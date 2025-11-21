-- Update generate_minister_id function with proper security settings
CREATE OR REPLACE FUNCTION generate_minister_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate ID in format GBCC-A##### where ##### is sequential
    new_id := 'GBCC-A' || LPAD(nextval('minister_number_seq')::TEXT, 5, '0');
    
    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM ministers WHERE minister_id = new_id) INTO id_exists;
    
    -- Exit loop if ID is unique
    EXIT WHEN NOT id_exists;
  END LOOP;
  
  RETURN new_id;
END;
$$;

-- Update set_minister_id function with proper security settings
CREATE OR REPLACE FUNCTION set_minister_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.minister_id IS NULL THEN
    NEW.minister_id := generate_minister_id();
  END IF;
  RETURN NEW;
END;
$$;