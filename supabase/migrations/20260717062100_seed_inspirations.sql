INSERT INTO public.inspiration_items (
    id, user_id, text, author, source, type, category, tone, tags, is_user_added, is_default, is_active, is_favourite
) VALUES
-- Motivational
('0190be97-71b1-7cf6-8a71-610b78d2b961', null, 'One small step is still movement.', 'TinyWins', null, 'motivational', 'General', 'calm', '{"step", "action"}', false, true, true, false),
('0190be97-71b2-7cf6-8a71-610b78d2b962', null, 'Start where you are. Keep it small.', 'TinyWins', null, 'motivational', 'General', 'calm', '{"beginning"}', false, true, true, false),
('0190be97-71b3-7cf6-8a71-610b78d2b963', null, 'Great things are done by a series of small things brought together.', 'Vincent van Gogh', null, 'motivational', 'General', 'calm', '{"growth"}', false, true, true, false),

-- Calm
('0190be97-71b4-7cf6-8a71-610b78d2b964', null, 'Breathe first. Begin softly.', 'TinyWins', null, 'calm', 'General', 'calm', '{"breathe", "peace"}', false, true, true, false),
('0190be97-71b5-7cf6-8a71-610b78d2b965', null, 'A gentle step still counts.', 'TinyWins', null, 'calm', 'General', 'calm', '{"gentle"}', false, true, true, false),
('0190be97-71b6-7cf6-8a71-610b78d2b966', null, 'Nature does not hurry, yet everything is accomplished.', 'Lao Tzu', null, 'calm', 'General', 'calm', '{"nature", "patience"}', false, true, true, false),

-- Restart
('0190be97-71b7-7cf6-8a71-610b78d2b967', null, 'Begin again, without punishment.', 'TinyWins', null, 'restart', 'General', 'calm', '{"restart", "kindness"}', false, true, true, false),
('0190be97-71b8-7cf6-8a71-610b78d2b968', null, 'A soft reset is still progress.', 'TinyWins', null, 'restart', 'General', 'calm', '{"reset", "progress"}', false, true, true, false),
('0190be97-71b9-7cf6-8a71-610b78d2b969', null, 'Tomorrow is always new, with no mistakes in it yet.', 'L.M. Montgomery', 'Anne of Green Gables', 'restart', 'General', 'calm', '{"fresh-start"}', false, true, true, false),

-- Gratitude
('0190be97-71ba-7cf6-8a71-610b78d2b970', null, 'Name one thing that gave you strength today.', 'TinyWins', null, 'gratitude', 'General', 'calm', '{"gratitude"}', false, true, true, false),
('0190be97-71bb-7cf6-8a71-610b78d2b971', null, 'Reflect on your present blessings, of which every man has many.', 'Charles Dickens', null, 'gratitude', 'General', 'calm', '{"blessings"}', false, true, true, false),

-- Focus / Self Care
('0190be97-71bc-7cf6-8a71-610b78d2b972', null, 'Quiet the noise. Focus on this single moment.', 'TinyWins', null, 'focus', 'General', 'calm', '{"focus", "noise"}', false, true, true, false),
('0190be97-71bd-7cf6-8a71-610b78d2b973', null, 'Doing less, with full attention, is more than enough.', 'TinyWins', null, 'focus', 'General', 'calm', '{"focus", "attention"}', false, true, true, false),
('0190be97-71be-7cf6-8a71-610b78d2b974', null, 'Rest is not idleness; it is soil for tomorrow''s flowers.', 'TinyWins', null, 'self_care', 'General', 'calm', '{"rest", "self-care"}', false, true, true, false),
('0190be97-71bf-7cf6-8a71-610b78d2b975', null, 'Treat your effort with the same kindness you offer a friend.', 'TinyWins', null, 'self_care', 'General', 'calm', '{"kindness", "self-care"}', false, true, true, false),

-- Spiritual (bible_verse, saint_quote, prayer)
('0190be97-71c0-7cf6-8a71-610b78d2b976', null, 'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.', 'Jesus', 'Matthew 7:7 (KJV)', 'bible_verse', 'Spiritual', 'calm', '{"seek", "find"}', false, true, true, false),
('0190be97-71c1-7cf6-8a71-610b78d2b977', null, 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures.', 'King David', 'Psalm 23:1-2 (KJV)', 'bible_verse', 'Spiritual', 'calm', '{"comfort", "peace"}', false, true, true, false),
('0190be97-71c2-7cf6-8a71-610b78d2b978', null, 'Be not disturbed by anything; let nothing frighten thee. All things are passing; God alone is changeless.', 'St. Teresa of Avila', null, 'saint_quote', 'Spiritual', 'calm', '{"peace", "trust"}', false, true, true, false),
('0190be97-71c3-7cf6-8a71-610b78d2b979', null, 'Have patience with all things, but chiefly have patience with yourself.', 'St. Francis de Sales', null, 'saint_quote', 'Spiritual', 'calm', '{"patience"}', false, true, true, false),
('0190be97-71c4-7cf6-8a71-610b78d2b980', null, 'May I find stillness in the middle of my busy day today.', 'TinyWins Prayer Prompt', null, 'prayer', 'Spiritual', 'calm', '{"stillness"}', false, true, true, false),
('0190be97-71c5-7cf6-8a71-610b78d2b981', null, 'Help me to remember that every tiny win counts in Thy sight.', 'TinyWins Prayer Prompt', null, 'prayer', 'Spiritual', 'calm', '{"win"}', false, true, true, false)
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    author = EXCLUDED.author,
    source = EXCLUDED.source,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    tone = EXCLUDED.tone,
    tags = EXCLUDED.tags,
    is_user_added = EXCLUDED.is_user_added,
    is_default = EXCLUDED.is_default,
    is_active = EXCLUDED.is_active;
