import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, GraduationCap, HelpCircle, Phone, Mail, Info } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OTPService } from "@/services/otp";
import logoGbcc from "@/assets/logo-gbcc.png";

export default function ApplyAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showPhonePreview, setShowPhonePreview] = useState(false);
  const [formattedPhonePreview, setFormattedPhonePreview] = useState("");

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

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    // Format phone number consistently
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Show preview if not already shown
    if (!showPhonePreview) {
      setFormattedPhonePreview(formattedPhone);
      setShowPhonePreview(true);
      return;
    }

    setLoading(true);

    // Check if phone number is approved
    const { data: approvalResp, error: approvalErr } = await supabase.functions.invoke('check-approval', {
      body: { phoneNumber: formattedPhone },
    });

    if (approvalErr) {
      console.error('Approval check error:', approvalErr);
      setLoading(false);
      toast.error('Error checking approval status');
      return;
    }

    if (!approvalResp?.approved) {
      setLoading(false);
      toast.error(`Phone number ${formattedPhone} is not approved. Please contact finance to make payment first.`);
      return;
    }

    // Phone is approved, proceed to send OTP
    const result = await OTPService.generateOTP(formattedPhone);
    setLoading(false);

    if (result.success) {
      setOtpSent(true);
      setResendTimer(60);
      setResendAvailable(false);
      toast.success("OTP sent successfully!");
    } else {
      toast.error(result.error || "Failed to send OTP");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);

    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // First verify the OTP
    const result = await OTPService.verifyOTP(formattedPhone, otp);

    if (!result.success) {
      setLoading(false);
      toast.error(result.error || 'Invalid OTP');
      return;
    }

    // Check if an application exists for this phone number
    const { data: application, error } = await supabase
      .from('applications')
      .select('id, full_name, status')
      .eq('phone', formattedPhone)
      .maybeSingle();

    setLoading(false);

    if (error) {
      console.error('Error checking application:', error);
      toast.error('Error verifying application status');
      return;
    }

    // Store phone in localStorage
    localStorage.setItem('applicant_phone', formattedPhone);

    if (!application) {
      // No application exists - create new one
      toast.success('Verification successful! Complete your application.');
      navigate('/applicant-portal');
      return;
    }

    // Application exists - load it
    localStorage.setItem('applicant_name', application.full_name);
    toast.success('Welcome back! Loading your application...');
    navigate('/applicant-portal');
  };

  const handleResendOTP = async () => {
    setOtp("");
    setResendTimer(60);
    setResendAvailable(false);

    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const result = await OTPService.generateOTP(formattedPhone);

    if (result.success) {
      toast.success("OTP resent successfully!");
    } else {
      toast.error(result.error || "Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2%, transparent 0%), 
                         radial-gradient(circle at 75px 75px, hsl(var(--accent)) 2%, transparent 0%)`,
        backgroundSize: '100px 100px'
      }} />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-lg">
        <Card className="shadow-2xl border-2 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-4">
            {/* Logo Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <img src={logoGbcc} alt="GBCC Logo" className="h-24 w-24 object-contain relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Applicant Portal
                </CardTitle>
                <CardDescription className="text-base">
                  Ghana Baptist Convention Conference
                </CardDescription>
              </div>
            </div>
            
            {/* Status Badge */}
            {!otpSent && (
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Minister Training Application</p>
              </div>
            )}
          </CardHeader>
        <CardContent className="space-y-6 pt-2">
          {!otpSent ? (
            <>
              <div className="space-y-4">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-semibold text-foreground">Access Your Application</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your registered phone number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">
                      +233
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="241234567"
                      value={phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber.replace(/^\+?233/, '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 9) {
                          setPhoneNumber('0' + value);
                        }
                        setShowPhonePreview(false);
                      }}
                      disabled={loading}
                      maxLength={9}
                      className="h-12 pl-16 text-base"
                    />
                  </div>
                  {showPhonePreview && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-sm text-foreground">
                        OTP will be sent to: <strong className="text-primary">{formattedPhonePreview}</strong>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter 9 digits after 0 (e.g., 557083554)
                  </p>
                </div>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading || !phoneNumber}
                className="w-full h-12 text-base"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {showPhonePreview ? "Sending OTP..." : "Verifying..."}
                  </>
                ) : (
                  showPhonePreview ? "Send OTP Code" : "Continue"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-5">
                <div className="text-center space-y-2 pb-2">
                  <h3 className="text-lg font-semibold text-foreground">Enter Verification Code</h3>
                  <p className="text-sm text-muted-foreground">
                    We sent a 6-digit code to
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {formattedPhonePreview}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-center py-4">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-14 w-12 text-lg" />
                        <InputOTPSlot index={1} className="h-14 w-12 text-lg" />
                        <InputOTPSlot index={2} className="h-14 w-12 text-lg" />
                        <InputOTPSlot index={3} className="h-14 w-12 text-lg" />
                        <InputOTPSlot index={4} className="h-14 w-12 text-lg" />
                        <InputOTPSlot index={5} className="h-14 w-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Access Portal"
                  )}
                </Button>

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setPhoneNumber("");
                      setShowPhonePreview(false);
                    }}
                    disabled={loading}
                    className="w-full h-11"
                  >
                    Change Phone Number
                  </Button>

                  <div className="text-center">
                    {resendAvailable ? (
                      <Button
                        variant="ghost"
                        onClick={handleResendOTP}
                        disabled={loading}
                        className="w-full h-11"
                      >
                        Resend OTP Code
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">
                        Resend available in <span className="font-semibold text-primary">{resendTimer}s</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>

        {/* Support Section */}
        <div className="px-6 pb-6">
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Need Help?</p>
            </div>
            
            {/* Info Button */}
            <Button
              variant="outline"
              className="w-full h-10"
              onClick={() => navigate('/applicant-info')}
            >
              <Info className="mr-2 h-4 w-4" />
              View Application Guide & FAQs
            </Button>

            {/* Contact Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => window.open('tel:+233000000000', '_self')}
              >
                <Phone className="mr-2 h-4 w-4" />
                Call Support
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => window.open('https://wa.me/233000000000?text=Hello,%20I%20need%20help%20with%20my%20application', '_blank')}
              >
                <Mail className="mr-2 h-4 w-4" />
                WhatsApp
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              For payment verification or technical issues, contact our support team
            </p>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
