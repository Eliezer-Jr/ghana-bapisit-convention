-- Drop existing storage policies for application-documents bucket if they exist
DROP POLICY IF EXISTS "Users can upload their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own application documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all application documents" ON storage.objects;

-- Create storage policies for application-documents bucket

-- Allow authenticated users to upload documents to their application folders
CREATE POLICY "Users can upload their own application documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM applications 
    WHERE user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow authenticated users to view their own application documents
CREATE POLICY "Users can view their own application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM applications 
    WHERE user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow authenticated users to update their own application documents
CREATE POLICY "Users can update their own application documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM applications 
    WHERE user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow authenticated users to delete their own application documents
CREATE POLICY "Users can delete their own application documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-documents' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM applications 
    WHERE user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow admins to view all application documents
CREATE POLICY "Admins can view all application documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'application-documents' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);