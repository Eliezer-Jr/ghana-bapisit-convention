-- =====================================================================
-- GHANA BAPTIST CONVENTION CONFERENCE - COMPLETE DATABASE SCHEMA
-- Generated: 2025-11-29
-- This file contains all database migrations consolidated into one file
-- =====================================================================

-- =====================================================================
-- PART 1: ENUMS AND TYPES
-- =====================================================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM (
  'super_admin', 
  'admin', 
  'user', 
  'finance_manager', 
  'admission_reviewer',
  'local_officer',
  'association_head',
  'vp_office'
);

-- Create admission levels enum
CREATE TYPE public.admission_level AS ENUM ('licensing', 'recognition', 'ordination');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM (
  'draft', 
  'submitted', 
  'local_screening', 
  'association_approved', 
  'vp_review', 
  'interview_scheduled', 
  'approved', 
  'rejected'
);

-- =====================================================================
-- PART 2: SEQUENCES
-- =====================================================================

-- Create sequence for minister numbers
CREATE SEQUENCE IF NOT EXISTS minister_number_seq START WITH 10000;

-- =====================================================================
-- PART 3: CORE TABLES
-- =====================================================================

-- User Roles Table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone_number TEXT UNIQUE,
  avatar_url TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activity Logs Table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Ministers Table
CREATE TABLE public.ministers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  location TEXT,
  date_joined DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  photo_url TEXT,
  titles TEXT,
  date_of_birth DATE,
  gps_address TEXT,
  whatsapp TEXT,
  marital_status TEXT CHECK (marital_status IN ('married', 'single', 'divorced', 'widowed')),
  spouse_name TEXT,
  spouse_phone_number TEXT,
  spouse_occupation TEXT,
  marriage_type TEXT CHECK (marriage_type IN ('ordinance', 'customary')),
  number_of_children INTEGER DEFAULT 0,
  current_church_name TEXT,
  position_at_church TEXT,
  church_address TEXT,
  association TEXT,
  sector TEXT,
  fellowship TEXT,
  zone TEXT,
  ordination_year INTEGER,
  recognition_year INTEGER,
  licensing_year INTEGER,
  areas_of_ministry TEXT[],
  physical_folder_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Educational Qualifications Table
CREATE TABLE public.educational_qualifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  qualification TEXT NOT NULL,
  institution TEXT,
  year_obtained INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ministerial History Table
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

