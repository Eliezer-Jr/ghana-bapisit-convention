-- Drop the incorrect policy
DROP POLICY IF EXISTS "Anyone can update their applications" ON applications;

-- Create proper policy that allows applicants to update their own applications
CREATE POLICY "Applicants can update their applications"
ON applications
FOR UPDATE
USING (true) -- Allow reading any application for update
WITH CHECK (
  -- Allow staying in draft
  status = 'draft'::application_status 
  OR 
  -- Allow submitting (changing from draft to submitted)
  status = 'submitted'::application_status
);