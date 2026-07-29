-- Fix missing foreign key relationship between public.reminders and public.habits
ALTER TABLE public.reminders
DROP CONSTRAINT IF EXISTS reminders_habit_id_fkey,
ADD CONSTRAINT reminders_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES public.habits(id) ON DELETE CASCADE;

-- Create handle_new_user trigger function to automatically create profile, consent, and security rows on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, coach_tone, onboarding_completed)
  VALUES (new.id, 'Gentle', false)
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
INSERT INTO public.profiles (user_id, coach_tone, onboarding_completed)
SELECT id, 'Gentle', false
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

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
