import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Upload, User, Camera, ClipboardCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import IntakeReviewSummary from "./IntakeReviewSummary";
import { MINISTRY_ENGAGEMENT_OPTIONS, ZONES, SECTORS, TITLE_OPTIONS, getAssociationsForSector, getSectorForAssociation, getChurchesForAssociation } from "@/config/ministerOptions";
import ImageCropDialog from "@/components/application/ImageCropDialog";
import GhanaCardUploadCard from "@/components/GhanaCardUploadCard";

interface IntakeFormTabsProps {
  payload: Record<string, any>;
  onChange: (payload: Record<string, any>) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  disabled?: boolean;
  submissionId?: string;
}

export default function IntakeFormTabs({ payload, onChange, activeTab, onTabChange, disabled, submissionId }: IntakeFormTabsProps) {
  const OTHER_CHURCH_VALUE = "__other__";
  const OTHER_TITLE_VALUE = "__other_title__";
  const QUALIFICATION_DOCUMENT_BUCKET = "qualification-documents";
  const GHANA_CARD_DOCUMENT_BUCKET = "ghana-card-documents";
  const QUALIFICATION_DOCUMENT_MAX_SIZE = 2 * 1024 * 1024;
  const [uploading, setUploading] = useState(false);
  const [uploadingQualificationIndex, setUploadingQualificationIndex] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(payload.photo_url || "");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState("");
  const [useCustomCurrentChurch, setUseCustomCurrentChurch] = useState(false);
  const [useCustomTitle, setUseCustomTitle] = useState(false);
  const [customHistoryChurchRows, setCustomHistoryChurchRows] = useState<Record<number, boolean>>({});
  const churchOptions = getChurchesForAssociation(payload.association || "");
  const isSingle = payload.marital_status === "single";
  const isCustomCurrentChurch = useCustomCurrentChurch || (!!payload.current_church_name && !churchOptions.includes(payload.current_church_name));
  const isCustomTitle = useCustomTitle || (!!payload.titles && !TITLE_OPTIONS.includes(payload.titles));

  const updateField = (field: string, value: any) => {
    onChange({ ...payload, [field]: value });
  };

  const updateFields = (fields: Record<string, any>) => {
    onChange({ ...payload, ...fields });
  };

  const updateArrayField = (field: string, index: number, key: string, value: any) => {
    const arr = [...(payload[field] || [])];
    arr[index] = { ...arr[index], [key]: value };
    onChange({ ...payload, [field]: arr });
  };

  const updateArrayFields = (field: string, index: number, values: Record<string, any>) => {
    const arr = [...(payload[field] || [])];
    arr[index] = { ...arr[index], ...values };
    onChange({ ...payload, [field]: arr });
  };

  const addArrayItem = (field: string, defaultItem: Record<string, any>) => {
    const arr = [...(payload[field] || []), defaultItem];
    onChange({ ...payload, [field]: arr });
  };

  const removeArrayItem = (field: string, index: number) => {
    const arr = (payload[field] || []).filter((_: any, i: number) => i !== index);
    onChange({ ...payload, [field]: arr });
    if (field === "ministerial_history") {
      setCustomHistoryChurchRows((prev) => {
        const next: Record<number, boolean> = {};
        Object.entries(prev).forEach(([key, value]) => {
          const rowIndex = Number(key);
          if (rowIndex < index) next[rowIndex] = value;
          if (rowIndex > index) next[rowIndex - 1] = value;
        });
        return next;
      });
    }
  };

  const handleMaritalStatusChange = (value: string) => {
    if (value === "single") {
      updateFields({
        marital_status: value,
        marriage_type: "",
        spouse_name: "",
        spouse_phone_number: "",
        spouse_occupation: "",
        number_of_children: 0,
        children: [],
      });
      return;
    }

    updateField("marital_status", value);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setCropDialogOpen(true);
  };

  const handlePhotoCropComplete = async (croppedBlob: Blob) => {
    const objectUrl = URL.createObjectURL(croppedBlob);
    setPhotoPreview(objectUrl);
    setCropDialogOpen(false);
    setImageToCrop("");

    setUploading(true);
    try {
      const fileName = `intake/${submissionId || "temp"}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("minister-photos")
        .upload(fileName, croppedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("minister-photos")
        .getPublicUrl(fileName);

      updateField("photo_url", urlData.publicUrl);
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast.error(error.message || "Failed to upload photo");
      setPhotoPreview("");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoCropCancel = () => {
    setCropDialogOpen(false);
    setImageToCrop("");
  };

  const handleQualificationDocumentUpload = async (index: number, file: File | null) => {
    if (!file) return;

    const isAcceptedType = file.type.startsWith("image/");
    if (!isAcceptedType) {
      toast.error("Only image files are allowed");
      return;
    }

    if (file.size > QUALIFICATION_DOCUMENT_MAX_SIZE) {
      toast.error("Document size must be 2MB or less");
      return;
    }

    const fileExt = file.name.split(".").pop() || "file";
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `intake/${submissionId || "temp"}/qualification-${index}-${Date.now()}-${baseName}.${fileExt}`;

    setUploadingQualificationIndex(index);
    try {
      const { error: uploadError } = await supabase.storage
        .from(QUALIFICATION_DOCUMENT_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(QUALIFICATION_DOCUMENT_BUCKET)
        .getPublicUrl(filePath);

      updateArrayFields("qualifications", index, {
        document_name: file.name,
        document_type: file.type,
        document_url: urlData.publicUrl,
      });
      toast.success("Qualification document uploaded");
    } catch (error: any) {
      console.error("Qualification document upload error:", error);
      toast.error(error.message || "Failed to upload qualification document");
    } finally {
      setUploadingQualificationIndex(null);
    }
  };

  const handleGhanaCardUpload = async (side: "front" | "back", file: File | null) => {
    if (!file) return;

    const isAcceptedType = file.type === "application/pdf" || file.type.startsWith("image/");
    if (!isAcceptedType) {
      toast.error("Only PDF files and images are allowed");
      return;
    }

    if (file.size > QUALIFICATION_DOCUMENT_MAX_SIZE) {
      toast.error("Document size must be 2MB or less");
      return;
    }

    const fileExt = file.name.split(".").pop() || "file";
    const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `intake/${submissionId || "temp"}/ghana-card-${side}-${Date.now()}-${baseName}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(GHANA_CARD_DOCUMENT_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(GHANA_CARD_DOCUMENT_BUCKET)
        .getPublicUrl(filePath);

      updateFields({
        [`ghana_card_${side}_name`]: file.name,
        [`ghana_card_${side}_type`]: file.type,
        [`ghana_card_${side}_url`]: urlData.publicUrl,
      });
      toast.success(`Ghana Card ${side} uploaded`);
    } catch (error: any) {
      console.error(`Ghana Card ${side} upload error:`, error);
      toast.error(error.message || `Failed to upload Ghana Card ${side}`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handlePhotoCropComplete}
        onCancel={handlePhotoCropCancel}
      />

      <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1">
        <TabsTrigger value="bio" className="text-xs sm:text-sm py-2">Bio</TabsTrigger>
        <TabsTrigger value="education" className="text-xs sm:text-sm py-2">Education</TabsTrigger>
        <TabsTrigger value="ministerial" className="text-xs sm:text-sm py-2">Ministry</TabsTrigger>
        <TabsTrigger value="history" className="text-xs sm:text-sm py-2">History</TabsTrigger>
        <TabsTrigger value="other" className="text-xs sm:text-sm py-2">Other</TabsTrigger>
        <TabsTrigger value="review" className="text-xs sm:text-sm py-2 flex items-center gap-1">
          <ClipboardCheck className="h-3 w-3 hidden sm:inline" />
          Review
        </TabsTrigger>
      </TabsList>

      {/* Bio Data Tab */}
      <TabsContent value="bio" className="mt-6 space-y-6">
        {/* Photo Upload */}
        <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={photoPreview || payload.photo_url} alt="Minister photo" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-16 w-16 text-primary/40" />
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <span>{photoPreview || payload.photo_url ? "Change Photo" : "Upload Photo"}</span>
                </div>
              </Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={disabled || uploading}
              />
              <p className="text-xs text-muted-foreground text-center">
                Crop before upload. Square image recommended. Max 2MB.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                value={payload.full_name || ""}
                onChange={(e) => updateField("full_name", e.target.value)}
                disabled={disabled}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Title(s) <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                <Select
                  value={isCustomTitle ? OTHER_TITLE_VALUE : payload.titles || ""}
                  onValueChange={(value) => {
                    if (value === OTHER_TITLE_VALUE) {
                      setUseCustomTitle(true);
                      updateField("titles", "");
                      return;
                    }
                    setUseCustomTitle(false);
                    updateField("titles", value);
                  }}
                  disabled={disabled}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    {TITLE_OPTIONS.map((title) => (
                      <SelectItem key={title} value={title}>{title}</SelectItem>
                    ))}
                    <SelectItem value={OTHER_TITLE_VALUE}>Other</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomTitle && (
                  <Input
                    value={payload.titles || ""}
                    onChange={(e) => updateField("titles", e.target.value)}
                    disabled={disabled}
                    placeholder="Type title"
                    required
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={payload.date_of_birth || ""}
                onChange={(e) => updateField("date_of_birth", e.target.value)}
                disabled={disabled}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ghana Card Number <span className="text-destructive">*</span></Label>
              <Input
                value={payload.ghana_card_number || ""}
                onChange={(e) => updateField("ghana_card_number", e.target.value)}
                disabled={disabled}
                placeholder="e.g., GHA-123456789-0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <Input
                value={payload.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={disabled}
                placeholder="+233..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number <span className="text-destructive">*</span></Label>
              <Input
                value={payload.whatsapp || ""}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                disabled={disabled}
                placeholder="+233..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={payload.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={disabled}
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>GPS Address <span className="text-destructive">*</span></Label>
              <Input
                value={payload.gps_address || ""}
                onChange={(e) => updateField("gps_address", e.target.value)}
                disabled={disabled}
                placeholder="e.g., GA-123-4567"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Location/Area <span className="text-destructive">*</span></Label>
              <Input
                value={payload.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                disabled={disabled}
                placeholder="City or town"
                required
              />
            </div>
            <div className="space-y-3 sm:col-span-2">
              <Label>Ghana Card Upload</Label>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <GhanaCardUploadCard
                  id="ghana-card-front-upload"
                  title="Ghana Card Front"
                  sideLabel="Front side"
                  imageUrl={payload.ghana_card_front_url}
                  imageName={payload.ghana_card_front_name}
                  disabled={disabled}
                  onUpload={(file) => handleGhanaCardUpload("front", file)}
                  onRemove={() => updateFields({
                    ghana_card_front_name: null,
                    ghana_card_front_type: null,
                    ghana_card_front_url: null,
                  })}
                />
                <GhanaCardUploadCard
                  id="ghana-card-back-upload"
                  title="Ghana Card Back"
                  sideLabel="Back side"
                  imageUrl={payload.ghana_card_back_url}
                  imageName={payload.ghana_card_back_name}
                  disabled={disabled}
                  onUpload={(file) => handleGhanaCardUpload("back", file)}
                  onRemove={() => updateFields({
                    ghana_card_back_name: null,
                    ghana_card_back_type: null,
                    ghana_card_back_url: null,
                  })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Marital Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Marital Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marital Status <span className="text-destructive">*</span></Label>
              <Select
                value={payload.marital_status || ""}
                onValueChange={handleMaritalStatusChange}
                disabled={disabled}
                required
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
            {!isSingle && (
              <>
                <div className="space-y-2">
                  <Label>Marriage Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={payload.marriage_type || ""}
                    onValueChange={(value) => updateField("marriage_type", value)}
                    disabled={disabled}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ordinance">Ordinance</SelectItem>
                      <SelectItem value="customary">Customary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Spouse Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={payload.spouse_name || ""}
                    onChange={(e) => updateField("spouse_name", e.target.value)}
                    disabled={disabled}
                    placeholder="Enter spouse name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse Phone Number <span className="text-destructive">*</span></Label>
                  <Input
                    value={payload.spouse_phone_number || ""}
                    onChange={(e) => updateField("spouse_phone_number", e.target.value)}
                    disabled={disabled}
                    placeholder="+233..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse Occupation <span className="text-destructive">*</span></Label>
                  <Input
                    value={payload.spouse_occupation || ""}
                    onChange={(e) => updateField("spouse_occupation", e.target.value)}
                    disabled={disabled}
                    placeholder="Enter occupation"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Number of Children <span className="text-destructive">*</span></Label>
                  <Input
                    type="number"
                    min="0"
                    value={payload.number_of_children ?? ""}
                    onChange={(e) => updateField("number_of_children", parseInt(e.target.value) || 0)}
                    disabled={disabled}
                    required
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Children */}
        {!isSingle && (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Children Details</h3>
          <div className="space-y-3">
            {(payload.children || []).map((child: any, idx: number) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 items-end border rounded-md p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Child Name</Label>
                  <Input
                    value={child.child_name || ""}
                    onChange={(e) => updateArrayField("children", idx, "child_name", e.target.value)}
                    disabled={disabled}
                    placeholder="Child's name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input
                    type="date"
                    value={child.date_of_birth || ""}
                    onChange={(e) => updateArrayField("children", idx, "date_of_birth", e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeArrayItem("children", idx)}
                  disabled={disabled}
                  className="shrink-0 self-end"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("children", { child_name: "", date_of_birth: "" })}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Child
            </Button>
          </div>
        </div>
        )}
      </TabsContent>

      {/* Education Tab */}
      <TabsContent value="education" className="mt-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">
            Educational Qualifications <span className="text-destructive">*</span>
          </h3>
          <p className="text-sm text-muted-foreground">List your qualifications starting with the highest</p>
          <div className="space-y-3">
            {(payload.qualifications || []).map((qual: any, idx: number) => (
              <Card key={idx} className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Qualification (e.g., B.Th, M.Div)"
                    value={qual.qualification || ""}
                    onChange={(e) => updateArrayField("qualifications", idx, "qualification", e.target.value)}
                    disabled={disabled}
                    required
                  />
                  <Input
                    placeholder="Institution"
                    value={qual.institution || ""}
                    onChange={(e) => updateArrayField("qualifications", idx, "institution", e.target.value)}
                    disabled={disabled}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Year"
                      className="flex-1"
                      value={qual.year_obtained || ""}
                      onChange={(e) => updateArrayField("qualifications", idx, "year_obtained", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("qualifications", idx)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Supporting Document <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Label htmlFor={`qualification-document-${idx}`} className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                          <Upload className="h-4 w-4" />
                          <span>{uploadingQualificationIndex === idx ? "Uploading..." : "Upload document"}</span>
                        </div>
                      </Label>
                      <Input
                        id={`qualification-document-${idx}`}
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        disabled={disabled || uploadingQualificationIndex === idx}
                        onChange={(e) => {
                          void handleQualificationDocumentUpload(idx, e.target.files?.[0] || null);
                          e.target.value = "";
                        }}
                      />
                      {qual.document_url && (
                        <>
                          <a
                            href={qual.document_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                          >
                            View document
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => updateArrayFields("qualifications", idx, {
                              document_name: null,
                              document_type: null,
                              document_url: null,
                            })}
                            disabled={disabled}
                          >
                            Remove document
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Accepted: PDF and images, up to 2MB.</p>
                  {qual.document_name && (
                    <p className="text-sm text-muted-foreground">{qual.document_name}</p>
                  )}
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("qualifications", {
                qualification: "",
                institution: "",
                year_obtained: null,
                document_name: null,
                document_type: null,
                document_url: null,
              })}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Qualification
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Ministerial Tab */}
      <TabsContent value="ministerial" className="mt-6 space-y-6">
        {/* Convention Structure */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Convention Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sector <span className="text-destructive">*</span></Label>
              <Select
                value={payload.sector || ""}
                onValueChange={(value) => {
                  updateFields({
                    sector: value,
                    association: "",
                    fellowship: "",
                    current_church_name: "",
                  });
                  setUseCustomCurrentChurch(false);
                }}
                disabled={disabled}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Association <span className="text-destructive">*</span></Label>
              <Select
                value={payload.association || ""}
                onValueChange={(value) => {
                  const sector = !payload.sector ? getSectorForAssociation(value) : undefined;
                  updateFields({
                    association: value,
                    fellowship: "",
                    current_church_name: "",
                    ...(sector ? { sector } : {}),
                  });
                  setUseCustomCurrentChurch(false);
                }}
                disabled={disabled || !payload.sector}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={payload.sector ? "Select association" : "Select sector first"} />
                </SelectTrigger>
                <SelectContent>
                  {getAssociationsForSector(payload.sector || "").map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Current Ministry */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Current Ministry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type of Ministry <span className="text-destructive">*</span></Label>
              <Select
                value={payload.ministry_engagement || ""}
                onValueChange={(value) => updateField("ministry_engagement", value)}
                disabled={disabled}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MINISTRY_ENGAGEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Church Name <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                <Select
                  value={isCustomCurrentChurch ? OTHER_CHURCH_VALUE : payload.current_church_name || ""}
                  onValueChange={(value) => {
                    if (value === OTHER_CHURCH_VALUE) {
                      setUseCustomCurrentChurch(true);
                      updateField("current_church_name", "");
                      return;
                    }
                    setUseCustomCurrentChurch(false);
                    updateField("current_church_name", value);
                  }}
                  disabled={disabled || !payload.association}
                  required
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !payload.association
                          ? "Select association first"
                          : "Select church"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {churchOptions.map((church) => (
                      <SelectItem key={church} value={church}>{church}</SelectItem>
                    ))}
                    <SelectItem value={OTHER_CHURCH_VALUE}>Other (Type manually)</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomCurrentChurch && (
                  <Input
                    value={payload.current_church_name || ""}
                    onChange={(e) => updateField("current_church_name", e.target.value)}
                    disabled={disabled}
                    placeholder="Type church name"
                    required
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Position at Church <span className="text-destructive">*</span></Label>
              <Input
                value={payload.position_at_church || ""}
                onChange={(e) => updateField("position_at_church", e.target.value)}
                disabled={disabled}
                placeholder="e.g., Senior Pastor"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Church Address <span className="text-destructive">*</span></Label>
              <Input
                value={payload.church_address || ""}
                onChange={(e) => updateField("church_address", e.target.value)}
                disabled={disabled}
                placeholder="Full address"
                required
              />
            </div>
          </div>
        </div>

        {/* Ministerial Milestones */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Ministerial Milestones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Licensing Year</Label>
              <Input
                type="number"
                min="1900"
                max="2100"
                value={payload.licensing_year || ""}
                onChange={(e) => updateField("licensing_year", parseInt(e.target.value) || null)}
                disabled={disabled}
                placeholder="Year"
              />
            </div>
             <div className="space-y-2">
              <Label>Recognition Year</Label>
              <Input
                type="number"
                min="1900"
                max="2100"
                value={payload.recognition_year || ""}
                onChange={(e) => updateField("recognition_year", parseInt(e.target.value) || null)}
                disabled={disabled}
                placeholder="Year"
              />
            </div>
            <div className="space-y-2">
              <Label>Ordination Year</Label>
              <Input
                type="number"
                min="1900"
                max="2100"
                value={payload.ordination_year || ""}
                onChange={(e) => updateField("ordination_year", parseInt(e.target.value) || null)}
                disabled={disabled}
                placeholder="Year"
              />
            </div>
            <div className="space-y-2">
              <Label>Commissioning Year</Label>
              <Input
                type="number"
                min="1900"
                max="2100"
                value={payload.commissioning_year || ""}
                onChange={(e) => updateField("commissioning_year", parseInt(e.target.value) || null)}
                disabled={disabled}
                placeholder="Year"
              />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* History Tab */}
      <TabsContent value="history" className="mt-6 space-y-6">
        {/* Ministerial History */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Ministerial History</h3>
          <p className="text-sm text-muted-foreground">Previous churches and positions</p>
          <div className="space-y-3">
            {(payload.ministerial_history || []).map((hist: any, idx: number) => (
              <Card key={idx} className="p-4">
                {(() => {
                  const historyChurchOptions = getChurchesForAssociation(hist.association || "");
                  const isCustomHistoryChurch = customHistoryChurchRows[idx] || (!!hist.church_name && !historyChurchOptions.includes(hist.church_name));
                  return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    value={hist.sector || ""}
                    onValueChange={(value) => updateArrayFields("ministerial_history", idx, {
                      sector: value,
                      association: "",
                      church_name: "",
                    })}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((sector) => (
                        <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  <Select
                    value={hist.association || ""}
                    onValueChange={(value) => updateArrayFields("ministerial_history", idx, {
                      association: value,
                      church_name: "",
                    })}
                    disabled={disabled || !hist.sector}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={hist.sector ? "Select association" : "Select sector first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAssociationsForSector(hist.sector || "").map((association) => (
                        <SelectItem key={association} value={association}>{association}</SelectItem>
                      ))}
                    </SelectContent>
                    </Select>
                  <div className="space-y-2">
                    <Select
                      value={isCustomHistoryChurch ? OTHER_CHURCH_VALUE : hist.church_name || ""}
                      onValueChange={(value) => {
                        if (value === OTHER_CHURCH_VALUE) {
                          setCustomHistoryChurchRows((prev) => ({ ...prev, [idx]: true }));
                          updateArrayField("ministerial_history", idx, "church_name", "");
                          return;
                        }
                        setCustomHistoryChurchRows((prev) => ({ ...prev, [idx]: false }));
                        updateArrayField("ministerial_history", idx, "church_name", value);
                      }}
                      disabled={disabled || !hist.association}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !hist.association
                              ? "Select association first"
                              : "Select church"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {historyChurchOptions.map((church) => (
                          <SelectItem key={church} value={church}>{church}</SelectItem>
                        ))}
                        <SelectItem value={OTHER_CHURCH_VALUE}>Other (Type manually)</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomHistoryChurch && (
                      <Input
                        value={hist.church_name || ""}
                        onChange={(e) => updateArrayField("ministerial_history", idx, "church_name", e.target.value)}
                        disabled={disabled}
                        placeholder="Type church name"
                      />
                    )}
                  </div>
                  <Input
                    placeholder="Position"
                    value={hist.position || ""}
                    onChange={(e) => updateArrayField("ministerial_history", idx, "position", e.target.value)}
                    disabled={disabled}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="From Year"
                      value={hist.period_start || ""}
                      onChange={(e) => updateArrayField("ministerial_history", idx, "period_start", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="To Year"
                      value={hist.period_end || ""}
                      onChange={(e) => updateArrayField("ministerial_history", idx, "period_end", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("ministerial_history", idx)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                  );
                })()}
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("ministerial_history", { church_name: "", position: "", association: "", sector: "", period_start: null, period_end: null })}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" /> Add History
            </Button>
          </div>
        </div>

        {/* Convention Positions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Convention Positions Held</h3>
          <div className="space-y-3">
            {(payload.convention_positions || []).map((pos: any, idx: number) => (
              <Card key={idx} className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Position"
                    className="sm:col-span-3"
                    value={pos.position || ""}
                    onChange={(e) => updateArrayField("convention_positions", idx, "position", e.target.value)}
                    disabled={disabled}
                  />
                  <div className="flex gap-2 sm:col-span-3">
                    <Input
                      type="number"
                      placeholder="From Year"
                      value={pos.period_start || ""}
                      onChange={(e) => updateArrayField("convention_positions", idx, "period_start", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="To Year"
                      value={pos.period_end || ""}
                      onChange={(e) => updateArrayField("convention_positions", idx, "period_end", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("convention_positions", idx)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("convention_positions", { position: "", period_start: null, period_end: null })}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Position
            </Button>
          </div>
        </div>

        {/* Non-Church Work */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Other Work Experience</h3>
          <div className="space-y-3">
            {(payload.non_church_work || []).map((work: any, idx: number) => (
              <Card key={idx} className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Organization"
                    value={work.organization || ""}
                    onChange={(e) => updateArrayField("non_church_work", idx, "organization", e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder="Job Title"
                    value={work.job_title || ""}
                    onChange={(e) => updateArrayField("non_church_work", idx, "job_title", e.target.value)}
                    disabled={disabled}
                  />
                  <div className="flex gap-2 sm:col-span-2">
                    <Input
                      type="number"
                      placeholder="From Year"
                      value={work.period_start || ""}
                      onChange={(e) => updateArrayField("non_church_work", idx, "period_start", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Input
                      type="number"
                      placeholder="To Year"
                      value={work.period_end || ""}
                      onChange={(e) => updateArrayField("non_church_work", idx, "period_end", parseInt(e.target.value) || null)}
                      disabled={disabled}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("non_church_work", idx)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("non_church_work", { organization: "", job_title: "", period_start: null, period_end: null })}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Work Experience
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Other Tab */}
      <TabsContent value="other" className="mt-6 space-y-6">
        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Emergency Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Contact Name <span className="text-destructive">*</span></Label>
              <Input
                value={payload.emergency_contact?.contact_name || ""}
                onChange={(e) => updateField("emergency_contact", { 
                  ...payload.emergency_contact, 
                  contact_name: e.target.value 
                })}
                disabled={disabled}
                placeholder="Full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship <span className="text-destructive">*</span></Label>
              <Input
                value={payload.emergency_contact?.relationship || ""}
                onChange={(e) => updateField("emergency_contact", { 
                  ...payload.emergency_contact, 
                  relationship: e.target.value 
                })}
                disabled={disabled}
                placeholder="e.g., Spouse, Sibling"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number <span className="text-destructive">*</span></Label>
              <Input
                value={payload.emergency_contact?.phone_number || ""}
                onChange={(e) => updateField("emergency_contact", { 
                  ...payload.emergency_contact, 
                  phone_number: e.target.value.replace(/\D/g, "")
                })}
                disabled={disabled}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="233..."
                required
              />
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Additional Information</h3>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={payload.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              disabled={disabled}
              placeholder="Any additional information you'd like to share..."
              rows={4}
            />
          </div>
        </div>
      </TabsContent>

      {/* Review Tab */}
      <TabsContent value="review" className="mt-6">
        <IntakeReviewSummary payload={payload} />
      </TabsContent>
    </Tabs>
  );
}
