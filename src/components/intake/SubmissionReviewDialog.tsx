import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Check, X, AlertCircle, ArrowRight } from "lucide-react";

type IntakeSubmission = {
  id: string;
  session_id: string;
  invite_id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  payload: Record<string, any>;
};

type Minister = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  association: string | null;
  sector: string | null;
  fellowship: string | null;
  location: string | null;
  role: string;
  status: string;
  notes: string | null;
};

type Props = {
  submission: IntakeSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: () => void;
  onRejected: () => void;
};

const FIELD_LABELS: Record<string, string> = {
  full_name: "Full Name",
  phone: "Phone",
  email: "Email",
  association: "Association",
  sector: "Sector",
  fellowship: "Fellowship",
  location: "Location",
  role: "Role/Position",
  status: "Status",
  notes: "Notes",
  marital_status: "Marital Status",
  spouse_name: "Spouse Name",
  number_of_children: "Number of Children",
  whatsapp: "WhatsApp",
  gps_address: "GPS Address",
  date_of_birth: "Date of Birth",
  current_church_name: "Current Church",
  position_at_church: "Position at Church",
  church_address: "Church Address",
  ordination_year: "Ordination Year",
  recognition_year: "Recognition Year",
  licensing_year: "Licensing Year",
  titles: "Titles",
  zone: "Zone",
};

