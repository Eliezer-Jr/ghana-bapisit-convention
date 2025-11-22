-- Create storage policies for application documents
-- Allow authenticated users with appropriate roles to view application documents
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

-- Allow authenticated users with appropriate roles to upload application documents
CREATE POLICY "Applicants and admins can upload application documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'application-documents'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'admission_reviewer', 'local_officer', 'association_head', 'vp_office', 'user')
    )
  )
);

-- Allow authenticated users with appropriate roles to update application documents
CREATE POLICY "Admins can update application documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'admission_reviewer')
    )
  )
);

-- Allow authenticated users with appropriate roles to delete application documents
CREATE POLICY "Admins can delete application documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'application-documents'
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'admin', 'admission_reviewer')
    )
  )
);