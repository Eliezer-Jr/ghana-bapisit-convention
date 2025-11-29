-- Fix: Change minister_audit_info view from SECURITY DEFINER to SECURITY INVOKER
-- This ensures RLS policies of the querying user are enforced, not the view creator

-- Drop the existing view
DROP VIEW IF EXISTS public.minister_audit_info;

-- Recreate the view with SECURITY INVOKER (which is the default and safe option)
CREATE VIEW public.minister_audit_info
WITH (security_invoker = on)
AS
SELECT 
    m.id,
    m.minister_id,
    m.full_name,
    m.created_at,
    m.updated_at,
    m.created_by,
    m.updated_by,
    pc.full_name AS created_by_name,
    pc.email AS created_by_email,
    pu.full_name AS updated_by_name,
    pu.email AS updated_by_email
FROM ministers m
LEFT JOIN profiles pc ON m.created_by = pc.id
LEFT JOIN profiles pu ON m.updated_by = pu.id;