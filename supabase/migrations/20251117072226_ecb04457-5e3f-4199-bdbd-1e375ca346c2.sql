-- Update RLS policies for applications table to allow phone-based access without auth

-- Drop existing policies that require auth
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own draft applications" ON applications;
DROP POLICY IF EXISTS "Users can update applications by email" ON applications;

-- Allow anyone to insert applications (for new applicants)
-- Keep the existing "Anyone can submit applications" policy

-- Allow applicants to view their applications by phone number (no auth required)
CREATE POLICY "Applicants can view their own applications by phone"
ON applications
FOR SELECT
TO anon, authenticated
USING (phone = current_setting('app.current_phone', true));

-- Allow applicants to update their draft applications by phone number
CREATE POLICY "Applicants can update their draft applications by phone"
ON applications
FOR UPDATE
TO anon, authenticated
USING (phone = current_setting('app.current_phone', true) AND status = 'draft')
WITH CHECK (phone = current_setting('app.current_phone', true) AND status = 'draft');

-- Update application_documents RLS policies to work with phone numbers

-- Drop existing user-based document policies
DROP POLICY IF EXISTS "Users can insert documents for their applications" ON application_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON application_documents;

-- Allow applicants to insert documents for their applications by phone
CREATE POLICY "Applicants can insert documents by phone"
ON application_documents
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = application_documents.application_id 
    AND applications.phone = current_setting('app.current_phone', true)
  )
);

-- Allow applicants to view their own documents by phone
CREATE POLICY "Applicants can view documents by phone"
ON application_documents
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM applications 
    WHERE applications.id = application_documents.application_id 
    AND applications.phone = current_setting('app.current_phone', true)
  )
);

-- Update storage policies to work with phone numbers

-- Drop existing user-based storage policies
DROP POLICY IF EXISTS "Users can upload their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own application documents" ON storage.objects;

-- Allow applicants to upload documents by phone
CREATE POLICY "Applicants can upload documents by phone"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications 
    WHERE phone = current_setting('app.current_phone', true)
  )
);

-- Allow applicants to view documents by phone
CREATE POLICY "Applicants can view documents by phone"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications 
    WHERE phone = current_setting('app.current_phone', true)
  )
);

-- Allow applicants to update documents by phone
CREATE POLICY "Applicants can update documents by phone"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications 
    WHERE phone = current_setting('app.current_phone', true)
  )
);

-- Allow applicants to delete documents by phone
CREATE POLICY "Applicants can delete documents by phone"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM applications 
    WHERE phone = current_setting('app.current_phone', true)
  )
);