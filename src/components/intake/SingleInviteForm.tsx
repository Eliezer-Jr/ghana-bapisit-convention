import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { supabase, supabaseFunctions } from "@/lib/supabase";
import { MESSAGING_CONFIG } from "@/config/messaging";

interface Props {
  sessionId: string;
  isSessionOpen: boolean;
  onInviteCreated: () => void;
}

export function SingleInviteForm({ sessionId, isSessionOpen, onInviteCreated }: Props) {
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [sendSms, setSendSms] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const createInvite = async () => {
    if (!sessionId) return;
    if (!inviteName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!invitePhone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsCreating(true);
    const { data: auth } = await supabase.auth.getUser();

    try {
      // Normalize phone
      let normalizedPhone = invitePhone.trim().replace(/\s+/g, "");
      if (normalizedPhone.startsWith("0")) {
        normalizedPhone = "+233" + normalizedPhone.substring(1);
      } else if (!normalizedPhone.startsWith("+")) {
        normalizedPhone = "+233" + normalizedPhone;
      }

      const { data, error } = await supabase
        .from("intake_invites")
        .insert({
          session_id: sessionId,
          minister_full_name: inviteName.trim(),
          minister_phone: normalizedPhone,
          minister_email: inviteEmail.trim() || null,
          expires_at: inviteExpiresAt ? new Date(inviteExpiresAt).toISOString() : null,
          created_by: auth.user?.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/minister-intake/${data.id}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link);

      // Send SMS if enabled
      if (sendSms) {
        const message = `Dear ${inviteName.trim()}, please update your minister information using this link: ${link} - GBC Ministers' Conference`;
        
        const { error: smsError } = await supabaseFunctions.functions.invoke("frogapi-send-personalized", {
          body: {
            senderid: MESSAGING_CONFIG.SENDER_ID,
            destinations: [{
              destination: normalizedPhone,
              message,
              smstype: MESSAGING_CONFIG.SMS_TYPE,
            }],
          },
        });

        if (smsError) {
          console.error("SMS Error:", smsError);
          toast.warning("Invite created but SMS failed");
        } else {
          toast.success("Invite created, link copied & SMS sent");
        }
      } else {
        toast.success("Invite created (link copied)");
      }

      // Reset form
      setInviteName("");
      setInvitePhone("");
      setInviteEmail("");
      setInviteExpiresAt("");
      onInviteCreated();
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to create invite: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Single Invite</CardTitle>
        <CardDescription>
          Creates a unique link for one minister. Link is copied to clipboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Full Name *</Label>
            <Input 
              value={inviteName} 
              onChange={(e) => setInviteName(e.target.value)} 
              placeholder="e.g., Rev. John Mensah"
            />
          </div>
          <div className="grid gap-2">
            <Label>Phone *</Label>
            <Input 
              value={invitePhone} 
              onChange={(e) => setInvitePhone(e.target.value)} 
              placeholder="0244123456 or +233244123456" 
            />
          </div>
          <div className="grid gap-2">
            <Label>Email (optional)</Label>
            <Input 
              value={inviteEmail} 
              onChange={(e) => setInviteEmail(e.target.value)} 
              type="email"
            />
          </div>
          <div className="grid gap-2">
            <Label>Expires at (optional)</Label>
            <Input 
              type="datetime-local" 
              value={inviteExpiresAt} 
              onChange={(e) => setInviteExpiresAt(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="send-sms" 
            checked={sendSms} 
            onCheckedChange={(checked) => setSendSms(checked === true)}
          />
          <label htmlFor="send-sms" className="text-sm cursor-pointer">
            Send SMS with invite link
          </label>
        </div>

        <Button 
          onClick={createInvite} 
          className="w-full" 
          disabled={!isSessionOpen || isCreating}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Create Invite
        </Button>
        
        {!isSessionOpen && (
          <p className="text-xs text-muted-foreground text-center">
            Select an open session to create invites.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
