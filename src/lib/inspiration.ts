import { supabase } from './supabase'

export interface InspirationItem {
  id: string
  text: string
  author?: string | null
  source?: string | null
  type: string // motivational, calm, restart, gratitude, prayer, focus, self_care, bible_verse, saint_quote
  category?: string | null
  tone?: string | null
  tags?: string[]
  is_user_added: boolean
  is_default: boolean
  is_active: boolean
  is_favourite: boolean
}

export const LOCAL_INSPIRATION_SEEDS: InspirationItem[] = [
  // Bible Verses (type = 'bible_verse')
  {
    id: 'seed-ins-16',
    text: 'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.',
    author: null,
    source: 'Matthew 7:7 (KJV)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['seek', 'find'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-17',
    text: 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures.',
    author: null,
    source: 'Psalm 23:1-2 (KJV)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['comfort', 'peace'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db01',
    text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    author: null,
    source: 'Isaiah 40:31 (KJV)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['strength', 'wait'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db02',
    text: 'I can do all things through Christ, who strengthens me.',
    author: null,
    source: 'Philippians 4:13 (WEB)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['strength', 'faith'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db03',
    text: 'But the path of the righteous is like the dawning light, that shines more and more unto the perfect day.',
    author: null,
    source: 'Proverbs 4:18 (WEB)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['light', 'journey'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db04',
    text: 'Your word is a lamp to my feet, and a light for my path.',
    author: null,
    source: 'Psalm 119:105 (WEB)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['guidance', 'path'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db05',
    text: 'Rejoicing in hope; enduring in troubles; continuing steadfastly in prayer.',
    author: null,
    source: 'Romans 12:12 (WEB)',
    type: 'bible_verse',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['hope', 'patience'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },

  // Saint Quotes (type = 'saint_quote')
  {
    id: 'seed-ins-18',
    text: 'Be not disturbed by anything; let nothing frighten thee. All things are passing; God alone is changeless.',
    author: 'St. Teresa of Avila',
    source: null,
    type: 'saint_quote',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['peace', 'trust'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-19',
    text: 'Have patience with all things, but chiefly have patience with yourself.',
    author: 'St. Francis de Sales',
    source: null,
    type: 'saint_quote',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['patience'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db06',
    text: 'Start by doing what\'s necessary; then do what\'s possible; and suddenly you are doing the impossible.',
    author: 'St. Francis of Assisi',
    source: null,
    type: 'saint_quote',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['action', 'impossible'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db07',
    text: 'Trust God that you are exactly where you are meant to be.',
    author: 'St. Thérèse of Lisieux',
    source: null,
    type: 'saint_quote',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['trust', 'place'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db08',
    text: 'Pray as though everything depended on God. Work as though everything depended on you.',
    author: 'St. Augustine',
    source: null,
    type: 'saint_quote',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['work', 'prayer'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db09',
    text: 'The truth is not ours to possess, but to serve.',
    author: 'St. Thomas Aquinas',
    source: null,
    type: 'saint_quote',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['truth'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },

  // Prayer Prompts (type = 'prayer')
  {
    id: 'seed-ins-20',
    text: 'May I find stillness in the middle of my busy day today.',
    author: 'TinyWins Prayer Prompt',
    source: null,
    type: 'prayer',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['stillness'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-21',
    text: 'Help me to remember that every tiny win counts in Thy sight.',
    author: 'TinyWins Prayer Prompt',
    source: null,
    type: 'prayer',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['win'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },

  // Motivational (type = 'motivational')
  {
    id: 'seed-ins-1',
    text: 'One small step is still movement.',
    author: 'TinyWins',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['step', 'action'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-2',
    text: 'Start where you are. Keep it small.',
    author: 'TinyWins',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['beginning'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-3',
    text: 'Great things are done by a series of small things brought together.',
    author: 'Vincent van Gogh',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['growth'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db10',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['start'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db11',
    text: 'The primary indication of a well-ordered mind is a man\'s ability to remain in one place and linger in his own company.',
    author: 'Seneca',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['mind', 'stillness'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db12',
    text: 'Concentrate every minute on doing what\'s in front of you with precise and genuine seriousness, tenderly, willingly, with justice.',
    author: 'Marcus Aurelius',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['focus', 'present'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db13',
    text: 'He who is brave is free.',
    author: 'Seneca',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['courage'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db14',
    text: 'A journey of a thousand miles begins with a single step.',
    author: 'Lao Tzu',
    source: null,
    type: 'motivational',
    category: 'General',
    tone: 'calm',
    tags: ['step', 'journey'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },

  // Calm (type = 'calm')
  {
    id: 'seed-ins-4',
    text: 'Breathe first. Begin softly.',
    author: 'TinyWins',
    source: null,
    type: 'calm',
    category: 'General',
    tone: 'calm',
    tags: ['breathe', 'peace'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-5',
    text: 'A gentle step still counts.',
    author: 'TinyWins',
    source: null,
    type: 'calm',
    category: 'General',
    tone: 'calm',
    tags: ['gentle'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-6',
    text: 'Nature does not hurry, yet everything is accomplished.',
    author: 'Lao Tzu',
    source: null,
    type: 'calm',
    category: 'General',
    tone: 'calm',
    tags: ['nature', 'patience'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db15',
    text: 'Adopt the pace of nature: her secret is patience.',
    author: 'Ralph Waldo Emerson',
    source: null,
    type: 'calm',
    category: 'General',
    tone: 'calm',
    tags: ['nature', 'patience'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db16',
    text: 'Nothing is more useful than peace of mind.',
    author: 'Seneca',
    source: null,
    type: 'calm',
    category: 'General',
    tone: 'calm',
    tags: ['peace'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db17',
    text: 'The greatest step towards a calm life is to learn to limit our desires.',
    author: 'Epictetus',
    source: null,
    type: 'calm',
    category: 'General',
    tone: 'calm',
    tags: ['calm', 'desires'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },

  // Restart (type = 'restart' - tender original app lines only)
  {
    id: 'seed-ins-7',
    text: 'Begin again, without punishment.',
    author: 'TinyWins',
    source: null,
    type: 'restart',
    category: 'General',
    tone: 'calm',
    tags: ['restart', 'kindness'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-8',
    text: 'A soft reset is still progress.',
    author: 'TinyWins',
    source: null,
    type: 'restart',
    category: 'General',
    tone: 'calm',
    tags: ['reset', 'progress'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-9',
    text: 'Tomorrow is always new, with no mistakes in it yet.',
    author: 'L.M. Montgomery',
    source: 'Anne of Green Gables',
    type: 'restart',
    category: 'General',
    tone: 'calm',
    tags: ['fresh-start'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db18',
    text: 'No matter how hard the past, you can always begin again.',
    author: 'Buddha',
    source: null,
    type: 'restart',
    category: 'General',
    tone: 'calm',
    tags: ['restart', 'compassion'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },

  // Gratitude (type = 'gratitude' - tender original app lines only)
  {
    id: 'seed-ins-10',
    text: 'Name one thing that gave you strength today.',
    author: 'TinyWins',
    source: null,
    type: 'gratitude',
    category: 'General',
    tone: 'calm',
    tags: ['gratitude'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-11',
    text: 'Reflect on your present blessings, of which every man has many.',
    author: 'Charles Dickens',
    source: null,
    type: 'gratitude',
    category: 'General',
    tone: 'calm',
    tags: ['blessings'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db19',
    text: 'What tiny win felt sweet today?',
    author: 'TinyWins',
    source: null,
    type: 'gratitude',
    category: 'General',
    tone: 'calm',
    tags: ['win', 'sweetness'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-db20',
    text: 'Let us be grateful to the mirror that reflects our efforts.',
    author: 'TinyWins',
    source: null,
    type: 'gratitude',
    category: 'General',
    tone: 'calm',
    tags: ['reflection', 'mirror'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  }
]

export interface SelectionContext {
  isSoftReturn?: boolean // user is recovering from consecutive missed days
  isStrongStreak?: boolean // current streak is high
  tone?: string | null // coach tone preference (e.g. calm, friendly, direct)
}

/**
 * Picks an inspiration quote based on preferences and context.
 */
export async function getInspiration(
  userId: string,
  preferences: string[] = [], // from profiles.inspiration_preferences
  context: SelectionContext = {}
): Promise<InspirationItem> {
  let allItems: InspirationItem[] = []

  try {
    // 1. Fetch user added and default active inspiration items
    const { data, error } = await supabase
      .from('inspiration_items')
      .select('*')
      .eq('is_active', true)
      .or(`user_id.eq.${userId},is_default.eq.true`)

    if (!error && data) {
      allItems = data
    }
  } catch (err) {
    console.error('Error fetching inspirations from DB:', err)
  }

  // Fall back to local seeds if DB did not yield seeds
  const hasDefaults = allItems.some((item) => item.is_default)
  if (!hasDefaults) {
    allItems = [...allItems, ...LOCAL_INSPIRATION_SEEDS]
  }

  // 2. Filter spiritual content based on preference
  const wantsSpiritual = preferences.some(p => {
    const pl = p.toLowerCase()
    return (
      pl.includes('spiritual') ||
      pl.includes('prayer') ||
      pl.includes('scripture') ||
      pl.includes('bible') ||
      pl.includes('saint')
    )
  })
  const spiritualTypes = ['bible_verse', 'saint_quote', 'prayer']

  let candidates = allItems.filter((item) => {
    const isSpiritual = spiritualTypes.includes(item.type)
    if (isSpiritual && !wantsSpiritual) {
      return false // Filter out religious items if user did not consent
    }
    return true
  })

  // If preferences are empty, we fall back to general motivational, calm, restart, focus, etc.
  if (preferences.length === 0) {
    candidates = candidates.filter((item) => !spiritualTypes.includes(item.type))
  } else {
    // Filter by type matching user preferences (if type is in preferences or if we fallback)
    const matchedPreferences = candidates.filter((item) =>
      preferences.some(p => p.toLowerCase() === item.type.toLowerCase())
    )
    if (matchedPreferences.length > 0) {
      candidates = matchedPreferences
    }
  }

  // 3. Apply Context-Based Rules
  if (context.isSoftReturn) {
    // Prefer restart items
    const restartItems = candidates.filter((item) => item.type === 'restart')
    if (restartItems.length > 0) {
      candidates = restartItems
    }
  } else if (context.isStrongStreak) {
    // Prefer gratitude or motivational items
    const streakItems = candidates.filter((item) => item.type === 'gratitude' || item.type === 'motivational')
    if (streakItems.length > 0) {
      candidates = streakItems
    }
  }

  // 4. Tone matching
  if (context.tone) {
    const toneMatched = candidates.filter((item) => item.tone?.toLowerCase() === context.tone?.toLowerCase())
    if (toneMatched.length > 0) {
      candidates = toneMatched
    }
  }

  // Fallback to absolute anything if candidates became empty
  if (candidates.length === 0) {
    candidates = LOCAL_INSPIRATION_SEEDS.filter((item) => !spiritualTypes.includes(item.type))
  }

  // Pick random candidate
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}
