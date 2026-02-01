import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, X, Send, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase, supabaseFunctions } from "@/lib/supabase";
import { MESSAGING_CONFIG } from "@/config/messaging";

interface MinisterContact {
  full_name: string;
  phone: string;
}

interface Props {
  sessionId: string;
  onInvitesCreated: () => void;
}

const PRODUCTION_DOMAIN = "https://ghanabaptistministers.com";

export function BulkInviteUpload({ sessionId, onInvitesCreated }: Props) {
  const [contacts, setContacts] = useState<MinisterContact[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

        // Skip header row and parse contacts
        const parsedContacts: MinisterContact[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length >= 2) {
            const fullName = String(row[0] || "").trim();
            const phone = String(row[1] || "").trim();
            if (fullName && phone) {
              // Normalize phone number
              let normalizedPhone = phone.replace(/\s+/g, "");
              if (normalizedPhone.startsWith("0")) {
                normalizedPhone = "+233" + normalizedPhone.substring(1);
              } else if (!normalizedPhone.startsWith("+")) {
                normalizedPhone = "+233" + normalizedPhone;
              }
              parsedContacts.push({ full_name: fullName, phone: normalizedPhone });
            }
          }
        }

        if (parsedContacts.length === 0) {
          toast.error("No valid contacts found. Ensure columns: Full Name, Phone");
          return;
        }

        setContacts(parsedContacts);
        toast.success(`Loaded ${parsedContacts.length} contacts`);
      } catch (error) {
        console.error("Error parsing file:", error);
        toast.error("Failed to parse file. Use Excel format with Full Name, Phone columns.");
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeContact = (index: number) => {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setContacts([]);
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Full Name", "Phone"],
      ["Rev. John Doe", "0241234567"],
      ["Pastor Jane Smith", "+233201234567"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, "Ministers");
    XLSX.writeFile(wb, "minister_intake_template.xlsx");
    toast.success("Template downloaded");
  };

  const createInvitesAndSendSMS = async () => {
    if (contacts.length === 0) {
      toast.error("No contacts to process");
      return;
    }

    setIsSending(true);
    const { data: auth } = await supabase.auth.getUser();
    
    try {
      // Create invites for all contacts
      const invitePromises = contacts.map(async (contact) => {
        const { data, error } = await supabase
          .from("intake_invites")
          .insert({
            session_id: sessionId,
            minister_full_name: contact.full_name,
            minister_phone: contact.phone,
            created_by: auth.user?.id,
          })
          .select("id")
          .single();

        if (error) throw error;
        return {
          id: data.id,
          full_name: contact.full_name,
          phone: contact.phone,
          link: `${PRODUCTION_DOMAIN}/minister-intake/${data.id}`,
        };
      });

      const createdInvites = await Promise.all(invitePromises);
      
      // Prepare SMS messages with unique links
      const smsDestinations = createdInvites.map((invite) => ({
        destination: invite.phone,
        message: `Dear ${invite.full_name}, please update your minister information using this link: ${invite.link} - GBC Ministers' Conference`,
        smstype: MESSAGING_CONFIG.SMS_TYPE,
      }));

      // Send SMS via edge function
      const { error: smsError } = await supabaseFunctions.functions.invoke("frogapi-send-personalized", {
        body: {
          senderid: MESSAGING_CONFIG.SENDER_ID,
          destinations: smsDestinations,
        },
      });

      if (smsError) {
        console.error("SMS Error:", smsError);
        toast.warning(`Invites created but SMS failed: ${smsError.message}`);
      } else {
        // Update SMS status for all created invites
        const updatePromises = createdInvites.map((invite) =>
          supabase
            .from("intake_invites")
            .update({
              sms_sent_at: new Date().toISOString(),
              sms_status: "sent",
            })
            .eq("id", invite.id)
        );
        await Promise.all(updatePromises);
        toast.success(`Created ${createdInvites.length} invites and sent SMS`);
      }

      setContacts([]);
      onInvitesCreated();
    } catch (error: any) {
      console.error("Error creating invites:", error);
      toast.error(`Failed: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Invite Upload
        </CardTitle>
        <CardDescription>
          Upload an Excel file with columns: <strong>Full Name</strong>, <strong>Phone</strong>. 
          Each minister gets a unique link sent via SMS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
            id="bulk-upload-input"
          />
          <Button
            variant="outline"
            onClick={downloadTemplate}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Excel
          </Button>
          {contacts.length > 0 && (
            <>
              <Button variant="outline" onClick={clearAll}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
              <Button onClick={createInvitesAndSendSMS} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Create Invites & Send SMS ({contacts.length})
              </Button>
            </>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="border rounded-md max-h-64 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{contact.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{contact.phone}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
