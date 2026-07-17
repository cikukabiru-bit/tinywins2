-- Create reminders table for in-app and browser notifications
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
    reminder_type TEXT, -- daily, preferred_time, weekly_review, etc.
    reminder_time TIME,
    reminder_days INTEGER[], -- 0=Sun, 1=Mon, ..., 6=Sat
    message TEXT,
    include_inspiration BOOLEAN NOT NULL DEFAULT false,
    include_support_link BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies for Reminders
-- ----------------------------------------------------

-- Drop existing policies if they exist to prevent duplicates
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.reminders;

-- SELECT Policy: Allows authenticated users to view only their own reminder records.
CREATE POLICY "Users can view their own reminders"
ON public.reminders FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy: Allows authenticated users to create reminder records for themselves.
CREATE POLICY "Users can insert their own reminders"
ON public.reminders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Allows authenticated users to modify their own reminder records.
CREATE POLICY "Users can update their own reminders"
ON public.reminders FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Allows authenticated users to delete their own reminder records.
CREATE POLICY "Users can delete their own reminders"
ON public.reminders FOR DELETE TO authenticated
USING (auth.uid() = user_id);
