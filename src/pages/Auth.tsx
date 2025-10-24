import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Church } from "lucide-react";
import { z } from "zod";

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^0\d{9}$/, "Phone number must be 10 digits starting with 0"),
  fullName: z.string().min(2, "Full name is required").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  // Redirect if already authenticated
  if (user) {
    navigate("/");
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

  const handleVerifyOTP = async () => {
    try {
      setLoading(true);

      if (otp.length !== 6) {
        throw new Error("Please enter the complete 6-digit OTP");
      }

      // Verify OTP
      const { data, error } = await supabase.functions.invoke('frogapi-otp-verify', {
        body: { 
          phoneNumber, 
          otp,
          fullName: isSignup ? fullName : undefined,
          isSignup 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Invalid OTP");

      toast.success(data.message || "Verification successful!");
      
      // Refresh the session
      await supabase.auth.refreshSession();
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    setOtp("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3">
              <Church className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Ghana Bapisit Convention</CardTitle>
          <CardDescription>Minister Data Management System</CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <Tabs defaultValue="login" className="w-full" onValueChange={(v) => setIsSignup(v === "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-phone">Phone Number</Label>
                  <Input
                    id="login-phone"
                    type="tel"
                    placeholder="0241234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSendOTP("login")}
                  disabled={loading || !phoneNumber}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </TabsContent>
              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="0241234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleSendOTP("signup")}
                  disabled={loading || !phoneNumber || !fullName}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Enter Verification Code</Label>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to {phoneNumber}
                </p>
                <div className="flex justify-center">
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
              </div>
              <Button
                className="w-full"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
