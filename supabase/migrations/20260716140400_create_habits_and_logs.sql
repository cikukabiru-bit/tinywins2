-- Create habits table (trackable habits linked to goals)
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    tiny_goal TEXT,
    frequency TEXT NOT NULL DEFAULT 'daily',            -- 'daily', 'weekdays', 'weekends', 'custom'
    custom_days INTEGER[] DEFAULT '{}',                 -- 0=Sun..6=Sat, used when frequency='custom'
    preferred_time TEXT,
    reminder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    growth_mode TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create habit_logs table (records check-ins for habits on specific dates)
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',           -- 'completed'
    reflection TEXT,
    mood TEXT,                                          -- 'calm','happy','tired','hopeful','overwhelmed','neutral'
    effort_level TEXT,                                  -- 'easy','okay','hard'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_habit_log_date UNIQUE (habit_id, log_date) -- a habit can only be checked in once per day
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies for Habits
-- ----------------------------------------------------

-- SELECT Policy
-- Allows authenticated users to view only their own habits.
CREATE POLICY "Users can view their own habits"
ON public.habits FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT Policy
-- Allows authenticated users to create habits under their own user account.
CREATE POLICY "Users can insert their own habits"
ON public.habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
-- Allows authenticated users to modify only their own habits.
CREATE POLICY "Users can update their own habits"
ON public.habits FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE Policy
-- Allows authenticated users to delete only their own habits.
CREATE POLICY "Users can delete their own habits"
ON public.habits FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- RLS Policies for Habit Logs
-- ----------------------------------------------------

-- SELECT Policy
-- Allows authenticated users to view only their own check-in logs.
CREATE POLICY "Users can view their own habit logs"
ON public.habit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT Policy
-- Allows authenticated users to log habit check-ins for themselves.
CREATE POLICY "Users can insert their own habit logs"
ON public.habit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
-- Allows authenticated users to update only their own check-in logs.
CREATE POLICY "Users can update their own habit logs"
ON public.habit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE Policy
-- Allows authenticated users to delete only their own check-in logs.
CREATE POLICY "Users can delete their own habit logs"
ON public.habit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
