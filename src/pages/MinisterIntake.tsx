import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, FileText, Loader2, Lock, LogOut, Save, Send, ShieldCheck } from "lucide-react";
import logoGbcc from "@/assets/logo-gbcc.png";
import IntakeFormTabs from "@/components/intake/IntakeFormTabs";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

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

type IntakeTab = "bio" | "education" | "ministerial" | "history" | "other" | "review";

type MissingField = {
  key: string;
  label: string;
  tab: IntakeTab;
};

const INTAKE_TABS: IntakeTab[] = ["bio", "education", "ministerial", "history", "other", "review"];

function getMissingRequiredFields(payload: Record<string, any>): MissingField[] {
  const requiredFields: MissingField[] = [
    { key: "full_name", label: "Full Name", tab: "bio" },
    { key: "titles", label: "Title(s)", tab: "bio" },
    { key: "date_of_birth", label: "Date of Birth", tab: "bio" },
    { key: "phone", label: "Phone Number", tab: "bio" },
    { key: "whatsapp", label: "WhatsApp Number", tab: "bio" },
    { key: "email", label: "Email Address", tab: "bio" },
    { key: "ghana_card_number", label: "Ghana Card Number", tab: "bio" },
    { key: "gps_address", label: "GPS Address", tab: "bio" },
    { key: "location", label: "Location/Area", tab: "bio" },
    { key: "marital_status", label: "Marital Status", tab: "bio" },
    { key: "sector", label: "Sector", tab: "ministerial" },
    { key: "association", label: "Association", tab: "ministerial" },
    { key: "ministry_engagement", label: "Type of Ministry", tab: "ministerial" },
    { key: "current_church_name", label: "Current Church Name", tab: "ministerial" },
    { key: "position_at_church", label: "Position at Church", tab: "ministerial" },
    { key: "church_address", label: "Church Address", tab: "ministerial" },
  ];

  if (payload.marital_status !== "single") {
    requiredFields.push(
      { key: "marriage_type", label: "Marriage Type", tab: "bio" },
      { key: "spouse_name", label: "Spouse Name", tab: "bio" },
      { key: "spouse_phone_number", label: "Spouse Phone Number", tab: "bio" },
      { key: "spouse_occupation", label: "Spouse Occupation", tab: "bio" },
      { key: "number_of_children", label: "Number of Children", tab: "bio" },
    );
  }

  const missingFields = requiredFields.filter((field) => {
    const value = payload[field.key];
    return value === undefined || value === null || value === "" || (typeof value === "string" && !value.trim());
  });

  if (!payload.emergency_contact?.contact_name?.trim()) {
    missingFields.push({ key: "emergency_contact.contact_name", label: "Emergency Contact Name", tab: "other" });
  }
  if (!payload.emergency_contact?.relationship?.trim()) {
    missingFields.push({ key: "emergency_contact.relationship", label: "Emergency Contact Relationship", tab: "other" });
  }
  if (!payload.emergency_contact?.phone_number?.trim()) {
    missingFields.push({ key: "emergency_contact.phone_number", label: "Emergency Contact Phone Number", tab: "other" });
  }

  return missingFields;
}

function formatGhanaPhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("233")) return `+${digits}`;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
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
  const [payload, setPayload] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<IntakeTab>("bio");

  // Enable inactivity logout only when on the form step (authenticated)
  const { handleLogout } = useInactivityLogout(authStep === "form");

  const loadInviteSessionAndMaybeSubmission = async () => {
    if (!inviteId) {
      toast.error("Invalid invite link");
      navigate("/");
      return;
    }

    setLoading(true);
    const { data: currentSession } = await supabase.auth.getSession();

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
    
    // Pre-fill phone from invite
    if (inviteRow.minister_phone) setPhone(inviteRow.minister_phone);

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
      // Merge invite data with saved payload
      setPayload({
        ...p,
        full_name: p.full_name || inviteRow.minister_full_name || "",
        email: p.email || inviteRow.minister_email || "",
        phone: p.phone || inviteRow.minister_phone || "",
      });
    } else {
      const { data: created, error: createErr } = await supabase
        .from("intake_submissions")
        .insert({
          invite_id: inviteRow.id,
          session_id: inviteRow.session_id,
          user_id: userId,
          status: "draft",
          payload: {
            full_name: inviteRow.minister_full_name || "",
            email: inviteRow.minister_email || "",
            phone: inviteRow.minister_phone || "",
          },
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
      setPayload({
        full_name: inviteRow.minister_full_name || "",
        email: inviteRow.minister_email || "",
        phone: inviteRow.minister_phone || "",
      });
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
      const errMsg = data?.error || error?.message || "Failed to send OTP";
      if (errMsg.toLowerCase().includes('dbcrash') || errMsg.toLowerCase().includes('invalid response')) {
        toast.error("Our SMS service is temporarily unavailable. Please try again in a few minutes.");
      } else {
        toast.error(errMsg);
      }
      return;
    }
    setPhone(formatted);
    setAuthStep("verify");
    toast.success("OTP sent to your phone");
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
        fullName: invite?.minister_full_name || undefined,
        isSignup: true,
        skipNameRequirement: true,
      },
    });
    if (error || !data?.success) {
      setOtpVerifying(false);
      toast.error(data?.error || error?.message || "OTP verification failed");
      return;
    }

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

  const isSubmitted = submission?.status === "submitted" || submission?.status === "approved";
  const missingRequiredFields = useMemo(() => getMissingRequiredFields(payload), [payload]);
  const isReadyForSubmission = missingRequiredFields.length === 0;

  const saveDraft = async () => {
    if (!submission) return;
    const payloadToSave = payload.marital_status === "single"
      ? {
          ...payload,
          marriage_type: "",
          spouse_name: "",
          spouse_phone_number: "",
          spouse_occupation: "",
          number_of_children: 0,
          children: [],
          role: "",
          zone: "",
        }
      : {
          ...payload,
          role: "",
          zone: "",
        };
    setSaving(true);
    const nextStatus = submission.status === "rejected" ? "draft" : submission.status;
    const { error } = await supabase
      .from("intake_submissions")
      .update({
        payload: payloadToSave,
        status: nextStatus,
        reviewed_at: submission.status === "rejected" ? null : undefined,
        reviewed_by: submission.status === "rejected" ? null : undefined,
        rejection_reason: submission.status === "rejected" ? null : undefined,
      })
      .eq("id", submission.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Unable to save (session may be closed)");
      return;
    }
    setSubmission({ ...submission, payload: payloadToSave, status: nextStatus });
    toast.success(submission.status === "rejected" ? "Corrections saved. Status changed to draft." : "Draft saved successfully!");
  };

  const submit = async () => {
    if (!submission) return;
    const missingFields = getMissingRequiredFields(payload);

    if (missingFields.length > 0) {
      const labels = missingFields.map((field) => field.label);
      if (missingFields.length <= 3) {
        toast.error(`Please fill in: ${labels.join(", ")}`);
      } else {
        toast.error(`Please fill in all required fields. Missing ${missingFields.length} fields.`);
      }
      setActiveTab(missingFields[0].tab);
      return;
    }

    const payloadToSubmit = payload.marital_status === "single"
      ? {
          ...payload,
          marriage_type: "",
          spouse_name: "",
          spouse_phone_number: "",
          spouse_occupation: "",
          number_of_children: 0,
          children: [],
          role: "",
          zone: "",
        }
      : {
          ...payload,
          role: "",
          zone: "",
        };

    setSubmitting(true);
    const { error } = await supabase
      .from("intake_submissions")
      .update({
        payload: payloadToSubmit,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        reviewed_by: null,
        rejection_reason: null,
      })
      .eq("id", submission.id);
    setSubmitting(false);
    if (error) {
      console.error(error);
      toast.error("Unable to submit (session may be closed)");
      return;
    }
    setSubmission({ ...submission, payload: payloadToSubmit, status: "submitted" });
    toast.success("Submitted successfully! An administrator will review your information.");
  };

  const handlePrimaryAction = () => {
    if (activeTab === "review" && isReadyForSubmission) {
      submit();
      return;
    }

    const currentIndex = INTAKE_TABS.indexOf(activeTab);
    if (activeTab === "review") {
      if (missingRequiredFields.length <= 3) {
        toast.error(`Please fill in: ${missingRequiredFields.map((field) => field.label).join(", ")}`);
      } else {
        toast.error(`Please complete all required fields. Missing ${missingRequiredFields.length} fields.`);
      }
      setActiveTab(missingRequiredFields[0]?.tab || "bio");
      return;
    }

    const nextTab = INTAKE_TABS[Math.min(currentIndex + 1, INTAKE_TABS.length - 1)];
    setActiveTab(nextTab);
  };

  // Format session dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center gap-3 px-3 sm:px-4">
          <img src={logoGbcc} alt="GBCC Logo" className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm sm:text-lg truncate">Ghana Baptist Convention</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Minister Information Intake</p>
          </div>
          {session && (
            <Badge variant="outline" className="hidden sm:flex gap-1 shrink-0">
              <Clock className="h-3 w-3" />
              {formatDate(session.ends_at)}
            </Badge>
          )}
          {authStep === "form" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="gap-1.5 shrink-0"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container max-w-4xl px-3 sm:px-4 py-4 sm:py-8">
        {loading ? (
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your intake form...</p>
            </CardContent>
          </Card>
        ) : authStep !== "form" ? (
          /* OTP Verification */
          <Card className="border-2 shadow-xl max-w-md mx-auto">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
                <ShieldCheck className="h-12 w-12 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Verify Your Identity</CardTitle>
                <CardDescription className="mt-2">
                  Enter your phone number to receive a verification code
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0241234567 or +233241234567"
                  disabled={otpSending || otpVerifying}
                  className="text-center text-lg"
                />
              </div>

              {authStep === "verify" && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the 6-digit code sent to <span className="font-medium">{phone}</span>
                    </p>
                  </div>
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
              )}

              <div className="flex gap-3">
                {authStep === "send" ? (
                  <Button className="flex-1" onClick={handleSendOtp} disabled={otpSending} size="lg">
                    {otpSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send OTP
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setAuthStep("send")} className="flex-1">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      onClick={handleVerifyOtp} 
                      disabled={otpVerifying || otp.length !== 6}
                      className="flex-1"
                      size="lg"
                    >
                      {otpVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Main Form */
          <div className="space-y-6">
            {/* Session Info Card */}
            <Card className="border-2">
              <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                    <div className="min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">{session?.title || "Minister Intake Form"}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Please fill in your information accurately
                      </CardDescription>
                    </div>
                  </div>
                  {isSubmitted ? (
                    <Badge className="bg-green-500 hover:bg-green-600 shrink-0 self-start">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Submitted
                    </Badge>
                  ) : sessionClosed ? (
                    <Badge variant="secondary" className="shrink-0 self-start">
                      <Lock className="h-3 w-3 mr-1" />
                      Closed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 self-start">
                      <Clock className="h-3 w-3 mr-1" />
                      Open
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Closed Session Warning */}
            {sessionClosed && !isSubmitted && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <Lock className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">
                    This intake session is currently closed. You can view your information but cannot make changes.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Form Tabs */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <IntakeFormTabs
                  payload={payload}
                  onChange={setPayload}
                  activeTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab as IntakeTab)}
                  disabled={sessionClosed || isSubmitted}
                  submissionId={submission?.id}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {!isSubmitted && !sessionClosed && (
              <Card className="border-2">
                <CardContent className="flex flex-col-reverse sm:flex-row gap-3 py-4">
                  <Button 
                    variant="outline" 
                    onClick={saveDraft} 
                    disabled={saving || sessionClosed}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={handlePrimaryAction}
                    disabled={submitting || sessionClosed}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        {activeTab === "review" && isReadyForSubmission ? (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit for Review
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Next
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Submitted Confirmation */}
            {isSubmitted && (
              <Card className="border-green-500/50 bg-green-500/5">
                <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="bg-green-500/10 p-4 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Form Submitted Successfully!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      An administrator will review your information. You will be notified of any updates.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-4">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ghana Baptist Convention. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
