-- Add RLS policies for admission reviewers to view and update applications
CREATE POLICY "Admission reviewers can view all applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admission_reviewer'::app_role)
);

CREATE POLICY "Admission reviewers can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admission_reviewer'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admission_reviewer'::app_role)
);

-- Allow admission reviewers to view application documents
CREATE POLICY "Admission reviewers can view application documents"
ON public.application_documents
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admission_reviewer'::app_role)
);