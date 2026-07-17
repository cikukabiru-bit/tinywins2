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
  {
    id: 'seed-ins-1',
    text: 'One small step is still movement.',
    author: 'TinyWins',
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
    id: 'seed-ins-4',
    text: 'Breathe first. Begin softly.',
    author: 'TinyWins',
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
    id: 'seed-ins-7',
    text: 'Begin again, without punishment.',
    author: 'TinyWins',
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
    id: 'seed-ins-10',
    text: 'Name one thing that gave you strength today.',
    author: 'TinyWins',
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
    id: 'seed-ins-12',
    text: 'Quiet the noise. Focus on this single moment.',
    author: 'TinyWins',
    type: 'focus',
    category: 'General',
    tone: 'calm',
    tags: ['focus', 'noise'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-13',
    text: 'Doing less, with full attention, is more than enough.',
    author: 'TinyWins',
    type: 'focus',
    category: 'General',
    tone: 'calm',
    tags: ['focus', 'attention'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-14',
    text: 'Rest is not idleness; it is soil for tomorrow\'s flowers.',
    author: 'TinyWins',
    type: 'self_care',
    category: 'General',
    tone: 'calm',
    tags: ['rest', 'self-care'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-15',
    text: 'Treat your effort with the same kindness you offer a friend.',
    author: 'TinyWins',
    type: 'self_care',
    category: 'General',
    tone: 'calm',
    tags: ['kindness', 'self-care'],
    is_user_added: false,
    is_default: true,
    is_active: true,
    is_favourite: false
  },
  {
    id: 'seed-ins-16',
    text: 'Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you.',
    author: 'Jesus',
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
    author: 'King David',
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
    id: 'seed-ins-18',
    text: 'Be not disturbed by anything; let nothing frighten thee. All things are passing; God alone is changeless.',
    author: 'St. Teresa of Avila',
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
    id: 'seed-ins-20',
    text: 'May I find stillness in the middle of my busy day today.',
    author: 'TinyWins Prayer Prompt',
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
    type: 'prayer',
    category: 'Spiritual',
    tone: 'calm',
    tags: ['win'],
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
  const wantsSpiritual = preferences.some(p => p.toLowerCase() === 'spiritual' || p.toLowerCase() === 'prayer' || p.toLowerCase() === 'scripture')
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
