-- Create function to send SMS notification when application status changes
CREATE OR REPLACE FUNCTION notify_application_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Only send notification if status has changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Get Supabase URL and service key from vault or env
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_role_key', true);
    
    -- Call the edge function asynchronously using pg_net if available
    -- For now, we'll use a simpler approach with net extension if available
    -- Note: This is a placeholder - actual implementation may vary based on available extensions
    
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/notify-status-change',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object(
        'applicationId', NEW.id,
        'status', NEW.status,
        'recipientPhone', NEW.phone,
        'recipientName', NEW.full_name
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to send SMS notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for application status changes
DROP TRIGGER IF EXISTS trigger_notify_application_status ON applications;
CREATE TRIGGER trigger_notify_application_status
  AFTER UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_application_status_change();