function DiffRow({ 
  field, 
  oldValue, 
  newValue 
}: { 
  field: string; 
  oldValue: any; 
  newValue: any;
}) {
  const label = FIELD_LABELS[field] || field;
  const hasChanged = oldValue !== newValue && oldValue !== undefined;
  const isNew = oldValue === undefined && newValue !== undefined && newValue !== "";
  
  if (!newValue && newValue !== 0) return null;

  return (
    <div className={`grid grid-cols-3 gap-4 py-2 px-3 rounded-md ${hasChanged ? "bg-amber-50 dark:bg-amber-950/20" : isNew ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
      <div className="font-medium text-sm text-muted-foreground">{label}</div>
      <div className="text-sm">
        {oldValue !== undefined ? (
          <span className={hasChanged ? "line-through text-muted-foreground" : ""}>
            {String(oldValue || "—")}
          </span>
        ) : (
          <span className="text-muted-foreground italic">No existing record</span>
        )}
      </div>
      <div className="text-sm flex items-center gap-2">
        {hasChanged && <ArrowRight className="h-3 w-3 text-amber-600" />}
        <span className={hasChanged ? "font-medium text-amber-700 dark:text-amber-400" : isNew ? "font-medium text-green-700 dark:text-green-400" : ""}>
          {String(newValue || "—")}
        </span>
      </div>
    </div>
  );
}

export function SubmissionReviewDialog({ 
  submission, 
  open, 
  onOpenChange, 
  onApproved,
  onRejected 
}: Props) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [selectedMinisterId, setSelectedMinisterId] = useState<string | null>(null);

  // Try to find an existing minister by phone
  const { data: existingMinister, isLoading: ministerLoading } = useQuery({
    queryKey: ["existing-minister", submission?.payload?.phone],
    enabled: !!submission?.payload?.phone && open,
    queryFn: async () => {
      const phone = submission?.payload?.phone;
      if (!phone) return null;
      
      const { data, error } = await supabase
        .from("ministers")
        .select("*")
        .eq("phone", phone)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching minister:", error);
        return null;
      }
      return data as Minister | null;
    },
  });

  // Search for ministers to link
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults } = useQuery({
    queryKey: ["minister-search", searchTerm],
    enabled: searchTerm.length >= 2 && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ministers")
        .select("id, full_name, phone, email")
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
  });

  const payload = submission?.payload || {};
  const targetMinister = existingMinister || (selectedMinisterId ? searchResults?.find(m => m.id === selectedMinisterId) : null);

  const handleApprove = async () => {
    if (!submission) return;
    setIsApproving(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      // Prepare minister data from payload
      const ministerData = {
        full_name: payload.full_name,
        phone: payload.phone || null,
        email: payload.email || null,
        association: payload.association || null,
        sector: payload.sector || null,
        fellowship: payload.fellowship || null,
        location: payload.location || null,
        role: payload.role || "Minister",
        status: payload.status || "active",
        notes: payload.notes || null,
        marital_status: payload.marital_status || null,
        spouse_name: payload.spouse_name || null,
        number_of_children: payload.number_of_children ? parseInt(payload.number_of_children) : null,
        whatsapp: payload.whatsapp || null,
        gps_address: payload.gps_address || null,
        date_of_birth: payload.date_of_birth || null,
        current_church_name: payload.current_church_name || null,
        position_at_church: payload.position_at_church || null,
        church_address: payload.church_address || null,
        ordination_year: payload.ordination_year ? parseInt(payload.ordination_year) : null,
        recognition_year: payload.recognition_year ? parseInt(payload.recognition_year) : null,
        licensing_year: payload.licensing_year ? parseInt(payload.licensing_year) : null,
        titles: payload.titles || null,
        zone: payload.zone || null,
      };

      let ministerId: string;

      if (targetMinister) {
        // Update existing minister
        const { error: updateError } = await supabase
          .from("ministers")
          .update(ministerData)
          .eq("id", targetMinister.id);

        if (updateError) throw updateError;
        ministerId = targetMinister.id;
      } else {
        // Create new minister
        const { data: newMinister, error: insertError } = await supabase
          .from("ministers")
          .insert(ministerData)
          .select("id")
          .single();

        if (insertError) throw insertError;
        ministerId = newMinister.id;
      }

      // Handle emergency contacts if present in payload
      if (payload.emergency_contacts && Array.isArray(payload.emergency_contacts)) {
        for (const contact of payload.emergency_contacts) {
          if (contact.contact_name && contact.phone_number) {
            await supabase.from("emergency_contacts").insert({
              minister_id: ministerId,
              contact_name: contact.contact_name,
              relationship: contact.relationship || "Other",
              phone_number: contact.phone_number,
            });
          }
        }
      }

      // Mark submission as approved
      const { error: submissionError } = await supabase
        .from("intake_submissions")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId,
        })
        .eq("id", submission.id);

      if (submissionError) throw submissionError;

      toast.success(targetMinister ? "Minister record updated" : "New minister created");
      onApproved();
      onOpenChange(false);
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve and publish");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;
    setIsRejecting(true);

    try {
      const { data: auth } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("intake_submissions")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: auth.user?.id,
          rejection_reason: rejectionReason || null,
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast.success("Submission rejected");
      onRejected();
      onOpenChange(false);
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject submission");
    } finally {
      setIsRejecting(false);
      setShowRejectionInput(false);
      setRejectionReason("");
    }
  };

  useEffect(() => {
    if (!open) {
      setShowRejectionInput(false);
      setRejectionReason("");
      setSelectedMinisterId(null);
      setSearchTerm("");
    }
  }, [open]);

  if (!submission) return null;

  const isSubmitted = submission.status === "submitted";
  const diffFields = Object.keys(FIELD_LABELS);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Review Submission
            <Badge variant={submission.status === "submitted" ? "default" : "secondary"}>
              {submission.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Compare submitted data with existing records before publishing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[50vh] pr-4">
          {/* Match Status */}
          <div className="mb-4 p-3 rounded-lg border">
            {ministerLoading ? (
              <p className="text-sm text-muted-foreground">Searching for existing minister...</p>
            ) : existingMinister ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Found existing minister: {existingMinister.full_name} ({existingMinister.phone})
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">No existing minister found — will create new record</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Or link to existing minister:</Label>
                  <Input
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8"
                  />
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-md divide-y">
                      {searchResults.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMinisterId(m.id)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted ${selectedMinisterId === m.id ? "bg-primary/10" : ""}`}
                        >
                          {m.full_name} — {m.phone || m.email || "No contact"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Diff View */}
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-4 py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <div>Field</div>
              <div>Current Value</div>
              <div>Submitted Value</div>
            </div>
            {diffFields.map((field) => (
              <DiffRow
                key={field}
                field={field}
                oldValue={targetMinister ? (targetMinister as any)[field] : undefined}
                newValue={payload[field]}
              />
            ))}
          </div>

          {/* Rejection Input */}
          {showRejectionInput && (
            <div className="mt-4 space-y-2">
              <Label>Rejection Reason (optional)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this submission is being rejected..."
                rows={3}
              />
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="gap-2">
          {showRejectionInput ? (
            <>
              <Button variant="outline" onClick={() => setShowRejectionInput(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
                {isRejecting ? "Rejecting..." : "Confirm Reject"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectionInput(true)}
                disabled={!isSubmitted || isApproving}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={handleApprove}
                disabled={!isSubmitted || isApproving}
              >
                <Check className="h-4 w-4 mr-2" />
                {isApproving ? "Publishing..." : existingMinister || selectedMinisterId ? "Approve & Update" : "Approve & Create"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
