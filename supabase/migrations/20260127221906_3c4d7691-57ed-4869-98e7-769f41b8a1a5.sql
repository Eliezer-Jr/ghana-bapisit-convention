-- Create error_logs table for centralized logging
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('client', 'server')),
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}',
  user_id UUID,
  user_agent TEXT,
  url TEXT,
  function_name TEXT,
  severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to insert logs (using service role)
CREATE POLICY "Service role can insert logs"
ON public.error_logs FOR INSERT
WITH CHECK (true);

-- Allow super admins to view all logs
CREATE POLICY "Super admins can view all error logs"
ON public.error_logs FOR SELECT
USING (has_role(auth.uid(), 'super_admin'));

-- Allow admins to view logs
CREATE POLICY "Admins can view error logs"
ON public.error_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_source ON public.error_logs(source);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);