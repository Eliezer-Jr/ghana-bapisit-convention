import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditPhoneDialogProps {
  applicant: {
    id: string;
    phone_number: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditPhoneDialog = ({
  applicant,
  open,
  onOpenChange,
}: EditPhoneDialogProps) => {
  const [newPhone, setNewPhone] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!applicant || !newPhone) return;

      const { data, error } = await supabase.functions.invoke("approve-applicant", {
        body: {
          updateId: applicant.id,
          newPhoneNumber: newPhone,
          reason,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Phone number updated successfully");
      queryClient.invalidateQueries({ queryKey: ["approved-applicants"] });
      onOpenChange(false);
      setNewPhone("");
      setReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update phone number");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      toast.error("Please enter a new phone number");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Phone Number</DialogTitle>
          <DialogDescription className="sr-only">Update an approved applicant's phone number and optionally add a reason.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Current Number</Label>
            <Input value={applicant?.phone_number || ""} disabled className="font-mono" />
          </div>

          <div>
            <Label htmlFor="newPhone">New Phone Number *</Label>
            <Input
              id="newPhone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="0557083554 or +233557083554"
              required
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Change</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this number being changed?"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Number
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
