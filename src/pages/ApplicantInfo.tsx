import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, CheckCircle2, Phone, Mail, Clock, FileText, CreditCard, UserCheck } from "lucide-react";
import logoGbcc from "@/assets/logo-gbcc.png";

export default function ApplicantInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2%, transparent 0%), 
                         radial-gradient(circle at 75px 75px, hsl(var(--accent)) 2%, transparent 0%)`,
        backgroundSize: '100px 100px'
      }} />

      {/* Header */}
      <div className="relative z-10 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <img src={logoGbcc} alt="GBCC Logo" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-lg font-bold">Applicant Information Center</h1>
                <p className="text-sm text-muted-foreground">Everything you need to know</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to the Application Process</CardTitle>
              <CardDescription>
                Ghana Baptist Convention Conference - Minister Training Program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This page contains important information about the application process, requirements, 
                and answers to frequently asked questions. Please read through carefully before submitting your application.
              </p>
            </CardContent>
          </Card>

          {/* Application Process Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Application Process Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Payment & Registration</h3>
                    <p className="text-sm text-muted-foreground">
                      Contact the finance office to make your payment and register your phone number in the system.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Phone Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      Once approved, log in using your registered phone number. You'll receive an OTP for verification.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Complete Application Form</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill in your personal information, church details, theological background, and upload required documents.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Submit & Review</h3>
                    <p className="text-sm text-muted-foreground">
                      Submit your application for review. You can track the status and receive updates via SMS.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Interview & Final Decision</h3>
                    <p className="text-sm text-muted-foreground">
                      If selected, you'll be notified about interview scheduling. Final admission decisions will be communicated via SMS.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Recent passport-sized photograph (digital format)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Educational certificates and transcripts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Church recommendation letter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Proof of theological training (if applicable)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Birth certificate or valid ID</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I register for the application?</AccordionTrigger>
                  <AccordionContent>
                    First, contact the finance office to make your payment. They will register your phone number 
                    in the system. Once approved, you can log in to the applicant portal using your phone number 
                    to complete your application.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>What is the application fee?</AccordionTrigger>
                  <AccordionContent>
                    Please contact the finance office directly for current application fee information and payment methods.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I edit my application after submission?</AccordionTrigger>
                  <AccordionContent>
                    Yes, you can edit your application while it's still under review. However, once your application 
                    is approved or rejected, you will not be able to make further changes.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>How long does the review process take?</AccordionTrigger>
                  <AccordionContent>
                    The review process typically goes through multiple stages: Local screening, Association review, 
                    and VP office review. The entire process may take several weeks. You'll receive SMS updates 
                    as your application progresses through each stage.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>I didn't receive my OTP. What should I do?</AccordionTrigger>
                  <AccordionContent>
                    First, check that your phone number was registered correctly with the finance office. 
                    Ensure you have good network coverage. You can request to resend the OTP after 60 seconds. 
                    If problems persist, contact support for assistance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger>What admission levels are available?</AccordionTrigger>
                  <AccordionContent>
                    The program offers three admission levels:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li><strong>Licensing:</strong> Initial ministerial credential</li>
                      <li><strong>Recognition:</strong> Intermediate level for established ministers</li>
                      <li><strong>Ordination:</strong> Full ordination for qualified ministers</li>
                    </ul>
                    Requirements vary by level. Please ensure you meet the criteria for your chosen level.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger>Can I save my application and complete it later?</AccordionTrigger>
                  <AccordionContent>
                    Yes, your application is automatically saved as a draft. You can log in anytime using your 
                    phone number to continue where you left off. Make sure to submit your application when complete.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>What file formats are accepted for documents?</AccordionTrigger>
                  <AccordionContent>
                    You can upload documents in PDF, JPG, JPEG, or PNG formats. Please ensure files are clear, 
                    legible, and not larger than 5MB each. For photos, ensure the image is recent and meets 
                    passport photo standards.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Ensure all information provided is accurate and truthful. False information may lead to disqualification.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Keep your phone number active throughout the application process to receive important updates.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Upload clear, high-quality scans or photos of your documents for faster processing.</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>You will receive SMS notifications at each stage of the review process.</span>
              </p>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Need Additional Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Call Support</h4>
                    <p className="text-sm text-muted-foreground">+233 55 708 3554</p>
                    <p className="text-xs text-muted-foreground mt-1">Mon-Fri, 9am-5pm</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">WhatsApp Support</h4>
                    <p className="text-sm text-muted-foreground">+233 55 708 3554</p>
                    <p className="text-xs text-muted-foreground mt-1">Quick responses</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <CreditCard className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Finance Office</h4>
                    <p className="text-sm text-muted-foreground">For payment inquiries</p>
                    <p className="text-xs text-muted-foreground mt-1">Payment verification</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Technical Support</h4>
                    <p className="text-sm text-muted-foreground">Login or OTP issues</p>
                    <p className="text-xs text-muted-foreground mt-1">Available 24/7</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button onClick={() => navigate('/apply')} size="lg">
                  Return to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
