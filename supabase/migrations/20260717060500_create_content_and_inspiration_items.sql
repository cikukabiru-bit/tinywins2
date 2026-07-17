-- Create content_items table for support links & external resources
CREATE TABLE public.content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null for default seed items
    title TEXT NOT NULL,
    category TEXT,
    type TEXT, -- e.g. video, music, article, podcast, prayer
    url TEXT NOT NULL,
    platform TEXT,
    short_description TEXT,
    tags TEXT[] DEFAULT '{}',
    estimated_duration TEXT,
    mood TEXT,
    is_user_added BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_favourite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inspiration_items table for short encouragements
CREATE TABLE public.inspiration_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Null for default seed items
    text TEXT NOT NULL,
    author TEXT,
    source TEXT,
    type TEXT, -- motivational, calm, restart, gratitude, prayer, etc.
    category TEXT,
    tone TEXT,
    tags TEXT[] DEFAULT '{}',
    is_user_added BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_favourite BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- RLS Policies for Content Items
-- ----------------------------------------------------

-- SELECT Policy: Allows authenticated users to select their own content rows OR shared default seed items.
CREATE POLICY "Users can view their own content or default content"
ON public.content_items FOR SELECT TO authenticated
USING (auth.uid() = user_id OR is_default = true);

-- INSERT Policy: Allows authenticated users to create content items belonging to themselves.
CREATE POLICY "Users can insert their own content"
ON public.content_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Allows authenticated users to update their own content items.
CREATE POLICY "Users can update their own content"
ON public.content_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Allows authenticated users to delete their own content items.
CREATE POLICY "Users can delete their own content"
ON public.content_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);


-- ----------------------------------------------------
-- RLS Policies for Inspiration Items
-- ----------------------------------------------------

-- SELECT Policy: Allows authenticated users to view their own inspiration rows OR shared default seed items.
CREATE POLICY "Users can view their own inspirations or default ones"
ON public.inspiration_items FOR SELECT TO authenticated
USING (auth.uid() = user_id OR is_default = true);

-- INSERT Policy: Allows authenticated users to create inspiration items belonging to themselves.
CREATE POLICY "Users can insert their own inspirations"
ON public.inspiration_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Allows authenticated users to update their own inspiration items.
CREATE POLICY "Users can update their own inspirations"
ON public.inspiration_items FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Allows authenticated users to delete their own inspiration items.
CREATE POLICY "Users can delete their own inspirations"
ON public.inspiration_items FOR DELETE TO authenticated
USING (auth.uid() = user_id);
