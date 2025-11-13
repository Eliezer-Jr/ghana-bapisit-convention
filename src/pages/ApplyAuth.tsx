import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
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

    console.log('Phone approved via function:', approvalResp);

    // Phone is approved, proceed to send OTP
    const result = await OTPService.generateOTP(phoneNumber);
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
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);

    // Format phone number
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '233' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    // Verify OTP and authenticate user
    const result = await OTPService.verifyOTP(phoneNumber, otp, formattedPhone, true);
    setLoading(false);

    if (result.success) {
      toast.success("Logged in successfully!");
      // Navigate to applicant portal
      navigate('/applicant-portal');
    } else {
      toast.error(result.error || "Invalid OTP");
      setOtp("");
    }
  };

  const handleResendOTP = () => {
    setOtpSent(false);
    setOtp("");
    setResendAvailable(false);
    handleSendOTP();
  };

  const handleChangeNumber = () => {
    setShowPhonePreview(false);
    setOtpSent(false);
    setOtp("");
    setFormattedPhonePreview("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Verify Your Phone Number</CardTitle>
            <CardDescription>
              Enter your phone number to receive a verification code. Your number must be approved by finance before you can apply.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="phone-verify">Phone Number *</Label>
              <Input
                id="phone-verify"
                type="tel"
                placeholder="0XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={otpSent || showPhonePreview}
                required
              />
              {showPhonePreview && !otpSent && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Confirm your phone number:</p>
                  <p className="text-lg font-mono">{formattedPhonePreview}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    We will send an OTP to this number
                  </p>
                </div>
              )}
            </div>

            {!otpSent ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {showPhonePreview ? "Send OTP" : "Continue"}
                </Button>
                {showPhonePreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleChangeNumber}
                  >
                    Change
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter Verification Code</Label>
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
                  <p className="text-xs text-muted-foreground text-center">
                    Code sent to {formattedPhonePreview}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify OTP
                </Button>

                <div className="flex justify-between text-sm">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeNumber}
                  >
                    Change Number
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOTP}
                    disabled={!resendAvailable || loading}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
