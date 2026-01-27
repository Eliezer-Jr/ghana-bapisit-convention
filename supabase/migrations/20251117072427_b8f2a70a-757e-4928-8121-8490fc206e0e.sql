-- Simplify RLS policies to not use current_setting
-- Instead, we'll pass phone number directly in queries

-- Drop the complex policies
DROP POLICY IF EXISTS "Applicants can view their own applications by phone" ON applications;
DROP POLICY IF EXISTS "Applicants can update their draft applications by phone" ON applications;
DROP POLICY IF EXISTS "Applicants can insert documents by phone" ON application_documents;
DROP POLICY IF EXISTS "Applicants can view documents by phone" ON application_documents;
DROP POLICY IF EXISTS "Applicants can upload documents by phone" ON storage.objects;
DROP POLICY IF EXISTS "Applicants can view documents by phone" ON storage.objects;
DROP POLICY IF EXISTS "Applicants can update documents by phone" ON storage.objects;
DROP POLICY IF EXISTS "Applicants can delete documents by phone" ON storage.objects;

-- Allow unauthenticated (anon) access for applicants
-- Applications table
CREATE POLICY "Anyone can view applications"
ON applications
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update draft applications"
ON applications
FOR UPDATE
TO anon, authenticated
USING (status = 'draft')
WITH CHECK (status = 'draft');

-- Application documents table
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

-- Storage policies for application documents
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