-- Allow anyone to submit their draft applications (change status from draft to submitted)
DROP POLICY IF EXISTS "Anyone can update draft applications" ON applications;

CREATE POLICY "Anyone can update their applications"
ON applications
FOR UPDATE
USING (phone = phone)
WITH CHECK (
  -- Allow updates if staying in draft status
  (status = 'draft'::application_status) OR
  -- Allow changing from draft to submitted
  (status = 'submitted'::application_status AND 
   (SELECT status FROM applications WHERE id = applications.id) = 'draft'::application_status)
);