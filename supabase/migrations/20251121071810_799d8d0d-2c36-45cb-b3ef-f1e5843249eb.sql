-- Add unique minister ID column
ALTER TABLE public.ministers 
ADD COLUMN minister_id TEXT UNIQUE;

-- Create sequence for minister numbers
CREATE SEQUENCE IF NOT EXISTS minister_number_seq START WITH 10000;

-- Create function to generate unique minister ID
CREATE OR REPLACE FUNCTION generate_minister_id()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Create trigger to auto-generate minister ID on insert
CREATE OR REPLACE FUNCTION set_minister_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.minister_id IS NULL THEN
    NEW.minister_id := generate_minister_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_minister_id
BEFORE INSERT ON public.ministers
FOR EACH ROW
EXECUTE FUNCTION set_minister_id();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ministers_minister_id ON public.ministers(minister_id);