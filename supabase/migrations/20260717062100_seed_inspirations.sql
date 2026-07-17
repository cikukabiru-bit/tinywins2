DELETE FROM public.inspiration_items WHERE is_default = true AND user_id IS NULL;

INSERT INTO public.inspiration_items (
    id, user_id, text, author, source, type, category, tone, tags, is_user_added, is_default, is_active, is_favourite
) VALUES
-- Bible Verses (type = 'bible_verse')
('0190be97-71c0-7cf6-8a71-610b78d2b976', null, 'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.', null, 'Matthew 7:7 (KJV)', 'bible_verse', 'Spiritual', 'calm', '{"seek", "find"}', false, true, true, false),
('0190be97-71c1-7cf6-8a71-610b78d2b977', null, 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures.', null, 'Psalm 23:1-2 (KJV)', 'bible_verse', 'Spiritual', 'calm', '{"comfort", "peace"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b901', null, 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.', null, 'Isaiah 40:31 (KJV)', 'bible_verse', 'Spiritual', 'calm', '{"strength", "wait"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b902', null, 'I can do all things through Christ, who strengthens me.', null, 'Philippians 4:13 (WEB)', 'bible_verse', 'Spiritual', 'calm', '{"strength", "faith"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b903', null, 'But the path of the righteous is like the dawning light, that shines more and more unto the perfect day.', null, 'Proverbs 4:18 (WEB)', 'bible_verse', 'Spiritual', 'calm', '{"light", "journey"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b904', null, 'Your word is a lamp to my feet, and a light for my path.', null, 'Psalm 119:105 (WEB)', 'bible_verse', 'Spiritual', 'calm', '{"guidance", "path"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b905', null, 'Rejoicing in hope; enduring in troubles; continuing steadfastly in prayer.', null, 'Romans 12:12 (WEB)', 'bible_verse', 'Spiritual', 'calm', '{"hope", "patience"}', false, true, true, false),

-- Saint Quotes (type = 'saint_quote')
('0190be97-71c2-7cf6-8a71-610b78d2b978', null, 'Be not disturbed by anything; let nothing frighten thee. All things are passing; God alone is changeless.', 'St. Teresa of Avila', null, 'saint_quote', 'Spiritual', 'calm', '{"peace", "trust"}', false, true, true, false),
('0190be97-71c3-7cf6-8a71-610b78d2b979', null, 'Have patience with all things, but chiefly have patience with yourself.', 'St. Francis de Sales', null, 'saint_quote', 'Spiritual', 'calm', '{"patience"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b906', null, 'Start by doing what''s necessary; then do what''s possible; and suddenly you are doing the impossible.', 'St. Francis of Assisi', null, 'saint_quote', 'Spiritual', 'calm', '{"action", "impossible"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b907', null, 'Trust God that you are exactly where you are meant to be.', 'St. Thérèse of Lisieux', null, 'saint_quote', 'Spiritual', 'calm', '{"trust", "place"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b908', null, 'Pray as though everything depended on God. Work as though everything depended on you.', 'St. Augustine', null, 'saint_quote', 'Spiritual', 'calm', '{"work", "prayer"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b909', null, 'The truth is not ours to possess, but to serve.', 'St. Thomas Aquinas', null, 'saint_quote', 'Spiritual', 'calm', '{"truth"}', false, true, true, false),

-- Prayer Prompts (type = 'prayer')
('0190be97-71c4-7cf6-8a71-610b78d2b980', null, 'May I find stillness in the middle of my busy day today.', 'TinyWins Prayer Prompt', null, 'prayer', 'Spiritual', 'calm', '{"stillness"}', false, true, true, false),
('0190be97-71c5-7cf6-8a71-610b78d2b981', null, 'Help me to remember that every tiny win counts in Thy sight.', 'TinyWins Prayer Prompt', null, 'prayer', 'Spiritual', 'calm', '{"win"}', false, true, true, false),

-- Motivational (type = 'motivational')
('0190be97-71b1-7cf6-8a71-610b78d2b961', null, 'One small step is still movement.', 'TinyWins', null, 'motivational', 'General', 'calm', '{"step", "action"}', false, true, true, false),
('0190be97-71b2-7cf6-8a71-610b78d2b962', null, 'Start where you are. Keep it small.', 'TinyWins', null, 'motivational', 'General', 'calm', '{"beginning"}', false, true, true, false),
('0190be97-71b3-7cf6-8a71-610b78d2b963', null, 'Great things are done by a series of small things brought together.', 'Vincent van Gogh', null, 'motivational', 'General', 'calm', '{"growth"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b910', null, 'The secret of getting ahead is getting started.', 'Mark Twain', null, 'motivational', 'General', 'calm', '{"start"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b911', null, 'The primary indication of a well-ordered mind is a man''s ability to remain in one place and linger in his own company.', 'Seneca', null, 'motivational', 'General', 'calm', '{"mind", "stillness"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b912', null, 'Concentrate every minute on doing what''s in front of you with precise and genuine seriousness, tenderly, willingly, with justice.', 'Marcus Aurelius', null, 'motivational', 'General', 'calm', '{"focus", "present"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b913', null, 'He who is brave is free.', 'Seneca', null, 'motivational', 'General', 'calm', '{"courage"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b914', null, 'A journey of a thousand miles begins with a single step.', 'Lao Tzu', null, 'motivational', 'General', 'calm', '{"step", "journey"}', false, true, true, false),

-- Calm (type = 'calm')
('0190be97-71b4-7cf6-8a71-610b78d2b964', null, 'Breathe first. Begin softly.', 'TinyWins', null, 'calm', 'General', 'calm', '{"breathe", "peace"}', false, true, true, false),
('0190be97-71b5-7cf6-8a71-610b78d2b965', null, 'A gentle step still counts.', 'TinyWins', null, 'calm', 'General', 'calm', '{"gentle"}', false, true, true, false),
('0190be97-71b6-7cf6-8a71-610b78d2b966', null, 'Nature does not hurry, yet everything is accomplished.', 'Lao Tzu', null, 'calm', 'General', 'calm', '{"nature", "patience"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b915', null, 'Adopt the pace of nature: her secret is patience.', 'Ralph Waldo Emerson', null, 'calm', 'General', 'calm', '{"nature", "patience"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b916', null, 'Nothing is more useful than peace of mind.', 'Seneca', null, 'calm', 'General', 'calm', '{"peace"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b917', null, 'The greatest step towards a calm life is to learn to limit our desires.', 'Epictetus', null, 'calm', 'General', 'calm', '{"calm", "desires"}', false, true, true, false),

-- Restart (type = 'restart' - tender original app lines only)
('0190be97-71b7-7cf6-8a71-610b78d2b967', null, 'Begin again, without punishment.', 'TinyWins', null, 'restart', 'General', 'calm', '{"restart", "kindness"}', false, true, true, false),
('0190be97-71b8-7cf6-8a71-610b78d2b968', null, 'A soft reset is still progress.', 'TinyWins', null, 'restart', 'General', 'calm', '{"reset", "progress"}', false, true, true, false),
('0190be97-71b9-7cf6-8a71-610b78d2b969', null, 'Tomorrow is always new, with no mistakes in it yet.', 'L.M. Montgomery', 'Anne of Green Gables', 'restart', 'General', 'calm', '{"fresh-start"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b918', null, 'No matter how hard the past, you can always begin again.', 'Buddha', null, 'restart', 'General', 'calm', '{"restart", "compassion"}', false, true, true, false),

-- Gratitude (type = 'gratitude' - tender original app lines only)
('0190be97-71ba-7cf6-8a71-610b78d2b970', null, 'Name one thing that gave you strength today.', 'TinyWins', null, 'gratitude', 'General', 'calm', '{"gratitude"}', false, true, true, false),
('0190be97-71bb-7cf6-8a71-610b78d2b971', null, 'Reflect on your present blessings, of which every man has many.', 'Charles Dickens', null, 'gratitude', 'General', 'calm', '{"blessings"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b919', null, 'What tiny win felt sweet today?', 'TinyWins', null, 'gratitude', 'General', 'calm', '{"win", "sweetness"}', false, true, true, false),
('0190be97-71c0-7cf6-8a71-610b78d2b920', null, 'Let us be grateful to the mirror that reflects our efforts.', 'TinyWins', null, 'gratitude', 'General', 'calm', '{"reflection", "mirror"}', false, true, true, false)

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
