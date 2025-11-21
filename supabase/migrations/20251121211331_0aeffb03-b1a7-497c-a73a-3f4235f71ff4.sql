-- Add audit trail columns to ministers table
ALTER TABLE public.ministers
ADD COLUMN created_by uuid REFERENCES auth.users(id),
ADD COLUMN updated_by uuid REFERENCES auth.users(id);

-- Create trigger function to automatically set created_by and updated_by
CREATE OR REPLACE FUNCTION public.handle_minister_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On insert, set created_by
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  END IF;
  
  -- On update, set updated_by
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit trail
DROP TRIGGER IF EXISTS minister_audit_trigger ON public.ministers;
CREATE TRIGGER minister_audit_trigger
  BEFORE INSERT OR UPDATE ON public.ministers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_minister_audit();

-- Create a view to get minister audit information with user details
CREATE OR REPLACE VIEW public.minister_audit_info AS
SELECT 
  m.id,
  m.minister_id,
  m.full_name,
  m.created_at,
  m.updated_at,
  m.created_by,
  m.updated_by,
  pc.full_name as created_by_name,
  pc.email as created_by_email,
  pu.full_name as updated_by_name,
  pu.email as updated_by_email
FROM public.ministers m
LEFT JOIN public.profiles pc ON m.created_by = pc.id
LEFT JOIN public.profiles pu ON m.updated_by = pu.id;

-- Grant access to authenticated users
GRANT SELECT ON public.minister_audit_info TO authenticated;