-- Add SMS delivery tracking columns to intake_invites
ALTER TABLE public.intake_invites 
ADD COLUMN sms_sent_at timestamp with time zone DEFAULT NULL,
ADD COLUMN sms_status text DEFAULT NULL,
ADD COLUMN sms_message_id text DEFAULT NULL;