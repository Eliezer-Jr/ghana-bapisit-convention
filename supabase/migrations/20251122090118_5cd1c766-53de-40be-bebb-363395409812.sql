-- Drop existing policy
DROP POLICY IF EXISTS "Applicants can update their applications" ON public.applications;

-- Create new policy that allows updates for applications in review
CREATE POLICY "Applicants can update their applications" ON public.applications
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