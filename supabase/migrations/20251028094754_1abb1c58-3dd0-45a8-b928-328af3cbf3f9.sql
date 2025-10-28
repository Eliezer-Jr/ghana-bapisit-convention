-- Create admission levels enum
CREATE TYPE public.admission_level AS ENUM ('licensing', 'recognition', 'ordination');

-- Create application status enum
CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'under_review', 'screening_scheduled', 'screening_passed', 'interview_scheduled', 'approved', 'rejected');

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  admission_level admission_level NOT NULL,
  status application_status NOT NULL DEFAULT 'draft',
  
  -- Personal Information
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  marital_status TEXT,
  spouse_name TEXT,
  
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
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application documents table
CREATE TABLE public.application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
CREATE POLICY "Users can view their own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applications"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own draft applications"
  ON public.applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update all applications"
  ON public.applications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for application_documents
CREATE POLICY "Users can view their own documents"
  ON public.application_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = application_documents.application_id 
    AND applications.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert documents for their applications"
  ON public.application_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = application_documents.application_id 
    AND applications.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all documents"
  ON public.application_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-documents', 'application-documents', false);

-- Storage policies
CREATE POLICY "Users can upload their application documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'application-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'application-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all application documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'application-documents' 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  );

-- Update trigger
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();