-- Minister Children Table
CREATE TABLE public.minister_children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Emergency Contacts Table
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Non-Church Work History Table
CREATE TABLE public.non_church_work (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  organization TEXT NOT NULL,
  job_title TEXT NOT NULL,
  period_start INTEGER,
  period_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Convention Positions Table
CREATE TABLE public.convention_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  minister_id UUID NOT NULL REFERENCES public.ministers(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  period_start INTEGER,
  period_end INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Applications Table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admission_level admission_level NOT NULL,
  status application_status NOT NULL DEFAULT 'submitted',
  
  -- Personal Information
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  marital_status TEXT,
  spouse_name TEXT,
  photo_url TEXT,
  
  -- Church Information
  church_name TEXT NOT NULL,
  association TEXT NOT NULL,
  sector TEXT NOT NULL,
  fellowship TEXT NOT NULL,
  
  -- Theological Education
  theological_institution TEXT,
  theological_qualification TEXT,
  
  -- For Ordination only
  ministry_evaluation_paper TEXT,
  
  -- For Licensing only
  mentor_name TEXT,
  mentor_contact TEXT,
  vision_statement TEXT,
  
  -- Screening & Interview
  screening_date DATE,
  screening_result TEXT,
  interview_date DATE,
  interview_location TEXT,
  interview_result TEXT,
  
  -- Payment
  payment_receipt_number TEXT,
  payment_amount DECIMAL(10,2),
  payment_date DATE,
  gazette_paid BOOLEAN DEFAULT false,
  gazette_receipt_number TEXT,
  
  -- Administrative
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,
  
  -- Multi-level Review
  local_reviewed_by UUID,
  local_reviewed_at TIMESTAMP WITH TIME ZONE,
  local_notes TEXT,
  association_reviewed_by UUID,
  association_reviewed_at TIMESTAMP WITH TIME ZONE,
  association_notes TEXT,
  vp_reviewed_by UUID,
  vp_reviewed_at TIMESTAMP WITH TIME ZONE,
  vp_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Application Documents Table
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Approved Applicants Table
CREATE TABLE public.approved_applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used BOOLEAN DEFAULT false,
  application_id UUID REFERENCES public.applications(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phone Number History Table
CREATE TABLE public.phone_number_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approved_applicant_id UUID NOT NULL REFERENCES public.approved_applicants(id) ON DELETE CASCADE,
  old_phone_number TEXT NOT NULL,
  new_phone_number TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Letter Templates Table
CREATE TABLE public.letter_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL DEFAULT 'default',
  primary_color TEXT NOT NULL DEFAULT '41,128,185',
  secondary_color TEXT NOT NULL DEFAULT '52,73,94',
  font_family TEXT NOT NULL DEFAULT 'helvetica',
  font_size_title INTEGER NOT NULL DEFAULT 16,
  font_size_body INTEGER NOT NULL DEFAULT 11,
  letterhead_height INTEGER NOT NULL DEFAULT 45,
  logo_width INTEGER NOT NULL DEFAULT 30,
  logo_height INTEGER NOT NULL DEFAULT 30,
  organization_name TEXT NOT NULL DEFAULT 'Ghana Baptist Convention Conference',
  organization_subtitle TEXT NOT NULL DEFAULT 'MINISTERIAL ADMISSION',
  footer_text TEXT NOT NULL DEFAULT 'This is an official document of the Ghana Baptist Convention Conference',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_type)
);

-- Letter Signatures Table
CREATE TABLE public.letter_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================================
-- PART 4: STORAGE BUCKETS
-- =====================================================================

-- Minister Photos Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('minister-photos', 'minister-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Application Documents Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Signature Images Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signature-images', 'signature-images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- PART 5: FUNCTIONS
-- =====================================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, email, approved)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    false
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Function to generate unique minister ID
CREATE OR REPLACE FUNCTION generate_minister_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate ID in format GBCC-A##### where ##### is sequential
    new_id := 'GBCC-A' || LPAD(nextval('minister_number_seq')::TEXT, 5, '0');
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM ministers WHERE minister_id = new_id) INTO id_exists;
    
    -- Exit loop if ID is unique
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Function to auto-generate minister ID on insert
CREATE OR REPLACE FUNCTION set_minister_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.minister_id IS NULL THEN
    NEW.minister_id := generate_minister_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Function to handle minister audit trail
CREATE OR REPLACE FUNCTION public.handle_minister_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On insert, set created_by
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  END IF;
  
  -- On update, set updated_by
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to send SMS notification when application status changes
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Only send notification if status has changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Get Supabase URL and service key from vault or env
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);
    
    -- Call the edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/notify-status-change',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'applicationId', NEW.id,
        'status', NEW.status,
        'recipientPhone', NEW.phone,
        'recipientName', NEW.full_name
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send SMS notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- =====================================================================
-- PART 6: VIEWS
-- =====================================================================

-- Minister Audit Info View (with SECURITY INVOKER for proper RLS enforcement)
CREATE OR REPLACE VIEW public.minister_audit_info
WITH (security_invoker = on)
AS
SELECT 
  m.id,
  m.minister_id,
  m.full_name,
  m.created_at,
  m.updated_at,
  m.created_by,
  m.updated_by,
  pc.full_name AS created_by_name,
  pc.email AS created_by_email,
  pu.full_name AS updated_by_name,
  pu.email AS updated_by_email
FROM ministers m
LEFT JOIN profiles pc ON m.created_by = pc.id
LEFT JOIN profiles pu ON m.updated_by = pu.id;

-- Grant access to authenticated users
GRANT SELECT ON public.minister_audit_info TO authenticated;

-- =====================================================================
-- PART 7: TRIGGERS
-- =====================================================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profile updates timestamp
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for minister timestamp updates
CREATE TRIGGER update_ministers_updated_at
  BEFORE UPDATE ON public.ministers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-generate minister ID
