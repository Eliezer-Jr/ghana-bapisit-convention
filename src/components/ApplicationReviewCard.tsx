import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, FileText, Calendar, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  admission_level: string;
  status: string;
  submitted_at: string;
  church_name: string;
  association: string;
  sector: string | null;
  local_notes: string | null;
  association_notes: string | null;
  vp_notes: string | null;
}

interface ApplicationReviewCardProps {
  application: Application;
  onUpdate: () => void;
  reviewerRole: "local_officer" | "association_head" | "vp_office";
}

export function ApplicationReviewCard({ application, onUpdate, reviewerRole }: ApplicationReviewCardProps) {
  const [notes, setNotes] = useState("");
  const [sector, setSector] = useState(application.sector || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "rejected": return "destructive";
      case "submitted": return "secondary";
      default: return "outline";
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const updateData: any = {};
      
      if (reviewerRole === "local_officer") {
        updateData.status = "local_screening";
        updateData.local_reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.local_reviewed_at = new Date().toISOString();
        updateData.local_notes = notes;
      } else if (reviewerRole === "association_head") {
        updateData.status = "association_approved";
        updateData.association_reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.association_reviewed_at = new Date().toISOString();
        updateData.association_notes = notes;
      } else if (reviewerRole === "vp_office") {
        updateData.status = "vp_review";
        updateData.vp_reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.vp_reviewed_at = new Date().toISOString();
        updateData.vp_notes = notes;
        if (sector) {
          updateData.sector = sector;
        }
      }

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", application.id);

      if (error) throw error;

      toast.success("Application approved successfully");
      setNotes("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve application");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsProcessing(true);
    try {
      const updateData: any = {
        status: "rejected",
        rejection_reason: notes,
      };

      if (reviewerRole === "local_officer") {
        updateData.local_reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.local_reviewed_at = new Date().toISOString();
      } else if (reviewerRole === "association_head") {
        updateData.association_reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.association_reviewed_at = new Date().toISOString();
      } else if (reviewerRole === "vp_office") {
        updateData.vp_reviewed_by = (await supabase.auth.getUser()).data.user?.id;
        updateData.vp_reviewed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", application.id);

      if (error) throw error;

      toast.success("Application rejected");
      setNotes("");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject application");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{application.full_name}</CardTitle>
            <CardDescription>
              {application.admission_level} Application
            </CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(application.status)}>
            {application.status.replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{application.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{application.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{application.church_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{application.association}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Submitted: {new Date(application.submitted_at).toLocaleDateString()}</span>
          </div>
          {application.sector && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Sector: {application.sector}</span>
            </div>
          )}
        </div>

        {(application.local_notes || application.association_notes || application.vp_notes) && (
          <div className="space-y-2 pt-2 border-t">
            {application.local_notes && (
              <div className="text-sm">
                <span className="font-medium">Local Officer Notes:</span>
                <p className="text-muted-foreground">{application.local_notes}</p>
              </div>
            )}
            {application.association_notes && (
              <div className="text-sm">
                <span className="font-medium">Association Head Notes:</span>
                <p className="text-muted-foreground">{application.association_notes}</p>
              </div>
            )}
            {application.vp_notes && (
              <div className="text-sm">
                <span className="font-medium">VP Office Notes:</span>
                <p className="text-muted-foreground">{application.vp_notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 pt-2 border-t">
          {reviewerRole === "vp_office" && (
            <div className="space-y-2">
              <Label>Assign Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                  <SelectItem value="East">East</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Review Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your review notes here..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing || (reviewerRole === "vp_office" && !sector)}
              className="flex-1"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
