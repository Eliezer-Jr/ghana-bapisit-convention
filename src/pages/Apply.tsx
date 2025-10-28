import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const Apply = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    marital_status: "",
    spouse_name: "",
    church_name: "",
    fellowship: "",
    association: "",
    sector: "",
    admission_level: "" as "licensing" | "recognition" | "ordination" | "",
    theological_institution: "",
    theological_qualification: "",
    mentor_name: "",
    mentor_contact: "",
    vision_statement: "",
  });

  const [documents, setDocuments] = useState<{
    passport_photo?: File;
    birth_certificate?: File;
    baptism_certificate?: File;
    recommendation_letter?: File;
    theological_certificate?: File;
    marriage_certificate?: File;
  }>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    if (file) {
      setDocuments(prev => ({ ...prev, [field]: file }));
    }
  };

  const uploadDocument = async (file: File, applicationId: string, docType: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationId}/${docType}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
      .from('application-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('application-documents')
      .getPublicUrl(fileName);

    await supabase.from('application_documents').insert({
      application_id: applicationId,
      document_type: docType,
      document_name: file.name,
      document_url: publicUrl,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create application
      const { data: application, error: appError } = await supabase
        .from('applications')
        .insert([{
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          marital_status: formData.marital_status || null,
          spouse_name: formData.spouse_name || null,
          church_name: formData.church_name,
          fellowship: formData.fellowship,
          association: formData.association,
          sector: formData.sector,
          admission_level: formData.admission_level as "licensing" | "recognition" | "ordination",
          theological_institution: formData.theological_institution || null,
          theological_qualification: formData.theological_qualification || null,
          mentor_name: formData.mentor_name || null,
          mentor_contact: formData.mentor_contact || null,
          vision_statement: formData.vision_statement || null,
        }])
        .select()
        .single();

      if (appError) throw appError;

      // Upload documents
      const uploadPromises = Object.entries(documents).map(([key, file]) =>
        uploadDocument(file, application.id, key)
      );
      await Promise.all(uploadPromises);

      toast.success("Application submitted successfully!");
      navigate('/auth', { state: { message: 'Application submitted! Please create an account to track your application status.' } });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Ministerial Admission Application</CardTitle>
            <CardDescription>
              Complete this form to apply for ministerial admission. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marital_status">Marital Status</Label>
                    <Select
                      value={formData.marital_status}
                      onValueChange={(value) => handleInputChange('marital_status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.marital_status === 'married' && (
                    <div>
                      <Label htmlFor="spouse_name">Spouse Name</Label>
                      <Input
                        id="spouse_name"
                        value={formData.spouse_name}
                        onChange={(e) => handleInputChange('spouse_name', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Church Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Church Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="church_name">Church Name *</Label>
                    <Input
                      id="church_name"
                      required
                      value={formData.church_name}
                      onChange={(e) => handleInputChange('church_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fellowship">Fellowship *</Label>
                    <Input
                      id="fellowship"
                      required
                      value={formData.fellowship}
                      onChange={(e) => handleInputChange('fellowship', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="association">Association *</Label>
                    <Input
                      id="association"
                      required
                      value={formData.association}
                      onChange={(e) => handleInputChange('association', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sector">Sector *</Label>
                    <Input
                      id="sector"
                      required
                      value={formData.sector}
                      onChange={(e) => handleInputChange('sector', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Admission Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Admission Level *</h3>
                <Select
                  required
                  value={formData.admission_level}
                  onValueChange={(value) => handleInputChange('admission_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select admission level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="licensing">Licensing</SelectItem>
                    <SelectItem value="recognition">Recognition</SelectItem>
                    <SelectItem value="ordination">Ordination</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theological Training */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Theological Training</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="theological_institution">Institution</Label>
                    <Input
                      id="theological_institution"
                      value={formData.theological_institution}
                      onChange={(e) => handleInputChange('theological_institution', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="theological_qualification">Qualification</Label>
                    <Input
                      id="theological_qualification"
                      value={formData.theological_qualification}
                      onChange={(e) => handleInputChange('theological_qualification', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Mentor Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Mentor Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mentor_name">Mentor Name</Label>
                    <Input
                      id="mentor_name"
                      value={formData.mentor_name}
                      onChange={(e) => handleInputChange('mentor_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mentor_contact">Mentor Contact</Label>
                    <Input
                      id="mentor_contact"
                      value={formData.mentor_contact}
                      onChange={(e) => handleInputChange('mentor_contact', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Vision Statement */}
              <div>
                <Label htmlFor="vision_statement">Vision Statement</Label>
                <Textarea
                  id="vision_statement"
                  rows={4}
                  placeholder="Describe your vision for ministry..."
                  value={formData.vision_statement}
                  onChange={(e) => handleInputChange('vision_statement', e.target.value)}
                />
              </div>

              {/* Document Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Required Documents</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { key: 'passport_photo', label: 'Passport Photo *' },
                    { key: 'birth_certificate', label: 'Birth Certificate *' },
                    { key: 'baptism_certificate', label: 'Baptism Certificate *' },
                    { key: 'recommendation_letter', label: 'Recommendation Letter *' },
                    { key: 'theological_certificate', label: 'Theological Certificate' },
                    { key: 'marriage_certificate', label: 'Marriage Certificate' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label htmlFor={key}>{label}</Label>
                      <div className="mt-1">
                        <Input
                          id={key}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          required={label.includes('*')}
                          onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/auth')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  <Upload className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Apply;
