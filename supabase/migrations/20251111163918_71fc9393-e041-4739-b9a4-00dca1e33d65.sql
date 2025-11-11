-- Create phone number change history table
CREATE TABLE IF NOT EXISTS public.phone_number_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approved_applicant_id UUID NOT NULL REFERENCES public.approved_applicants(id) ON DELETE CASCADE,
  old_phone_number TEXT NOT NULL,
  new_phone_number TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS
ALTER TABLE public.phone_number_history ENABLE ROW LEVEL SECURITY;

-- Finance managers can view history
CREATE POLICY "Finance managers can view phone number history"
ON public.phone_number_history
FOR SELECT
USING (
  has_role(auth.uid(), 'finance_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Finance managers can insert history
CREATE POLICY "Finance managers can insert phone number history"
ON public.phone_number_history
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'finance_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Create index for faster lookups
CREATE INDEX idx_phone_number_history_applicant ON public.phone_number_history(approved_applicant_id);