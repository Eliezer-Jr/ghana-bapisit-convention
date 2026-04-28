import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Send, Loader2, Check } from "lucide-react";
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

interface Props {
  invites: IntakeInvite[];
  isLoading: boolean;
  onInviteUpdated: () => void;
}

export function InvitesList({ invites, isLoading, onInviteUpdated }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const copyLink = async (inviteId: string) => {
    const link = getIntakeInviteLink(inviteId);
    await navigator.clipboard.writeText(link);
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

      // Update SMS status in database
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
      console.error(error);
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
        <CardDescription>
          Each invite has a unique link. Copy or send via SMS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No invites yet. Create one above or bulk upload.
          </div>
        ) : (
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Minister</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SMS Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id} className={invite.revoked ? "opacity-50" : ""}>
                    <TableCell className="font-medium">
                      {invite.minister_full_name || "(not set)"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invite.minister_phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={invite.revoked ? "destructive" : "default"}>
                        {invite.revoked ? "Revoked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {invite.sms_sent_at ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Sent {new Date(invite.sms_sent_at).toLocaleDateString()}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Not sent
                          </Badge>
                        )}
                        {invite.sms_status && (
                          <span className="text-xs text-muted-foreground">
                            Status: {invite.sms_status}
                          </span>
                        )}
                        {invite.sms_message_id && (
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]" title={invite.sms_message_id}>
                            ID: {invite.sms_message_id.slice(0, 10)}...
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyLink(invite.id)}
                          title="Copy Link"
                        >
                          {copiedId === invite.id ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {invite.minister_phone && !invite.revoked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => sendSMS(invite)}
                            disabled={sendingId === invite.id}
                            title="Send SMS"
                          >
                            {sendingId === invite.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeInvite(invite.id, invite.revoked)}
                        >
                          {invite.revoked ? "Enable" : "Revoke"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
