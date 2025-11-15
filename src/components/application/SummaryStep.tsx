import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Summary & Confirmation</h2>
        <p className="text-muted-foreground">Review your application before submitting</p>
      </div>

      {isSubmitted ? (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div>
                <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                  Application Submitted Successfully!
                </h3>
                <p className="text-muted-foreground mt-2">
                  Your application has been submitted and is being reviewed. You can check back
                  here anytime to view your status or make corrections if needed.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Status: <strong className="capitalize">{formData.status}</strong></p>
                {formData.submitted_at && (
                  <p>Submitted: {new Date(formData.submitted_at).toLocaleDateString()}</p>
                )}
              </div>
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
