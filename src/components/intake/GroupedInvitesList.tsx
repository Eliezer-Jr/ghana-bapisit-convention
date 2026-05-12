import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getIntakeInviteLink, sendIntakeInviteSms } from "@/services/intakeSms";

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

type IntakeSession = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  manually_closed: boolean;
};

interface Props {
  invites: IntakeInvite[];
  sessions: IntakeSession[];
  isLoading: boolean;
  onInviteUpdated: () => void;
}

type SortField = "name" | "phone" | "status" | "sms" | "created_at";
type SortDirection = "asc" | "desc";

const ROWS_PER_SESSION_OPTIONS = ["10", "25", "50", "100", "all"];
const STATUS_OPTIONS = ["all", "active", "revoked"];

export function GroupedInvitesList({ invites, sessions, isLoading, onInviteUpdated }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openSessions, setOpenSessions] = useState<Record<string, boolean>>({});
  const [rowsPerSession, setRowsPerSession] = useState("10");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [smsFilter, setSmsFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sessionMap = useMemo(() => {
    const map = new Map<string, IntakeSession>();
    sessions.forEach((session) => map.set(session.id, session));
    return map;
  }, [sessions]);

  const filteredInvites = useMemo(() => {
    return invites.filter((invite) => {
      if (statusFilter === "active" && invite.revoked) return false;
      if (statusFilter === "revoked" && !invite.revoked) return false;
      if (smsFilter === "sent" && !invite.sms_sent_at) return false;
      if (smsFilter === "not_sent" && invite.sms_sent_at) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (invite.minister_full_name || "").toLowerCase();
        const phone = (invite.minister_phone || "").toLowerCase();
        const sessionTitle = (sessionMap.get(invite.session_id)?.title || "").toLowerCase();

        if (!name.includes(query) && !phone.includes(query) && !sessionTitle.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [invites, searchQuery, sessionMap, smsFilter, statusFilter]);

  const sortedInvites = useMemo(() => {
    return [...filteredInvites].sort((a, b) => {
      const getValue = (invite: IntakeInvite) => {
        switch (sortField) {
          case "name":
            return invite.minister_full_name || "";
          case "phone":
            return invite.minister_phone || "";
          case "status":
            return invite.revoked ? "revoked" : "active";
          case "sms":
            return invite.sms_sent_at || "";
          case "created_at":
            return invite.created_at || "";
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (!aValue) return 1;
      if (!bValue) return -1;

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredInvites, sortDirection, sortField]);

  const groupedInvites = useMemo(() => {
    const groups = new Map<string, IntakeInvite[]>();

    sortedInvites.forEach((invite) => {
      const group = groups.get(invite.session_id) || [];
      group.push(invite);
      groups.set(invite.session_id, group);
    });

    return Array.from(groups.entries()).sort(([sessionA], [sessionB]) => {
      const a = sessionMap.get(sessionA);
      const b = sessionMap.get(sessionB);
      return (b?.starts_at || "").localeCompare(a?.starts_at || "");
    });
  }, [sessionMap, sortedInvites]);

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all" || smsFilter !== "all";

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSmsFilter("all");
  };

  const toggleSession = (id: string, defaultOpen: boolean) => {
    setOpenSessions((current) => ({ ...current, [id]: !(current[id] ?? defaultOpen) }));
  };

  const copyLink = async (inviteId: string) => {
    await navigator.clipboard.writeText(getIntakeInviteLink(inviteId));
    setCopiedId(inviteId);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendSMS = async (invite: IntakeInvite) => {
    if (!invite.minister_phone) {
      toast.error("No phone number for this invite");
      return;
    }

    setSendingId(invite.id);
    try {
      const name = invite.minister_full_name || "Minister";
      const [smsResult] = await sendIntakeInviteSms([{ id: invite.id, full_name: name, phone: invite.minister_phone }]);

      await supabase
        .from("intake_invites")
        .update({
          sms_sent_at: new Date().toISOString(),
          sms_status: "sent",
          sms_message_id: smsResult.messageId,
        })
        .eq("id", invite.id);

      toast.success(`SMS sent to ${invite.minister_phone}`);
      onInviteUpdated();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown SMS error";
      console.error("SMS Error:", error);
      toast.error(`Failed to send SMS: ${message}`);
    } finally {
      setSendingId(null);
    }
  };

  const revokeInvite = async (id: string, revoked: boolean) => {
    const { error } = await supabase.from("intake_invites").update({ revoked: !revoked }).eq("id", id);
    if (error) {
      toast.error("Failed to update invite");
      return;
    }

    toast.success(!revoked ? "Invite revoked" : "Invite re-enabled");
    onInviteUpdated();
  };

  const deleteInvite = async (invite: IntakeInvite) => {
    const label = invite.minister_full_name || invite.minister_phone || "this invite";
    if (!window.confirm(`Delete invite for ${label}? This cannot be undone.`)) return;

    setDeletingId(invite.id);
    const { error } = await supabase.from("intake_invites").delete().eq("id", invite.id);
    setDeletingId(null);

    if (error) {
      toast.error("Failed to delete invite");
      return;
    }

    toast.success("Invite deleted");
    onInviteUpdated();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />;
    }

    return sortDirection === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button className="flex items-center transition-colors hover:text-foreground" onClick={() => handleSort(field)}>
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-sm text-muted-foreground">Loading invites...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invites ({invites.length})</CardTitle>
        <CardDescription>Manage minister intake invitations grouped by session.</CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">No invites yet. Create one above or bulk upload.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or session..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status === "all" ? "All statuses" : status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={smsFilter} onValueChange={setSmsFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="SMS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SMS</SelectItem>
                  <SelectItem value="sent">SMS Sent</SelectItem>
                  <SelectItem value="not_sent">Not Sent</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per session:</span>
              <Select value={rowsPerSession} onValueChange={setRowsPerSession}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROWS_PER_SESSION_OPTIONS.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size === "all" ? "All" : size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <span>
                  Showing {sortedInvites.length} of {invites.length} invites
                </span>
              )}
            </div>

            {groupedInvites.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No invites match your filters.</div>
            ) : (
              <div className="space-y-3">
                {groupedInvites.map(([sessionId, sessionInvites], index) => {
                  const session = sessionMap.get(sessionId);
                  const isOpen = openSessions[sessionId] ?? index === 0;
                  const visibleInvites = rowsPerSession === "all" ? sessionInvites : sessionInvites.slice(0, Number(rowsPerSession));
                  const hiddenCount = sessionInvites.length - visibleInvites.length;

                  return (
                    <Collapsible key={sessionId} open={isOpen} onOpenChange={() => toggleSession(sessionId, index === 0)}>
                      <CollapsibleTrigger asChild>
                        <button className="flex w-full items-center justify-between rounded-md border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50">
                          <div className="flex items-center gap-2 text-left">
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <span className="font-medium">{session?.title || "Unknown session"}</span>
                            <Badge variant="secondary">{sessionInvites.length}</Badge>
                          </div>
                          {session && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(session.starts_at).toLocaleDateString()} - {new Date(session.ends_at).toLocaleDateString()}
                            </span>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 overflow-auto rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <SortableHeader field="name">Minister</SortableHeader>
                                <SortableHeader field="phone">Phone</SortableHeader>
                                <SortableHeader field="status">Status</SortableHeader>
                                <SortableHeader field="sms">SMS</SortableHeader>
                                <SortableHeader field="created_at">Created</SortableHeader>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {visibleInvites.map((invite) => (
                                <TableRow key={invite.id} className={invite.revoked ? "opacity-50" : ""}>
                                  <TableCell className="font-medium">{invite.minister_full_name || "(not set)"}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{invite.minister_phone || "-"}</TableCell>
                                  <TableCell>
                                    <Badge variant={invite.revoked ? "destructive" : "default"}>
                                      {invite.revoked ? "Revoked" : "Active"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {invite.sms_sent_at ? (
                                      <Badge variant="outline" className="border-green-600 text-green-600">
                                        Sent
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-muted-foreground">
                                        Not sent
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(invite.created_at).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => copyLink(invite.id)} title="Copy Link">
                                        {copiedId === invite.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                      </Button>
                                      {invite.minister_phone && !invite.revoked && (
                                        <Button variant="ghost" size="sm" onClick={() => sendSMS(invite)} disabled={sendingId === invite.id} title="Send SMS">
                                          {sendingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                      )}
                                      <Button variant="outline" size="sm" onClick={() => revokeInvite(invite.id, invite.revoked)}>
                                        {invite.revoked ? "Enable" : "Revoke"}
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => deleteInvite(invite)}
                                        disabled={deletingId === invite.id}
                                        title="Delete invite"
                                      >
                                        {deletingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {hiddenCount > 0 && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Showing first {rowsPerSession} invites in this session. Increase rows per session to see {hiddenCount} more.
                          </p>
                        )}
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
