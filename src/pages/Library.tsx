import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface ContentItem {
  id: string
  user_id: string | null
  title: string
  category: string
  type: string
  url: string
  platform: string
  short_description: string
  tags: string[]
  estimated_duration: string
  mood: string
  is_user_added: boolean
  is_default: boolean
  is_favourite: boolean
}

// Client-side default seeds in case database lacks them on cold boot
const DEFAULT_SEEDS: ContentItem[] = [
  {
    id: 'seed-1',
    user_id: null,
    title: 'Gentle 10-Minute Morning Stretch',
    category: 'Physical',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
    platform: 'YouTube',
    short_description: 'A calm, slow morning stretch routine to wake up your muscles.',
    tags: ['stretch', 'morning', 'fitness'],
    estimated_duration: '10 mins',
    mood: 'calm',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  },
  {
    id: 'seed-2',
    user_id: null,
    title: 'Calm Ambient Rain Music',
    category: 'Mental',
    type: 'music',
    url: 'https://www.youtube.com/watch?v=q76bN0Gy6zo',
    platform: 'YouTube',
    short_description: 'Deep ambient sounds of rain falling on leaves for focusing or resting.',
    tags: ['rain', 'ambient', 'focus', 'sleep'],
    estimated_duration: 'flexible',
    mood: 'focus',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  },
  {
    id: 'seed-3',
    user_id: null,
    title: 'Daily Breathing Exercise',
    category: 'Self-care',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=5DqTuWve9t8',
    platform: 'YouTube',
    short_description: 'Box breathing exercise to reduce anxiety and anchor your day.',
    tags: ['breathing', 'self-care', 'calm'],
    estimated_duration: '3 mins',
    mood: 'anxious',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  },
  {
    id: 'seed-4',
    user_id: null,
    title: 'The Quiet Mind Meditation',
    category: 'Spiritual',
    type: 'prayer',
    url: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
    platform: 'YouTube',
    short_description: 'A short, gentle guidance to calm the mind and find spiritual presence.',
    tags: ['prayer', 'spiritual', 'calm'],
    estimated_duration: '5 mins',
    mood: 'calm',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  }
]

