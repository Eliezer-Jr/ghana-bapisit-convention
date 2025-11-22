import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OTPService } from "@/services/otp";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl text-center">Applicant Login</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number to access your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!otpSent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="0XXXXXXXXX or 233XXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setShowPhonePreview(false);
                  }}
                  disabled={loading}
                />
                {showPhonePreview && (
                  <p className="text-sm text-muted-foreground">
                    OTP will be sent to: <strong>{formattedPhonePreview}</strong>
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {showPhonePreview ? "Sending OTP..." : "Verifying..."}
                  </>
                ) : (
                  showPhonePreview ? "Send OTP" : "Continue"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Enter 6-digit OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                    >
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
                  <p className="text-sm text-muted-foreground text-center">
                    OTP sent to {formattedPhonePreview}
                  </p>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>

                <div className="text-center space-y-2">
                  <Button
                    variant="link"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setPhoneNumber("");
                      setShowPhonePreview(false);
                    }}
                    disabled={loading}
                  >
                    Change Phone Number
                  </Button>

                  {resendAvailable ? (
                    <Button
                      variant="ghost"
                      onClick={handleResendOTP}
                      disabled={loading}
                      className="w-full"
                    >
                      Resend OTP
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Resend available in {resendTimer}s
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
