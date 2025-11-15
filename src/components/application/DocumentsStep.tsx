import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Save, Upload, FileText, Trash2 } from "lucide-react";

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
  ordination: [
    "GBC License Letter",
    "Recognition Certificate",
    "Appointment Letter",
    "Ministry Evaluation Paper",
  ],
};

interface DocumentsStepProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSave: (data: any) => void;
  applicationId: string | null;
  isSubmitted: boolean;
}

export default function DocumentsStep({
  formData,
  onNext,
  onBack,
  onSave,
  applicationId,
  isSubmitted,
}: DocumentsStepProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId) {
      loadDocuments();
    }
  }, [applicationId]);

  const loadDocuments = async () => {
    if (!applicationId) return;

    const { data, error } = await supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", applicationId);

    if (error) {
      console.error("Error loading documents:", error);
      return;
    }

    setDocuments(data || []);
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

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!applicationId) {
      toast.error("Please save your application first");
      return;
    }

    setUploading(documentType);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${applicationId}/${documentType.replace(/\s+/g, "_")}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("application-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("application-documents")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("application_documents")
        .insert({
          application_id: applicationId,
          document_type: documentType,
          document_name: file.name,
          document_url: urlData.publicUrl,
        });

      if (dbError) throw dbError;

      await loadDocuments();
      toast.success(`${documentType} uploaded successfully`);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const { error } = await supabase
        .from("application_documents")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      await loadDocuments();
      toast.success("Document deleted successfully");
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const isDocumentUploaded = (docType: string) => {
    return documents.some((doc) => doc.document_type === docType);
  };

  const requiredDocs = getRequiredDocuments();
  const uploadedCount = requiredDocs.filter(isDocumentUploaded).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Documents</h2>
        <p className="text-muted-foreground">
          Upload all required documents ({uploadedCount}/{requiredDocs.length} uploaded)
        </p>
      </div>

      <div className="grid gap-4">
        {requiredDocs.map((docType) => {
          const doc = documents.find((d) => d.document_type === docType);
          const isUploaded = !!doc;

          return (
            <Card key={docType} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className={`h-5 w-5 ${isUploaded ? "text-green-500" : "text-muted-foreground"}`} />
                  <div>
                    <Label className="text-base">{docType}</Label>
                    {doc && (
                      <p className="text-sm text-muted-foreground">{doc.document_name}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!isSubmitted && (
                    <>
                      <input
                        type="file"
                        id={`file-${docType}`}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(docType, file);
                          }
                        }}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`file-${docType}`)?.click()}
                        disabled={uploading === docType}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading === docType ? "Uploading..." : isUploaded ? "Replace" : "Upload"}
                      </Button>
                      {isUploaded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                  {isUploaded && doc && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                    >
                      <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!isSubmitted && (
        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={() => onSave({})}>
            <Save className="mr-2 h-4 w-4" />
            Save Progress
          </Button>
          <Button
            onClick={() => onNext({})}
            className="ml-auto"
            disabled={uploadedCount < requiredDocs.length}
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
