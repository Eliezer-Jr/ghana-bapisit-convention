import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Send, Loader2, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Search, X } from "lucide-react";
import { supabase, supabaseFunctions } from "@/lib/supabase";
import { MESSAGING_CONFIG } from "@/config/messaging";

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

const BASE_DOMAIN = "https://ghanabaptistministers.com";

interface Props {
  invites: IntakeInvite[];
  isLoading: boolean;
  onInviteUpdated: () => void;
}

type SortField = "name" | "phone" | "status" | "sms" | "created_at";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const STATUS_OPTIONS = ["all", "active", "revoked"];
const SMS_OPTIONS = ["all", "sent", "not_sent"];

export function GroupedInvitesList({ invites, isLoading, onInviteUpdated }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [smsFilter, setSmsFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Filter invites
  const filteredInvites = useMemo(() => {
    return invites.filter((inv) => {
      // Status filter
      if (statusFilter === "active" && inv.revoked) return false;
      if (statusFilter === "revoked" && !inv.revoked) return false;
      // SMS filter
      if (smsFilter === "sent" && !inv.sms_sent_at) return false;
      if (smsFilter === "not_sent" && inv.sms_sent_at) return false;
      // Search filter (name or phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const name = (inv.minister_full_name || "").toLowerCase();
        const phone = (inv.minister_phone || "").toLowerCase();
        if (!name.includes(query) && !phone.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [invites, searchQuery, statusFilter, smsFilter]);

  // Sort invites
  const sortedInvites = useMemo(() => {
    return [...filteredInvites].sort((a, b) => {
      let aValue: string | null = null;
      let bValue: string | null = null;

      switch (sortField) {
        case "name":
          aValue = a.minister_full_name || "";
          bValue = b.minister_full_name || "";
          break;
        case "phone":
          aValue = a.minister_phone || "";
          bValue = b.minister_phone || "";
          break;
        case "status":
          aValue = a.revoked ? "revoked" : "active";
          bValue = b.revoked ? "revoked" : "active";
          break;
        case "sms":
          aValue = a.sms_sent_at || "";
          bValue = b.sms_sent_at || "";
          break;
        case "created_at":
          aValue = a.created_at || "";
          bValue = b.created_at || "";
          break;
      }

      if (aValue === null || aValue === "") return 1;
      if (bValue === null || bValue === "") return -1;

      const comparison = aValue.localeCompare(bValue);
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredInvites, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedInvites.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedInvites = sortedInvites.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSmsFilter("all");
    setCurrentPage(1);
  };

  const getInviteLink = (inviteId: string) => `${BASE_DOMAIN}/minister-intake/${inviteId}`;

  const copyLink = async (inviteId: string) => {
    await navigator.clipboard.writeText(getInviteLink(inviteId));
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
      const link = getInviteLink(invite.id);
      const name = invite.minister_full_name || "Minister";
      const message = `Dear ${name}, please update your minister information using this link: ${link} - GBC Ministers' Conference`;

      const { data, error } = await supabaseFunctions.functions.invoke("moolre-send-personalized", {
        body: {
          senderid: MESSAGING_CONFIG.SENDER_ID,
          destinations: [{ destination: invite.minister_phone, message, smstype: MESSAGING_CONFIG.SMS_TYPE }],
        },
      });
      if (error) throw error;

      const messageId = data?.messages?.[0]?.msgid || data?.msgid || null;
      await supabase.from("intake_invites").update({
        sms_sent_at: new Date().toISOString(),
        sms_status: "sent",
        sms_message_id: messageId,
      }).eq("id", invite.id);

      toast.success(`SMS sent to ${invite.minister_phone}`);
      onInviteUpdated();
    } catch (error: any) {
      console.error("SMS Error:", error);
      toast.error(`Failed to send SMS: ${error.message}`);
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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead>
      <button
        className="flex items-center hover:text-foreground transition-colors"
        onClick={() => handleSort(field)}
      >
        {children}
        <SortIcon field={field} />
      </button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-sm text-muted-foreground text-center">Loading invites…</div>
        </CardContent>
      </Card>
    );
  }

  const hasActiveFilters = searchQuery.trim() || statusFilter !== "all" || smsFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invites ({invites.length})</CardTitle>
        <CardDescription>Manage minister intake invitations.</CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No invites yet. Create one above or bulk upload.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
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
              <Select value={smsFilter} onValueChange={(v) => { setSmsFilter(v); setCurrentPage(1); }}>
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

            {/* Results info */}
            {hasActiveFilters && (
              <div className="text-sm text-muted-foreground">
                Showing {sortedInvites.length} of {invites.length} invites
              </div>
            )}

            <div className="border rounded-md overflow-auto">
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
                  {paginatedInvites.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No invites match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedInvites.map((invite) => (
                      <TableRow key={invite.id} className={invite.revoked ? "opacity-50" : ""}>
                        <TableCell className="font-medium">{invite.minister_full_name || "(not set)"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{invite.minister_phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={invite.revoked ? "destructive" : "default"}>
                            {invite.revoked ? "Revoked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {invite.sms_sent_at ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">Sent</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Not sent</Badge>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {sortedInvites.length > 0
                    ? `${startIndex + 1}–${Math.min(endIndex, sortedInvites.length)} of ${sortedInvites.length}`
                    : "0 results"}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
