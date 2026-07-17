import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getLocalDateString } from '../lib/streaks'
import { generateHabitSuggestion, generateGeneralSuggestion } from '../lib/coach'

interface Habit {
  id: string
  user_id: string
  goal_id: string
  name: string
  category: string
  tiny_goal: string
  frequency: string
  custom_days: number[]
  preferred_time: string
  growth_mode: string
  start_date: string
  active: boolean
  habit_logs: { log_date: string; status: string; created_at?: string }[]
}

export default function Coach() {
  const { user } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [coachTone, setCoachTone] = useState('Gentle')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selection: null means "overall"
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)

  const todayStr = getLocalDateString()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        // Fetch tone
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('coach_tone')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError
        if (profileData?.coach_tone) {
          setCoachTone(profileData.coach_tone)
        }

        // Fetch habits and logs
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('*, habit_logs(*)')
          .eq('user_id', user.id)
          .eq('active', true)

        if (habitsError) throw habitsError
        setHabits(habitsData || [])
      } catch (err) {
        console.error(err)
        setError('Could not load Tiny Coach data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  const selectedHabit = habits.find((h) => h.id === selectedHabitId)

  // Get suggestion
  const suggestion = selectedHabit
    ? generateHabitSuggestion(selectedHabit, selectedHabit.habit_logs, coachTone, todayStr)
    : generateGeneralSuggestion(habits, coachTone, todayStr)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/today" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Tiny Coach
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Consulting coach...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-xs text-plum-light/80 text-center mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-plum-main hover:bg-plum-dark text-cream-light py-2 px-4 rounded-xl text-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : habits.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center select-none py-12">
            <svg className="w-12 h-12 text-plum-main/30 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            <h3 className="font-serif text-2xl font-normal text-plum-dark italic mb-2">Tiny Coach is listening</h3>
            <p className="text-xs text-plum-light/80 leading-relaxed mb-6 max-w-[240px]">
              Check in a few times and Tiny Coach will have gentle suggestions for you.
            </p>
            <Link
              to="/habits/new"
              className="bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-5 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/15 cursor-pointer text-center block w-full"
            >
              Add your first habit
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Intro Title */}
              <div className="text-left mb-6">
                <h1 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight mb-1">
                  Coaching Notes
                </h1>
                <p className="text-xs text-plum-light/70 font-light">
                  A {coachTone.toLowerCase()} guide based on your patterns.
                </p>
              </div>

              {/* Selector Tabs */}
              <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 scrollbar-none select-none">
                <button
                  onClick={() => setSelectedHabitId(null)}
                  className={`py-1.5 px-3.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all duration-200 border whitespace-nowrap cursor-pointer ${
                    selectedHabitId === null
                      ? 'bg-plum-main text-cream-light border-plum-main'
                      : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30'
                  }`}
                >
                  Overall
                </button>
                {habits.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHabitId(h.id)}
                    className={`py-1.5 px-3.5 rounded-xl text-[10px] uppercase tracking-wider font-bold transition-all duration-200 border whitespace-nowrap cursor-pointer ${
                      selectedHabitId === h.id
                        ? 'bg-plum-main text-cream-light border-plum-main'
                        : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30'
                    }`}
                  >
                    {h.name}
                  </button>
                ))}
              </div>

              {/* Suggestion Card */}
              <div className="bg-cream-dark/15 border border-plum-main/10 rounded-3xl p-6 text-left relative animate-fadeIn min-h-[160px] flex flex-col justify-between gap-4">
                <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold">
                  {selectedHabit ? `Suggestion for "${selectedHabit.name}"` : 'Overall Direction'}
                </span>
                
                <p className="font-serif italic text-base text-plum-dark leading-relaxed flex-1">
                  "{suggestion.message}"
                </p>

                {suggestion.actionLabel && suggestion.actionPath && (
                  <Link
                    to={suggestion.actionPath}
                    className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-4 rounded-2xl font-medium text-xs text-center block transition-all duration-200 shadow-md shadow-plum-main/10 cursor-pointer"
                  >
                    {suggestion.actionLabel}
                  </Link>
                )}
              </div>
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
              <Link to="/timeline" className="flex flex-col items-center gap-1 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
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
