import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { portalFetch } from "@/lib/portalApi";
import { usePortalAuth } from "@/contexts/PortalAuthContext";
import logoGbcc from "@/assets/logo-gbcc.png";

export default function PortalLogin() {
  const navigate = useNavigate();
  const { setSession } = usePortalAuth();
  const [step, setStep] = useState<"creds" | "otp">("creds");
  const [ministerId, setMinisterId] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      await portalFetch("minister-portal-otp-generate", { auth: false, body: { ministerId: ministerId.trim(), phoneNumber: phone.trim() } });
      toast.success("OTP sent to your phone");
      setStep("otp");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await portalFetch<any>("minister-portal-otp-verify", { auth: false, body: { ministerId: ministerId.trim(), phoneNumber: phone.trim(), otp } });
      setSession(res.token, res.minister);
      toast.success(`Welcome ${res.minister.full_name}`);
      navigate("/myportal/dashboard");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3"><img src={logoGbcc} alt="GBCC" className="h-16 w-16" /></div>
          <CardTitle>Minister Portal</CardTitle>
          <CardDescription>Sign in with your Minister ID and registered phone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "creds" ? (
            <>
              <div className="space-y-2">
                <Label>Minister ID</Label>
                <Input placeholder="GBMC-A00001" value={ministerId} onChange={(e) => setMinisterId(e.target.value.toUpperCase())} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="0241234567" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={10} />
              </div>
              <Button className="w-full" disabled={loading || !ministerId || phone.length < 10} onClick={sendOtp}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-center">Enter the 6-digit code sent to {phone}</p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button className="w-full" disabled={loading || otp.length !== 6} onClick={verifyOtp}>
                {loading ? "Verifying..." : "Verify & Sign in"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => { setStep("creds"); setOtp(""); }}>Back</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
