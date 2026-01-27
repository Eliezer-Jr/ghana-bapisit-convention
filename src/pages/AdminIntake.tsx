import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { SubmissionReviewDialog } from "@/components/intake/SubmissionReviewDialog";

type IntakeSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  manually_closed: boolean;
};

type IntakeInvite = {
  id: string;
  session_id: string;
  minister_full_name: string | null;
  minister_phone: string | null;
  minister_email: string | null;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
};

type IntakeSubmission = {
  id: string;
  session_id: string;
  invite_id: string;
  user_id: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  payload: Record<string, any>;
};

function isSessionOpen(s: IntakeSession) {
  const now = Date.now();
  return !s.manually_closed && now >= new Date(s.starts_at).getTime() && now <= new Date(s.ends_at).getTime();
}

export default function AdminIntake() {
  const qc = useQueryClient();

  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");

  // Review dialog state
  const [reviewSubmission, setReviewSubmission] = useState<IntakeSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["intake-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_sessions")
        .select("id, title, starts_at, ends_at, manually_closed")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntakeSession[];
    },
  });

  const effectiveSessionId = useMemo(() => {
    if (activeSessionId) return activeSessionId;
    return sessions?.[0]?.id ?? null;
  }, [activeSessionId, sessions]);

  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["intake-invites", effectiveSessionId],
    enabled: !!effectiveSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_invites")
        .select("id, session_id, minister_full_name, minister_phone, minister_email, expires_at, revoked, created_at")
        .eq("session_id", effectiveSessionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntakeInvite[];
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["intake-submissions", effectiveSessionId],
    enabled: !!effectiveSessionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_submissions")
        .select("id, session_id, invite_id, user_id, status, submitted_at, reviewed_at, rejection_reason, payload")
        .eq("session_id", effectiveSessionId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntakeSubmission[];
    },
  });

  const createSession = async () => {
    if (!newTitle.trim()) return toast.error("Enter a session title");
    if (!newEnd) return toast.error("Select an end time");
    const startsAt = newStart ? new Date(newStart).toISOString() : new Date().toISOString();
    const endsAt = new Date(newEnd).toISOString();
    const { data: auth } = await supabase.auth.getUser();

    const { error } = await supabase.from("intake_sessions").insert({
      title: newTitle.trim(),
      starts_at: startsAt,
      ends_at: endsAt,
      created_by: auth.user?.id,
    });
    if (error) {
      console.error(error);
      toast.error("Failed to create session");
      return;
    }
    setNewTitle("");
    setNewStart("");
    setNewEnd("");
    toast.success("Session created");
    qc.invalidateQueries({ queryKey: ["intake-sessions"] });
  };

  const toggleCloseSession = async (s: IntakeSession) => {
    const { error } = await supabase
      .from("intake_sessions")
      .update({ manually_closed: !s.manually_closed })
      .eq("id", s.id);
    if (error) {
      console.error(error);
      toast.error("Failed to update session");
      return;
    }
    toast.success(s.manually_closed ? "Session reopened" : "Session closed");
    qc.invalidateQueries({ queryKey: ["intake-sessions"] });
  };

  const createInvite = async () => {
    if (!effectiveSessionId) return;
    const { data: auth } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("intake_invites")
      .insert({
        session_id: effectiveSessionId,
        minister_full_name: inviteName.trim() || null,
        minister_phone: invitePhone.trim() || null,
        minister_email: inviteEmail.trim() || null,
        expires_at: inviteExpiresAt ? new Date(inviteExpiresAt).toISOString() : null,
        created_by: auth.user?.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error(error);
      toast.error("Failed to create invite");
      return;
    }

    const link = `${window.location.origin}/minister-intake/${data.id}`;
    await navigator.clipboard.writeText(link);
    toast.success("Invite created (link copied)");
    setInviteName("");
    setInvitePhone("");
    setInviteEmail("");
    setInviteExpiresAt("");
    qc.invalidateQueries({ queryKey: ["intake-invites", effectiveSessionId] });
  };

  const revokeInvite = async (id: string, revoked: boolean) => {
    const { error } = await supabase.from("intake_invites").update({ revoked: !revoked }).eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Failed to update invite");
      return;
    }
    toast.success(!revoked ? "Invite revoked" : "Invite re-enabled");
    qc.invalidateQueries({ queryKey: ["intake-invites", effectiveSessionId] });
  };

  const openReviewDialog = (sub: IntakeSubmission) => {
    setReviewSubmission(sub);
    setReviewDialogOpen(true);
  };

  const handleReviewComplete = () => {
    qc.invalidateQueries({ queryKey: ["intake-submissions", effectiveSessionId] });
  };

  const selectedSession = sessions?.find((s) => s.id === effectiveSessionId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minister Intake</h1>
        <p className="text-sm text-muted-foreground">Open/close intake windows, generate invites, and review submissions.</p>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="invites" disabled={!effectiveSessionId}>
            Invites
          </TabsTrigger>
          <TabsTrigger value="submissions" disabled={!effectiveSessionId}>
            Submissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Session</CardTitle>
              <CardDescription>Set a start/end time; you can close it early anytime.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2 sm:col-span-3">
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., 2026 Minister Update" />
              </div>
              <div className="grid gap-2">
                <Label>Starts (optional)</Label>
                <Input type="datetime-local" value={newStart} onChange={(e) => setNewStart(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Ends</Label>
                <Input type="datetime-local" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button onClick={createSession} className="w-full">Create</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sessions</CardTitle>
              <CardDescription>Select a session to manage invites and submissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Window</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sessions || []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <button
                            className="text-left font-medium hover:underline"
                            onClick={() => setActiveSessionId(s.id)}
                          >
                            {s.title}
                          </button>
                        </TableCell>
                        <TableCell className="text-sm">
                          {isSessionOpen(s) ? "Open" : "Closed"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => toggleCloseSession(s)}>
                            {s.manually_closed ? "Reopen" : "Close now"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Invite</CardTitle>
              <CardDescription>Creates a unique link and copies it to clipboard.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Full Name (optional)</Label>
                <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Phone (optional)</Label>
                <Input value={invitePhone} onChange={(e) => setInvitePhone(e.target.value)} placeholder="+233…" />
              </div>
              <div className="grid gap-2">
                <Label>Email (optional)</Label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Expires at (optional)</Label>
                <Input type="datetime-local" value={inviteExpiresAt} onChange={(e) => setInviteExpiresAt(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={createInvite} className="w-full" disabled={!selectedSession || !isSessionOpen(selectedSession)}>
                  Create & Copy Link
                </Button>
                {!selectedSession || !isSessionOpen(selectedSession) ? (
                  <p className="mt-2 text-xs text-muted-foreground">Select an open session to create invites.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invites</CardTitle>
              <CardDescription>Revoke an invite to disable its link.</CardDescription>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Minister</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(invites || []).map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.minister_full_name || "(not set)"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{i.minister_phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {i.expires_at ? new Date(i.expires_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => revokeInvite(i.id, i.revoked)}>
                            {i.revoked ? "Enable" : "Revoke"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submissions</CardTitle>
              <CardDescription>Review and approve submissions (publishing to the official minister record can be added next).</CardDescription>
            </CardHeader>
            <CardContent>
              {submissionsLoading ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(submissions || []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Badge variant={s.status === "approved" ? "default" : s.status === "rejected" ? "destructive" : "secondary"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{s.payload?.full_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.payload?.phone || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewDialog(s)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SubmissionReviewDialog
        submission={reviewSubmission}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onApproved={handleReviewComplete}
        onRejected={handleReviewComplete}
      />
    </div>
  );
}