CREATE TRIGGER trigger_set_minister_id
  BEFORE INSERT ON public.ministers
  FOR EACH ROW
  EXECUTE FUNCTION set_minister_id();

-- Trigger for minister audit trail
CREATE TRIGGER minister_audit_trigger
  BEFORE INSERT OR UPDATE ON public.ministers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_minister_audit();

-- Trigger for application timestamp updates
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for application status change notifications
CREATE TRIGGER trigger_notify_application_status
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();

-- Trigger for letter templates timestamp
CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for letter signatures timestamp
CREATE TRIGGER update_letter_signatures_updated_at
  BEFORE UPDATE ON public.letter_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================================
-- PART 8: ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministerial_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.minister_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.non_church_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approved_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_number_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letter_signatures ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- USER_ROLES POLICIES
-- =====================================================================

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- =====================================================================
-- PROFILES POLICIES
-- =====================================================================

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Super admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- =====================================================================
-- ACTIVITY_LOGS POLICIES
-- =====================================================================

CREATE POLICY "Super admins can view all logs"
  ON public.activity_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view their own logs"
  ON public.activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- MINISTERS POLICIES
-- =====================================================================

CREATE POLICY "Authenticated users can view all ministers" 
  ON public.ministers 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create ministers" 
  ON public.ministers 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ministers" 
  ON public.ministers 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete ministers" 
  ON public.ministers 
  FOR DELETE 
  TO authenticated
  USING (true);

-- =====================================================================
-- EDUCATIONAL_QUALIFICATIONS POLICIES
-- =====================================================================

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

-- =====================================================================
-- MINISTERIAL_HISTORY POLICIES
-- =====================================================================

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

-- =====================================================================
-- MINISTER_CHILDREN POLICIES
-- =====================================================================

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

-- =====================================================================
-- EMERGENCY_CONTACTS POLICIES
-- =====================================================================

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

-- =====================================================================
-- NON_CHURCH_WORK POLICIES
-- =====================================================================

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

-- =====================================================================
-- CONVENTION_POSITIONS POLICIES
-- =====================================================================

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

-- =====================================================================
-- APPLICATIONS POLICIES
-- =====================================================================

CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view applications"
  ON applications
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Applicants can update their applications"
  ON public.applications
  FOR UPDATE 
  USING (true)
  WITH CHECK (
    status IN (
      'draft'::application_status,
      'submitted'::application_status,
      'local_screening'::application_status,
      'association_approved'::application_status,
      'vp_review'::application_status,
      'interview_scheduled'::application_status
    )
  );

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update all applications"
  ON public.applications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admission reviewers can view all applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admission_reviewer'::app_role));

