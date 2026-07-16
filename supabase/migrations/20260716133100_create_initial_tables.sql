-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    primary_goal TEXT,
    available_time TEXT,
    consistency_blocker TEXT,
    preferred_time TEXT,
    support_style TEXT,
    growth_preference TEXT,
    coach_tone TEXT,
    content_preferences TEXT[] DEFAULT '{}',
    inspiration_preferences TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- 1. Users can select their own profile row.
--    This policy allows authenticated users to read records from public.profiles only if the user_id matches their own auth.uid().
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can insert their own profile row.
--    This policy allows authenticated users to insert new profile records, ensuring that the user_id inserted matches their auth.uid().
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own profile row.
--    This policy allows authenticated users to modify their existing profile record (using the auth.uid() = user_id restriction for both identifying the row and validating updates).
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own profile row.
--    This policy allows authenticated users to delete their profile record if the user_id matches their auth.uid().
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- Create habit_scores table
CREATE TABLE IF NOT EXISTS public.habit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable Row Level Security (RLS) for habit_scores
ALTER TABLE public.habit_scores ENABLE ROW LEVEL SECURITY;

-- Habit Scores Policies
-- 1. Users can select their own habit scores.
--    This policy allows authenticated users to read records from public.habit_scores only if the user_id matches their own auth.uid().
CREATE POLICY "Users can view their own habit scores"
ON public.habit_scores
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can insert their own habit scores.
--    This policy allows authenticated users to insert new habit score records, ensuring that the user_id inserted matches their auth.uid().
CREATE POLICY "Users can insert their own habit scores"
ON public.habit_scores
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own habit scores.
--    This policy allows authenticated users to modify their existing habit score records, verifying that the user_id matches their auth.uid().
CREATE POLICY "Users can update their own habit scores"
ON public.habit_scores
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete their own habit scores.
--    This policy allows authenticated users to delete their habit score records if the user_id matches their auth.uid().
CREATE POLICY "Users can delete their own habit scores"
ON public.habit_scores
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
