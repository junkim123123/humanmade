-- Migration to add credit_topup_requests table for manual credit requests
-- Created on 2026-01-16

CREATE TABLE IF NOT EXISTS public.credit_topup_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  credits_requested integer NOT NULL DEFAULT 1 CHECK (credits_requested > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  source text DEFAULT 'billing_page',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_topup_requests_user_id_idx ON public.credit_topup_requests (user_id);
CREATE INDEX IF NOT EXISTS credit_topup_requests_status_idx ON public.credit_topup_requests (status);

ALTER TABLE public.credit_topup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own topup requests" ON public.credit_topup_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own topup requests" ON public.credit_topup_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage topup requests" ON public.credit_topup_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP TRIGGER IF EXISTS credit_topup_requests_updated_at ON public.credit_topup_requests;
CREATE TRIGGER credit_topup_requests_updated_at
  BEFORE UPDATE ON public.credit_topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.credit_topup_requests IS 'Manual credit top-up requests from billing page';
