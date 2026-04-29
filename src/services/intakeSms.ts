import { supabaseFunctions } from "@/lib/supabase";
import { MESSAGING_CONFIG } from "@/config/messaging";

export type IntakeSmsRecipient = {
  id: string;
  full_name: string;
  phone: string;
};

type FrogSmsResult = {
  ok?: boolean;
  destination?: string;
  data?: {
    msgid?: string;
    message_id?: string;
    message?: string;
    status?: string;
  };
};

type FrogSmsResponse = {
  success?: boolean;
  data?: FrogSmsResult[];
  error?: string;
};

const getBaseDomain = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "https://ghanabaptistministers.com";
};

export const getIntakeInviteLink = (inviteId: string) => `${getBaseDomain()}/minister-intake/${inviteId}`;

export const buildIntakeInviteMessage = (name: string, inviteId: string) =>
  `Dear ${name || "Minister"}, please update your minister information using this link: ${getIntakeInviteLink(inviteId)} - GBC Ministers' Conference`;

export const sendIntakeInviteSms = async (recipients: IntakeSmsRecipient[]) => {
  const destinations = recipients.map((recipient) => ({
    destination: recipient.phone,
    message: buildIntakeInviteMessage(recipient.full_name, recipient.id),
    smstype: MESSAGING_CONFIG.SMS_TYPE,
  }));

  const { data, error } = await supabaseFunctions.functions.invoke<FrogSmsResponse>("frogapi-send-personalized", {
    body: {
      destinations,
    },
  });

  if (error) {
    throw new Error(error.message || "SMS service could not be reached");
  }

  if (!data?.success) {
    const providerMessage = data?.error || data?.data?.find((result) => result.ok === false)?.data?.message;
    throw new Error(providerMessage || "SMS provider rejected the message");
  }

  return recipients.map((recipient, index) => ({
    inviteId: recipient.id,
    messageId: data.data?.[index]?.data?.msgid || data.data?.[index]?.data?.message_id || null,
  }));
};