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

interface IntakeFormTabsProps {
  payload: Record<string, any>;
  onChange: (payload: Record<string, any>) => void;
  disabled?: boolean;
  submissionId?: string;
}

const ASSOCIATIONS = [
  "Ashanti",
  "Brong Ahafo",
  "Central",
  "Eastern",
  "Greater Accra",
  "Northern",
  "Upper East",
  "Upper West",
  "Volta",
  "Western",
  "Western North",
  "Oti",
  "Ahafo",
  "Bono East",
  "North East",
  "Savannah",
];

export default function IntakeFormTabs({ payload, onChange, disabled, submissionId }: IntakeFormTabsProps) {
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>(payload.photo_url || "");

  const updateField = (field: string, value: any) => {
    onChange({ ...payload, [field]: value });
  };

  const updateArrayField = (field: string, index: number, key: string, value: any) => {
    const arr = [...(payload[field] || [])];
    arr[index] = { ...arr[index], [key]: value };
    onChange({ ...payload, [field]: arr });
  };

  const addArrayItem = (field: string, defaultItem: Record<string, any>) => {
    const arr = [...(payload[field] || []), defaultItem];
    onChange({ ...payload, [field]: arr });
  };

  const removeArrayItem = (field: string, index: number) => {
    const arr = (payload[field] || []).filter((_: any, i: number) => i !== index);
    onChange({ ...payload, [field]: arr });
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

    // Create preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPhotoPreview(objectUrl);

    // Upload to storage
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `intake/${submissionId || "temp"}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("minister-photos")
        .upload(fileName, file, { upsert: true });

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

  return (
    <Tabs defaultValue="bio" className="w-full">
      <TabsList className="grid w-full grid-cols-6 h-auto p-1">
        <TabsTrigger value="bio" className="text-xs sm:text-sm py-2">Bio Data</TabsTrigger>
        <TabsTrigger value="education" className="text-xs sm:text-sm py-2">Education</TabsTrigger>
        <TabsTrigger value="ministerial" className="text-xs sm:text-sm py-2">Ministerial</TabsTrigger>
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
                Square image recommended • Max 2MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={payload.full_name || ""}
                onChange={(e) => updateField("full_name", e.target.value)}
                disabled={disabled}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Title(s)</Label>
              <Input
                value={payload.titles || ""}
                onChange={(e) => updateField("titles", e.target.value)}
                disabled={disabled}
                placeholder="e.g., Rev., Dr., Pastor"
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={payload.date_of_birth || ""}
                onChange={(e) => updateField("date_of_birth", e.target.value)}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input
                value={payload.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={disabled}
                placeholder="+233..."
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input
                value={payload.whatsapp || ""}
                onChange={(e) => updateField("whatsapp", e.target.value)}
                disabled={disabled}
                placeholder="+233..."
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={payload.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={disabled}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>GPS Address</Label>
              <Input
                value={payload.gps_address || ""}
                onChange={(e) => updateField("gps_address", e.target.value)}
                disabled={disabled}
                placeholder="e.g., GA-123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Location/Area</Label>
              <Input
                value={payload.location || ""}
                onChange={(e) => updateField("location", e.target.value)}
                disabled={disabled}
                placeholder="City or town"
              />
            </div>
          </div>
        </div>

        {/* Marital Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Marital Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Select
                value={payload.marital_status || ""}
                onValueChange={(value) => updateField("marital_status", value)}
                disabled={disabled}
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
            <div className="space-y-2">
              <Label>Marriage Type</Label>
              <Select
                value={payload.marriage_type || ""}
                onValueChange={(value) => updateField("marriage_type", value)}
                disabled={disabled}
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
              <Label>Spouse Name</Label>
              <Input
                value={payload.spouse_name || ""}
                onChange={(e) => updateField("spouse_name", e.target.value)}
                disabled={disabled}
                placeholder="Enter spouse name"
              />
            </div>
            <div className="space-y-2">
              <Label>Spouse Phone Number</Label>
              <Input
                value={payload.spouse_phone_number || ""}
                onChange={(e) => updateField("spouse_phone_number", e.target.value)}
                disabled={disabled}
                placeholder="+233..."
              />
            </div>
            <div className="space-y-2">
              <Label>Spouse Occupation</Label>
              <Input
                value={payload.spouse_occupation || ""}
                onChange={(e) => updateField("spouse_occupation", e.target.value)}
                disabled={disabled}
                placeholder="Enter occupation"
              />
            </div>
            <div className="space-y-2">
              <Label>Number of Children</Label>
              <Input
                type="number"
                min="0"
                value={payload.number_of_children || ""}
                onChange={(e) => updateField("number_of_children", parseInt(e.target.value) || 0)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Children */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Children Details</h3>
          <div className="space-y-3">
            {(payload.children || []).map((child: any, idx: number) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Child Name</Label>
                  <Input
                    value={child.child_name || ""}
                    onChange={(e) => updateArrayField("children", idx, "child_name", e.target.value)}
                    disabled={disabled}
                    placeholder="Child's name"
                  />
                </div>
                <div className="w-40 space-y-1">
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
                  className="shrink-0"
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
      </TabsContent>

      {/* Education Tab */}
      <TabsContent value="education" className="mt-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Educational Qualifications</h3>
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
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem("qualifications", { qualification: "", institution: "", year_obtained: null })}
              disabled={disabled}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Qualification
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* Ministerial Tab */}
      <TabsContent value="ministerial" className="mt-6 space-y-6">
        {/* Current Ministry */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Current Ministry</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role/Position *</Label>
              <Input
                value={payload.role || ""}
                onChange={(e) => updateField("role", e.target.value)}
                disabled={disabled}
                placeholder="e.g., Pastor, Evangelist"
              />
            </div>
            <div className="space-y-2">
              <Label>Current Church Name</Label>
              <Input
                value={payload.current_church_name || ""}
                onChange={(e) => updateField("current_church_name", e.target.value)}
                disabled={disabled}
                placeholder="Church name"
              />
            </div>
            <div className="space-y-2">
              <Label>Position at Church</Label>
              <Input
                value={payload.position_at_church || ""}
                onChange={(e) => updateField("position_at_church", e.target.value)}
                disabled={disabled}
                placeholder="e.g., Senior Pastor"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Church Address</Label>
              <Input
                value={payload.church_address || ""}
                onChange={(e) => updateField("church_address", e.target.value)}
                disabled={disabled}
                placeholder="Full address"
              />
            </div>
          </div>
        </div>

        {/* Convention Structure */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Convention Structure</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Association</Label>
              <Select
                value={payload.association || ""}
                onValueChange={(value) => updateField("association", value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select association" />
                </SelectTrigger>
                <SelectContent>
                  {ASSOCIATIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Input
                value={payload.zone || ""}
                onChange={(e) => updateField("zone", e.target.value)}
                disabled={disabled}
                placeholder="Zone name"
              />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Input
                value={payload.sector || ""}
                onChange={(e) => updateField("sector", e.target.value)}
                disabled={disabled}
                placeholder="Sector name"
              />
            </div>
            <div className="space-y-2">
              <Label>Fellowship</Label>
              <Input
                value={payload.fellowship || ""}
                onChange={(e) => updateField("fellowship", e.target.value)}
                disabled={disabled}
                placeholder="Fellowship name"
              />
            </div>
          </div>
        </div>

        {/* Ministerial Milestones */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Ministerial Milestones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    placeholder="Church Name"
                    value={hist.church_name || ""}
                    onChange={(e) => updateArrayField("ministerial_history", idx, "church_name", e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder="Position"
                    value={hist.position || ""}
                    onChange={(e) => updateArrayField("ministerial_history", idx, "position", e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder="Association"
                    value={hist.association || ""}
                    onChange={(e) => updateArrayField("ministerial_history", idx, "association", e.target.value)}
                    disabled={disabled}
                  />
                  <Input
                    placeholder="Sector"
                    value={hist.sector || ""}
                    onChange={(e) => updateArrayField("ministerial_history", idx, "sector", e.target.value)}
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
              <Label>Contact Name</Label>
              <Input
                value={payload.emergency_contact?.contact_name || ""}
                onChange={(e) => updateField("emergency_contact", { 
                  ...payload.emergency_contact, 
                  contact_name: e.target.value 
                })}
                disabled={disabled}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Input
                value={payload.emergency_contact?.relationship || ""}
                onChange={(e) => updateField("emergency_contact", { 
                  ...payload.emergency_contact, 
                  relationship: e.target.value 
                })}
                disabled={disabled}
                placeholder="e.g., Spouse, Sibling"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={payload.emergency_contact?.phone_number || ""}
                onChange={(e) => updateField("emergency_contact", { 
                  ...payload.emergency_contact, 
                  phone_number: e.target.value 
                })}
                disabled={disabled}
                placeholder="+233..."
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