export default function Library() {
  const { user } = useAuth()

  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Settings & Preferences
  const [showSettings, setShowSettings] = useState(false)
  const [supportLinksEnabled, setSupportLinksEnabled] = useState(() => {
    const saved = localStorage.getItem(`support_links_enabled_${user?.id}`)
    return saved !== 'false' // default to true
  })
  const [supportStyle, setSupportStyle] = useState<string[]>([])

  // Filters
  const [filterType, setFilterType] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')

  // Load preferences and links
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // 1. Fetch Profile Preferences
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('support_style')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError
        if (profileData?.support_style) {
          setSupportStyle(profileData.support_style)
        }

        // 2. Fetch Content Items
        const { data: contentData, error: contentError } = await supabase
          .from('content_items')
          .select('*')
          .or(`user_id.eq.${user.id},is_default.eq.true`)

        if (contentError) throw contentError

        // Merge database items and fallback defaults if none present
        let merged = contentData || []
        const hasDefaults = merged.some((item) => item.is_default)
        if (!hasDefaults) {
          merged = [...merged, ...DEFAULT_SEEDS]
        }

        setItems(merged)
      } catch (err) {
        console.error('Error fetching library:', err)
        setError('Could not load support library. Using offline seeds.')
        setItems(DEFAULT_SEEDS)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleToggleEnabled = (val: boolean) => {
    setSupportLinksEnabled(val)
    if (user) {
      localStorage.setItem(`support_links_enabled_${user.id}`, String(val))
    }
  }

  const handleToggleStyle = async (type: string) => {
    if (!user) return
    const newStyle = supportStyle.includes(type)
      ? supportStyle.filter((t) => t !== type)
      : [...supportStyle, type]

    setSupportStyle(newStyle)

    try {
      await supabase
        .from('profiles')
        .update({ support_style: newStyle, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
    } catch (err) {
      console.error('Error saving support style preference:', err)
    }
  }

  const handleToggleFavourite = async (itemId: string, currentFav: boolean) => {
    if (!user) return
    
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, is_favourite: !currentFav } : item))
    )

    // Check if it is a seed item (not saved in database yet)
    const item = items.find((i) => i.id === itemId)
    if (!item) return

    try {
      if (item.is_default && item.id.startsWith('seed-')) {
        // Create a user record of it as a favorite link
        const { error: insertError } = await supabase
          .from('content_items')
          .insert({
            user_id: user.id,
            title: item.title,
            category: item.category,
            type: item.type,
            url: item.url,
            platform: item.platform,
            short_description: item.short_description,
            tags: item.tags,
            estimated_duration: item.estimated_duration,
            mood: item.mood,
            is_user_added: false,
            is_default: true,
            is_favourite: !currentFav
          })
        if (insertError) throw insertError
      } else {
        // Regular update
        const { error: updateError } = await supabase
          .from('content_items')
          .update({ is_favourite: !currentFav })
          .eq('id', itemId)
        if (updateError) throw updateError
      }
    } catch (err) {
      console.error('Error favouriting item:', err)
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, is_favourite: currentFav } : i))
      )
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!user) return
    const confirm = window.confirm('Are you sure you want to remove this support link?')
    if (!confirm) return

    try {
      const { error: deleteError } = await supabase
        .from('content_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      setItems((prev) => prev.filter((i) => i.id !== itemId))
    } catch (err) {
      console.error('Error deleting library item:', err)
      setError('Could not delete support link.')
    }
  }

  // Filter content
  const filteredItems = items.filter((item) => {
    if (filterType !== 'All' && item.type !== filterType.toLowerCase()) return false
    if (filterCategory !== 'All' && item.category !== filterCategory) return false
    return true
  })

  const uniqueCategories = ['All', ...Array.from(new Set(items.map((i) => i.category)))]
  const typeOptions = ['All', 'Video', 'Music', 'Article', 'Podcast', 'Prayer']

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <header className="flex justify-between items-start mb-6 select-none">
          <div className="text-left">
            <h1 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight">
              Support Library
            </h1>
            <p className="text-xs text-plum-light/70 font-light">Gentle resources for your journey.</p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              showSettings
                ? 'bg-plum-main text-cream-light border-plum-main'
                : 'bg-cream-dark/15 border-plum-main/5 text-plum-main hover:bg-cream-dark/30'
            }`}
            title="Configure Preferences"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </header>

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-3 mb-4 text-xs text-plum-light text-left">
            {error}
          </div>
        )}

        {/* Collapsible settings card */}
        {showSettings && (
          <div className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 mb-4 text-left animate-fadeIn select-none">
            <h4 className="text-[10px] uppercase tracking-wider text-plum-light/60 font-bold mb-2 ml-0.5">Library Preferences</h4>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={supportLinksEnabled}
                onChange={(e) => handleToggleEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-plum-main/20 text-plum-main focus:ring-plum-main/30 accent-plum-main"
              />
              <span className="text-xs font-semibold text-plum-dark">Include support links on habits</span>
            </label>

            {supportLinksEnabled && (
              <div className="border-t border-plum-main/5 pt-2 ml-1">
                <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-2">Preferred Formats</span>
                <div className="grid grid-cols-2 gap-2">
                  {['video', 'music', 'article', 'podcast', 'prayer'].map((type) => {
                    const checked = supportStyle.includes(type)
                    return (
                      <label key={type} className="flex items-center gap-2 cursor-pointer text-[10px] text-plum-dark">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleStyle(type)}
                          className="w-3 h-3 rounded border-plum-main/20 text-plum-main focus:ring-plum-main/30 accent-plum-main"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2 mb-4 select-none">
          <div>
            <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1 ml-1 text-left">Format</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-xl py-1.5 px-2 text-plum-dark font-sans text-[10px] focus:outline-none focus:border-plum-main/40"
            >
              {typeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1 ml-1 text-left">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-xl py-1.5 px-2 text-plum-dark font-sans text-[10px] focus:outline-none focus:border-plum-main/40"
            >
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Consulting library...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Cards List */}
              {filteredItems.length === 0 ? (
                <div className="text-center py-12 select-none">
                  <p className="text-xs text-plum-light/60">No support links match this filter.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin my-1 text-left">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col justify-between hover:border-plum-main/20 transition-all duration-200 relative animate-fadeIn"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7px] font-bold uppercase tracking-wider text-sunset-end bg-sunset-end/5 px-1 py-0.5 rounded border border-sunset-end/10">
                            {item.category}
                          </span>
                          <span className="text-[7px] font-bold uppercase tracking-wider text-plum-light bg-cream-dark/30 px-1 py-0.5 rounded">
                            {item.type}
                          </span>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={() => handleToggleFavourite(item.id, item.is_favourite)}
                          className="text-plum-light/50 hover:text-red-500 transition-colors p-1"
                        >
                          <svg
                            className={`w-3.5 h-3.5 ${item.is_favourite ? 'fill-red-500 text-red-500' : 'text-plum-light/40'}`}
                            fill={item.is_favourite ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>

                      <h4 className="font-semibold text-plum-dark text-xs mb-1">{item.title}</h4>
                      <p className="text-[10px] text-plum-light/85 font-light leading-relaxed mb-3">
                        {item.short_description}
                      </p>

                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-plum-main/5">
                        <div className="text-[8px] text-plum-light/60 font-semibold">
                          <span>⏱️ {item.estimated_duration || 'flexible'}</span>
                          {item.platform && <span className="ml-2">📱 {item.platform}</span>}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.is_user_added && (
                            <>
                              <Link
                                to={`/library/${item.id}/edit`}
                                className="text-[9px] font-bold text-plum-light hover:text-plum-main transition-colors"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-[9px] font-bold text-red-500/70 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </>
                          )}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-plum-main hover:bg-plum-dark text-cream-light py-1 px-3.5 rounded-lg text-[9px] font-semibold transition-colors text-center inline-block cursor-pointer"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[8px] text-plum-light/50 mt-4 leading-normal select-none italic text-center">
                "Support links open outside TinyWins. Choose what feels supportive for you."
              </p>
            </div>

            {/* Bottom Actions & Nav */}
            <div className="mt-4 pt-4 border-t border-plum-main/10 flex flex-col gap-4">
              <Link
                to="/library/new"
                className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/10 text-center block"
              >
                Add support link
              </Link>

              {/* Bottom Navigation (5 tabs) */}
              <nav className="flex justify-around items-center text-xs select-none border-t border-plum-main/5 pt-3">
                <Link to="/today" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                  <span className="text-[9px]">Today</span>
                </Link>
                <Link to="/habits" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 112-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className="text-[9px]">Habits</span>
                </Link>
                <Link to="/timeline" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-[9px]">Timeline</span>
                </Link>
                <Link to="/coach" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-[9px]">Coach</span>
                </Link>
                <Link to="/library" className="flex flex-col items-center gap-0.5 cursor-pointer text-sunset-end font-bold transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-[9px]">Library</span>
                </Link>
              </nav>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
