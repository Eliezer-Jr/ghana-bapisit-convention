import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { z } from "zod";
import { useActivityLog } from "@/hooks/useActivityLog";
import logoGbcc from "@/assets/logo-gbcc.png";

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0"),
  fullName: z.string().min(2, "Full name is required").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Redirect if already authenticated
  if (user) {
    navigate("/dashboard");
    return null;
  }

  const handleSendOTP = async (type: "login" | "signup") => {
    try {
      setLoading(true);
      setIsSignup(type === "signup");

      // Validate inputs
      const validated = phoneSchema.parse({ 
        phoneNumber, 
        fullName: type === "signup" ? fullName : undefined 
      });

      if (type === "signup" && !fullName.trim()) {
        throw new Error("Full name is required for signup");
      }

      // Send OTP
      const { data, error } = await supabase.functions.invoke('frogapi-otp-generate', {
        body: { phoneNumber: validated.phoneNumber }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to send OTP");

      setOtpSent(true);
      setCanResend(false);
      setResendTimer(60);
      
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Start countdown timer
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      toast.success("OTP sent to your phone number!");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    await handleSendOTP(isSignup ? "signup" : "login");
  };

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);

      if (otp.length !== 6) {
        throw new Error("Please enter the complete 6-digit OTP");
      }

      // Verify OTP for system login
      const { data, error } = await supabase.functions.invoke('system-otp-verify', {
        body: { 
          phoneNumber, 
          otp,
          fullName: isSignup ? fullName : undefined,
          isSignup
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "OTP verification failed");

      // For login, use the email and password returned to sign in
      if (!isSignup && data.email && data.password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        });
        
        if (signInError) {
          console.error("Sign in error:", signInError);
          throw new Error("Failed to establish session. Please try again.");
        }
      }

      toast.success(isSignup ? "Account created successfully!" : "Login successful!");
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Log activity
      await logActivity({
        action: isSignup ? 'user_signup' : 'user_login',
        details: { 
          phoneNumber,
          method: 'OTP'
        }
      });

      // For signup, redirect to login
      if (isSignup) {
        setTimeout(() => {
          toast.info("Please login with your phone number");
          setOtpSent(false);
          setIsSignup(false);
          setOtp("");
        }, 1500);
      } else {
        // Force session refresh for login
        await supabase.auth.refreshSession();
        
        // Navigate to dashboard
        setTimeout(() => navigate("/dashboard"), 800);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setOtpSent(false);
    setOtp("");
    setCanResend(false);
    setResendTimer(60);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, hsl(var(--primary)) 2%, transparent 0%), 
                         radial-gradient(circle at 75px 75px, hsl(var(--accent)) 2%, transparent 0%)`,
        backgroundSize: '100px 100px'
      }} />
      <div className="relative z-10 w-full max-w-md">
      <Card className="w-full shadow-xl border-2">
        <CardHeader className="space-y-1 text-center pb-4">
          <div className="flex justify-center mb-4">
            <img src={logoGbcc} alt="GBCC Logo" className="h-20 w-20 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Ghana Baptist Convention Conference</CardTitle>
          <CardDescription className="text-base">Ministers' Data Management System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!otpSent ? (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {isSignup ? "Create Account" : "Sign In"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSignup ? "Register with your phone number" : "Login with OTP verification"}
                </p>
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    className="h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">
                    +233
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="241234567"
                    value={phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                      if (value.length <= 9) {
                        setPhoneNumber('0' + value);
                      }
                    }}
                    disabled={loading}
                    maxLength={9}
                    className="h-11 pl-16"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter 9 digits after 0 (e.g., 557083554)
                </p>
              </div>

              <Button
                className="w-full h-11"
                onClick={() => handleSendOTP(isSignup ? "signup" : "login")}
                disabled={loading || !phoneNumber || (isSignup && !fullName)}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setFullName("");
                  setPhoneNumber("");
                }}
                disabled={loading}
              >
                {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Enter Verification Code</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{phoneNumber}</span>
                </p>
              </div>

              <div className="flex justify-center py-4">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
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

              <Button
                className="w-full h-11"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 h-11"
                  onClick={handleResendOTP}
                  disabled={loading || !canResend}
                >
                  {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
