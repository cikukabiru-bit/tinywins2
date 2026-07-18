-- Create journal_entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    title TEXT,
    body TEXT NOT NULL,
    mood TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add journal_ai_consent to user_consents
ALTER TABLE public.user_consents ADD COLUMN IF NOT EXISTS journal_ai_consent BOOLEAN NOT NULL DEFAULT FALSE;

-- Add evening_reflection_hour to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS evening_reflection_hour INTEGER NOT NULL DEFAULT 20;

-- Enable Row Level Security (RLS)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies for Journal Entries
-- ----------------------------------------------------

-- Drop existing policies if they exist to prevent duplicates
DROP POLICY IF EXISTS "Users can view their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can insert their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.journal_entries;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.journal_entries;

-- SELECT Policy: Allows authenticated users to view only their own journal entries.
CREATE POLICY "Users can view their own journal entries"
ON public.journal_entries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- INSERT Policy: Allows authenticated users to create journal entries for themselves.
CREATE POLICY "Users can insert their own journal entries"
ON public.journal_entries FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Allows authenticated users to modify only their own journal entries.
CREATE POLICY "Users can update their own journal entries"
ON public.journal_entries FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Allows authenticated users to delete only their own journal entries.
CREATE POLICY "Users can delete their own journal entries"
ON public.journal_entries FOR DELETE TO authenticated
USING (auth.uid() = user_id);
