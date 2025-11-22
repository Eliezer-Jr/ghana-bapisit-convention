import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, Trash2, Plus, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Signature {
  id: string;
  name: string;
  role: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
}

export function SignatureManager() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newSignature, setNewSignature] = useState({ name: "", role: "" });
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const { data: signatures, isLoading } = useQuery({
    queryKey: ["letter-signatures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("letter_signatures")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Signature[];
    },
  });

  const uploadSignature = useMutation({
    mutationFn: async ({ file, signatureId }: { file: File; signatureId: string }) => {
      const fileExt = file.name.split(".").pop();
      const filePath = `${signatureId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("signature-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("signature-images")
        .getPublicUrl(filePath);

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-signatures"] });
      toast.success("Signature image uploaded successfully");
      setUploadingFor(null);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload signature image");
    },
  });

  const addSignature = useMutation({
    mutationFn: async (signature: { name: string; role: string; image_url: string }) => {
      const { error } = await supabase
        .from("letter_signatures")
        .insert({
          ...signature,
          display_order: (signatures?.length || 0) + 1,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-signatures"] });
      toast.success("Signature added successfully");
      setNewSignature({ name: "", role: "" });
    },
    onError: () => {
      toast.error("Failed to add signature");
    },
  });

  const updateSignature = useMutation({
    mutationFn: async ({ id, image_url }: { id: string; image_url: string }) => {
      const { error } = await supabase
        .from("letter_signatures")
        .update({ image_url })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-signatures"] });
    },
  });

  const deleteSignature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("letter_signatures")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letter-signatures"] });
      toast.success("Signature deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete signature");
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, signatureId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const publicUrl = await uploadSignature.mutateAsync({ file, signatureId });
    await updateSignature.mutateAsync({ id: signatureId, image_url: publicUrl });
  };

  const handleAddSignature = () => {
    if (!newSignature.name || !newSignature.role) {
      toast.error("Please enter name and role");
      return;
    }
    addSignature.mutate({
      ...newSignature,
      image_url: "/placeholder-signature.png",
    });
  };

  if (isLoading) {
    return <div>Loading signatures...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Signature Management</CardTitle>
        <CardDescription>Upload and manage signature images for letter signatories</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Signatures */}
        <div className="space-y-4">
          {signatures?.map((sig) => (
            <div key={sig.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{sig.name}</h4>
                  <Badge variant="secondary">{sig.role}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  {sig.image_url && (
                    <img
                      src={sig.image_url}
                      alt={sig.name}
                      className="h-12 border rounded"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder-signature.png";
                      }}
                    />
                  )}
                  <input
                    ref={uploadingFor === sig.id ? fileInputRef : undefined}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, sig.id)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadingFor(sig.id);
                      setTimeout(() => fileInputRef.current?.click(), 0);
                    }}
                    disabled={uploadSignature.isPending}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadSignature.isPending && uploadingFor === sig.id
                      ? "Uploading..."
                      : "Upload New"}
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSignature.mutate(sig.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add New Signature */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-semibold">Add New Signatory</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sig-name">Name</Label>
              <Input
                id="sig-name"
                value={newSignature.name}
                onChange={(e) => setNewSignature({ ...newSignature, name: e.target.value })}
                placeholder="Convention Secretary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sig-role">Role/Title</Label>
              <Input
                id="sig-role"
                value={newSignature.role}
                onChange={(e) => setNewSignature({ ...newSignature, role: e.target.value })}
                placeholder="Secretary"
              />
            </div>
          </div>
          <Button onClick={handleAddSignature} disabled={addSignature.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Add Signatory
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
