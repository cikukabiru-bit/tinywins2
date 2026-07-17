-- Create user_security_settings table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_enabled BOOLEAN NOT NULL DEFAULT false,
    pin_hash TEXT,
    biometric_enabled BOOLEAN NOT NULL DEFAULT false,
    app_lock_enabled BOOLEAN NOT NULL DEFAULT false,
    lock_timeout_minutes INTEGER NOT NULL DEFAULT 5,
    failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_consents table
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    data_storage_consent BOOLEAN NOT NULL DEFAULT true,
    ai_personalization_consent BOOLEAN NOT NULL DEFAULT false,
    support_content_consent BOOLEAN NOT NULL DEFAULT false,
    habit_score_personalization_consent BOOLEAN NOT NULL DEFAULT false,
    inspiration_personalization_consent BOOLEAN NOT NULL DEFAULT false,
    consent_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create security_audit_logs table
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all three tables
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- user_security_settings Policies
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Users can view own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can insert own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can delete own security settings" ON public.user_security_settings;

-- SELECT Policy: Users can only read their own security settings row.
CREATE POLICY "Users can view own security settings"
ON public.user_security_settings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create their own security settings row.
CREATE POLICY "Users can insert own security settings"
ON public.user_security_settings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only modify their own security settings row.
CREATE POLICY "Users can update own security settings"
ON public.user_security_settings FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own security settings row.
CREATE POLICY "Users can delete own security settings"
ON public.user_security_settings FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- user_consents Policies
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can update own consents" ON public.user_consents;
DROP POLICY IF EXISTS "Users can delete own consents" ON public.user_consents;

-- SELECT Policy: Users can only read their own consent settings row.
CREATE POLICY "Users can view own consents"
ON public.user_consents FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy: Users can only create their own consent settings row.
CREATE POLICY "Users can insert own consents"
ON public.user_consents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only modify their own consent settings row.
CREATE POLICY "Users can update own consents"
ON public.user_consents FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own consent settings row.
CREATE POLICY "Users can delete own consents"
ON public.user_consents FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- security_audit_logs Policies (Read and Insert only)
-- ----------------------------------------------------

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.security_audit_logs;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.security_audit_logs;

-- SELECT Policy: Users can view their own security audit history logs.
CREATE POLICY "Users can view own audit logs"
ON public.security_audit_logs FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy: Users can insert audit entries for their own sessions.
CREATE POLICY "Users can insert own audit logs"
ON public.security_audit_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
