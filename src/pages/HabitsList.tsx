import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateStreaks, getLocalDateString } from '../lib/streaks'

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
  goals: {
    area: string
  } | null
  habit_logs: {
    id?: string
    log_date: string
    status: string
    reflection?: string
    mood?: string
    effort_level?: string
  }[]
}

export default function HabitsList() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Reflection modal states
  const [activeReflectionLogId, setActiveReflectionLogId] = useState<string | null>(null)
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null)
  const [reflectionText, setReflectionText] = useState('')
  const [selectedMood, setSelectedMood] = useState('neutral')
  const [selectedEffort, setSelectedEffort] = useState('okay')
  const [submittingReflection, setSubmittingReflection] = useState(false)

  const todayStr = getLocalDateString()
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000))

  const [dismissedNudges, setDismissedNudges] = useState<string[]>(() => {
    const list = localStorage.getItem('dismissed_nudges_' + todayStr)
    return list ? JSON.parse(list) : []
  })

  const dismissNudge = (habitId: string) => {
    const newList = [...dismissedNudges, habitId]
    setDismissedNudges(newList)
    localStorage.setItem('dismissed_nudges_' + todayStr, JSON.stringify(newList))
  }

  const fetchHabits = async () => {
    if (!user) return

    try {
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*, habit_logs(*)')
        .eq('user_id', user.id)
        .eq('active', true)

      if (habitsError) throw habitsError

      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('id, area, active')
        .eq('user_id', user.id)
        .eq('active', true)

      if (goalsError) throw goalsError

      const combined = (habitsData || []).map((h) => ({
        ...h,
        goals: goalsData?.find((g) => g.id === h.goal_id) || null
      })).filter(h => h.goals !== null)

      setHabits(combined)
    } catch (err) {
      console.error('Error fetching habits:', err)
      setError('A small issue occurred while loading your habits. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [user])

  const handleCheckIn = async (habit: Habit) => {
    if (!user) return
    setError(null)

    // Local check to prevent double submissions
    const alreadyLogged = habit.habit_logs.some((l) => l.log_date === todayStr)
    if (alreadyLogged) return

    try {
      const { data, error: logError } = await supabase
        .from('habit_logs')
        .insert({
          habit_id: habit.id,
          user_id: user.id,
          log_date: todayStr,
          status: 'completed'
        })
        .select()
        .single()

      // Handle duplicate row check-in constraint gently
      if (logError) {
        if (logError.code === '23505') {
          // unique constraint violation
          fetchHabits()
          return
        }
        throw logError
      }

      if (data) {
        // Update local state temporarily to show changes immediately
        setHabits((prevHabits) =>
          prevHabits.map((h) => {
            if (h.id === habit.id) {
              return {
                ...h,
                habit_logs: [...h.habit_logs, data]
              }
            }
            return h
          })
        )

        // Open reflection modal
        setActiveReflectionLogId(data.id)
        setActiveHabitId(habit.id)
        setReflectionText('')
        setSelectedMood('neutral')
        setSelectedEffort('okay')
      }
    } catch (err) {
      console.error('Check-in error:', err)
      setError('Could not complete check-in. Please try again.')
    }
  }

  const handleSaveReflection = async () => {
    if (!activeReflectionLogId) return
    setSubmittingReflection(true)

    try {
      const { error: updateError } = await supabase
        .from('habit_logs')
        .update({
          reflection: reflectionText.trim(),
          mood: selectedMood,
          effort_level: selectedEffort
        })
        .eq('id', activeReflectionLogId)

      if (updateError) throw updateError

      // Update local state with reflection details
      setHabits((prevHabits) =>
        prevHabits.map((h) => {
          if (h.id === activeHabitId) {
            return {
              ...h,
              habit_logs: h.habit_logs.map((log) => {
                if (log.id === activeReflectionLogId) {
                  return {
                    ...log,
                    reflection: reflectionText.trim(),
                    mood: selectedMood,
                    effort_level: selectedEffort
                  }
                }
                return log
              })
            }
          }
          return h
        })
      )

      // Close modal
      setActiveReflectionLogId(null)
      setActiveHabitId(null)
    } catch (err) {
      console.error('Reflection error:', err)
      setError('Saved check-in, but could not save your reflection.')
      setActiveReflectionLogId(null)
      setActiveHabitId(null)
    } finally {
      setSubmittingReflection(false)
    }
  }

  const handleSkipReflection = () => {
    setActiveReflectionLogId(null)
    setActiveHabitId(null)
  }

  // Group habits by goal area
  const groupedHabits: Record<string, Habit[]> = {}
  habits.forEach((habit) => {
    const areaName = habit.goals?.area || 'General'
    if (!groupedHabits[areaName]) {
      groupedHabits[areaName] = []
    }
    groupedHabits[areaName].push(habit)
  })

  const goalAreas = Object.keys(groupedHabits)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        
        {/* Header */}
        <header className="flex justify-between items-start mb-6 select-none">
          <div className="text-left">
            <h1 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight">
              My Habits
            </h1>
            <p className="text-xs text-plum-light/70 font-light">Growing quietly, step by step.</p>
          </div>
          <div className="flex gap-1.5">
            <Link
              to="/goals"
              className="p-2.5 rounded-xl bg-cream-dark/15 border border-plum-main/5 text-plum-main hover:bg-cream-dark/30 transition-colors cursor-pointer"
              title="My Goals"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading habits...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left leading-relaxed animate-fadeIn">
                  {error}
                </div>
              )}

              {/* EMPTY STATE */}
              {habits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none">
                  <svg 
                    className="w-12 h-12 text-plum-main/30 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-plum-dark/60 mb-2">No tiny habits yet.</p>
                  <p className="text-xs text-plum-light/60 max-w-[200px] leading-normal">
                    Add your first one to start growing quietly and consistently.
                  </p>
                </div>
              ) : (
                /* HABITS LIST */
                <div className="flex flex-col gap-5 max-h-[340px] overflow-y-auto pr-1 text-left scrollbar-thin my-2">
                  {goalAreas.map((area) => (
                    <div key={area} className="flex flex-col gap-2">
                      {/* Goal Heading */}
                      <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-sunset-end ml-1 mb-1">
                        {area}
                      </h3>

                      {groupedHabits[area].map((habit) => {
                        const stats = calculateStreaks(habit.start_date, habit.frequency, habit.custom_days, habit.habit_logs, todayStr)
                        const isDoneToday = habit.habit_logs.some((l) => l.log_date === todayStr)
                        const isSavedByFreeze = stats.freeze_used_dates.includes(yesterdayStr)

                        const nudgeMessages = [
                          "It's been a little while. Want to begin again today?",
                          "No pressure at all — shall we start this one gently again?",
                          "Ready to return? We can make this habit even smaller so it's easier to come back to."
                        ]
                        const charCodeSum = habit.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
                        const nudgeText = nudgeMessages[charCodeSum % nudgeMessages.length]
                        const showNudge = stats.consecutive_missed >= 3 && !isDoneToday && !dismissedNudges.includes(habit.id)

                        return (
                          <div 
                            key={habit.id} 
                            className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col transition-all hover:border-plum-main/20 gap-3"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                    <span className="text-[9px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                      {habit.category}
                                    </span>
                                    {habit.preferred_time && (
                                      <span className="text-[9px] text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded font-medium">
                                        {habit.preferred_time}
                                      </span>
                                    )}
                                    <span className="text-[9px] text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 select-none">
                                      ❄️ {stats.remaining_freezes} {stats.remaining_freezes === 1 ? 'freeze' : 'freezes'}
                                    </span>
                                    {isSavedByFreeze && (
                                      <span className="text-[9px] text-green-700 bg-green-50/15 border border-green-600/10 px-1.5 py-0.5 rounded font-semibold select-none">
                                        🛡️ Saved by freeze
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-semibold text-plum-dark text-sm mb-0.5">{habit.name}</h4>
                                  <p className="text-xs text-plum-light/80 font-light">
                                    Tiny goal: {habit.tiny_goal}
                                  </p>
                                </div>

                                <button
                                  onClick={() => navigate(`/habits/${habit.id}/edit`)}
                                  className="text-plum-light/40 hover:text-plum-main transition-colors p-1 cursor-pointer"
                                  title="Edit habit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </div>

                              {/* Soft return nudge banner */}
                              {showNudge && (
                                <div className="bg-coral-50/10 border border-plum-main/15 rounded-xl p-3.5 mt-2 mb-1 text-xs text-plum-light text-left relative animate-fadeIn leading-relaxed">
                                  <button
                                    type="button"
                                    onClick={() => dismissNudge(habit.id)}
                                    className="absolute right-2 top-2 text-plum-light/40 hover:text-plum-main p-0.5 cursor-pointer"
                                    title="Dismiss nudge"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                  <p className="font-serif italic text-plum-dark font-medium pr-6 mb-2">
                                    "{nudgeText}"
                                  </p>
                                  <div className="flex gap-2.5">
                                    <button
                                      type="button"
                                      onClick={() => handleCheckIn(habit)}
                                      className="bg-plum-main hover:bg-plum-dark text-cream-light py-1.5 px-3 rounded-lg font-medium cursor-pointer text-[10px]"
                                    >
                                      Begin again
                                    </button>
                                    <Link
                                      to={`/habits/${habit.id}/edit?focus=tiny_goal`}
                                      className="border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-1.5 px-3 rounded-lg font-medium text-center cursor-pointer text-[10px] bg-cream-light"
                                    >
                                      Make it smaller
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Streaks & Stats */}
                            <div className="flex gap-4 mt-1 text-[10px] text-plum-light/60 font-semibold select-none border-t border-plum-main/5 pt-2.5">
                              <span>🔥 {stats.current_streak} streak</span>
                              <span>🏆 {stats.longest_streak} longest</span>
                              <span>✨ {stats.total_completions} completions</span>
                            </div>

                            {/* Check In Action */}
                            <div className="mt-1">
                              {isDoneToday ? (
                                <div className="w-full bg-green-50/15 border border-green-600/10 text-green-700 py-2 px-3 rounded-xl text-center text-xs font-semibold select-none flex items-center justify-center gap-1">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                  <span>You showed up today!</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCheckIn(habit)}
                                  className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2 px-3 rounded-xl font-medium text-xs text-center cursor-pointer transition-colors shadow-sm shadow-plum-main/5"
                                >
                                  Check In
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-plum-main/10">
              <Link
                to="/habits/new"
                className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm text-center inline-block"
              >
                Add habit
              </Link>
            </div>

            {/* Bottom Navigation */}
            <nav className="mt-8 pt-4 border-t border-plum-main/10 flex justify-around items-center text-xs select-none">
              <Link to="/today" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
                <span className="text-[9px]">Today</span>
              </Link>
              <Link to="/habits" className="flex flex-col items-center gap-0.5 cursor-pointer text-sunset-end font-bold transition-colors">
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

      {/* OPTIONAL REFLECTION MODAL */}
      {activeReflectionLogId && (
        <div className="fixed inset-0 bg-plum-dark/30 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 shadow-2xl text-left">
            <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold mb-2">
              Reflection
            </span>
            <h3 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight mb-2">
              You showed up! ✨
            </h3>
            <p className="text-xs text-plum-light/70 mb-4 leading-relaxed">
              Take a moment to check in with yourself. This is entirely optional.
            </p>

            <div className="flex flex-col gap-4">
              {/* Note */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">
                  What helped you show up today?
                </label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-4 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35 resize-none h-16"
                  placeholder="e.g. Setting my shoes by the door..."
                  maxLength={300}
                  disabled={submittingReflection}
                />
              </div>

              {/* Mood picker */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-2 ml-1">
                  How are you feeling?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['calm', 'happy', 'tired', 'hopeful', 'overwhelmed', 'neutral'].map((mood) => {
                    const isSelected = selectedMood === mood
                    return (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setSelectedMood(mood)}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer select-none text-center ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30'
                        }`}
                        disabled={submittingReflection}
                      >
                        {mood}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Effort level picker */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-2 ml-1">
                  How was the effort today?
                </label>
                <div className="flex gap-2">
                  {['easy', 'okay', 'hard'].map((effort) => {
                    const isSelected = selectedEffort === effort
                    return (
                      <button
                        key={effort}
                        type="button"
                        onClick={() => setSelectedEffort(effort)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer select-none text-center ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30'
                        }`}
                        disabled={submittingReflection}
                      >
                        {effort}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-plum-main/10">
                <button
                  type="button"
                  onClick={handleSkipReflection}
                  className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-2.5 rounded-xl font-medium text-xs text-center cursor-pointer transition-colors bg-cream-light"
                  disabled={submittingReflection}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={handleSaveReflection}
                  className="flex-1 bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-xl font-medium text-xs text-center cursor-pointer transition-colors shadow-sm"
                  disabled={submittingReflection}
                >
                  {submittingReflection ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
