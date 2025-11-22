-- Update the application-documents bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'application-documents';