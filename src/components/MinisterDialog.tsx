import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Trash2, Upload, User } from "lucide-react";
import { MINISTRY_ENGAGEMENT_OPTIONS, SECTORS, TITLE_OPTIONS, ZONES, getAssociationsForSector, getChurchesForAssociation } from "@/config/ministerOptions";
import ImageCropDialog from "@/components/application/ImageCropDialog";
import GhanaCardUploadCard from "@/components/GhanaCardUploadCard";

const ministerSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().max(255).refine((val) => !val || z.string().email().safeParse(val).success, "Invalid email").optional(),
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  role: z.string().trim().min(1, "Role is required").max(100),
  location: z.string().trim().max(100).optional(),
  date_joined: z.string().min(1, "Date is required"), // System-managed field
  status: z.enum(["active", "inactive", "retired"]),
  notes: z.string().max(1000).optional(),
  titles: z.string().trim().max(200).optional(),
  date_of_birth: z.string().optional(),
  gps_address: z.string().trim().max(200).optional(),
  ghana_card_number: z.string().trim().max(50).optional(),
  ghana_card_front_name: z.string().trim().max(255).optional(),
  ghana_card_front_type: z.string().trim().max(100).optional(),
  ghana_card_front_url: z.string().trim().max(500).optional(),
  ghana_card_back_name: z.string().trim().max(255).optional(),
  ghana_card_back_type: z.string().trim().max(100).optional(),
  ghana_card_back_url: z.string().trim().max(500).optional(),
  marital_status: z.string().max(20).optional(),
  spouse_name: z.string().trim().max(100).optional(),
  spouse_phone_number: z.string().trim().max(20).optional(),
  spouse_occupation: z.string().trim().max(100).optional(),
  marriage_type: z.string().max(20).optional(),
  number_of_children: z.number().min(0).default(0),
  ministry_engagement: z.string().trim().max(20).optional(),
  current_church_name: z.string().trim().max(200).optional(),
  position_at_church: z.string().trim().max(100).optional(),
  church_address: z.string().trim().max(300).optional(),
  association: z.string().trim().max(100).optional(),
  sector: z.string().trim().max(100).optional(),
  fellowship: z.string().trim().max(100).optional(),
  zone: z.string().trim().max(100).optional(),
  ordination_year: z.number().min(1900).max(2100).nullable().optional(),
  recognition_year: z.number().min(1900).max(2100).nullable().optional(),
  licensing_year: z.number().min(1900).max(2100).nullable().optional(),
  commissioning_year: z.number().min(1900).max(2100).nullable().optional(),
  physical_folder_number: z.string().trim().max(50).optional(),
});

interface MinisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  minister?: any;
  onSuccess: () => void;
}

