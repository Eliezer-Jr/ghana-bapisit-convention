import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OTPService } from "@/services/otp";

export default function Apply() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // 0 = OTP verification
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    maritalStatus: "",
    spouseName: "",
    churchName: "",
    fellowship: "",
    association: "",
    sector: "",
    admissionLevel: "",
    theologicalInstitution: "",
    theologicalQualification: "",
    visionStatement: "",
    mentorName: "",
    mentorContact: "",
    ministryEvaluationPaper: "",
    gazetteReceiptNumber: "",
    paymentReceiptNumber: "",
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setResendAvailable(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const totalSteps = 5; // Including OTP verification step

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    const result = await OTPService.generateOTP(phoneNumber);
    setLoading(false);

    if (result.success) {
      setOtpSent(true);
      setResendTimer(60);
      setResendAvailable(false);
      toast.success("OTP sent to your phone!");
    } else {
      toast.error(result.error || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);

    // Check if phone number is approved
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+233${phoneNumber.replace(/^0/, "")}`;
    const { data: approvedData, error: approvedError } = await supabase
      .from("approved_applicants")
      .select("*")
      .eq("phone_number", formattedPhone)
      .eq("used", false)
      .maybeSingle();

    if (approvedError) {
      setLoading(false);
      toast.error("Error checking approval status");
      return;
    }

    if (!approvedData) {
      setLoading(false);
      toast.error("Your phone number is not approved for application. Please contact finance to make payment first.");
      return;
    }

    // Verify OTP
    const result = await OTPService.verifyOTP(phoneNumber, otp);
    setLoading(false);

    if (result.success) {
      setOtpVerified(true);
      setCurrentStep(1);
      setFormData(prev => ({ ...prev, phone: formattedPhone }));
      toast.success("Phone verified! You can now proceed with your application.");
    } else {
      toast.error(result.error || "Invalid OTP");
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return otpVerified;
      case 1:
        if (!formData.fullName || !formData.email || !formData.phone || !formData.dateOfBirth) {
          toast.error("Please fill in all required personal information fields");
          return false;
        }
        break;
      case 2:
        if (!formData.churchName || !formData.fellowship || !formData.association || !formData.sector) {
          toast.error("Please fill in all required church information fields");
          return false;
        }
        break;
      case 3:
        if (!formData.admissionLevel) {
          toast.error("Please select an admission level");
          return false;
        }
        break;
      case 4:
        // Documents step - optional validation
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpVerified) {
      toast.error("Please verify your phone number first");
      return;
    }

    setLoading(true);

    try {
      // Mark the approved applicant as used
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+233${phoneNumber.replace(/^0/, "")}`;
      
      // Insert the application and get the ID
      const { data: applicationData, error } = await supabase
        .from("applications")
        .insert({
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          marital_status: formData.maritalStatus || null,
          spouse_name: formData.spouseName || null,
          church_name: formData.churchName,
          fellowship: formData.fellowship,
          association: formData.association,
          sector: formData.sector,
          admission_level: formData.admissionLevel as "licensing" | "recognition" | "ordination",
          theological_institution: formData.theologicalInstitution || null,
          theological_qualification: formData.theologicalQualification || null,
          vision_statement: formData.visionStatement || null,
          mentor_name: formData.mentorName || null,
          mentor_contact: formData.mentorContact || null,
          ministry_evaluation_paper: formData.ministryEvaluationPaper || null,
          gazette_receipt_number: formData.gazetteReceiptNumber || null,
          payment_receipt_number: formData.paymentReceiptNumber || null,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update approved_applicants to mark as used and link to application
      await supabase
        .from("approved_applicants")
        .update({ 
          used: true,
          application_id: applicationData.id 
        })
        .eq("phone_number", formattedPhone);

      toast.success("Application submitted successfully!");
      navigate("/auth", { state: { message: "Application submitted! Please log in to track your status." } });
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 0, title: "Phone Verification" },
    { number: 1, title: "Personal Information" },
    { number: 2, title: "Church Information" },
    { number: 3, title: "Admission & Training" },
    { number: 4, title: "Documents" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Ministerial Admission Application</CardTitle>
            <CardDescription>
              {!otpVerified ? "Verify your phone number to begin" : "Complete all steps to submit your application"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-8">
              <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
              <div className="flex justify-between mt-4">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`flex flex-col items-center ${
                      currentStep >= step.number ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                        currentStep > step.number
                          ? "bg-primary border-primary text-primary-foreground"
                          : currentStep === step.number
                          ? "border-primary"
                          : "border-muted"
                      }`}
                    >
                      {currentStep > step.number ? <Check className="h-5 w-5" /> : step.number + 1}
                    </div>
                    <span className="text-xs mt-2 text-center max-w-[80px]">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 0: OTP Verification */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Verify Your Phone Number</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter your phone number to receive a verification code. Your number must be approved by finance before you can apply.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone-verify">Phone Number *</Label>
                    <Input
                      id="phone-verify"
                      type="tel"
                      placeholder="0XXXXXXXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={otpSent}
                      required
                    />
                  </div>

                  {!otpSent ? (
                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Verification Code
                    </Button>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="otp">Enter 6-Digit Code</Label>
                        <div className="flex justify-center">
                          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleVerifyOTP}
                          disabled={loading || otp.length !== 6}
                          className="flex-1"
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Verify Code
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendOTP}
                          disabled={!resendAvailable || loading}
                        >
                          {resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend Code"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input
                        id="phone"
                        required
                        value={formData.phone}
                        disabled
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select
                        value={formData.maritalStatus}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, maritalStatus: value }))}
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
                    {formData.maritalStatus === "married" && (
                      <div>
                        <Label htmlFor="spouseName">Spouse Name</Label>
                        <Input
                          id="spouseName"
                          value={formData.spouseName}
                          onChange={(e) => setFormData(prev => ({ ...prev, spouseName: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Church Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Church Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="churchName">Church Name *</Label>
                      <Input
                        id="churchName"
                        required
                        value={formData.churchName}
                        onChange={(e) => setFormData(prev => ({ ...prev, churchName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="fellowship">Fellowship *</Label>
                      <Input
                        id="fellowship"
                        required
                        value={formData.fellowship}
                        onChange={(e) => setFormData(prev => ({ ...prev, fellowship: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="association">Association *</Label>
                      <Input
                        id="association"
                        required
                        value={formData.association}
                        onChange={(e) => setFormData(prev => ({ ...prev, association: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="sector">Sector *</Label>
                      <Input
                        id="sector"
                        required
                        value={formData.sector}
                        onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Admission & Training */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admissionLevel">Admission Level *</Label>
                    <Select
                      required
                      value={formData.admissionLevel}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, admissionLevel: value }))}
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

                  <div>
                    <h3 className="text-lg font-semibold">Theological Training</h3>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="theologicalInstitution">Institution</Label>
                        <Input
                          id="theologicalInstitution"
                          value={formData.theologicalInstitution}
                          onChange={(e) => setFormData(prev => ({ ...prev, theologicalInstitution: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="theologicalQualification">Qualification</Label>
                        <Input
                          id="theologicalQualification"
                          value={formData.theologicalQualification}
                          onChange={(e) => setFormData(prev => ({ ...prev, theologicalQualification: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Mentor Information</h3>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="mentorName">Mentor Name</Label>
                        <Input
                          id="mentorName"
                          value={formData.mentorName}
                          onChange={(e) => setFormData(prev => ({ ...prev, mentorName: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="mentorContact">Mentor Contact</Label>
                        <Input
                          id="mentorContact"
                          value={formData.mentorContact}
                          onChange={(e) => setFormData(prev => ({ ...prev, mentorContact: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="visionStatement">Vision Statement</Label>
                    <Textarea
                      id="visionStatement"
                      rows={4}
                      placeholder="Describe your vision for ministry..."
                      value={formData.visionStatement}
                      onChange={(e) => setFormData(prev => ({ ...prev, visionStatement: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Documents */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gazetteReceiptNumber">Gazette Receipt Number</Label>
                      <Input
                        id="gazetteReceiptNumber"
                        value={formData.gazetteReceiptNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, gazetteReceiptNumber: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentReceiptNumber">Payment Receipt Number</Label>
                      <Input
                        id="paymentReceiptNumber"
                        value={formData.paymentReceiptNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentReceiptNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ministryEvaluationPaper">Ministry Evaluation Paper</Label>
                    <Textarea
                      id="ministryEvaluationPaper"
                      rows={4}
                      placeholder="Describe your ministry experience and evaluation..."
                      value={formData.ministryEvaluationPaper}
                      onChange={(e) => setFormData(prev => ({ ...prev, ministryEvaluationPaper: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {currentStep > 0 && (
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!otpVerified}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading}>
                      {loading ? "Submitting..." : "Submit Application"}
                    </Button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}