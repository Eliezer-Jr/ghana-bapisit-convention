import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Plus, Trash2, Upload, Users, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useSMSMessaging } from "@/hooks/useSMSMessaging";

interface Destination {
  destination: string;
  msgid?: string;
  message?: string;
}

interface ExcelContact {
  name: string;
  phone_number: string;
}

export const GeneralSMSForm = () => {
  const { loading, sendGeneralSMS } = useSMSMessaging();
  const [message, setMessage] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([{ destination: "" }]);
  const [useAllMinisters, setUseAllMinisters] = useState(false);
  const [excelContacts, setExcelContacts] = useState<ExcelContact[]>([]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        const contacts: ExcelContact[] = json.map(row => ({
          name: row.name || row.Name || row.NAME || '',
          phone_number: String(row.phone_number || row.phone || row.Phone || row.PHONE || '')
        })).filter(contact => contact.phone_number.trim());
        
        setExcelContacts(contacts);
        toast.success(`Loaded ${contacts.length} contacts from Excel`);
      } catch (error: any) {
        toast.error("Failed to parse Excel file: " + error.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { name: "John Doe", phone_number: "0244123456" },
      { name: "Jane Smith", phone_number: "0201234567" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, "sms_template.xlsx");
    toast.success("Template downloaded");
  };

  const handleSend = () => {
    sendGeneralSMS(message, destinations, excelContacts, useAllMinisters);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send General SMS</CardTitle>
        <CardDescription>Send the same message to multiple recipients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="use-all-ministers"
              checked={useAllMinisters}
              onChange={(e) => {
                setUseAllMinisters(e.target.checked);
                if (e.target.checked) setExcelContacts([]);
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="use-all-ministers" className="cursor-pointer">
              <Users className="h-4 w-4 inline mr-1" />
              Send to all ministers in database
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="excel-upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload Excel with Names & Phone Numbers
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </div>
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                handleExcelUpload(e);
                setUseAllMinisters(false);
              }}
              disabled={useAllMinisters}
            />
            {excelContacts.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {excelContacts.length} contacts loaded. Use [[name]] and [[phone_number]] as placeholders in your message.
              </p>
            )}
          </div>

          {!useAllMinisters && excelContacts.length === 0 && (
            <div className="space-y-2">
              <Label>Phone Numbers (Manual Entry)</Label>
              {destinations.map((dest, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    placeholder="e.g., 0244123456"
                    value={dest.destination}
                    onChange={(e) => {
                      const newDests = [...destinations];
                      newDests[idx].destination = e.target.value;
                      setDestinations(newDests);
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDestinations(destinations.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDestinations([...destinations, { destination: "" }])}
              >
                <Plus className="h-4 w-4 mr-2" /> Add Number
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="general-message">Message</Label>
          <Textarea
            id="general-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={excelContacts.length > 0 ? "Use [[name]] and [[phone_number]] for personalization..." : "Enter your message here..."}
            rows={4}
          />
        </div>

        <Button onClick={handleSend} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
          Send Message
        </Button>
      </CardContent>
    </Card>
  );
};
