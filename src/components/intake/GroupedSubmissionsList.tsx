import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Eye, Trash2, Loader2, Search, X, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

type IntakeSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  manually_closed: boolean;
};

interface Props {
  submissions: IntakeSubmission[];
  sessions: IntakeSession[];
  isLoading: boolean;
  onReview: (submission: IntakeSubmission) => void;
  onDeleted: () => void;
}

const STATUS_OPTIONS = ["all", "draft", "submitted", "approved", "rejected"];

export function GroupedSubmissionsList({ submissions, sessions, isLoading, onReview, onDeleted }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openSessions, setOpenSessions] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return submissions.filter((sub) => {
      if (statusFilter !== "all" && sub.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (sub.payload?.full_name || "").toLowerCase();
        const phone = (sub.payload?.phone || "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [submissions, searchQuery, statusFilter]);

  const sessionMap = useMemo(() => {
    const map = new Map<string, IntakeSession>();
    sessions.forEach((s) => map.set(s.id, s));
    return map;
  }, [sessions]);

  const grouped = useMemo(() => {
    const groups = new Map<string, IntakeSubmission[]>();
    filtered.forEach((sub) => {
      const arr = groups.get(sub.session_id) || [];
      arr.push(sub);
      groups.set(sub.session_id, arr);
    });
    // Sort: most recent session first
    return Array.from(groups.entries()).sort(([a], [b]) => {
      const sa = sessionMap.get(a);
      const sb = sessionMap.get(b);
      return (sb?.starts_at || "").localeCompare(sa?.starts_at || "");
    });
  }, [filtered, sessionMap]);

  const toggleSession = (id: string) => {
    setOpenSessions((prev) => ({ ...prev, [id]: prev[id] === false ? true : !prev[id] && false === false ? false : !prev[id] }));
  };

  // Simpler toggle:
  const toggle = (id: string, defaultOpen: boolean) => {
    setOpenSessions((prev) => {
      const current = prev[id] ?? defaultOpen;
      return { ...prev, [id]: !current };
    });
  };

  const deleteSubmission = async (sub: IntakeSubmission) => {
    const label = sub.payload?.full_name || sub.payload?.phone || "this submission";
    if (!window.confirm(`Delete submission for ${label}? This cannot be undone.`)) return;
    setDeletingId(sub.id);
    const { error } = await supabase.from("intake_submissions").delete().eq("id", sub.id);
    setDeletingId(null);
    if (error) {
      toast.error("Failed to delete submission");
      return;
    }
    toast.success("Submission deleted");
    onDeleted();
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-sm text-muted-foreground text-center">Loading submissions…</div>
        </CardContent>
      </Card>
    );
  }

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions ({submissions.length})</CardTitle>
        <CardDescription>Submissions grouped by intake session.</CardDescription>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">No submissions yet.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {grouped.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No submissions match your filters.
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map(([sessionId, subs], idx) => {
                  const session = sessionMap.get(sessionId);
                  const isOpen = openSessions[sessionId] ?? idx === 0;
                  return (
                    <Collapsible key={sessionId} open={isOpen} onOpenChange={() => toggle(sessionId, idx === 0)}>
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between rounded-md border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-2 text-left">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-medium">{session?.title || "Unknown session"}</span>
                            <Badge variant="secondary">{subs.length}</Badge>
                          </div>
                          {session && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(session.starts_at).toLocaleDateString()} → {new Date(session.ends_at).toLocaleDateString()}
                            </span>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border rounded-md overflow-auto mt-2">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Reviewed</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subs.map((sub) => (
                                <TableRow key={sub.id}>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        sub.status === "approved"
                                          ? "default"
                                          : sub.status === "rejected"
                                          ? "destructive"
                                          : "secondary"
                                      }
                                    >
                                      {sub.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-medium">{sub.payload?.full_name || "—"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{sub.payload?.phone || "—"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : "—"}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleString() : "—"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button size="sm" variant="outline" onClick={() => onReview(sub)}>
                                        <Eye className="h-4 w-4 mr-1" />
                                        Review
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteSubmission(sub)}
                                        disabled={deletingId === sub.id}
                                        title="Delete submission"
                                      >
                                        {deletingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
