import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Save, Upload, User } from "lucide-react";

interface PersonalInformationStepProps {
  formData: any;
  onNext: (data: any) => void;
  onSave: (data: any) => void;
  isSubmitted: boolean;
  applicationId: string | null;
}

export default function PersonalInformationStep({
  formData,
  onNext,
  onSave,
  isSubmitted,
  applicationId,
}: PersonalInformationStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [data, setData] = useState({
    full_name: formData.full_name || "",
    date_of_birth: formData.date_of_birth || "",
    phone: formData.phone || "",
    email: formData.email || "",
    marital_status: formData.marital_status || "",
    spouse_name: formData.spouse_name || "",
    photo_url: formData.photo_url || "",
  });

  const handleChange = (field: string, value: string) => {
    setData({ ...data, [field]: value });
  };

  const uploadPhotoToStorage = async (file: File, appId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${appId}/photo_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('application-documents')
      .upload(fileName, file, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('application-documents')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size must be less than 5MB");
      return;
    }

    // Store file and show preview immediately
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    toast.success("Photo selected. It will be uploaded when you save.");

    // If applicationId exists, upload immediately
    if (applicationId) {
      setUploading(true);
      try {
        const photoUrl = await uploadPhotoToStorage(file, applicationId);
        setData({ ...data, photo_url: photoUrl });
        
        await supabase
          .from('applications')
          .update({ photo_url: photoUrl })
          .eq('id', applicationId);

        toast.success("Photo uploaded successfully");
      } catch (error: any) {
        console.error("Error uploading photo:", error);
        toast.error("Failed to upload photo");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    // If there's a selected file and no applicationId, we need to upload after saving
    if (selectedFile && !data.photo_url) {
      toast.info("Photo will be uploaded after saving...");
    }
    onSave(data);
  };

  const handleNext = () => {
    if (!data.full_name || !data.date_of_birth || !data.phone || !data.email || !data.marital_status) {
      toast.error("Please fill in all required fields");
      return;
    }
    onNext(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Personal Information</h2>
        <p className="text-muted-foreground">Please provide your personal details</p>
      </div>

      <div className="flex flex-col items-center mb-6">
        <Avatar className="h-32 w-32 mb-4 border-2 border-border">
          <AvatarImage src={previewUrl || data.photo_url} alt="Profile photo" />
          <AvatarFallback className="bg-muted">
            <User className="h-16 w-16 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
          disabled={isSubmitted || uploading}
        />
        {!isSubmitted && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : selectedFile ? "Change Photo" : "Upload Photo"}
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Max 5MB, recommended square ratio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name *</Label>
          <Input
            id="full_name"
            value={data.full_name}
            onChange={(e) => handleChange("full_name", e.target.value)}
            disabled={isSubmitted}
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={data.date_of_birth}
            onChange={(e) => handleChange("date_of_birth", e.target.value)}
            disabled={isSubmitted}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={isSubmitted}
            placeholder="0XXXXXXXXX"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={isSubmitted}
            placeholder="email@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="marital_status">Marital Status *</Label>
          <Select
            value={data.marital_status}
            onValueChange={(value) => handleChange("marital_status", value)}
            disabled={isSubmitted}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.marital_status === "married" && (
          <div className="space-y-2">
            <Label htmlFor="spouse_name">Spouse Name</Label>
            <Input
              id="spouse_name"
              value={data.spouse_name}
              onChange={(e) => handleChange("spouse_name", e.target.value)}
              disabled={isSubmitted}
              placeholder="Enter spouse name"
            />
          </div>
        )}
      </div>

      {!isSubmitted && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
          <Button onClick={handleNext} className="ml-auto">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
