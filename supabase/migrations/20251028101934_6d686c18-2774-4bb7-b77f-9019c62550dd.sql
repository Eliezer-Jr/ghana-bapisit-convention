-- Make user_id nullable for public applications
ALTER TABLE applications 
ALTER COLUMN user_id DROP NOT NULL;

-- Set default status to 'submitted' for applications
ALTER TABLE applications 
ALTER COLUMN status SET DEFAULT 'submitted';