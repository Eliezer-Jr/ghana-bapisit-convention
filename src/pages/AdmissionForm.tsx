import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Save, Send } from "lucide-react";

const REQUIRED_DOCUMENTS = {
  all: [
    "Birth Certificate",
    "Certificate of Baptism",
    "Fellowship Screening Evidence",
    "Association Endorsement Letter",
    "Theological Certificates",
    "Theological Transcripts",
    "Other Academic Certificates",
    "Financial Clearance",
  ],
  married: ["Marriage Certificate"],
  licensing: ["Mentor Commitment Letter", "Vision Statement"],
  recognition: ["GBC License Letter", "Appointment Letter with Job Description"],
  ordination: ["GBC License Letter", "Recognition Certificate", "Appointment Letter", "Ministry Evaluation Paper"],
};

type AdmissionFormProps = {
  currentStep?: number;
  onStepChange?: (step: number) => void;
};

export default function AdmissionForm({ currentStep: externalStep, onStepChange }: AdmissionFormProps = {}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    admission_level: "licensing" as "licensing" | "recognition" | "ordination",
    full_name: "",
    date_of_birth: "",
    phone: "",
    email: user?.email || "",
    marital_status: "",
    spouse_name: "",
    church_name: "",
    association: "",
    sector: "",
    fellowship: "",
    theological_institution: "",
    theological_qualification: "",
    ministry_evaluation_paper: "",
    mentor_name: "",
    mentor_contact: "",
    vision_statement: "",
    payment_receipt_number: "",
    payment_amount: 0,
    payment_date: "",
    gazette_paid: false,
    gazette_receipt_number: "",
  });

  useEffect(() => {
    if (id && id !== "new") {
      fetchApplication();
    }
  }, [id]);

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*, application_documents(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(data);
        setDocuments(data.application_documents || []);
      }
    } catch (error: any) {
      toast.error("Failed to load application");
      console.error(error);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        user_id: user?.id,
        status: "draft",
      };

      if (id && id !== "new") {
        const { error } = await supabase
          .from("applications")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("applications")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        navigate(`/admissions/${data.id}/edit`);
      }
      toast.success("Draft saved successfully");
    } catch (error: any) {
      toast.error("Failed to save draft");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.full_name || !formData.date_of_birth || !formData.church_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        user_id: user?.id,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      };

      if (id && id !== "new") {
        const { error } = await supabase
          .from("applications")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("applications")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Application submitted successfully!");
      navigate("/admissions");
    } catch (error: any) {
      toast.error("Failed to submit application");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file || !id || id === "new") {
      toast.error("Please save draft first before uploading documents");
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("application-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("application-documents")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("application_documents")
        .insert({
          application_id: id,
          document_type: documentType,
          document_name: file.name,
          document_url: publicUrl,
        });

      if (dbError) throw dbError;

      toast.success("Document uploaded successfully");
      fetchApplication();
    } catch (error: any) {
      toast.error("Failed to upload document");
      console.error(error);
    }
  };

  const getRequiredDocuments = () => {
    const docs = [...REQUIRED_DOCUMENTS.all];
    if (formData.marital_status === "married") {
      docs.push(...REQUIRED_DOCUMENTS.married);
    }
    if (formData.admission_level === "licensing") {
      docs.push(...REQUIRED_DOCUMENTS.licensing);
    } else if (formData.admission_level === "recognition") {
      docs.push(...REQUIRED_DOCUMENTS.recognition);
    } else if (formData.admission_level === "ordination") {
      docs.push(...REQUIRED_DOCUMENTS.ordination);
    }
    return docs;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Ministerial Admission Application</h1>
          <p className="text-muted-foreground mt-1">Complete all sections to submit your application</p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="church">Church</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admission_level">Admission Level *</Label>
                  <Select
                    value={formData.admission_level}
                    onValueChange={(value) => setFormData({ ...formData, admission_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="licensing">Licensing</SelectItem>
                      <SelectItem value="recognition">Recognition</SelectItem>
                      <SelectItem value="ordination">Ordination</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="marital_status">Marital Status</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={(value) => setFormData({ ...formData, marital_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.marital_status === "married" && (
                    <div>
                      <Label htmlFor="spouse_name">Spouse Name</Label>
                      <Input
                        id="spouse_name"
                        value={formData.spouse_name}
                        onChange={(e) => setFormData({ ...formData, spouse_name: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theological_institution">Theological Institution</Label>
                    <Input
                      id="theological_institution"
                      value={formData.theological_institution}
                      onChange={(e) => setFormData({ ...formData, theological_institution: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="theological_qualification">Qualification</Label>
                    <Input
                      id="theological_qualification"
                      value={formData.theological_qualification}
                      onChange={(e) => setFormData({ ...formData, theological_qualification: e.target.value })}
                    />
                  </div>
                </div>

                {formData.admission_level === "licensing" && (
                  <>
                    <div>
                      <Label htmlFor="mentor_name">Mentor Name</Label>
                      <Input
                        id="mentor_name"
                        value={formData.mentor_name}
                        onChange={(e) => setFormData({ ...formData, mentor_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="mentor_contact">Mentor Contact</Label>
                      <Input
                        id="mentor_contact"
                        value={formData.mentor_contact}
                        onChange={(e) => setFormData({ ...formData, mentor_contact: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vision_statement">Vision Statement</Label>
                      <Textarea
                        id="vision_statement"
                        rows={4}
                        placeholder="What the GBC License will enable you to do and how..."
                        value={formData.vision_statement}
                        onChange={(e) => setFormData({ ...formData, vision_statement: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {formData.admission_level === "ordination" && (
                  <div>
                    <Label htmlFor="ministry_evaluation_paper">Ministry Evaluation Paper (3-5 pages)</Label>
                    <Textarea
                      id="ministry_evaluation_paper"
                      rows={8}
                      placeholder="Include: Call to Ministry, Philosophy of Ministry, Doctrinal Emphases, and Goals..."
                      value={formData.ministry_evaluation_paper}
                      onChange={(e) => setFormData({ ...formData, ministry_evaluation_paper: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="church" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Church Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="church_name">Church Name *</Label>
                  <Input
                    id="church_name"
                    value={formData.church_name}
                    onChange={(e) => setFormData({ ...formData, church_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="association">Association *</Label>
                    <Input
                      id="association"
                      value={formData.association}
                      onChange={(e) => setFormData({ ...formData, association: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sector">Sector *</Label>
                    <Select
                      value={formData.sector}
                      onValueChange={(value) => setFormData({ ...formData, sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Greater Accra">Greater Accra</SelectItem>
                        <SelectItem value="Ashanti">Ashanti</SelectItem>
                        <SelectItem value="Northern">Northern</SelectItem>
                        <SelectItem value="Western">Western</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="fellowship">Local Ministers' Fellowship *</Label>
                  <Input
                    id="fellowship"
                    value={formData.fellowship}
                    onChange={(e) => setFormData({ ...formData, fellowship: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Required Documents</CardTitle>
                <CardDescription>
                  Upload all required documents. Save draft first to enable uploads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {getRequiredDocuments().map((doc) => (
                  <div key={doc} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{doc}</p>
                      {documents.find(d => d.document_type === doc) && (
                        <p className="text-sm text-muted-foreground">✓ Uploaded</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="file"
                        onChange={(e) => handleFileUpload(e, doc)}
                        className="max-w-xs"
                        disabled={!id || id === "new"}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>
                  GH₵ 850.00 (Processing Fee) + GH₵ 750.00 (Gazette - Refundable)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="font-medium mb-2">Bank Details:</p>
                  <p className="text-sm">Account Name: GHANA BAPTIST CONVENTION</p>
                  <p className="text-sm">Account Number: 1331130000488</p>
                  <p className="text-sm">Bank: GCB, ABELENKPE BRANCH</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_receipt_number">Receipt Number</Label>
                    <Input
                      id="payment_receipt_number"
                      value={formData.payment_receipt_number}
                      onChange={(e) => setFormData({ ...formData, payment_receipt_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_amount">Amount (GH₵)</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      value={formData.payment_amount}
                      onChange={(e) => setFormData({ ...formData, payment_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gazette Payment</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gazette_paid"
                      checked={formData.gazette_paid}
                      onChange={(e) => setFormData({ ...formData, gazette_paid: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="gazette_paid" className="font-normal">Gazette fee paid (GH₵ 750.00)</Label>
                  </div>
                </div>

                {formData.gazette_paid && (
                  <div>
                    <Label htmlFor="gazette_receipt_number">Gazette Receipt Number</Label>
                    <Input
                      id="gazette_receipt_number"
                      value={formData.gazette_receipt_number}
                      onChange={(e) => setFormData({ ...formData, gazette_receipt_number: e.target.value })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate("/admissions")}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <Send className="h-4 w-4 mr-2" />
            Submit Application
          </Button>
        </div>
      </div>
    </Layout>
  );
}