const MinisterDialog = ({ open, onOpenChange, minister, onSuccess }: MinisterDialogProps) => {
  const OTHER_CHURCH_VALUE = "__other__";
  const OTHER_TITLE_VALUE = "__other_title__";
  const QUALIFICATION_DOCUMENT_BUCKET = "qualification-documents";
  const GHANA_CARD_DOCUMENT_BUCKET = "ghana-card-documents";
  const QUALIFICATION_DOCUMENT_MAX_SIZE = 2 * 1024 * 1024;
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState("");
  const [uploadingQualificationIndex, setUploadingQualificationIndex] = useState<number | null>(null);
  const [useCustomCurrentChurch, setUseCustomCurrentChurch] = useState(false);
  const [useCustomTitle, setUseCustomTitle] = useState(false);
  const [customHistoryChurchRows, setCustomHistoryChurchRows] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    whatsapp: "",
    role: "",
    location: "",
    date_joined: new Date().toISOString().split("T")[0],
    status: "active",
    notes: "",
    titles: "",
    date_of_birth: "",
    gps_address: "",
    ghana_card_number: "",
    ghana_card_front_name: "",
    ghana_card_front_type: "",
    ghana_card_front_url: "",
    ghana_card_back_name: "",
    ghana_card_back_type: "",
    ghana_card_back_url: "",
    marital_status: "",
    spouse_name: "",
    spouse_phone_number: "",
    spouse_occupation: "",
    marriage_type: "",
    number_of_children: 0,
    ministry_engagement: "",
    current_church_name: "",
    position_at_church: "",
    church_address: "",
    association: "",
    sector: "",
    fellowship: "",
    zone: "",
    ordination_year: null as number | null,
    recognition_year: null as number | null,
    licensing_year: null as number | null,
    commissioning_year: null as number | null,
    physical_folder_number: "",
  });

  const [qualifications, setQualifications] = useState<Array<{
    qualification: string;
    institution: string;
    year_obtained: number | null;
    document_name?: string | null;
    document_type?: string | null;
    document_url?: string | null;
  }>>([]);
  const [history, setHistory] = useState<Array<{ church_name: string; association: string; sector: string; position: string; period_start: number | null; period_end: number | null }>>([]);
  const [nonChurchWork, setNonChurchWork] = useState<Array<{ organization: string; job_title: string; period_start: number | null; period_end: number | null }>>([]);
  const [conventionPositions, setConventionPositions] = useState<Array<{ position: string; period_start: number | null; period_end: number | null }>>([]);
  const [children, setChildren] = useState<Array<{ child_name: string; date_of_birth: string }>>([]);
  const [areasOfMinistry, setAreasOfMinistry] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState({
    contact_name: "",
    relationship: "",
    phone_number: "",
  });

  const churchOptions = getChurchesForAssociation(formData.association);
  const isCustomCurrentChurch = useCustomCurrentChurch || (!!formData.current_church_name && !churchOptions.includes(formData.current_church_name));
  const isSingle = formData.marital_status === "single";
  const isCustomTitle = useCustomTitle || (!!formData.titles && !TITLE_OPTIONS.includes(formData.titles));

  const handleMaritalStatusChange = (value: string) => {
    if (value === "single") {
      setFormData({
        ...formData,
        marital_status: value,
        marriage_type: "",
        spouse_name: "",
        spouse_phone_number: "",
        spouse_occupation: "",
        number_of_children: 0,
      });
      setChildren([]);
      return;
    }

    setFormData({ ...formData, marital_status: value });
  };

  const updateHistoryRow = (index: number, values: Partial<{ church_name: string; association: string; sector: string; position: string; period_start: number | null; period_end: number | null }>) => {
    const newHistory = [...history];
    newHistory[index] = { ...newHistory[index], ...values };
    setHistory(newHistory);
  };

  useEffect(() => {
    const loadMinisterData = async () => {
      if (minister) {
        setPhotoPreview(minister.photo_url || "");
        setFormData({
          full_name: minister.full_name || "",
          email: minister.email || "",
          phone: minister.phone || "",
          whatsapp: minister.whatsapp || "",
          role: minister.role || "",
          location: minister.location || "",
          date_joined: minister.date_joined || new Date().toISOString().split("T")[0],
          status: minister.status || "active",
          notes: minister.notes || "",
          titles: minister.titles || "",
          date_of_birth: minister.date_of_birth || "",
          gps_address: minister.gps_address || "",
          ghana_card_number: minister.ghana_card_number || "",
          ghana_card_front_name: minister.ghana_card_front_name || "",
          ghana_card_front_type: minister.ghana_card_front_type || "",
          ghana_card_front_url: minister.ghana_card_front_url || "",
          ghana_card_back_name: minister.ghana_card_back_name || "",
          ghana_card_back_type: minister.ghana_card_back_type || "",
          ghana_card_back_url: minister.ghana_card_back_url || "",
          marital_status: minister.marital_status || "",
          spouse_name: minister.spouse_name || "",
          spouse_phone_number: minister.spouse_phone_number || "",
          spouse_occupation: minister.spouse_occupation || "",
          marriage_type: minister.marriage_type || "",
          number_of_children: minister.number_of_children || 0,
          ministry_engagement: minister.ministry_engagement || "",
          current_church_name: minister.current_church_name || "",
          position_at_church: minister.position_at_church || "",
          church_address: minister.church_address || "",
          association: minister.association || "",
          sector: minister.sector || "",
          fellowship: minister.fellowship || "",
          zone: minister.zone || "",
          ordination_year: minister.ordination_year || null,
          recognition_year: minister.recognition_year || null,
          licensing_year: minister.licensing_year || null,
          commissioning_year: minister.commissioning_year || null,
          physical_folder_number: minister.physical_folder_number || "",
        });
        setAreasOfMinistry(minister.areas_of_ministry || []);

        // Load related data
        const [qualData, histData, nonChurchData, conventionData, childData, emergData] = await Promise.all([
          supabase.from("educational_qualifications").select("*").eq("minister_id", minister.id),
          supabase.from("ministerial_history").select("*").eq("minister_id", minister.id),
          supabase.from("non_church_work").select("*").eq("minister_id", minister.id),
          supabase.from("convention_positions").select("*").eq("minister_id", minister.id),
          supabase.from("minister_children").select("*").eq("minister_id", minister.id),
          supabase.from("emergency_contacts").select("*").eq("minister_id", minister.id).maybeSingle(),
        ]);

        if (qualData.data) setQualifications(qualData.data);
        if (histData.data) setHistory(histData.data);
        if (nonChurchData.data) setNonChurchWork(nonChurchData.data);
        if (conventionData.data) setConventionPositions(conventionData.data);
        if (childData.data) setChildren(childData.data);
        setUseCustomTitle(false);
        setUseCustomCurrentChurch(false);
        setCustomHistoryChurchRows({});
        if (emergData.data) {
          setEmergencyContact({
            contact_name: emergData.data.contact_name || "",
            relationship: emergData.data.relationship || "",
            phone_number: emergData.data.phone_number || "",
          });
        }
      } else {
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          whatsapp: "",
          role: "",
          location: "",
          date_joined: new Date().toISOString().split("T")[0],
          status: "active",
          notes: "",
          titles: "",
          date_of_birth: "",
          gps_address: "",
          ghana_card_number: "",
          ghana_card_front_name: "",
          ghana_card_front_type: "",
          ghana_card_front_url: "",
          ghana_card_back_name: "",
          ghana_card_back_type: "",
          ghana_card_back_url: "",
          marital_status: "",
          spouse_name: "",
          spouse_phone_number: "",
          spouse_occupation: "",
          marriage_type: "",
          number_of_children: 0,
          ministry_engagement: "",
          current_church_name: "",
          position_at_church: "",
          church_address: "",
          association: "",
          sector: "",
          fellowship: "",
          zone: "",
          ordination_year: null,
          recognition_year: null,
          licensing_year: null,
          commissioning_year: null,
          physical_folder_number: "",
        });
        setQualifications([]);
        setHistory([]);
        setNonChurchWork([]);
        setConventionPositions([]);
        setChildren([]);
        setAreasOfMinistry([]);
        setEmergencyContact({ contact_name: "", relationship: "", phone_number: "" });
        setPhotoPreview("");
        setPhotoFile(null);
        setUseCustomTitle(false);
        setUseCustomCurrentChurch(false);
        setCustomHistoryChurchRows({});
      }
    };

    if (open) {
      loadMinisterData();
    }
  }, [minister, open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo size must be less than 2MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageToCrop(objectUrl);
    setCropDialogOpen(true);
  };

  const handlePhotoCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], `minister-photo-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    const objectUrl = URL.createObjectURL(croppedBlob);
    setPhotoFile(croppedFile);
    setPhotoPreview(objectUrl);
    setCropDialogOpen(false);
    setImageToCrop("");
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
    const filePath = `admin/${minister?.id || "draft"}/qualification-${index}-${Date.now()}-${baseName}.${fileExt}`;

    setUploadingQualificationIndex(index);
    try {
      const { error: uploadError } = await supabase.storage
        .from(QUALIFICATION_DOCUMENT_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(QUALIFICATION_DOCUMENT_BUCKET)
        .getPublicUrl(filePath);

      const newQuals = [...qualifications];
      newQuals[index] = {
        ...newQuals[index],
        document_name: file.name,
        document_type: file.type,
        document_url: urlData.publicUrl,
      };
      setQualifications(newQuals);
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
    const filePath = `admin/${minister?.id || "draft"}/ghana-card-${side}-${Date.now()}-${baseName}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(GHANA_CARD_DOCUMENT_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(GHANA_CARD_DOCUMENT_BUCKET)
        .getPublicUrl(filePath);

      if (side === "front") {
        setFormData({
          ...formData,
          ghana_card_front_name: file.name,
          ghana_card_front_type: file.type,
          ghana_card_front_url: urlData.publicUrl,
        });
      } else {
        setFormData({
          ...formData,
          ghana_card_back_name: file.name,
          ghana_card_back_type: file.type,
          ghana_card_back_url: urlData.publicUrl,
        });
      }
      toast.success(`Ghana Card ${side} uploaded`);
    } catch (error: any) {
      console.error(`Ghana Card ${side} upload error:`, error);
      toast.error(error.message || `Failed to upload Ghana Card ${side}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validate data
      const validated = ministerSchema.parse(formData);
      const isValidatedSingle = validated.marital_status === "single";
      const validQualifications = qualifications.filter((qualification) => qualification.qualification.trim() && qualification.document_url);

      if (validQualifications.length === 0) {
        toast.error("Educational Qualifications and upload are required");
        setLoading(false);
        return;
      }

      if (!photoFile && !minister?.photo_url) {
        toast.error("Photo upload is required");
        setLoading(false);
        return;
      }

      // Convert empty strings to null for optional fields
      const dataToSubmit = {
        ...validated,
        email: validated.email?.trim() || null,
        phone: validated.phone?.trim() || null,
        whatsapp: validated.whatsapp?.trim() || null,
        location: validated.location?.trim() || null,
        notes: validated.notes?.trim() || null,
        titles: validated.titles?.trim() || null,
        date_of_birth: validated.date_of_birth?.trim() || null,
        gps_address: validated.gps_address?.trim() || null,
        ghana_card_number: validated.ghana_card_number?.trim() || null,
        ghana_card_front_name: validated.ghana_card_front_name?.trim() || null,
        ghana_card_front_type: validated.ghana_card_front_type?.trim() || null,
        ghana_card_front_url: validated.ghana_card_front_url?.trim() || null,
        ghana_card_back_name: validated.ghana_card_back_name?.trim() || null,
        ghana_card_back_type: validated.ghana_card_back_type?.trim() || null,
        ghana_card_back_url: validated.ghana_card_back_url?.trim() || null,
        marital_status: validated.marital_status?.trim() || null,
        spouse_name: isValidatedSingle ? null : validated.spouse_name?.trim() || null,
        spouse_phone_number: isValidatedSingle ? null : validated.spouse_phone_number?.trim() || null,
        spouse_occupation: isValidatedSingle ? null : validated.spouse_occupation?.trim() || null,
        marriage_type: isValidatedSingle ? null : validated.marriage_type?.trim() || null,
        number_of_children: isValidatedSingle ? 0 : validated.number_of_children,
        ministry_engagement: validated.ministry_engagement?.trim() || null,
        current_church_name: validated.current_church_name?.trim() || null,
        position_at_church: validated.position_at_church?.trim() || null,
        church_address: validated.church_address?.trim() || null,
        association: validated.association?.trim() || null,
        sector: validated.sector?.trim() || null,
        fellowship: validated.fellowship?.trim() || null,
        zone: validated.zone?.trim() || null,
        areas_of_ministry: areasOfMinistry.length > 0 ? areasOfMinistry : null,
        physical_folder_number: validated.physical_folder_number?.trim() || null,
      };

      let ministerId = minister?.id;
      let photoUrl = minister?.photo_url || null;

      // Upload photo if a new one was selected
      if (photoFile && ministerId) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${ministerId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('minister-photos')
          .upload(fileName, photoFile, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('minister-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrlData.publicUrl;
      }

      const finalData = { ...dataToSubmit, photo_url: photoUrl };

      if (minister) {
        const { error } = await supabase
          .from("ministers")
          .update(finalData as any)
          .eq("id", minister.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ministers")
          .insert([finalData as any])
          .select()
          .single();

        if (error) throw error;
        ministerId = data.id;
        
        // Upload photo for new minister
        if (photoFile && ministerId) {
          const fileExt = photoFile.name.split('.').pop();
          const fileName = `${ministerId}-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('minister-photos')
            .upload(fileName, photoFile);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('minister-photos')
              .getPublicUrl(fileName);
            
            await supabase
              .from("ministers")
              .update({ photo_url: publicUrlData.publicUrl })
              .eq("id", ministerId);
          }
        }
      }

      // Save related data
      if (ministerId) {
        // Delete existing related data
        await Promise.all([
          supabase.from("educational_qualifications").delete().eq("minister_id", ministerId),
          supabase.from("ministerial_history").delete().eq("minister_id", ministerId),
          supabase.from("non_church_work").delete().eq("minister_id", ministerId),
          supabase.from("convention_positions").delete().eq("minister_id", ministerId),
          supabase.from("minister_children").delete().eq("minister_id", ministerId),
          supabase.from("emergency_contacts").delete().eq("minister_id", ministerId),
        ]);

        // Insert new related data
        const insertPromises = [];

        if (validQualifications.length > 0) {
          insertPromises.push(
            supabase.from("educational_qualifications").insert(
              validQualifications.map(q => ({ ...q, minister_id: ministerId }))
            )
          );
        }

        if (history.length > 0) {
          insertPromises.push(
            supabase.from("ministerial_history").insert(
              history.filter(h => h.church_name && h.position).map(h => ({ ...h, minister_id: ministerId }))
            )
          );
        }

        if (nonChurchWork.length > 0) {
          insertPromises.push(
            supabase.from("non_church_work").insert(
              nonChurchWork.filter(w => w.organization && w.job_title).map(w => ({ ...w, minister_id: ministerId }))
            )
          );
        }

        if (conventionPositions.length > 0) {
          insertPromises.push(
            supabase.from("convention_positions").insert(
              conventionPositions.filter(p => p.position).map(p => ({ ...p, minister_id: ministerId }))
            )
          );
        }

        if (!isValidatedSingle && children.length > 0) {
          insertPromises.push(
            supabase.from("minister_children").insert(
              children.filter(c => c.child_name).map(c => ({ ...c, minister_id: ministerId }))
            )
          );
        }

        if (emergencyContact.contact_name && emergencyContact.phone_number) {
          insertPromises.push(
            supabase.from("emergency_contacts").insert([{ ...emergencyContact, minister_id: ministerId }])
          );
        }

        await Promise.all(insertPromises);
      }

      toast.success(minister ? "Minister updated successfully" : "Minister added successfully");
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
      <ImageCropDialog
        open={cropDialogOpen}
        imageSrc={imageToCrop}
        onCropComplete={handlePhotoCropComplete}
        onCancel={handlePhotoCropCancel}
      />
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{minister ? "Edit Minister" : "Add New Minister"}</DialogTitle>
          <DialogDescription>
            Fill in the Ministers' information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="bio" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="bio">Bio Data</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="ministerial">Ministerial</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent value="bio" className="space-y-4 mt-4">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border-2 border-dashed border-primary/20">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={photoPreview} alt="Minister photo" />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-16 w-16 text-primary/40" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <Label htmlFor="photo" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>{photoPreview ? "Change Photo" : "Upload Photo *"}</span>
                    </div>
                  </Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">Crop before upload. Recommended: square image, max 2MB.</p>
                </div>
              </div>

              {/* Minister ID - Auto-generated and read-only */}
              {minister?.minister_id && (
                <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <Label className="text-sm font-medium">Minister ID (Auto-generated)</Label>
                  <div className="font-mono text-lg font-bold text-primary">
                    {minister.minister_id}
                  </div>
                  <p className="text-xs text-muted-foreground">This ID is automatically assigned and cannot be changed</p>
                </div>
              )}

              {/* Physical Folder Number - editable for 6 months after creation */}
              <div className="space-y-2">
                <Label htmlFor="physical_folder_number">Physical Folder Number</Label>
                <Input
                  id="physical_folder_number"
                  value={formData.physical_folder_number}
                  onChange={(e) => setFormData({ ...formData, physical_folder_number: e.target.value })}
                  placeholder="Enter folder number"
                  disabled={loading || (minister?.created_at && new Date(minister.created_at) < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000))}
                />
                {minister?.created_at && new Date(minister.created_at) < new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) && (
                  <p className="text-xs text-muted-foreground">This field is locked after 6 months from record creation</p>
                )}
              </div>

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
                  <Label htmlFor="titles">Title(s)</Label>
                  <div className="space-y-2">
                    <Select
                      value={isCustomTitle ? OTHER_TITLE_VALUE : formData.titles}
                      disabled={loading}
                      onValueChange={(value) => {
                        if (value === OTHER_TITLE_VALUE) {
                          setUseCustomTitle(true);
                          setFormData({ ...formData, titles: "" });
                          return;
                        }
                        setUseCustomTitle(false);
                        setFormData({ ...formData, titles: value });
                      }}
                    >
                      <SelectTrigger id="titles">
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
                        value={formData.titles}
                        onChange={(e) => setFormData({ ...formData, titles: e.target.value })}
                        disabled={loading}
                        placeholder="Type title"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ghana_card_number">Ghana Card Number</Label>
                  <Input
                    id="ghana_card_number"
                    value={formData.ghana_card_number}
                    onChange={(e) => setFormData({ ...formData, ghana_card_number: e.target.value })}
                    disabled={loading}
                    placeholder="e.g., GHA-123456789-0"
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
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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
                  <Label htmlFor="gps_address">GPS Address</Label>
                  <Input
                    id="gps_address"
                    value={formData.gps_address}
                    onChange={(e) => setFormData({ ...formData, gps_address: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location/Area</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-3 col-span-2">
                  <Label>Ghana Card Upload</Label>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <GhanaCardUploadCard
                      id="ghana-card-front-admin-upload"
                      title="Ghana Card Front"
                      sideLabel="Front side"
                      imageUrl={formData.ghana_card_front_url}
                      imageName={formData.ghana_card_front_name}
                      disabled={loading}
                      onUpload={(file) => handleGhanaCardUpload("front", file)}
                      onRemove={() => setFormData({
                        ...formData,
                        ghana_card_front_name: "",
                        ghana_card_front_type: "",
                        ghana_card_front_url: "",
                      })}
                    />
                    <GhanaCardUploadCard
                      id="ghana-card-back-admin-upload"
                      title="Ghana Card Back"
                      sideLabel="Back side"
                      imageUrl={formData.ghana_card_back_url}
                      imageName={formData.ghana_card_back_name}
                      disabled={loading}
                      onUpload={(file) => handleGhanaCardUpload("back", file)}
                      onRemove={() => setFormData({
                        ...formData,
                        ghana_card_back_name: "",
                        ghana_card_back_type: "",
                        ghana_card_back_url: "",
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={handleMaritalStatusChange}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!isSingle && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_name">Name of Spouse</Label>
                      <Input
                        id="spouse_name"
                        value={formData.spouse_name}
                        onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_phone_number">Spouse's Phone Number</Label>
                      <Input
                        id="spouse_phone_number"
                        value={formData.spouse_phone_number}
                        onChange={(e) => setFormData({ ...formData, spouse_phone_number: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spouse_occupation">Occupation of Spouse</Label>
                      <Input
                        id="spouse_occupation"
                        value={formData.spouse_occupation}
                        onChange={(e) => setFormData({ ...formData, spouse_occupation: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="marriage_type">Marriage Type</Label>
                      <Select
                        value={formData.marriage_type}
                        onValueChange={(value) => setFormData({ ...formData, marriage_type: value })}
                        disabled={loading}
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
                      <Label htmlFor="number_of_children">Number of Children</Label>
                      <Input
                        id="number_of_children"
                        type="number"
                        min="0"
                        value={formData.number_of_children}
                        onChange={(e) => setFormData({ ...formData, number_of_children: parseInt(e.target.value) || 0 })}
                        disabled={loading}
                      />
                    </div>
                  </>
                )}
              </div>

              {!isSingle && (
              <div className="space-y-2">
                <Label>Names of Biological Children</Label>
                {children.map((child, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-end">
                    <Input
                      placeholder="Child name"
                      value={child.child_name}
                      onChange={(e) => {
                        const newChildren = [...children];
                        newChildren[idx].child_name = e.target.value;
                        setChildren(newChildren);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="date"
                      placeholder="Date of Birth"
                      value={child.date_of_birth}
                      onChange={(e) => {
                        const newChildren = [...children];
                        newChildren[idx].date_of_birth = e.target.value;
                        setChildren(newChildren);
                      }}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setChildren(children.filter((_, i) => i !== idx))}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setChildren([...children, { child_name: "", date_of_birth: "" }])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Child
                </Button>
              </div>
              )}
            </TabsContent>

            <TabsContent value="education" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>
                  Educational Qualifications (Starting with highest) <span className="text-destructive">*</span>
                </Label>
                {qualifications.map((qual, idx) => (
                  <div key={idx} className="rounded-md border p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_auto] gap-2 items-end">
                      <Input
                        placeholder="Qualification"
                        value={qual.qualification}
                        onChange={(e) => {
                          const newQuals = [...qualifications];
                          newQuals[idx].qualification = e.target.value;
                          setQualifications(newQuals);
                        }}
                        disabled={loading}
                        required
                      />
                      <Input
                        placeholder="Institution"
                        value={qual.institution}
                        onChange={(e) => {
                          const newQuals = [...qualifications];
                          newQuals[idx].institution = e.target.value;
                          setQualifications(newQuals);
                        }}
                        disabled={loading}
                      />
                      <Input
                        type="number"
                        placeholder="Year"
                        value={qual.year_obtained || ""}
                        onChange={(e) => {
                          const newQuals = [...qualifications];
                          newQuals[idx].year_obtained = parseInt(e.target.value) || null;
                          setQualifications(newQuals);
                        }}
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setQualifications(qualifications.filter((_, i) => i !== idx))}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Supporting Document <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">Accepted: PDF and images, up to 2MB.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Label htmlFor={`admin-qualification-document-${idx}`} className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                            <Upload className="h-4 w-4" />
                            <span>{uploadingQualificationIndex === idx ? "Uploading..." : "Upload document"}</span>
                          </div>
                        </Label>
                        <Input
                          id={`admin-qualification-document-${idx}`}
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          disabled={loading || uploadingQualificationIndex === idx}
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
                              onClick={() => {
                                const newQuals = [...qualifications];
                                newQuals[idx] = {
                                  ...newQuals[idx],
                                  document_name: null,
                                  document_type: null,
                                  document_url: null,
                                };
                                setQualifications(newQuals);
                              }}
                              disabled={loading}
                            >
                              Remove document
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {qual.document_name && (
                      <p className="text-sm text-muted-foreground">{qual.document_name}</p>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQualifications([
                    ...qualifications,
                    {
                      qualification: "",
                      institution: "",
                      year_obtained: null,
                      document_name: null,
                      document_type: null,
                      document_url: null,
                    },
                  ])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Qualification
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="ministerial" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
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
                {/* Date Joined - Hidden system field, automatically set on creation */}
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
                <div className="space-y-2">
                  <Label htmlFor="position_at_church">Position at Church</Label>
                  <Input
                    id="position_at_church"
                    value={formData.position_at_church}
                    onChange={(e) => setFormData({ ...formData, position_at_church: e.target.value })}
                    placeholder="e.g., Head Pastor"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministry_engagement">Type of Ministry</Label>
                  <Select
                    value={formData.ministry_engagement}
                    onValueChange={(value) => setFormData({ ...formData, ministry_engagement: value })}
                    disabled={loading}
                  >
                    <SelectTrigger id="ministry_engagement">
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
                  <Label htmlFor="church_address">Church Address</Label>
                  <Input
                    id="church_address"
                    value={formData.church_address}
                    onChange={(e) => setFormData({ ...formData, church_address: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Select
                    value={formData.sector}
                    onValueChange={(value) => {
                      setUseCustomCurrentChurch(false);
                      setFormData({ ...formData, sector: value, association: "", fellowship: "", current_church_name: "" });
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="association">Association</Label>
                  <Select
                    value={formData.association}
                    onValueChange={(value) => {
                      setUseCustomCurrentChurch(false);
                      setFormData({ ...formData, association: value, fellowship: "", current_church_name: "" });
                    }}
                    disabled={loading || !formData.sector}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.sector ? "Select Association" : "Select Sector first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getAssociationsForSector(formData.sector).map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_church_name">Current Church Name</Label>
                  <div className="space-y-2">
                    <Select
                      value={isCustomCurrentChurch ? OTHER_CHURCH_VALUE : formData.current_church_name}
                      onValueChange={(value) => {
                        if (value === OTHER_CHURCH_VALUE) {
                          setUseCustomCurrentChurch(true);
                          setFormData({ ...formData, current_church_name: "" });
                          return;
                        }
                        setUseCustomCurrentChurch(false);
                        setFormData({ ...formData, current_church_name: value });
                      }}
                      disabled={loading || !formData.association}
                    >
                      <SelectTrigger id="current_church_name">
                        <SelectValue
                          placeholder={
                            !formData.association
                              ? "Select Association first"
                              : "Select Church"
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
                        value={formData.current_church_name}
                        onChange={(e) => setFormData({ ...formData, current_church_name: e.target.value })}
                        disabled={loading}
                        placeholder="Type church name"
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone">Zone</Label>
                  <Select
                    value={formData.zone}
                    onValueChange={(value) => setFormData({ ...formData, zone: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONES.map((z) => (
                        <SelectItem key={z} value={z}>{z}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ordination_year">Ordination Year</Label>
                  <Input
                    id="ordination_year"
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.ordination_year || ""}
                    onChange={(e) => setFormData({ ...formData, ordination_year: parseInt(e.target.value) || null })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recognition_year">Recognition Year</Label>
                  <Input
                    id="recognition_year"
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.recognition_year || ""}
                    onChange={(e) => setFormData({ ...formData, recognition_year: parseInt(e.target.value) || null })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licensing_year">Licensing Year</Label>
                  <Input
                    id="licensing_year"
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.licensing_year || ""}
                    onChange={(e) => setFormData({ ...formData, licensing_year: parseInt(e.target.value) || null })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissioning_year">Commissioning Year</Label>
                  <Input
                    id="commissioning_year"
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.commissioning_year || ""}
                    onChange={(e) => setFormData({ ...formData, commissioning_year: parseInt(e.target.value) || null })}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label>Area(s) of Ministry (Five-fold Ministry)</Label>
                <div className="flex flex-wrap gap-2">
                  {["Apostle", "Prophet", "Evangelist", "Pastor", "Teacher"].map((area) => (
                    <Button
                      key={area}
                      type="button"
                      variant={areasOfMinistry.includes(area) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (areasOfMinistry.includes(area)) {
                          setAreasOfMinistry(areasOfMinistry.filter(a => a !== area));
                        } else {
                          setAreasOfMinistry([...areasOfMinistry, area]);
                        }
                      }}
                      disabled={loading}
                    >
                      {area}
                    </Button>
                  ))}
                </div>
              </div> */}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>History of Churches You Have Pastored</Label>
                {history.map((hist, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr_auto] gap-2 items-end border p-2 rounded">
                    {(() => {
                      const historyChurchOptions = getChurchesForAssociation(hist.association);
                      const isCustomHistoryChurch = customHistoryChurchRows[idx] || (!!hist.church_name && !historyChurchOptions.includes(hist.church_name));
                      return (
                        <>
                          <Select
                            value={hist.sector}
                            onValueChange={(value) => updateHistoryRow(idx, {
                              sector: value,
                              association: "",
                              church_name: "",
                            })}
                            disabled={loading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Sector" />
                            </SelectTrigger>
                            <SelectContent>
                              {SECTORS.map((sector) => (
                                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={hist.association}
                            onValueChange={(value) => updateHistoryRow(idx, {
                              association: value,
                              church_name: "",
                            })}
                            disabled={loading || !hist.sector}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={hist.sector ? "Select Association" : "Select Sector first"} />
                            </SelectTrigger>
                            <SelectContent>
                              {getAssociationsForSector(hist.sector).map((association) => (
                                <SelectItem key={association} value={association}>{association}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="space-y-2">
                            <Select
                              value={isCustomHistoryChurch ? OTHER_CHURCH_VALUE : hist.church_name}
                              onValueChange={(value) => {
                                if (value === OTHER_CHURCH_VALUE) {
                                  setCustomHistoryChurchRows((prev) => ({ ...prev, [idx]: true }));
                                  updateHistoryRow(idx, { church_name: "" });
                                  return;
                                }
                                setCustomHistoryChurchRows((prev) => ({ ...prev, [idx]: false }));
                                updateHistoryRow(idx, { church_name: value });
                              }}
                              disabled={loading || !hist.association}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={!hist.association ? "Select Association first" : "Select Church"} />
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
                                value={hist.church_name}
                                onChange={(e) => updateHistoryRow(idx, { church_name: e.target.value })}
                                disabled={loading}
                                placeholder="Type church name"
                              />
                            )}
                          </div>
                        </>
                      );
                    })()}
                    <Input
                      placeholder="Position"
                      value={hist.position}
                      onChange={(e) => updateHistoryRow(idx, { position: e.target.value })}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="Start Year"
                      value={hist.period_start || ""}
                      onChange={(e) => updateHistoryRow(idx, { period_start: parseInt(e.target.value) || null })}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="End Year"
                      value={hist.period_end || ""}
                      onChange={(e) => updateHistoryRow(idx, { period_end: parseInt(e.target.value) || null })}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setHistory(history.filter((_, i) => i !== idx));
                        setCustomHistoryChurchRows((prev) => {
                          const next: Record<number, boolean> = {};
                          Object.entries(prev).forEach(([key, value]) => {
                            const rowIndex = Number(key);
                            if (rowIndex < idx) next[rowIndex] = value;
                            if (rowIndex > idx) next[rowIndex - 1] = value;
                          });
                          return next;
                        });
                      }}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHistory([...history, { church_name: "", association: "", sector: "", position: "", period_start: null, period_end: null }])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Church History
                </Button>
              </div>

              <div className="space-y-2 mt-6">
                <Label>Non-Church Work</Label>
                {nonChurchWork.map((work, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-2 items-end border p-2 rounded">
                    <Input
                      placeholder="Organization"
                      value={work.organization}
                      onChange={(e) => {
                        const newWork = [...nonChurchWork];
                        newWork[idx].organization = e.target.value;
                        setNonChurchWork(newWork);
                      }}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Job Title"
                      value={work.job_title}
                      onChange={(e) => {
                        const newWork = [...nonChurchWork];
                        newWork[idx].job_title = e.target.value;
                        setNonChurchWork(newWork);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="Start Year"
                      value={work.period_start || ""}
                      onChange={(e) => {
                        const newWork = [...nonChurchWork];
                        newWork[idx].period_start = parseInt(e.target.value) || null;
                        setNonChurchWork(newWork);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="End Year"
                      value={work.period_end || ""}
                      onChange={(e) => {
                        const newWork = [...nonChurchWork];
                        newWork[idx].period_end = parseInt(e.target.value) || null;
                        setNonChurchWork(newWork);
                      }}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setNonChurchWork(nonChurchWork.filter((_, i) => i !== idx))}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNonChurchWork([...nonChurchWork, { organization: "", job_title: "", period_start: null, period_end: null }])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Non-Church Work
                </Button>
              </div>

              <div className="space-y-2 mt-6">
                <Label>KEY Positions Held Within the Convention</Label>
                {conventionPositions.map((pos, idx) => (
                  <div key={idx} className="grid grid-cols-[3fr_1fr_1fr_auto] gap-2 items-end border p-2 rounded">
                    <Input
                      placeholder="Position"
                      value={pos.position}
                      onChange={(e) => {
                        const newPos = [...conventionPositions];
                        newPos[idx].position = e.target.value;
                        setConventionPositions(newPos);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="Start Year"
                      value={pos.period_start || ""}
                      onChange={(e) => {
                        const newPos = [...conventionPositions];
                        newPos[idx].period_start = parseInt(e.target.value) || null;
                        setConventionPositions(newPos);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="End Year"
                      value={pos.period_end || ""}
                      onChange={(e) => {
                        const newPos = [...conventionPositions];
                        newPos[idx].period_end = parseInt(e.target.value) || null;
                        setConventionPositions(newPos);
                      }}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setConventionPositions(conventionPositions.filter((_, i) => i !== idx))}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConventionPositions([...conventionPositions, { position: "", period_start: null, period_end: null }])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Convention Position
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="other" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold">Emergency Contact Information</Label>
                  <p className="text-sm text-muted-foreground mb-3">In case of emergency contact:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_name">Name</Label>
                      <Input
                        id="emergency_name"
                        value={emergencyContact.contact_name}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, contact_name: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_relationship">Relationship</Label>
                      <Input
                        id="emergency_relationship"
                        value={emergencyContact.relationship}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="emergency_phone">Phone Number</Label>
                      <Input
                        id="emergency_phone"
                        value={emergencyContact.phone_number}
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, phone_number: e.target.value.replace(/\D/g, "") })}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    disabled={loading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
