import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, CheckCircle2, Download } from "lucide-react";
import { generateAdmissionLetter } from "@/utils/admissionLetter";
import { toast } from "sonner";

interface SummaryStepProps {
  formData: any;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitted: boolean;
}

export default function SummaryStep({
  formData,
  onBack,
  onSubmit,
  isSubmitted,
}: SummaryStepProps) {
  const handleDownloadLetter = () => {
    try {
      generateAdmissionLetter({
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email,
        admission_level: formData.admission_level,
        church_name: formData.church_name,
        association: formData.association,
        sector: formData.sector,
        fellowship: formData.fellowship,
        submitted_at: formData.submitted_at,
        date_of_birth: formData.date_of_birth,
      });
      toast.success("Admission letter downloaded successfully!");
    } catch (error) {
      console.error("Error generating admission letter:", error);
      toast.error("Failed to generate admission letter");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Summary & Confirmation</h2>
        <p className="text-muted-foreground">Review your application before submitting</p>
      </div>

      {isSubmitted ? (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {formData.status === 'approved' 
                    ? 'Application Approved!' 
                    : formData.status === 'rejected'
                    ? 'Application Status'
                    : 'Application Submitted Successfully!'}
                </h3>
                <p className="text-muted-foreground">
                  {formData.status === 'approved' 
                    ? 'Congratulations! Your application has been approved. You can now download your admission letter.'
                    : formData.status === 'rejected'
                    ? 'Your application has been reviewed. Please check the notes for more information.'
                    : 'Your application is being reviewed. You can still edit your information if needed until the review is complete.'}
                </p>
              </div>
              
              <div className="bg-card rounded-lg p-4 w-full max-w-md border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Current Status:</span>
                  <span className="text-sm font-bold capitalize px-3 py-1 rounded-full bg-primary/10 text-primary">
                    {formData.status.replace(/_/g, ' ')}
                  </span>
                </div>
                {formData.submitted_at && (
                  <p className="text-xs text-muted-foreground">
                    Submitted on {new Date(formData.submitted_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                )}
              </div>
              
              {formData.status === 'approved' && (
                <Button 
                  onClick={handleDownloadLetter}
                  size="lg"
                  className="mt-4"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Admission Letter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-muted-foreground">Full Name:</p>
                  <p className="font-medium">{formData.full_name}</p>
                  <p className="text-muted-foreground">Date of Birth:</p>
                  <p className="font-medium">{formData.date_of_birth}</p>
                  <p className="text-muted-foreground">Phone:</p>
                  <p className="font-medium">{formData.phone}</p>
                  <p className="text-muted-foreground">Email:</p>
                  <p className="font-medium">{formData.email}</p>
                  <p className="text-muted-foreground">Marital Status:</p>
                  <p className="font-medium capitalize">{formData.marital_status}</p>
                  {formData.spouse_name && (
                    <>
                      <p className="text-muted-foreground">Spouse Name:</p>
                      <p className="font-medium">{formData.spouse_name}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Church Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-muted-foreground">Church Name:</p>
                  <p className="font-medium">{formData.church_name}</p>
                  <p className="text-muted-foreground">Fellowship:</p>
                  <p className="font-medium">{formData.fellowship}</p>
                  <p className="text-muted-foreground">Association:</p>
                  <p className="font-medium">{formData.association}</p>
                  <p className="text-muted-foreground">Sector:</p>
                  <p className="font-medium">{formData.sector}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admission & Training</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-muted-foreground">Admission Level:</p>
                  <p className="font-medium capitalize">{formData.admission_level}</p>
                  <p className="text-muted-foreground">Institution:</p>
                  <p className="font-medium">{formData.theological_institution}</p>
                  {formData.theological_qualification && (
                    <>
                      <p className="text-muted-foreground">Qualification:</p>
                      <p className="font-medium">{formData.theological_qualification}</p>
                    </>
                  )}
                  {formData.mentor_name && (
                    <>
                      <p className="text-muted-foreground">Mentor:</p>
                      <p className="font-medium">{formData.mentor_name}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={onSubmit} className="ml-auto" size="lg">
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
