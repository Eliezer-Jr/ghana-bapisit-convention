-- Add new roles to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'local_officer') THEN
    ALTER TYPE app_role ADD VALUE 'local_officer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'association_head') THEN
    ALTER TYPE app_role ADD VALUE 'association_head';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'vp_office') THEN
    ALTER TYPE app_role ADD VALUE 'vp_office';
  END IF;
END $$;

-- Drop existing RLS policies that depend on status column
DROP POLICY IF EXISTS "Users can update their own draft applications" ON applications;
DROP POLICY IF EXISTS "Users can update applications by email" ON applications;

-- Create new application_status enum with all stages
CREATE TYPE application_status_new AS ENUM (
  'draft',
  'submitted',
  'local_screening',
  'association_approved',
  'vp_review',
  'interview_scheduled',
  'approved',
  'rejected'
);

-- Add temporary column with new type
ALTER TABLE applications ADD COLUMN status_new application_status_new;

-- Migrate existing data
UPDATE applications SET status_new = 
  CASE 
    WHEN status::text = 'draft' THEN 'draft'::application_status_new
    WHEN status::text = 'submitted' THEN 'submitted'::application_status_new
    WHEN status::text = 'under_review' THEN 'local_screening'::application_status_new
    WHEN status::text = 'approved' THEN 'approved'::application_status_new
    WHEN status::text = 'rejected' THEN 'rejected'::application_status_new
    ELSE 'submitted'::application_status_new
  END;

-- Drop old column and rename new one
ALTER TABLE applications DROP COLUMN status CASCADE;
ALTER TABLE applications RENAME COLUMN status_new TO status;
ALTER TABLE applications ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE applications ALTER COLUMN status SET NOT NULL;

-- Drop old enum type
DROP TYPE application_status;
ALTER TYPE application_status_new RENAME TO application_status;

-- Recreate the dropped RLS policies with updated logic
CREATE POLICY "Users can update their own draft applications"
ON applications FOR UPDATE
TO authenticated
USING ((auth.uid() = user_id) AND (status = 'draft'))
WITH CHECK ((auth.uid() = user_id) AND (status = 'draft'));

CREATE POLICY "Users can update applications by email"
ON applications FOR UPDATE
TO authenticated
USING (
  ((user_id IS NULL) AND (email = ((current_setting('request.jwt.claims'::text, true))::json ->> 'email'::text))) 
  OR ((auth.uid() = user_id) AND (status = 'draft'))
);

-- Add workflow tracking columns to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS local_reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS local_reviewed_at timestamp with time zone;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS local_notes text;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS association_reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS association_reviewed_at timestamp with time zone;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS association_notes text;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS vp_reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS vp_reviewed_at timestamp with time zone;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS vp_notes text;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS sector text CHECK (sector IN ('North', 'South', 'East', 'West'));

-- Add RLS policies for new roles
CREATE POLICY "Local officers can view applications in their area"
ON applications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'local_officer'::app_role) 
  AND status IN ('submitted', 'local_screening', 'association_approved', 'vp_review', 'interview_scheduled', 'approved', 'rejected')
);

CREATE POLICY "Local officers can update applications for screening"
ON applications FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'local_officer'::app_role) 
  AND status IN ('submitted', 'local_screening')
)
WITH CHECK (
  has_role(auth.uid(), 'local_officer'::app_role)
);

CREATE POLICY "Association heads can view applications"
ON applications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'association_head'::app_role)
  AND status IN ('local_screening', 'association_approved', 'vp_review', 'interview_scheduled', 'approved', 'rejected')
);

CREATE POLICY "Association heads can update applications for approval"
ON applications FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'association_head'::app_role)
  AND status IN ('local_screening', 'association_approved')
)
WITH CHECK (
  has_role(auth.uid(), 'association_head'::app_role)
);

CREATE POLICY "VP office can view all applications"
ON applications FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'vp_office'::app_role)
);

CREATE POLICY "VP office can update all applications"
ON applications FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'vp_office'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'vp_office'::app_role)
);