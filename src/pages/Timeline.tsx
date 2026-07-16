import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getLocalDateString } from '../lib/streaks'

interface LogEntry {
  id: string
  log_date: string
  status: string
  reflection: string | null
  mood: string | null
  effort_level: string | null
  habit_name: string
  tiny_goal: string
  goal_area: string
}

export default function Timeline() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const todayStr = getLocalDateString()
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000))

  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!user) return

      try {
        // Fetch completed logs
        const { data: logsData, error: logsError } = await supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('log_date', { ascending: false })

        if (logsError) throw logsError

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

        // Combine and join in memory
        const combined: LogEntry[] = (logsData || []).map((log) => {
          const habit = habitsData?.find((h) => h.id === log.habit_id) || null
          const goal = goalsData?.find((g) => g.id === habit?.goal_id) || null
          return {
            id: log.id,
            log_date: log.log_date,
            status: log.status,
            reflection: log.reflection,
            mood: log.mood,
            effort_level: log.effort_level,
            habit_name: habit ? habit.name : 'Unknown Habit',
            tiny_goal: habit ? habit.tiny_goal : '',
            goal_area: goal ? goal.area : 'General'
          }
        })

        setLogs(combined)
      } catch (err) {
        console.error('Error fetching timeline data:', err)
        setError('Could not load your journal timeline. Please try again.')
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

  // Group logs by date
  const groupedLogs: Record<string, LogEntry[]> = {}
  logs.forEach((log) => {
    if (!groupedLogs[log.log_date]) {
      groupedLogs[log.log_date] = []
    }
    groupedLogs[log.log_date].push(log)
  })

  const logDates = Object.keys(groupedLogs)

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
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-cream-dark/15 border border-plum-main/5 text-plum-main hover:bg-cream-dark/30 hover:text-red-600 transition-colors cursor-pointer"
            title="Log Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
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
              {logs.length === 0 ? (
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
                    When you check in a habit, your journal logs will appear here.
                  </p>
                </div>
              ) : (
                /* JOURNAL TIMELINE */
                <div className="flex flex-col gap-5 max-h-[320px] overflow-y-auto pr-1 text-left scrollbar-thin my-2">
                  {logDates.map((dateStr) => (
                    <div key={dateStr} className="flex flex-col gap-2">
                      <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-sunset-end ml-1 mb-1">
                        {formatHeadingDate(dateStr)}
                      </h3>

                      {groupedLogs[dateStr].map((log) => (
                        <div 
                          key={log.id} 
                          className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col gap-2 transition-all hover:border-plum-main/20"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className="text-[8px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                {log.goal_area}
                              </span>
                              {log.mood && (
                                <span className="text-[8px] font-bold text-sunset-end bg-sunset-end/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {log.mood}
                                </span>
                              )}
                              {log.effort_level && (
                                <span className="text-[8px] font-semibold text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded">
                                  Effort: {log.effort_level}
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-plum-dark leading-relaxed font-light">
                              Small win — completed <span className="font-semibold">{log.tiny_goal || log.habit_name}</span>
                            </p>
                          </div>

                          {log.reflection && (
                            <p className="text-xs text-plum-light/85 italic font-light pl-2 border-l border-plum-main/10 leading-relaxed">
                              "{log.reflection}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <nav className="mt-8 pt-4 border-t border-plum-main/10 flex justify-around items-center text-xs select-none">
              <Link to="/today" className="flex flex-col items-center gap-1 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <span>Today</span>
              </Link>
              <Link to="/habits" className="flex flex-col items-center gap-1 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 112-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Habits</span>
              </Link>
              <Link to="/timeline" className="flex flex-col items-center gap-1 cursor-pointer text-sunset-end font-bold transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Timeline</span>
              </Link>
            </nav>
          </div>
        )}

      </div>
    </main>
  )
}
