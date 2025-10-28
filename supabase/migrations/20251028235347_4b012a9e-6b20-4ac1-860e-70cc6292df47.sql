-- Create approved_applicants table to track who can apply
CREATE TABLE IF NOT EXISTS public.approved_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used BOOLEAN DEFAULT false,
  application_id UUID REFERENCES public.applications(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approved_applicants ENABLE ROW LEVEL SECURITY;

-- Finance managers can view all approved applicants
CREATE POLICY "Finance managers can view all approved applicants"
ON public.approved_applicants
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Finance managers can add approved applicants
CREATE POLICY "Finance managers can add approved applicants"
ON public.approved_applicants
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Finance managers can update approved applicants
CREATE POLICY "Finance managers can update approved applicants"
ON public.approved_applicants
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_approved_applicants_phone ON public.approved_applicants(phone_number);
CREATE INDEX IF NOT EXISTS idx_approved_applicants_used ON public.approved_applicants(used);