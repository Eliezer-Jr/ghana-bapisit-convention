-- =============================================================================
-- SECURITY FIX: Remove overly permissive RLS policies and secure data access
-- =============================================================================

-- -----------------------------------------------------------------------------
-- FIX 1: Applications table - Remove public access, add proper ownership checks
-- -----------------------------------------------------------------------------

-- Drop the dangerous "Anyone can view applications" policy
DROP POLICY IF EXISTS "Anyone can view applications" ON public.applications;

-- Drop the dangerous "Anyone can submit applications" policy  
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;

-- Drop the overly permissive "Applicants can update their applications" policy
DROP POLICY IF EXISTS "Applicants can update their applications" ON public.applications;

-- Add policy for applicants to view ONLY their own applications (by user_id)
CREATE POLICY "Applicants can view own applications"
ON public.applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add policy for applicants to insert their own applications (must set user_id)
CREATE POLICY "Applicants can submit own applications"
ON public.applications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add policy for applicants to update ONLY their own draft/submitted applications
CREATE POLICY "Applicants can update own applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('draft', 'submitted'))
WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'submitted'));

-- -----------------------------------------------------------------------------
-- FIX 2: Application documents - Remove anonymous access, require authentication
-- -----------------------------------------------------------------------------

-- Drop dangerous policies that allow anonymous access
DROP POLICY IF EXISTS "Anyone can insert application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Anyone can delete application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Anyone can view application documents" ON public.application_documents;

-- Add policy for authenticated users to insert documents for their own applications
CREATE POLICY "Users can insert documents for own applications"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_id AND a.user_id = auth.uid()
  )
);

-- Add policy for authenticated users to delete documents from their own applications (draft/submitted only)
CREATE POLICY "Users can delete documents from own applications"
ON public.application_documents
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_id 
    AND a.user_id = auth.uid()
    AND a.status IN ('draft', 'submitted')
  )
);

-- Add policy for authenticated users to view their own documents
CREATE POLICY "Users can view documents for own applications"
ON public.application_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.id = application_id AND a.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
  OR has_role(auth.uid(), 'admission_reviewer'::app_role)
  OR has_role(auth.uid(), 'local_officer'::app_role)
  OR has_role(auth.uid(), 'association_head'::app_role)
  OR has_role(auth.uid(), 'vp_office'::app_role)
);

-- -----------------------------------------------------------------------------
-- FIX 3: Storage bucket - Make application-documents private
-- -----------------------------------------------------------------------------

-- Make the application-documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'application-documents';

-- Drop existing overly permissive storage policies
DROP POLICY IF EXISTS "Anyone can upload application documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view application documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete application documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create secure storage policies for application-documents bucket
-- Users can upload to their own application folder
CREATE POLICY "Users can upload to own application folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.applications WHERE user_id = auth.uid()
  )
);

-- Users can view files from their own applications OR reviewers can view all
CREATE POLICY "Users and reviewers can view application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.applications WHERE user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'admission_reviewer'::app_role)
    OR has_role(auth.uid(), 'local_officer'::app_role)
    OR has_role(auth.uid(), 'association_head'::app_role)
    OR has_role(auth.uid(), 'vp_office'::app_role)
  )
);

-- Users can delete files from their own draft/submitted applications
CREATE POLICY "Users can delete from own application folder"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.applications 
    WHERE user_id = auth.uid() AND status IN ('draft', 'submitted')
  )
);