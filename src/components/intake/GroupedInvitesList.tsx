import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Copy, Send, Loader2, Check, ChevronDown, ChevronRight } from "lucide-react";
import { supabase, supabaseFunctions } from "@/lib/supabase";
import { MESSAGING_CONFIG } from "@/config/messaging";
import { groupByWeekAndDate } from "@/utils/dateGrouping";

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

const getBaseDomain = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return "https://ghanabaptistministers.com";
};

interface Props {
  invites: IntakeInvite[];
  isLoading: boolean;
  onInviteUpdated: () => void;
}

export function GroupedInvitesList({ invites, isLoading, onInviteUpdated }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  const groupedInvites = groupByWeekAndDate(invites, (inv) => inv.created_at);

  const toggleWeek = (weekLabel: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekLabel)) next.delete(weekLabel);
      else next.add(weekLabel);
      return next;
    });
  };

  const toggleDate = (key: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getInviteLink = (inviteId: string) => `${getBaseDomain()}/minister-intake/${inviteId}`;

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

      const { data, error } = await supabaseFunctions.functions.invoke("frogapi-send-personalized", {
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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-sm text-muted-foreground text-center">Loading invites…</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invites ({invites.length})</CardTitle>
        <CardDescription>Grouped by week and date. Click to expand.</CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No invites yet. Create one above or bulk upload.
          </div>
        ) : (
          <div className="space-y-2">
            {groupedInvites.map((week) => {
              const weekOpen = expandedWeeks.has(week.weekLabel);
              const weekInviteCount = week.dates.reduce((sum, d) => sum + d.items.length, 0);

              return (
                <Collapsible key={week.weekLabel} open={weekOpen} onOpenChange={() => toggleWeek(week.weekLabel)}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-left font-semibold">
                      <span className="flex items-center gap-2">
                        {weekOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {week.weekLabel}
                      </span>
                      <Badge variant="secondary">{weekInviteCount}</Badge>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-1">
                    {week.dates.map((dateGroup) => {
                      const dateKey = `${week.weekLabel}-${dateGroup.dateLabel}`;
                      const dateOpen = expandedDates.has(dateKey);

                      return (
                        <Collapsible key={dateKey} open={dateOpen} onOpenChange={() => toggleDate(dateKey)}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between text-left">
                              <span className="flex items-center gap-2">
                                {dateOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                {dateGroup.dateLabel}
                              </span>
                              <Badge variant="outline">{dateGroup.items.length}</Badge>
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border rounded-md overflow-auto mt-1 mb-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Minister</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>SMS</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dateGroup.items.map((invite) => (
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
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
