import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateStreaks, getLocalDateString, isScheduledDay } from '../lib/streaks'

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

const ENCOURAGEMENTS = [
  "Quiet progress is still progress.",
  "Be gentle with yourself. Growth is a slow, steady tide.",
  "Tiny steps create lasting paths. Take it one breath at a time.",
  "Your effort today, however small, is enough.",
  "Every tiny choice is a seed for tomorrow's ease."
]

export default function Dashboard() {
  const { user, name, signOut } = useAuth()
  const navigate = useNavigate()

  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [loadingData, setLoadingData] = useState(true)
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

  const todayDate = new Date()
  const yesterdayDate = new Date(Date.now() - 86400000)

  // 1. Check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!data || !data.onboarding_completed) {
          navigate('/onboarding')
        } else {
          setCheckingOnboarding(false)
        }
      } catch (err) {
        console.error(err)
        setCheckingOnboarding(false)
      }
    }

    checkOnboardingStatus()
  }, [user, navigate])

  // 2. Fetch habits and logs
  const fetchDashboardData = async () => {
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
        .select('id, area')
        .eq('user_id', user.id)

      if (goalsError) throw goalsError

      const combined = (habitsData || []).map((h) => ({
        ...h,
        goals: goalsData?.find((g) => g.id === h.goal_id) || null
      }))

      setHabits(combined)
    } catch (err) {
      console.error('Error fetching dashboard habits:', err)
      setError('Could not load your habits for today. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!checkingOnboarding) {
      fetchDashboardData()
    }
  }, [user, checkingOnboarding])

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  const handleCheckIn = async (habit: Habit) => {
    if (!user) return
    setError(null)

    // Local check to prevent duplicate log creations
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

      if (logError) {
        if (logError.code === '23505') {
          // unique constraint violation
          fetchDashboardData()
          return
        }
        throw logError
      }

      if (data) {
        // Update local state immediately
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

      // Update local state
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

  // Get time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Filter habits scheduled for today
  const scheduledToday = habits.filter((h) => isScheduledDay(todayDate, h.frequency, h.custom_days))
  
  // Calculate completed count
  const completedTodayCount = scheduledToday.filter((h) =>
    h.habit_logs.some((l) => l.log_date === todayStr)
  ).length

  // Check if any habit scheduled yesterday was missed
  let missedYesterday = false
  habits.forEach((h) => {
    const isScheduledYesterday = isScheduledDay(yesterdayDate, h.frequency, h.custom_days)
    const completedYesterday = h.habit_logs.some((l) => l.log_date === yesterdayStr)
    if (isScheduledYesterday && !completedYesterday) {
      missedYesterday = true
    }
  })

  // Select encouragement quote
  const dayIndex = new Date().getDate() % ENCOURAGEMENTS.length
  const encouragement = missedYesterday
    ? 'Each day is a fresh starting line. Begin again, gently.'
    : ENCOURAGEMENTS[dayIndex]

  // Calculate best current streak and best longest streak across all habits
  let bestCurrentStreak = 0
  let bestLongestStreak = 0
  habits.forEach((h) => {
    const stats = calculateStreaks(h.start_date, h.frequency, h.custom_days, h.habit_logs, todayStr)
    if (stats.current_streak > bestCurrentStreak) {
      bestCurrentStreak = stats.current_streak
    }
    if (stats.longest_streak > bestLongestStreak) {
      bestLongestStreak = stats.longest_streak
    }
  })

  if (checkingOnboarding || loadingData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans">
        <div className="text-plum-main font-medium tracking-wide animate-pulse">
          Loading dashboard...
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        
        {/* Header with time-aware greeting and navigation */}
        <header className="flex justify-between items-start mb-6 select-none">
          <div className="text-left">
            <h1 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight">
              {getGreeting()}, {name || 'Friend'}
            </h1>
            <p className="text-xs text-plum-light/70 font-light">One tiny win at a time.</p>
          </div>
          <div className="flex gap-2">
            <Link 
              to="/habits" 
              className="p-2.5 rounded-xl bg-cream-dark/15 border border-plum-main/5 text-plum-main hover:bg-cream-dark/30 transition-colors"
              title="My Habits"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Encouragement note */}
            <div className="text-left py-2 px-1 mb-4 select-none">
              <p className="text-xs font-serif italic text-plum-light/80 leading-relaxed font-light">
                "{encouragement}"
              </p>
            </div>

            {/* Wins progress bar */}
            {scheduledToday.length > 0 && (
              <div className="mb-6 text-left">
                <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold text-plum-light/50 mb-1 px-1 select-none">
                  <span>Wins Today</span>
                  <span>{completedTodayCount} of {scheduledToday.length} completed</span>
                </div>
                <div className="w-full bg-plum-main/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-sunset-end h-full transition-all duration-300"
                    style={{ width: `${(completedTodayCount / scheduledToday.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Today's scheduled habits */}
            <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1 text-left scrollbar-thin mb-4">
              {scheduledToday.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-plum-main/10 rounded-2xl select-none">
                  <p className="text-xs text-plum-light/60 italic">
                    Nothing scheduled today. Rest is part of growth.
                  </p>
                </div>
              ) : (
                scheduledToday.map((habit) => {
                  const stats = calculateStreaks(habit.start_date, habit.frequency, habit.custom_days, habit.habit_logs, todayStr)
                  const isCompleted = habit.habit_logs.some((l) => l.log_date === todayStr)

                  return (
                    <div 
                      key={habit.id}
                      className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[8px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                              {habit.goals?.area || 'General'}
                            </span>
                            {stats.current_streak > 0 && (
                              <span className="text-[8px] text-sunset-end bg-sunset-end/10 px-1.5 py-0.5 rounded font-bold">
                                🔥 {stats.current_streak}d streak
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-plum-dark text-sm mb-0.5">{habit.name}</h4>
                          <p className="text-xs text-plum-light/80 font-light">
                            Tiny goal: {habit.tiny_goal}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isCompleted ? (
                          <div className="w-full bg-green-50/15 border border-green-600/10 text-green-700 py-2.5 px-3 rounded-xl text-center text-xs font-semibold select-none flex items-center justify-center gap-1 animate-fadeIn">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>You showed up!</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCheckIn(habit)}
                            className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 px-3 rounded-xl font-medium text-xs text-center cursor-pointer transition-colors shadow-sm shadow-plum-main/5"
                          >
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Streak Summary */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-left select-none">
              <div className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-3">
                <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1">
                  Active Streak
                </span>
                <span className="text-base font-serif text-plum-dark italic font-bold">
                  🔥 {bestCurrentStreak} {bestCurrentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <div className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-3">
                <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1">
                  Longest Streak
                </span>
                <span className="text-base font-serif text-plum-dark italic font-bold">
                  🏆 {bestLongestStreak} {bestLongestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>

            {/* Tiny Coach Placeholder Note Card */}
            <div className="bg-cream-light border border-plum-main/10 rounded-2xl p-4 text-left shadow-sm select-none mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sunset-end"></span>
                <h4 className="text-[10px] uppercase tracking-wider text-plum-light/60 font-bold">
                  Tiny Coach
                </h4>
              </div>
              <p className="text-xs text-plum-dark/80 font-light leading-relaxed">
                Tiny Coach is warming up — real notes coming soon.
              </p>
            </div>

          </div>
        </div>

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
