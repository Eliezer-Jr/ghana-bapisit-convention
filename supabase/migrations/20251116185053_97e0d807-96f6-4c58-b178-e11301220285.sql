-- Add photo_url column to applications table for applicant photos
ALTER TABLE public.applications
ADD COLUMN photo_url TEXT;

COMMENT ON COLUMN public.applications.photo_url IS 'URL to applicant photo stored in Supabase storage';