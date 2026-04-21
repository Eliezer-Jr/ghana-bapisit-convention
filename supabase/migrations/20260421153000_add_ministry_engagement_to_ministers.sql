ALTER TABLE public.ministers
ADD COLUMN IF NOT EXISTS ministry_engagement text
CHECK (ministry_engagement IN ('full_time', 'part_time'));
