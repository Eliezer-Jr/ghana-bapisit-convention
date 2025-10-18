-- Add new columns to ministers table for comprehensive data collection
ALTER TABLE public.ministers
ADD COLUMN photo_url TEXT,
ADD COLUMN titles TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN gps_address TEXT,
ADD COLUMN whatsapp TEXT,
ADD COLUMN marital_status TEXT CHECK (marital_status IN ('married', 'single', 'divorced', 'widowed')),
ADD COLUMN spouse_name TEXT,
ADD COLUMN marriage_type TEXT CHECK (marriage_type IN ('ordinance', 'customary')),
ADD COLUMN number_of_children INTEGER DEFAULT 0,
ADD COLUMN current_church_name TEXT,
ADD COLUMN position_at_church TEXT,
ADD COLUMN church_address TEXT,
ADD COLUMN association TEXT,
ADD COLUMN sector TEXT,
ADD COLUMN fellowship TEXT,
ADD COLUMN ordination_year INTEGER,
ADD COLUMN recognition_year INTEGER,
ADD COLUMN licensing_year INTEGER,
ADD COLUMN areas_of_ministry TEXT[];

-- Create educational qualifications table
CREATE TABLE public.educational_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  institution TEXT,
  year_obtained INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.educational_qualifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view qualifications"
ON public.educational_qualifications
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert qualifications"
ON public.educational_qualifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update qualifications"
ON public.educational_qualifications
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete qualifications"
ON public.educational_qualifications
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create ministerial history table
CREATE TABLE public.ministerial_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  church_name TEXT NOT NULL,
  association TEXT,
  sector TEXT,
  position TEXT NOT NULL,
  period_start INTEGER,
  period_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ministerial_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view history"
ON public.ministerial_history
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert history"
ON public.ministerial_history
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update history"
ON public.ministerial_history
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete history"
ON public.ministerial_history
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create children table
CREATE TABLE public.minister_children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.minister_children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view children"
ON public.minister_children
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert children"
ON public.minister_children
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update children"
ON public.minister_children
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete children"
ON public.minister_children
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create emergency contacts table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view emergency contacts"
ON public.emergency_contacts
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert emergency contacts"
ON public.emergency_contacts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update emergency contacts"
ON public.emergency_contacts
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete emergency contacts"
ON public.emergency_contacts
FOR DELETE
USING (auth.uid() IS NOT NULL);