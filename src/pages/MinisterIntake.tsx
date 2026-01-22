import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import logoGbcc from "@/assets/logo-gbcc.png";

type IntakeInvite = {
  id: string;
  session_id: string;
  minister_full_name: string | null;
  minister_phone: string | null;
  minister_email: string | null;
  expires_at: string | null;
  revoked: boolean;
};

type IntakeSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  manually_closed: boolean;
};

type IntakeSubmission = {
  id: string;
  invite_id: string;
  session_id: string;
  user_id: string;
  status: string;
  payload: Record<string, any>;
};

function formatGhanaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  // assume user typed 9 digits
  if (digits.length === 9) return `+233${digits}`;
  return input.startsWith("+") ? input : `+${input}`;
}

export default function MinisterIntake() {
  const navigate = useNavigate();
  const { inviteId } = useParams();

  const [loading, setLoading] = useState(true);
  const [authStep, setAuthStep] = useState<"send" | "verify" | "form">("send");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [invite, setInvite] = useState<IntakeInvite | null>(null);
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [submission, setSubmission] = useState<IntakeSubmission | null>(null);

  // Simple MVP payload fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [association, setAssociation] = useState("");
  const [sector, setSector] = useState("");
  const [fellowship, setFellowship] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [notes, setNotes] = useState("");

  const payload = useMemo(
    () => ({
      full_name: fullName,
      phone,
      email,
      association,
      sector,
      fellowship,
      location,
      role,
      notes,
    }),
    [association, email, fellowship, fullName, location, notes, phone, role, sector],
  );

  const loadInviteSessionAndMaybeSubmission = async () => {
    if (!inviteId) {
      toast.error("Invalid invite link");
      navigate("/");
      return;
    }

    setLoading(true);
    const { data: currentSession } = await supabase.auth.getSession();

    // If logged out, we can't read the invite yet (RLS requires auth). We'll show OTP gate.
    if (!currentSession.session) {
      setLoading(false);
      setAuthStep("send");
      return;
    }

    const { data: inviteRow, error: inviteErr } = await supabase
      .from("intake_invites")
      .select("id, session_id, minister_full_name, minister_phone, minister_email, expires_at, revoked")
      .eq("id", inviteId)
      .maybeSingle();

    if (inviteErr) {
      console.error(inviteErr);
      toast.error("Unable to load invite. Ensure you verified with the correct phone number.");
      setLoading(false);
      setAuthStep("send");
      return;
    }

    if (!inviteRow) {
      toast.error("Invite not found or you don't have access to it.");
      setLoading(false);
      setAuthStep("send");
      return;
    }

    setInvite(inviteRow as IntakeInvite);
    if (inviteRow.minister_phone) setPhone(inviteRow.minister_phone);
    if (inviteRow.minister_full_name) setFullName(inviteRow.minister_full_name);
    if (inviteRow.minister_email) setEmail(inviteRow.minister_email);

    const { data: sessionRow, error: sessionErr } = await supabase
      .from("intake_sessions")
      .select("id, title, starts_at, ends_at, manually_closed")
      .eq("id", inviteRow.session_id)
      .maybeSingle();

    if (sessionErr) {
      console.error(sessionErr);
      toast.error("Unable to load intake session");
      setLoading(false);
      return;
    }

    setSession((sessionRow as IntakeSession) || null);

    // Load or create submission draft
    const userId = currentSession.session.user.id;
    const { data: subRow } = await supabase
      .from("intake_submissions")
      .select("id, invite_id, session_id, user_id, status, payload")
      .eq("invite_id", inviteRow.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (subRow) {
      setSubmission(subRow as IntakeSubmission);
      const p = (subRow as any).payload || {};
      setFullName(p.full_name ?? inviteRow.minister_full_name ?? "");
      setEmail(p.email ?? inviteRow.minister_email ?? "");
      setAssociation(p.association ?? "");
      setSector(p.sector ?? "");
      setFellowship(p.fellowship ?? "");
      setLocation(p.location ?? "");
      setRole(p.role ?? "");
      setNotes(p.notes ?? "");
      setPhone(p.phone ?? inviteRow.minister_phone ?? phone);
    } else {
      const { data: created, error: createErr } = await supabase
        .from("intake_submissions")
        .insert({
          invite_id: inviteRow.id,
          session_id: inviteRow.session_id,
          user_id: userId,
          status: "draft",
          payload: {},
        })
        .select("id, invite_id, session_id, user_id, status, payload")
        .single();
      if (createErr) {
        console.error(createErr);
        toast.error("Unable to start your form. The intake window might be closed.");
        setLoading(false);
        return;
      }
      setSubmission(created as IntakeSubmission);
    }

    setAuthStep("form");
    setLoading(false);
  };

  useEffect(() => {
    loadInviteSessionAndMaybeSubmission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteId]);

  const handleSendOtp = async () => {
    const formatted = formatGhanaPhone(phone);
    if (!formatted || !formatted.startsWith("+") || formatted.replace(/\D/g, "").length < 11) {
      toast.error("Enter a valid phone number");
      return;
    }
    setOtpSending(true);
    const { data, error } = await supabase.functions.invoke("frogapi-otp-generate", {
      body: { phoneNumber: formatted.startsWith("+233") ? `0${formatted.slice(4)}` : formatted },
    });
    setOtpSending(false);
    if (error || !data?.success) {
      console.error(error || data);
      toast.error(data?.error || error?.message || "Failed to send OTP");
      return;
    }
    setPhone(formatted);
    setAuthStep("verify");
    toast.success("OTP sent");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setOtpVerifying(true);
    const { data, error } = await supabase.functions.invoke("system-otp-verify", {
      body: {
        phoneNumber: phone,
        otp,
        fullName: fullName || invite?.minister_full_name || undefined,
        isSignup: true,
      },
    });
    if (error || !data?.success) {
      setOtpVerifying(false);
      toast.error(data?.error || error?.message || "OTP verification failed");
      return;
    }

    // Establish authenticated session
    if (data.email && data.password) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      if (signInError) {
        setOtpVerifying(false);
        toast.error("Failed to establish a session. Please try again.");
        return;
      }
    }

    setOtpVerifying(false);
    await loadInviteSessionAndMaybeSubmission();
  };

  const sessionClosed = useMemo(() => {
    if (!session) return false;
    const now = Date.now();
    return session.manually_closed || now < new Date(session.starts_at).getTime() || now > new Date(session.ends_at).getTime();
  }, [session]);

  const saveDraft = async () => {
    if (!submission) return;
    const { error } = await supabase
      .from("intake_submissions")
      .update({ payload })
      .eq("id", submission.id);
    if (error) {
      console.error(error);
      toast.error("Unable to save (session may be closed)");
      return;
    }
    toast.success("Draft saved");
  };

  const submit = async () => {
    if (!submission) return;
    const { error } = await supabase
      .from("intake_submissions")
      .update({ payload, status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", submission.id);
    if (error) {
      console.error(error);
      toast.error("Unable to submit (session may be closed)");
      return;
    }
    toast.success("Submitted! An administrator will review your information.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <img src={logoGbcc} alt="GBCC Logo" className="h-12 w-12 object-contain" />
              <div>
                <CardTitle className="text-xl">Minister Information Intake</CardTitle>
                <CardDescription>
                  {session?.title || "Please verify to continue"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : authStep !== "form" ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-sm text-muted-foreground">
                    Verify your phone number to access the form.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+233241234567"
                    disabled={otpSending || otpVerifying}
                  />
                </div>

                {authStep === "verify" && (
                  <div className="space-y-2">
                    <Label>OTP</Label>
                    <div className="flex justify-center py-2">
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
                )}

                <div className="flex gap-2">
                  {authStep === "send" ? (
                    <Button className="flex-1" onClick={handleSendOtp} disabled={otpSending}>
                      {otpSending ? "Sending…" : "Send OTP"}
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="flex-1" onClick={() => setAuthStep("send")}>
                        Back
                      </Button>
                      <Button className="flex-1" onClick={handleVerifyOtp} disabled={otpVerifying || otp.length !== 6}>
                        {otpVerifying ? "Verifying…" : "Verify"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {sessionClosed && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">This intake session is currently closed.</p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={sessionClosed} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={sessionClosed} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Role / Position</Label>
                    <Input value={role} onChange={(e) => setRole(e.target.value)} disabled={sessionClosed} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Association</Label>
                    <Input value={association} onChange={(e) => setAssociation(e.target.value)} disabled={sessionClosed} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Sector</Label>
                    <Input value={sector} onChange={(e) => setSector(e.target.value)} disabled={sessionClosed} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fellowship</Label>
                    <Input value={fellowship} onChange={(e) => setFellowship(e.target.value)} disabled={sessionClosed} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} disabled={sessionClosed} />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={sessionClosed} />
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={saveDraft} disabled={sessionClosed}>
                    Save Draft
                  </Button>
                  <Button onClick={submit} disabled={sessionClosed}>
                    Submit for Review
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
