-- Add physical folder number field to ministers table
ALTER TABLE public.ministers 
ADD COLUMN physical_folder_number text;