-- Fix profiles table missing theme column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'sunset';

-- Fix missing foreign key relationship between public.reminders and public.habits
ALTER TABLE public.reminders
DROP CONSTRAINT IF EXISTS reminders_habit_id_fkey,
ADD CONSTRAINT reminders_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;

-- Create handle_new_user trigger function to automatically create profile, consent, and security rows on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, coach_tone, onboarding_completed, theme)
  VALUES (new.id, 'Gentle', false, 'sunset')
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_consents
  INSERT INTO public.user_consents (
    user_id, 
    data_storage_consent, 
    ai_personalization_consent, 
    support_content_consent, 
    habit_score_personalization_consent, 
    inspiration_personalization_consent, 
    journal_ai_consent, 
    consent_version
  )
  VALUES (
    new.id, 
    true, 
    false, 
    false, 
    false, 
    false, 
    false, 
    '1.0'
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert into user_security_settings
  INSERT INTO public.user_security_settings (
    user_id, 
    pin_enabled, 
    biometric_enabled, 
    app_lock_enabled, 
    lock_timeout_minutes, 
    failed_pin_attempts, 
    two_factor_enabled
  )
  VALUES (
    new.id, 
    false, 
    false, 
    false, 
    5, 
    0, 
    false
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind handle_new_user trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- One-time backfill SQL for any existing auth.users missing profiles / user_consents / user_security_settings
INSERT INTO public.profiles (user_id, coach_tone, onboarding_completed, theme)
SELECT id, 'Gentle', false, 'sunset'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Make sure existing profiles have sunset theme if they were null
UPDATE public.profiles
SET theme = 'sunset'
WHERE theme IS NULL;

INSERT INTO public.user_consents (
  user_id, 
  data_storage_consent, 
  ai_personalization_consent, 
  support_content_consent, 
  habit_score_personalization_consent, 
  inspiration_personalization_consent, 
  journal_ai_consent, 
  consent_version
)
SELECT 
  id, 
  true, 
  false, 
  false, 
  false, 
  false, 
  false, 
  '1.0'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_security_settings (
  user_id, 
  pin_enabled, 
  biometric_enabled, 
  app_lock_enabled, 
  lock_timeout_minutes, 
  failed_pin_attempts, 
  two_factor_enabled
)
SELECT 
  id, 
  false, 
  false, 
  false, 
  5, 
  0, 
  false
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Ensure Row Level Security (RLS) is enabled on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- profiles Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- user_consents Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own consents" ON public.user_consents;
CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consents" ON public.user_consents;
CREATE POLICY "Users can insert own consents" ON public.user_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own consents" ON public.user_consents;
CREATE POLICY "Users can update own consents" ON public.user_consents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own consents" ON public.user_consents;
CREATE POLICY "Users can delete own consents" ON public.user_consents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- user_security_settings Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view own security settings" ON public.user_security_settings;
CREATE POLICY "Users can view own security settings" ON public.user_security_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security settings" ON public.user_security_settings;
CREATE POLICY "Users can insert own security settings" ON public.user_security_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security settings" ON public.user_security_settings;
CREATE POLICY "Users can update own security settings" ON public.user_security_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own security settings" ON public.user_security_settings;
CREATE POLICY "Users can delete own security settings" ON public.user_security_settings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- reminders Policies
-- ----------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
CREATE POLICY "Users can view their own reminders" ON public.reminders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.reminders;
CREATE POLICY "Users can insert their own reminders" ON public.reminders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
CREATE POLICY "Users can update their own reminders" ON public.reminders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;
CREATE POLICY "Users can delete their own reminders" ON public.reminders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