CREATE POLICY "Admission reviewers can update applications"
  ON public.applications FOR UPDATE
  USING (has_role(auth.uid(), 'admission_reviewer'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admission_reviewer'::app_role));

CREATE POLICY "Local officers can view applications in their area"
  ON public.applications FOR SELECT
  USING (
    has_role(auth.uid(), 'local_officer'::app_role) AND 
    status IN ('submitted', 'local_screening', 'association_approved', 'vp_review', 'interview_scheduled', 'approved', 'rejected')
  );

CREATE POLICY "Local officers can update applications for screening"
  ON public.applications FOR UPDATE
  USING (
    has_role(auth.uid(), 'local_officer'::app_role) AND 
    status IN ('submitted', 'local_screening')
  )
  WITH CHECK (has_role(auth.uid(), 'local_officer'::app_role));

CREATE POLICY "Association heads can view applications"
  ON public.applications FOR SELECT
  USING (
    has_role(auth.uid(), 'association_head'::app_role) AND 
    status IN ('local_screening', 'association_approved', 'vp_review', 'interview_scheduled', 'approved', 'rejected')
  );

CREATE POLICY "Association heads can update applications for approval"
  ON public.applications FOR UPDATE
  USING (
    has_role(auth.uid(), 'association_head'::app_role) AND 
    status IN ('local_screening', 'association_approved')
  )
  WITH CHECK (has_role(auth.uid(), 'association_head'::app_role));

CREATE POLICY "VP office can view all applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'vp_office'::app_role));

CREATE POLICY "VP office can update all applications"
  ON public.applications FOR UPDATE
  USING (has_role(auth.uid(), 'vp_office'::app_role))
  WITH CHECK (has_role(auth.uid(), 'vp_office'::app_role));

-- =====================================================================
-- APPLICATION_DOCUMENTS POLICIES
-- =====================================================================

CREATE POLICY "Anyone can insert application documents"
  ON application_documents
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view application documents"
  ON application_documents
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete application documents"
  ON application_documents
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can view all documents"
  ON public.application_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admission reviewers can view application documents"
  ON public.application_documents FOR SELECT
  USING (has_role(auth.uid(), 'admission_reviewer'::app_role));

-- =====================================================================
-- APPROVED_APPLICANTS POLICIES
-- =====================================================================

CREATE POLICY "Finance managers can view all approved applicants"
  ON public.approved_applicants
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Finance managers can add approved applicants"
  ON public.approved_applicants
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Finance managers can update approved applicants"
  ON public.approved_applicants
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'finance_manager') OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- =====================================================================
-- PHONE_NUMBER_HISTORY POLICIES
-- =====================================================================

CREATE POLICY "Finance managers can view phone number history"
  ON public.phone_number_history
  FOR SELECT
  USING (
    has_role(auth.uid(), 'finance_manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

CREATE POLICY "Finance managers can insert phone number history"
  ON public.phone_number_history
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'finance_manager'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- =====================================================================
-- LETTER_TEMPLATES POLICIES
-- =====================================================================

CREATE POLICY "Anyone can view letter templates"
  ON public.letter_templates
  FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage letter templates"
  ON public.letter_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================================
-- LETTER_SIGNATURES POLICIES
-- =====================================================================

CREATE POLICY "Anyone can view signatures"
  ON public.letter_signatures
  FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage signatures"
  ON public.letter_signatures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================================
-- STORAGE POLICIES
-- =====================================================================

-- Minister Photos Storage Policies
CREATE POLICY "Anyone can view minister photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'minister-photos');

CREATE POLICY "Authenticated users can upload minister photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'minister-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update minister photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'minister-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete minister photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'minister-photos' AND auth.uid() IS NOT NULL);

-- Application Documents Storage Policies
CREATE POLICY "Anyone can upload application documents"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'application-documents');

CREATE POLICY "Anyone can view application documents"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'application-documents');

CREATE POLICY "Anyone can update application documents"
  ON storage.objects
  FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'application-documents');

CREATE POLICY "Anyone can delete application documents"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'application-documents');

CREATE POLICY "Admins can view application documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'application-documents' 
    AND (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('super_admin', 'admin', 'admission_reviewer', 'local_officer', 'association_head', 'vp_office')
      )
    )
  );

-- Signature Images Storage Policies
CREATE POLICY "Public can view signature images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'signature-images');

CREATE POLICY "Super admins can upload signature images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'signature-images' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete signature images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'signature-images' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================================
-- PART 9: INDEXES
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_ministers_minister_id ON public.ministers(minister_id);
CREATE INDEX IF NOT EXISTS idx_approved_applicants_phone ON public.approved_applicants(phone_number);
CREATE INDEX IF NOT EXISTS idx_approved_applicants_used ON public.approved_applicants(used);
CREATE INDEX IF NOT EXISTS idx_phone_number_history_applicant ON public.phone_number_history(approved_applicant_id);

-- =====================================================================
-- PART 10: DEFAULT DATA
-- =====================================================================

-- Insert default letter template
INSERT INTO public.letter_templates (template_type)
VALUES ('default')
ON CONFLICT (template_type) DO NOTHING;

-- Insert default signatures
INSERT INTO public.letter_signatures (name, role, image_url, display_order)
VALUES 
  ('Convention Secretary', 'secretary', '/assets/signature-secretary.png', 1),
  ('Vice President', 'vice_president', '/assets/signature-vp.png', 2)
ON CONFLICT DO NOTHING;

-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
