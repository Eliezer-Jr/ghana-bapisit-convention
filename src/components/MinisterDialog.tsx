import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";

const ministerSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.string().trim().min(1, "Role is required").max(100),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  date_joined: z.string().min(1, "Date is required"),
  status: z.enum(["active", "inactive", "retired"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

interface MinisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minister?: any;
  onSuccess: () => void;
}

const MinisterDialog = ({ open, onOpenChange, minister, onSuccess }: MinisterDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    location: "",
    date_joined: new Date().toISOString().split("T")[0],
    status: "active",
    notes: "",
  });

  useEffect(() => {
    if (minister) {
      setFormData({
        full_name: minister.full_name || "",
        email: minister.email || "",
        phone: minister.phone || "",
        role: minister.role || "",
        location: minister.location || "",
        date_joined: minister.date_joined || new Date().toISOString().split("T")[0],
        status: minister.status || "active",
        notes: minister.notes || "",
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        role: "",
        location: "",
        date_joined: new Date().toISOString().split("T")[0],
        status: "active",
        notes: "",
      });
    }
  }, [minister, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate data
      const validated = ministerSchema.parse(formData);

      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...validated,
        email: validated.email || null,
        phone: validated.phone || null,
        location: validated.location || null,
        notes: validated.notes || null,
      };

      if (minister) {
        const { error } = await supabase
          .from("ministers")
          .update(dataToSubmit as any)
          .eq("id", minister.id);

        if (error) throw error;
        toast.success("Minister updated successfully");
      } else {
        const { error } = await supabase
          .from("ministers")
          .insert([dataToSubmit as any]);

        if (error) throw error;
        toast.success("Minister added successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{minister ? "Edit Minister" : "Add New Minister"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., Pastor, Deacon, Elder"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_joined">Date Joined *</Label>
              <Input
                id="date_joined"
                type="date"
                value={formData.date_joined}
                onChange={(e) => setFormData({ ...formData, date_joined: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              disabled={loading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : minister ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MinisterDialog;
