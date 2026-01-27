-- Minister self-service intake (staging + approval)

-- 1) Sessions
CREATE TABLE IF NOT EXISTS public.intake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  manually_closed boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.intake_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view sessions (so invite page can show time window)
CREATE POLICY "Authenticated users can view intake sessions"
ON public.intake_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins/super admins can manage sessions
CREATE POLICY "Admins can manage intake sessions"
ON public.intake_sessions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- 2) Invites
CREATE TABLE IF NOT EXISTS public.intake_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.intake_sessions(id) ON DELETE CASCADE,
  minister_full_name text,
  minister_phone text,
  minister_email text,
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intake_invites_session_id ON public.intake_invites(session_id);
CREATE INDEX IF NOT EXISTS idx_intake_invites_phone ON public.intake_invites(minister_phone);

ALTER TABLE public.intake_invites ENABLE ROW LEVEL SECURITY;

-- Admins can manage invites
CREATE POLICY "Admins can manage intake invites"
ON public.intake_invites
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Authenticated users can read their invite by id (optionally phone-matched)
CREATE POLICY "Authenticated users can view their intake invite"
ON public.intake_invites
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND revoked = false
  AND (expires_at IS NULL OR expires_at > now())
  AND (
    minister_phone IS NULL
    OR minister_phone = (SELECT p.phone_number FROM public.profiles p WHERE p.id = auth.uid())
    OR (SELECT p.phone_number FROM public.profiles p WHERE p.id = auth.uid()) IS NULL
  )
);

-- 3) Submissions (staging)
CREATE TABLE IF NOT EXISTS public.intake_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.intake_sessions(id) ON DELETE CASCADE,
  invite_id uuid NOT NULL REFERENCES public.intake_invites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(invite_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_session_status ON public.intake_submissions(session_id, status);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_user_id ON public.intake_submissions(user_id);

ALTER TABLE public.intake_submissions ENABLE ROW LEVEL SECURITY;

-- Owners can view their submissions
CREATE POLICY "Users can view their own intake submissions"
ON public.intake_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Owners can insert their submission when invite/session is open
CREATE POLICY "Users can create their own intake submissions"
ON public.intake_submissions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.intake_invites i
    JOIN public.intake_sessions s ON s.id = i.session_id
    WHERE i.id = invite_id
      AND i.revoked = false
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND s.manually_closed = false
      AND now() BETWEEN s.starts_at AND s.ends_at
  )
);

-- Owners can update drafts/submitted (no approved/rejected changes)
CREATE POLICY "Users can update their own intake submissions"
ON public.intake_submissions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('draft','submitted')
  AND EXISTS (
    SELECT 1
    FROM public.intake_invites i
    JOIN public.intake_sessions s ON s.id = i.session_id
    WHERE i.id = invite_id
      AND i.revoked = false
      AND (i.expires_at IS NULL OR i.expires_at > now())
      AND s.manually_closed = false
      AND now() BETWEEN s.starts_at AND s.ends_at
  )
);

-- Admins can view and update all submissions
CREATE POLICY "Admins can view all intake submissions"
ON public.intake_submissions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can update intake submissions"
ON public.intake_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Timestamp triggers
DROP TRIGGER IF EXISTS update_intake_sessions_updated_at ON public.intake_sessions;
CREATE TRIGGER update_intake_sessions_updated_at
BEFORE UPDATE ON public.intake_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_intake_submissions_updated_at ON public.intake_submissions;
CREATE TRIGGER update_intake_submissions_updated_at
BEFORE UPDATE ON public.intake_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
