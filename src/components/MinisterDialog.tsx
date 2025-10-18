import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";

const ministerSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.string().trim().min(1, "Role is required").max(100),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  date_joined: z.string().min(1, "Date is required"),
  status: z.enum(["active", "inactive", "retired"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
  titles: z.string().trim().max(200).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gps_address: z.string().trim().max(200).optional().or(z.literal("")),
  marital_status: z.enum(["married", "single", "divorced", "widowed"]).optional().or(z.literal("")),
  spouse_name: z.string().trim().max(100).optional().or(z.literal("")),
  marriage_type: z.enum(["ordinance", "customary"]).optional().or(z.literal("")),
  number_of_children: z.number().min(0).optional(),
  current_church_name: z.string().trim().max(200).optional().or(z.literal("")),
  position_at_church: z.string().trim().max(100).optional().or(z.literal("")),
  church_address: z.string().trim().max(300).optional().or(z.literal("")),
  association: z.string().trim().max(100).optional().or(z.literal("")),
  sector: z.string().trim().max(100).optional().or(z.literal("")),
  fellowship: z.string().trim().max(100).optional().or(z.literal("")),
  ordination_year: z.number().min(1900).max(2100).optional().or(z.literal(null)),
  recognition_year: z.number().min(1900).max(2100).optional().or(z.literal(null)),
  licensing_year: z.number().min(1900).max(2100).optional().or(z.literal(null)),
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
    whatsapp: "",
    role: "",
    location: "",
    date_joined: new Date().toISOString().split("T")[0],
    status: "active",
    notes: "",
    titles: "",
    date_of_birth: "",
    gps_address: "",
    marital_status: "",
    spouse_name: "",
    marriage_type: "",
    number_of_children: 0,
    current_church_name: "",
    position_at_church: "",
    church_address: "",
    association: "",
    sector: "",
    fellowship: "",
    ordination_year: null as number | null,
    recognition_year: null as number | null,
    licensing_year: null as number | null,
  });

  const [qualifications, setQualifications] = useState<Array<{ qualification: string; institution: string; year_obtained: number | null }>>([]);
  const [history, setHistory] = useState<Array<{ church_name: string; association: string; sector: string; position: string; period_start: number | null; period_end: number | null }>>([]);
  const [children, setChildren] = useState<Array<{ child_name: string }>>([]);
  const [areasOfMinistry, setAreasOfMinistry] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState({
    contact_name: "",
    relationship: "",
    phone_number: "",
  });

  useEffect(() => {
    const loadMinisterData = async () => {
      if (minister) {
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
          marital_status: minister.marital_status || "",
          spouse_name: minister.spouse_name || "",
          marriage_type: minister.marriage_type || "",
          number_of_children: minister.number_of_children || 0,
          current_church_name: minister.current_church_name || "",
          position_at_church: minister.position_at_church || "",
          church_address: minister.church_address || "",
          association: minister.association || "",
          sector: minister.sector || "",
          fellowship: minister.fellowship || "",
          ordination_year: minister.ordination_year || null,
          recognition_year: minister.recognition_year || null,
          licensing_year: minister.licensing_year || null,
        });
        setAreasOfMinistry(minister.areas_of_ministry || []);

        // Load related data
        const [qualData, histData, childData, emergData] = await Promise.all([
          supabase.from("educational_qualifications").select("*").eq("minister_id", minister.id),
          supabase.from("ministerial_history").select("*").eq("minister_id", minister.id),
          supabase.from("minister_children").select("*").eq("minister_id", minister.id),
          supabase.from("emergency_contacts").select("*").eq("minister_id", minister.id).maybeSingle(),
        ]);

        if (qualData.data) setQualifications(qualData.data);
        if (histData.data) setHistory(histData.data);
        if (childData.data) setChildren(childData.data);
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
          marital_status: "",
          spouse_name: "",
          marriage_type: "",
          number_of_children: 0,
          current_church_name: "",
          position_at_church: "",
          church_address: "",
          association: "",
          sector: "",
          fellowship: "",
          ordination_year: null,
          recognition_year: null,
          licensing_year: null,
        });
        setQualifications([]);
        setHistory([]);
        setChildren([]);
        setAreasOfMinistry([]);
        setEmergencyContact({ contact_name: "", relationship: "", phone_number: "" });
      }
    };

    if (open) {
      loadMinisterData();
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
        whatsapp: validated.whatsapp || null,
        location: validated.location || null,
        notes: validated.notes || null,
        titles: validated.titles || null,
        date_of_birth: validated.date_of_birth || null,
        gps_address: validated.gps_address || null,
        marital_status: validated.marital_status || null,
        spouse_name: validated.spouse_name || null,
        marriage_type: validated.marriage_type || null,
        current_church_name: validated.current_church_name || null,
        position_at_church: validated.position_at_church || null,
        church_address: validated.church_address || null,
        association: validated.association || null,
        sector: validated.sector || null,
        fellowship: validated.fellowship || null,
        areas_of_ministry: areasOfMinistry.length > 0 ? areasOfMinistry : null,
      };

      let ministerId = minister?.id;

      if (minister) {
        const { error } = await supabase
          .from("ministers")
          .update(dataToSubmit as any)
          .eq("id", minister.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("ministers")
          .insert([dataToSubmit as any])
          .select()
          .single();

        if (error) throw error;
        ministerId = data.id;
      }

      // Save related data
      if (ministerId) {
        // Delete existing related data
        await Promise.all([
          supabase.from("educational_qualifications").delete().eq("minister_id", ministerId),
          supabase.from("ministerial_history").delete().eq("minister_id", ministerId),
          supabase.from("minister_children").delete().eq("minister_id", ministerId),
          supabase.from("emergency_contacts").delete().eq("minister_id", ministerId),
        ]);

        // Insert new related data
        const insertPromises = [];

        if (qualifications.length > 0) {
          insertPromises.push(
            supabase.from("educational_qualifications").insert(
              qualifications.filter(q => q.qualification).map(q => ({ ...q, minister_id: ministerId }))
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

        if (children.length > 0) {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{minister ? "Edit Minister" : "Add New Minister"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="bio" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bio">Bio Data</TabsTrigger>
              <TabsTrigger value="ministerial">Ministerial</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent value="bio" className="space-y-4 mt-4">
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
                  <Input
                    id="titles"
                    value={formData.titles}
                    onChange={(e) => setFormData({ ...formData, titles: e.target.value })}
                    placeholder="e.g., Rev., Dr."
                    disabled={loading}
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status</Label>
                  <Select
                    value={formData.marital_status}
                    onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
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
              </div>

              <div className="space-y-2">
                <Label>Educational Qualifications (Starting with highest)</Label>
                {qualifications.map((qual, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_2fr_1fr_auto] gap-2 items-end">
                    <Input
                      placeholder="Qualification"
                      value={qual.qualification}
                      onChange={(e) => {
                        const newQuals = [...qualifications];
                        newQuals[idx].qualification = e.target.value;
                        setQualifications(newQuals);
                      }}
                      disabled={loading}
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
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQualifications([...qualifications, { qualification: "", institution: "", year_obtained: null }])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Qualification
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Names of Biological Children</Label>
                {children.map((child, idx) => (
                  <div key={idx} className="flex gap-2">
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
                  onClick={() => setChildren([...children, { child_name: "" }])}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Child
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
                <div className="space-y-2">
                  <Label htmlFor="current_church_name">Name of Current Church</Label>
                  <Input
                    id="current_church_name"
                    value={formData.current_church_name}
                    onChange={(e) => setFormData({ ...formData, current_church_name: e.target.value })}
                    disabled={loading}
                  />
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
                  <Label htmlFor="church_address">Church Address</Label>
                  <Input
                    id="church_address"
                    value={formData.church_address}
                    onChange={(e) => setFormData({ ...formData, church_address: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="association">Association</Label>
                  <Input
                    id="association"
                    value={formData.association}
                    onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fellowship">Fellowship</Label>
                  <Input
                    id="fellowship"
                    value={formData.fellowship}
                    onChange={(e) => setFormData({ ...formData, fellowship: e.target.value })}
                    disabled={loading}
                  />
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
              </div>

              <div className="space-y-2">
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
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Ministerial History</Label>
                {history.map((hist, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_2fr_1fr_1fr_auto] gap-2 items-end border p-2 rounded">
                    <Input
                      placeholder="Church Name"
                      value={hist.church_name}
                      onChange={(e) => {
                        const newHist = [...history];
                        newHist[idx].church_name = e.target.value;
                        setHistory(newHist);
                      }}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Association"
                      value={hist.association}
                      onChange={(e) => {
                        const newHist = [...history];
                        newHist[idx].association = e.target.value;
                        setHistory(newHist);
                      }}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Sector"
                      value={hist.sector}
                      onChange={(e) => {
                        const newHist = [...history];
                        newHist[idx].sector = e.target.value;
                        setHistory(newHist);
                      }}
                      disabled={loading}
                    />
                    <Input
                      placeholder="Position"
                      value={hist.position}
                      onChange={(e) => {
                        const newHist = [...history];
                        newHist[idx].position = e.target.value;
                        setHistory(newHist);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="Start Year"
                      value={hist.period_start || ""}
                      onChange={(e) => {
                        const newHist = [...history];
                        newHist[idx].period_start = parseInt(e.target.value) || null;
                        setHistory(newHist);
                      }}
                      disabled={loading}
                    />
                    <Input
                      type="number"
                      placeholder="End Year"
                      value={hist.period_end || ""}
                      onChange={(e) => {
                        const newHist = [...history];
                        newHist[idx].period_end = parseInt(e.target.value) || null;
                        setHistory(newHist);
                      }}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setHistory(history.filter((_, i) => i !== idx))}
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
                  <Plus className="h-4 w-4 mr-2" /> Add History Entry
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
                        onChange={(e) => setEmergencyContact({ ...emergencyContact, phone_number: e.target.value })}
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
