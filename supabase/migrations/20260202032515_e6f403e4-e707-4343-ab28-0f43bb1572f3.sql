-- Fix: Restrict ministers table access to admin roles only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all ministers" ON public.ministers;
DROP POLICY IF EXISTS "Authenticated users can create ministers" ON public.ministers;
DROP POLICY IF EXISTS "Authenticated users can update ministers" ON public.ministers;
DROP POLICY IF EXISTS "Authenticated users can delete ministers" ON public.ministers;

-- Create role-based policies for ministers table
CREATE POLICY "Admins can view ministers"
ON public.ministers FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can create ministers"
ON public.ministers FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update ministers"
ON public.ministers FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can delete ministers"
ON public.ministers FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));