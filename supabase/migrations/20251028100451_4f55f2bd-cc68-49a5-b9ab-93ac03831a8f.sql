-- Update RLS policies to allow public application submissions
DROP POLICY IF EXISTS "Users can insert their own applications" ON applications;

-- Allow anyone to insert applications (public submissions)
CREATE POLICY "Anyone can submit applications"
ON applications
FOR INSERT
WITH CHECK (true);

-- Update to allow applicants to update their draft applications by email
CREATE POLICY "Users can update applications by email"
ON applications
FOR UPDATE
USING (
  (user_id IS NULL AND email = current_setting('request.jwt.claims', true)::json->>'email')
  OR (auth.uid() = user_id AND status = 'draft')
);