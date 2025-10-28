-- Add date of birth column to minister_children table
ALTER TABLE public.minister_children 
ADD COLUMN IF NOT EXISTS date_of_birth date;