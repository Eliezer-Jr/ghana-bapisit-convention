-- Add new columns to ministers table for spouse and work information
ALTER TABLE public.ministers 
ADD COLUMN IF NOT EXISTS spouse_phone_number text,
ADD COLUMN IF NOT EXISTS spouse_occupation text;

-- Create table for non-church work history
CREATE TABLE IF NOT EXISTS public.non_church_work (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id uuid NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  organization text NOT NULL,
  job_title text NOT NULL,
  period_start integer,
  period_end integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for key positions held within convention
CREATE TABLE IF NOT EXISTS public.convention_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id uuid NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  position text NOT NULL,
  period_start integer,
  period_end integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.non_church_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for non_church_work
CREATE POLICY "Authenticated users can view non-church work"
ON public.non_church_work
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert non-church work"
ON public.non_church_work
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update non-church work"
ON public.non_church_work
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete non-church work"
ON public.non_church_work
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for convention_positions
CREATE POLICY "Authenticated users can view convention positions"
ON public.convention_positions
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert convention positions"
ON public.convention_positions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update convention positions"
ON public.convention_positions
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete convention positions"
ON public.convention_positions
FOR DELETE
USING (auth.uid() IS NOT NULL);