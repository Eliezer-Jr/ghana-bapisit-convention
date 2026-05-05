CREATE OR REPLACE FUNCTION public.generate_minister_id()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'GBMC-A' || LPAD(nextval('minister_number_seq')::TEXT, 5, '0');
    SELECT EXISTS(SELECT 1 FROM ministers WHERE minister_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$function$;