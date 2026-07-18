import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getLocalDateString } from '../lib/streaks'

interface TimelineItem {
  id: string
  date: string
  type: 'habit_log' | 'journal'
  status?: string
  reflection?: string | null
  mood: string | null
  effort_level?: string | null
  habit_name?: string
  tiny_goal?: string
  goal_area?: string
  title?: string | null
  body?: string
}

export default function Timeline() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayStr = getLocalDateString()
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000))

  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!user) return

      try {
        // Fetch all habit logs (any status)
        const { data: logsData, error: logsError } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('log_date', { ascending: false })

        if (logsError) throw logsError

        // Fetch journal entries
        const { data: journalData, error: journalError } = await supabase
          .from('journal_entries')
          .select('*, goals:goals(area)')
          .eq('user_id', user.id)
          .order('entry_date', { ascending: false })

        if (journalError) throw journalError

        // Fetch habits
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)

        if (habitsError) throw habitsError

        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id, area')
          .eq('user_id', user.id)

        if (goalsError) throw goalsError

        // Map habit logs
        const mappedLogs: TimelineItem[] = (logsData || []).map((log) => {
          const habit = habitsData?.find((h) => h.id === log.habit_id) || null
          const goal = goalsData?.find((g) => g.id === habit?.goal_id) || null
          return {
            id: log.id,
            date: log.log_date,
            type: 'habit_log',
            status: log.status,
            reflection: log.reflection,
            mood: log.mood,
            effort_level: log.effort_level,
            habit_name: habit ? habit.name : 'Unknown Habit',
            tiny_goal: habit ? habit.tiny_goal : '',
            goal_area: goal ? goal.area : 'General'
          }
        })

        // Map journal entries
        const mappedJournal: TimelineItem[] = (journalData || []).map((j) => {
          return {
            id: j.id,
            date: j.entry_date,
            type: 'journal',
            mood: j.mood,
            title: j.title,
            body: j.body,
            goal_area: j.goals?.area || undefined
          }
        })

        // Combine and sort newest first
        const combined = [...mappedLogs, ...mappedJournal].sort((a, b) => {
          if (a.date !== b.date) {
            return b.date.localeCompare(a.date)
          }
          if (a.type !== b.type) {
            return a.type === 'journal' ? -1 : 1
          }
          return 0
        })

        setItems(combined)
      } catch (err) {
        console.error('Error fetching timeline data:', err)
        setError('Could not load your activity timeline. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTimelineData()
  }, [user])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  // Format header dates
  const formatHeadingDate = (dateStr: string) => {
    if (dateStr === todayStr) return 'Today'
    if (dateStr === yesterdayStr) return 'Yesterday'

    const date = new Date(dateStr + 'T12:00:00')
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }
    return date.toLocaleDateString('en-US', options)
  }

  // Group items by date
  const groupedItems: Record<string, TimelineItem[]> = {}
  items.forEach((item) => {
    if (!groupedItems[item.date]) {
      groupedItems[item.date] = []
    }
    groupedItems[item.date].push(item)
  })

  const itemDates = Object.keys(groupedItems)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        
        {/* Header */}
        <header className="flex justify-between items-start mb-6 select-none">
          <div className="text-left">
            <h1 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight">
              My Timeline
            </h1>
            <p className="text-xs text-plum-light/70 font-light">A record of showing up.</p>
          </div>
          <div className="flex gap-1.5">
            <Link
              to="/journal"
              className="p-2.5 rounded-xl bg-cream-dark/15 border border-plum-main/5 text-plum-main hover:bg-cream-dark/30 transition-colors cursor-pointer"
              title="Private Journal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </Link>
            <Link
              to="/settings"
              className="p-2.5 rounded-xl bg-cream-dark/15 border border-plum-main/5 text-plum-main hover:bg-cream-dark/30 transition-colors cursor-pointer"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.397-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-cream-dark/15 border border-plum-main/5 text-plum-main hover:bg-cream-dark/30 hover:text-red-600 transition-colors cursor-pointer"
              title="Log Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading timeline...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between animate-fadeIn">
            <div>
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left leading-relaxed">
                  {error}
                </div>
              )}

              {/* EMPTY STATE */}
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none">
                  <svg 
                    className="w-12 h-12 text-plum-main/30 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-sm font-medium text-plum-dark/60 mb-2">Your story starts with one small win.</p>
                  <p className="text-xs text-plum-light/60 max-w-[220px] leading-normal">
                    When you check in a habit or write in your journal, entries will appear here.
                  </p>
                </div>
              ) : (
                /* MERGED TIMELINE */
                <div className="flex flex-col gap-5 max-h-[320px] overflow-y-auto pr-1 text-left scrollbar-thin my-2">
                  {itemDates.map((dateStr) => (
                    <div key={dateStr} className="flex flex-col gap-2.5">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-sunset-end ml-1 mb-1">
                        {formatHeadingDate(dateStr)}
                      </h3>

                      {groupedItems[dateStr].map((item) => (
                        item.type === 'journal' ? (
                          /* Journal Entry Card */
                          <div 
                            key={item.id} 
                            onClick={() => navigate('/journal')}
                            className="bg-sunset-start/35 border border-sunset-end/20 rounded-2xl p-4 flex flex-col gap-1.5 transition-all hover:border-sunset-end/40 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[7.5px] font-bold uppercase tracking-wider text-sunset-end bg-sunset-end/10 px-1.5 py-0.5 rounded">
                                📝 Journal Note
                              </span>
                              {item.goal_area && (
                                <span className="text-[7.5px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                  {item.goal_area}
                                </span>
                              )}
                              {item.mood && (
                                <span className="text-[7.5px] font-bold text-sunset-end bg-sunset-end/15 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {item.mood}
                                </span>
                              )}
                            </div>
                            {item.title && (
                              <h4 className="font-semibold text-plum-dark text-xs mb-0.5">{item.title}</h4>
                            )}
                            <p className="text-[11px] text-plum-dark font-sans font-light leading-relaxed whitespace-pre-wrap">
                              {item.body}
                            </p>
                          </div>
                        ) : (
                          /* Habit Log Card */
                          <div 
                            key={item.id} 
                            className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col gap-2 transition-all hover:border-plum-main/20"
                          >
                            <div>
                              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                <span className="text-[8px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                  {item.goal_area}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  item.status === 'completed'
                                    ? 'text-green-700 bg-green-50/15'
                                    : item.status === 'partial'
                                      ? 'text-orange-700 bg-orange-50/15'
                                      : 'text-plum-light/60 bg-plum-main/5'
                                }`}>
                                  {item.status || 'completed'}
                                </span>
                                {item.mood && (
                                  <span className="text-[8px] font-bold text-sunset-end bg-sunset-end/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {item.mood}
                                  </span>
                                )}
                                {item.effort_level && (
                                  <span className="text-[8px] font-semibold text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded">
                                    Effort: {item.effort_level}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-xs text-plum-dark leading-relaxed font-light">
                                {item.status === 'not_done' ? 'Honest log — ' : 'Small win — '}
                                <span className="font-semibold">{item.tiny_goal || item.habit_name}</span>
                              </p>
                            </div>

                            {item.reflection && (
                              <p className="text-xs text-plum-light/85 italic font-light pl-2 border-l border-plum-main/10 leading-relaxed">
                                "{item.reflection}"
                              </p>
                            )}
                          </div>
                        )
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <nav className="mt-8 pt-4 border-t border-plum-main/10 flex justify-around items-center text-xs select-none">
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
              <Link to="/timeline" className="flex flex-col items-center gap-0.5 cursor-pointer text-sunset-end font-bold transition-colors">
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
              <Link to="/library" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-[9px]">Library</span>
              </Link>
            </nav>
          </div>
        )}

      </div>
    </main>
  )
}
