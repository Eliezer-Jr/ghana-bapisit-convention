import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Download, Eye, FileText, User, Church, GraduationCap, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { InfoField } from "@/components/InfoField";

interface ApplicationReviewDialogProps {
  application: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (appId: string, status: string, notes?: string) => Promise<void>;
  onScheduleInterview: (appId: string, date: string, location: string) => Promise<void>;
}

export function ApplicationReviewDialog({
  application,
  open,
  onOpenChange,
  onUpdateStatus,
  onScheduleInterview,
}: ApplicationReviewDialogProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewLocation, setInterviewLocation] = useState("");

  useEffect(() => {
    if (application?.id) {
      loadDocuments();
    }
  }, [application?.id]);

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", application.id);

    if (error) {
      toast.error("Failed to load documents");
      return;
    }

    setDocuments(data || []);
  };

  const downloadApplicationPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Application Review", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Personal Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Personal Information", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Full Name: ${application.full_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Date of Birth: ${application.date_of_birth}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${application.email}`, 20, yPos);
    yPos += 6;
    doc.text(`Phone: ${application.phone}`, 20, yPos);
    yPos += 6;
    doc.text(`Marital Status: ${application.marital_status || "N/A"}`, 20, yPos);
    yPos += 6;
    if (application.spouse_name) {
      doc.text(`Spouse Name: ${application.spouse_name}`, 20, yPos);
      yPos += 6;
    }
    yPos += 5;

    // Church Information
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Church Information", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Church Name: ${application.church_name}`, 20, yPos);
    yPos += 6;
    doc.text(`Association: ${application.association}`, 20, yPos);
    yPos += 6;
    doc.text(`Sector: ${application.sector}`, 20, yPos);
    yPos += 6;
    doc.text(`Fellowship: ${application.fellowship}`, 20, yPos);
    yPos += 10;

    // Admission Details
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Admission Details", 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Admission Level: ${application.admission_level.toUpperCase()}`, 20, yPos);
    yPos += 6;
    doc.text(`Status: ${application.status.replace("_", " ").toUpperCase()}`, 20, yPos);
    yPos += 6;
    if (application.submitted_at) {
      doc.text(`Submitted: ${new Date(application.submitted_at).toLocaleDateString()}`, 20, yPos);
      yPos += 6;
    }
    yPos += 10;

    // Theological Training
    if (application.theological_institution || application.theological_qualification) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Theological Training", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (application.theological_institution) {
        doc.text(`Institution: ${application.theological_institution}`, 20, yPos);
        yPos += 6;
      }
      if (application.theological_qualification) {
        doc.text(`Qualification: ${application.theological_qualification}`, 20, yPos);
        yPos += 6;
      }
      yPos += 10;
    }

    // Mentorship
    if (application.mentor_name || application.mentor_contact) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Mentorship", 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (application.mentor_name) {
        doc.text(`Mentor Name: ${application.mentor_name}`, 20, yPos);
        yPos += 6;
      }
      if (application.mentor_contact) {
        doc.text(`Mentor Contact: ${application.mentor_contact}`, 20, yPos);
        yPos += 6;
      }
    }

    doc.save(`Application_${application.full_name.replace(/\s+/g, "_")}_${application.id.slice(0, 8)}.pdf`);
    toast.success("PDF downloaded successfully");
  };

  if (!application) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Application Review</DialogTitle>
              <Button variant="outline" size="sm" onClick={downloadApplicationPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">
                <User className="h-4 w-4 mr-2" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="church">
                <Church className="h-4 w-4 mr-2" />
                Church
              </TabsTrigger>
              <TabsTrigger value="training">
                <GraduationCap className="h-4 w-4 mr-2" />
                Training
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="actions">
                <MessageSquare className="h-4 w-4 mr-2" />
                Actions
              </TabsTrigger>
            </TabsList>

            {/* Personal Information */}
            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoField label="Full Name" value={application.full_name} />
                  <InfoField label="Date of Birth" value={application.date_of_birth} />
                  <InfoField label="Email" value={application.email} />
                  <InfoField label="Phone" value={application.phone} />
                  <InfoField label="Marital Status" value={application.marital_status || "N/A"} />
                  {application.spouse_name && (
                    <InfoField label="Spouse Name" value={application.spouse_name} />
                  )}
                  <InfoField 
                    label="Admission Level" 
                    value={application.admission_level.toUpperCase()} 
                  />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                    <Badge className="mt-1">{application.status.replace("_", " ").toUpperCase()}</Badge>
                  </div>
                  {application.submitted_at && (
                    <InfoField 
                      label="Submitted Date" 
                      value={new Date(application.submitted_at).toLocaleDateString()} 
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Church Information */}
            <TabsContent value="church" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Church Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoField label="Church Name" value={application.church_name} />
                  <InfoField label="Association" value={application.association} />
                  <InfoField label="Sector" value={application.sector} />
                  <InfoField label="Fellowship" value={application.fellowship} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Training Information */}
            <TabsContent value="training" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theological Training</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoField 
                    label="Institution" 
                    value={application.theological_institution || "Not provided"} 
                  />
                  <InfoField 
                    label="Qualification" 
                    value={application.theological_qualification || "Not provided"} 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mentorship</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InfoField 
                    label="Mentor Name" 
                    value={application.mentor_name || "Not provided"} 
                  />
                  <InfoField 
                    label="Mentor Contact" 
                    value={application.mentor_contact || "Not provided"} 
                  />
                </CardContent>
              </Card>

              {application.vision_statement && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vision Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{application.vision_statement}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Uploaded Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium text-sm">{doc.document_name}</p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDoc(doc)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions */}
            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="notes">Review Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this application..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        onUpdateStatus(application.id, "approved", notes);
                        onOpenChange(false);
                      }}
                    >
                      Approve Application
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        onUpdateStatus(application.id, "rejected", notes);
                        onOpenChange(false);
                      }}
                    >
                      Reject Application
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Schedule Interview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="interview-date">Interview Date</Label>
                    <input
                      id="interview-date"
                      type="date"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={interviewDate}
                      onChange={(e) => setInterviewDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="interview-location">Location</Label>
                    <input
                      id="interview-location"
                      type="text"
                      placeholder="Enter interview location"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={interviewLocation}
                      onChange={(e) => setInterviewLocation(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (interviewDate && interviewLocation) {
                        onScheduleInterview(application.id, interviewDate, interviewLocation);
                        onOpenChange(false);
                      } else {
                        toast.error("Please fill in both date and location");
                      }
                    }}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Interview
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDoc?.document_name}</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[70vh]">
            <iframe
              src={previewDoc?.document_url}
              className="w-full h-full border rounded"
              title="Document Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
