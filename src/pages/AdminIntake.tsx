import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { SubmissionReviewDialog } from "@/components/intake/SubmissionReviewDialog";
import { BulkInviteUpload } from "@/components/intake/BulkInviteUpload";
import { GroupedInvitesList } from "@/components/intake/GroupedInvitesList";
import { GroupedSubmissionsList } from "@/components/intake/GroupedSubmissionsList";
import { GroupedSessionsList } from "@/components/intake/GroupedSessionsList";
import { SingleInviteForm } from "@/components/intake/SingleInviteForm";

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
  sms_sent_at: string | null;
  sms_status: string | null;
  sms_message_id: string | null;
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
        .select("id, session_id, minister_full_name, minister_phone, minister_email, expires_at, revoked, created_at, sms_sent_at, sms_status, sms_message_id")
        .eq("session_id", effectiveSessionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as IntakeInvite[];
    },
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ["intake-submissions-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intake_submissions")
        .select("id, session_id, invite_id, user_id, status, submitted_at, reviewed_at, rejection_reason, payload")
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

  const openReviewDialog = (sub: IntakeSubmission) => {
    setReviewSubmission(sub);
    setReviewDialogOpen(true);
  };

  const handleReviewComplete = () => {
    qc.invalidateQueries({ queryKey: ["intake-submissions-all"] });
  };

  const handleInvitesChanged = () => {
    qc.invalidateQueries({ queryKey: ["intake-invites", effectiveSessionId] });
  };

  const selectedSession = sessions?.find((s) => s.id === effectiveSessionId) ?? null;
  const sessionIsOpen = selectedSession ? isSessionOpen(selectedSession) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minister Intake</h1>
        <p className="text-sm text-muted-foreground">Open/close intake windows, generate unique invites, and review submissions.</p>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="invites" disabled={!effectiveSessionId}>
            Invites {invites?.length ? `(${invites.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="submissions" disabled={!effectiveSessionId}>
            Submissions {submissions?.length ? `(${submissions.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Session
              </CardTitle>
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

          <GroupedSessionsList
            sessions={sessions || []}
            isLoading={sessionsLoading}
            activeSessionId={effectiveSessionId}
            onSelectSession={setActiveSessionId}
            onToggleClose={toggleCloseSession}
          />
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {effectiveSessionId && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <SingleInviteForm
                  sessionId={effectiveSessionId}
                  isSessionOpen={sessionIsOpen}
                  onInviteCreated={handleInvitesChanged}
                />
                <BulkInviteUpload
                  sessionId={effectiveSessionId}
                  onInvitesCreated={handleInvitesChanged}
                />
              </div>
              <GroupedInvitesList
                invites={invites || []}
                isLoading={invitesLoading}
                onInviteUpdated={handleInvitesChanged}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <GroupedSubmissionsList
            submissions={submissions || []}
            isLoading={submissionsLoading}
            onReview={openReviewDialog}
          />
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
