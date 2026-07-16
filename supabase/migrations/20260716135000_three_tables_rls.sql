-- Drop existing tables to recreate with the split goals schema
DROP TABLE IF EXISTS public.habit_scores;
DROP TABLE IF EXISTS public.goals;
DROP TABLE IF EXISTS public.profiles;

-- Create profiles table (about the user, one row per user)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    consistency_blocker TEXT,
    coach_tone TEXT,
    support_style TEXT[] DEFAULT '{}',
    inspiration_preferences TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create goals table (one user can have many goals)
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    area TEXT NOT NULL,
    available_time TEXT,
    preferred_time TEXT,
    growth_preference TEXT,
    why TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create habit_scores table (scored existing habit, tied to a goal)
CREATE TABLE public.habit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    habit_name TEXT NOT NULL,
    category TEXT,
    score INTEGER,
    note TEXT,
    current_frequency TEXT,
    desired_improvement TEXT,
    difficulty_level TEXT,
    emotional_feeling TEXT,
    priority TEXT,
    converted_to_habit BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_scores ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies for Profiles
-- ----------------------------------------------------

-- SELECT Policy
-- Allows authenticated users to select their own profile record.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT Policy
-- Allows authenticated users to insert their own profile record (ensuring user_id matches auth.uid()).
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
-- Allows authenticated users to update their own profile record (ensuring user_id matches auth.uid()).
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE Policy
-- Allows authenticated users to delete their own profile record.
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- RLS Policies for Goals
-- ----------------------------------------------------

-- SELECT Policy
-- Allows authenticated users to view their own goals.
CREATE POLICY "Users can view their own goals"
ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT Policy
-- Allows authenticated users to insert new goals for themselves.
CREATE POLICY "Users can insert their own goals"
ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
-- Allows authenticated users to update their own goals.
CREATE POLICY "Users can update their own goals"
ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE Policy
-- Allows authenticated users to delete their own goals.
CREATE POLICY "Users can delete their own goals"
ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------
-- RLS Policies for Habit Scores
-- ----------------------------------------------------

-- SELECT Policy
-- Allows authenticated users to view their own habit score records.
CREATE POLICY "Users can view their own habit scores"
ON public.habit_scores FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- INSERT Policy
-- Allows authenticated users to create new habit score records for themselves.
CREATE POLICY "Users can insert their own habit scores"
ON public.habit_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy
-- Allows authenticated users to modify their own habit score records.
CREATE POLICY "Users can update their own habit scores"
ON public.habit_scores FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE Policy
-- Allows authenticated users to delete their own habit score records.
CREATE POLICY "Users can delete their own habit scores"
ON public.habit_scores FOR DELETE TO authenticated USING (auth.uid() = user_id);
