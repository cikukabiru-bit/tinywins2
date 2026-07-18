import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { calculateStreaks, getLocalDateString, isScheduledDay } from '../lib/streaks'
import { generateGeneralSuggestion, getSuggestionWithFallback, type CoachSuggestion } from '../lib/coach'
import { getInspiration } from '../lib/inspiration'
import { fetchActiveReminders, getDueReminders, triggerLocalNotificationIfPermitted, type Reminder } from '../lib/remindersManager'

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



export default function Dashboard() {
  const { user, name, signOut } = useAuth()
  const navigate = useNavigate()

  const [checkingOnboarding, setCheckingOnboarding] = useState(true)
  const [habits, setHabits] = useState<Habit[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachTone, setCoachTone] = useState('Gentle')
  const [coachSuggestion, setCoachSuggestion] = useState<CoachSuggestion | null>(null)
  const [loadingCoach, setLoadingCoach] = useState(false)

  // Reflection modal states
  const [activeReflectionLogId, setActiveReflectionLogId] = useState<string | null>(null)
  const [activeHabitId, setActiveHabitId] = useState<string | null>(null)
  const [reflectionText, setReflectionText] = useState('')
  const [selectedMood, setSelectedMood] = useState('neutral')
  const [selectedEffort, setSelectedEffort] = useState('okay')
  const [submittingReflection, setSubmittingReflection] = useState(false)

  // Inspirations
  const [inspiration, setInspiration] = useState<any | null>(null)
  const [reflectionInspiration, setReflectionInspiration] = useState<any | null>(null)

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)

  // Evening Encouragement states
  const [eveningHour, setEveningHour] = useState(20)
  const [dismissedEveningEncouragement, setDismissedEveningEncouragement] = useState(() => {
    const today = getLocalDateString()
    return localStorage.getItem(`dismissed_evening_${today}`) === 'true'
  })
  const [eveningInspiration, setEveningInspiration] = useState<any | null>(null)

  // Habit Log Status states
  const [selectedStatus, setSelectedStatus] = useState<'completed' | 'partial' | 'not_done'>('completed')

  // Reminders & PWA Push
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>(() => {
    return ('Notification' in window) ? Notification.permission : 'denied'
  })
  const [dismissedNotificationPromo, setDismissedNotificationPromo] = useState<boolean>(() => {
    return localStorage.getItem('dismissed_notification_promo') === 'true'
  })

  const todayStr = getLocalDateString()
  const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000))

  const todayDate = new Date()
  const yesterdayDate = new Date(Date.now() - 86400000)

  const [dismissedNudges, setDismissedNudges] = useState<string[]>(() => {
    const list = localStorage.getItem('dismissed_nudges_' + todayStr)
    return list ? JSON.parse(list) : []
  })

  const dismissNudge = (habitId: string) => {
    const newList = [...dismissedNudges, habitId]
    setDismissedNudges(newList)
    localStorage.setItem('dismissed_nudges_' + todayStr, JSON.stringify(newList))
  }

  // 1. Check onboarding status
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed, coach_tone, evening_reflection_hour')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (!data || !data.onboarding_completed) {
          navigate('/onboarding')
        } else {
          if (data.coach_tone) {
            setCoachTone(data.coach_tone)
          }
          if (data.evening_reflection_hour !== undefined && data.evening_reflection_hour !== null) {
            setEveningHour(data.evening_reflection_hour)
          }
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
        .select('id, area, active')
        .eq('user_id', user.id)
        .eq('active', true)

      if (goalsError) throw goalsError

      const combined = (habitsData || []).map((h) => ({
        ...h,
        goals: goalsData?.find((g) => g.id === h.goal_id) || null
      })).filter(h => h.goals !== null)

      setHabits(combined)

      // Fetch active reminders
      const activeRems = await fetchActiveReminders(user.id)
      setReminders(activeRems)
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

  useEffect(() => {
    const loadCoachSuggestion = async () => {
      if (habits.length === 0 || !user) return

      // Calculate local mock suggestion first so the card is never empty
      const localSugg = generateGeneralSuggestion(habits, coachTone, todayStr)
      setCoachSuggestion(localSugg)

      const consent = localStorage.getItem(`ai_personalization_consent_${user.id}`) === 'true'
      if (!consent) return

      setLoadingCoach(true)
      const sugg = await getSuggestionWithFallback(
        null,
        habits,
        [],
        coachTone,
        todayStr,
        supabase,
        consent
      )
      setCoachSuggestion(sugg)
      setLoadingCoach(false)
    }

    if (!loadingData) {
      loadCoachSuggestion()
    } else {
      setCoachSuggestion(null)
    }
  }, [habits, coachTone, user, loadingData])

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA install response: ${outcome}`)
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

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
        setSelectedStatus('completed')
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
          effort_level: selectedEffort,
          status: selectedStatus
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
                    effort_level: selectedEffort,
                    status: selectedStatus
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
    h.habit_logs.some((l) => l.log_date === todayStr && l.status !== 'not_done')
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

  // Fetch real-time inspirations
  useEffect(() => {
    const fetchDashboardInspirations = async () => {
      if (!user || loadingData) return

      try {
        // Fetch profile preferences
        const { data: profileData } = await supabase
          .from('profiles')
          .select('inspiration_preferences, coach_tone')
          .eq('user_id', user.id)
          .maybeSingle()

        const preferences = profileData?.inspiration_preferences || []
        const tone = profileData?.coach_tone || 'calm'

        // Determine if they missed habits yesterday (soft return context)
        const isSoftReturn = missedYesterday
        // Determine if they have a strong streak
        const isStrongStreak = bestCurrentStreak >= 3

        const mainIns = await getInspiration(user.id, preferences, {
          isSoftReturn,
          isStrongStreak,
          tone
        })
        setInspiration(mainIns)

        const refIns = await getInspiration(user.id, preferences, {
          tone
        })
        setReflectionInspiration(refIns)

        const eveIns = await getInspiration(user.id, preferences, {
          tone
        })
        setEveningInspiration(eveIns)
      } catch (err) {
        console.error('Error fetching dashboard inspirations:', err)
      }
    }

    fetchDashboardInspirations()
  }, [user, loadingData, missedYesterday, bestCurrentStreak])

  // Reminders Selection (Layer 1 In-App)
  const activeDueReminders = getDueReminders(reminders).filter((rem) => {
    const habitObj = habits.find(h => h.id === rem.habit_id)
    const isCompleted = habitObj?.habit_logs.some(l => l.log_date === todayStr)
    return !isCompleted
  })

  // Background browser push scheduling (Layer 2 Best-Effort)
  useEffect(() => {
    if (notificationPermissionStatus !== 'granted' || activeDueReminders.length === 0) return

    const sentKey = `sent_notifications_${todayStr}`
    const sentIds = JSON.parse(sessionStorage.getItem(sentKey) || '[]')

    activeDueReminders.forEach((rem) => {
      if (!sentIds.includes(rem.id)) {
        triggerLocalNotificationIfPermitted(`TinyWins: ${rem.habits?.name}`, {
          body: rem.message || 'Time for your tiny win.'
        })
        sentIds.push(rem.id)
      }
    })

    sessionStorage.setItem(sentKey, JSON.stringify(sentIds))
  }, [notificationPermissionStatus, activeDueReminders, todayStr])

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotificationPermissionStatus(result)
    if (result === 'granted') {
      triggerLocalNotificationIfPermitted('TinyWins Reminders Enabled', {
        body: "We'll gently notify you when it's time for your habits!"
      })
    }
  }

  const handleDismissNotificationPromo = () => {
    setDismissedNotificationPromo(true)
    localStorage.setItem('dismissed_notification_promo', 'true')
  }

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

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left leading-relaxed">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Encouragement note */}
            {inspiration && (
              <div className="text-left py-2 px-1 mb-4 select-none">
                <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-0.5">
                  Today's encouragement
                </span>
                <p className="text-xs font-serif italic text-plum-light/85 leading-relaxed font-light">
                  "{inspiration.text}"
                  {(inspiration.author || inspiration.source) && (
                    <span className="block text-[8px] text-plum-light/50 font-normal font-sans mt-0.5">
                      — {inspiration.author && inspiration.source 
                          ? `${inspiration.author}, ${inspiration.source}` 
                          : (inspiration.author || inspiration.source)}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Evening Reflection Card */}
            {(new Date().getHours() >= eveningHour) && !dismissedEveningEncouragement && (
              <div className="bg-plum-main text-cream-light border border-plum-light/20 rounded-3xl p-5 mb-5 text-left animate-fadeIn relative">
                <button
                  onClick={() => {
                    localStorage.setItem(`dismissed_evening_${todayStr}`, 'true')
                    setDismissedEveningEncouragement(true)
                  }}
                  className="absolute right-3 top-3 text-cream-light/40 hover:text-cream-light p-1 cursor-pointer"
                  aria-label="Dismiss evening encouragement"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <span className="block text-[8px] uppercase tracking-wider text-sunset-mid font-bold mb-1.5">
                  🌙 Evening Reflection
                </span>
                
                <p className="text-sm font-serif italic text-cream-light leading-relaxed mb-3">
                  "{
                    (() => {
                      if (scheduledToday.length === 0) {
                        return "Today was a rest day. Resting is part of growing. Rest well."
                      }
                      const logsToday = scheduledToday.map(h => 
                        h.habit_logs.find(l => l.log_date === todayStr) || null
                      ).filter(l => l !== null);

                      if (logsToday.length === 0) {
                        return "Today was quiet. That's okay. Tomorrow is still yours."
                      }
                      const completedCount = logsToday.filter(l => l.status === 'completed').length;
                      const partialCount = logsToday.filter(l => l.status === 'partial').length;
                      if (logsToday.length === scheduledToday.length && completedCount >= scheduledToday.length * 0.5) {
                        return "You did it! You showed up fully for your intentions today. Rest well."
                      }
                      if (completedCount > 0 || partialCount > 0) {
                        return "You showed up today, and that counts."
                      }
                      return "Today was quiet. That's okay. Tomorrow is still yours."
                    })()
                  }"
                </p>

                {eveningInspiration && (
                  <div className="border-t border-cream-light/10 pt-3 select-none">
                    <span className="block text-[7px] uppercase tracking-wider text-sunset-mid/80 font-bold mb-1">
                      A small thought for tonight
                    </span>
                    <p className="text-[10px] font-serif italic text-cream-light/80 leading-relaxed font-light">
                      "{eveningInspiration.text}"
                      {(eveningInspiration.author || eveningInspiration.source) && (
                        <span className="block text-[8px] text-cream-light/40 font-normal font-sans mt-0.5">
                          — {eveningInspiration.author && eveningInspiration.source 
                              ? `${eveningInspiration.author}, ${eveningInspiration.source}` 
                              : (eveningInspiration.author || eveningInspiration.source)}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Gentle PWA Install Banner */}
            {showInstallPrompt && (
              <div className="bg-sunset-start border border-sunset-end/20 rounded-2xl p-4 mb-4 text-left animate-fadeIn flex justify-between items-center gap-4 relative">
                <div className="min-w-0 flex-1 select-none">
                  <span className="block text-[8px] uppercase tracking-wider text-sunset-end font-bold mb-1">
                    ✨ TinyWins App
                  </span>
                  <p className="text-xs text-plum-dark font-medium">
                    Install TinyWins on your screen
                  </p>
                  <p className="text-[10px] text-plum-light font-light leading-relaxed mt-0.5">
                    Access your daily wins quickly as a standalone app.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleInstallClick}
                    className="bg-sunset-end hover:bg-sunset-end/90 text-cream-light py-1.5 px-3 rounded-xl text-[9px] font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Install
                  </button>
                  <button
                    onClick={() => setShowInstallPrompt(false)}
                    className="text-plum-light/50 hover:text-plum-main p-1.5 cursor-pointer"
                    aria-label="Dismiss prompt"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Notification permission opt-in card */}
            {notificationPermissionStatus === 'default' && !dismissedNotificationPromo && (
              <div className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 mb-4 text-left animate-fadeIn select-none">
                <h4 className="text-[9px] uppercase tracking-wider text-plum-light/65 font-bold mb-1.5 ml-0.5">Browser Reminders</h4>
                <p className="text-xs text-plum-dark/95 font-light leading-relaxed mb-3">
                  TinyWins can gently remind you when it's time for a small habit. You can change this anytime.
                </p>
                <p className="text-[7.5px] text-plum-light/50 font-light leading-relaxed mb-3">
                  * Background reminders work best when TinyWins is added to your home screen. Timing can vary by device.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestNotificationPermission}
                    className="bg-plum-main hover:bg-plum-dark text-cream-light py-1.5 px-3.5 rounded-xl font-medium text-[10px] cursor-pointer"
                  >
                    Enable notifications
                  </button>
                  <button
                    type="button"
                    onClick={handleDismissNotificationPromo}
                    className="border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-1.5 px-3.5 rounded-xl font-medium text-[10px] cursor-pointer bg-cream-light"
                  >
                    Not now
                  </button>
                </div>
              </div>
            )}

            {/* Active Due Reminders (Layer 1 In-App) */}
            {activeDueReminders.length > 0 && (
              <div className="bg-sunset-end/10 border border-sunset-end/20 rounded-2xl p-4 mb-4 text-left animate-fadeIn select-none">
                <span className="block text-[8px] uppercase tracking-wider text-sunset-end font-bold mb-2 ml-0.5">
                  🔔 Gentle Reminder
                </span>
                <div className="flex flex-col gap-3">
                  {activeDueReminders.map((rem) => {
                    const habitObj = habits.find(h => h.id === rem.habit_id)
                    return (
                      <div key={rem.id} className="flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-plum-dark">
                            {rem.habits?.name}
                          </p>
                          <p className="text-[10px] text-plum-light leading-relaxed font-light mt-0.5">
                            "{rem.message || 'Time for your tiny win.'}"
                          </p>
                        </div>
                        <button
                          onClick={() => handleCheckIn(habitObj!)}
                          className="bg-plum-main hover:bg-plum-dark text-cream-light py-1 px-3 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
                  const isSavedByFreeze = stats.freeze_used_dates.includes(yesterdayStr)
                  
                  // Setup nudge rotation
                  const nudgeText = (inspiration?.type === 'restart' ? inspiration.text : null) || 'Begin again, without punishment. A soft reset is still progress.'
                  const showNudge = stats.consecutive_missed >= 3 && !isCompleted && !dismissedNudges.includes(habit.id)

                  return (
                    <div 
                      key={habit.id}
                      className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              <span className="text-[8px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                {habit.goals?.area || 'General'}
                              </span>
                              {stats.current_streak > 0 && (
                                <span className="text-[8px] text-sunset-end bg-sunset-end/10 px-1.5 py-0.5 rounded font-bold">
                                  🔥 {stats.current_streak}d streak
                                </span>
                              )}
                              <span className="text-[8px] text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5 select-none">
                                ❄️ {stats.remaining_freezes} {stats.remaining_freezes === 1 ? 'freeze' : 'freezes'}
                              </span>
                              {isSavedByFreeze && (
                                <span className="text-[8px] text-green-700 bg-green-50/15 border border-green-600/10 px-1.5 py-0.5 rounded font-semibold select-none">
                                  🛡️ Saved by freeze
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-plum-dark text-sm mb-0.5">{habit.name}</h4>
                            <p className="text-xs text-plum-light/80 font-light">
                              Tiny goal: {habit.tiny_goal}
                            </p>
                          </div>
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

            {/* Tiny Coach Card */}
            {coachSuggestion && (
              <div className="bg-cream-light border border-plum-main/10 rounded-2xl p-4 text-left shadow-sm select-none mb-2 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${loadingCoach ? 'bg-sunset-end animate-ping' : 'bg-sunset-end'}`}></span>
                    <h4 className="text-[10px] uppercase tracking-wider text-plum-light/60 font-bold flex items-center gap-1">
                      <span>Tiny Coach</span>
                      {loadingCoach && <span className="lowercase font-normal text-[7px] text-plum-light/45">(thinking...)</span>}
                    </h4>
                  </div>
                  <Link to="/coach" className="text-[10px] text-sunset-end hover:text-plum-main font-semibold flex items-center gap-0.5">
                    <span>View all</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
                <p className="text-xs text-plum-dark/80 font-light leading-relaxed mb-3">
                  "{coachSuggestion.message}"
                </p>
                {coachSuggestion.actionLabel && coachSuggestion.actionPath && (
                  <Link
                    to={coachSuggestion.actionPath}
                    className="inline-block bg-plum-main/5 hover:bg-plum-main/10 text-plum-main text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    {coachSuggestion.actionLabel}
                  </Link>
                )}
              </div>
            )}

          </div>

          {/* Bottom Navigation */}
          <nav className="mt-8 pt-4 border-t border-plum-main/10 flex justify-around items-center text-xs select-none">
            <Link to="/today" className="flex flex-col items-center gap-0.5 cursor-pointer text-sunset-end font-bold transition-colors">
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
            <Link to="/library" className="flex flex-col items-center gap-0.5 cursor-pointer text-plum-light/50 hover:text-plum-main transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-[9px]">Library</span>
            </Link>
          </nav>
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
            <p className="text-xs text-plum-light/70 mb-4 leading-relaxed font-sans">
              Take a moment to check in with yourself. This is entirely optional.
            </p>

            {reflectionInspiration && (
              <div className="bg-cream-dark/15 border border-plum-main/5 p-3 rounded-2xl mb-4 select-none">
                <span className="block text-[7px] uppercase tracking-wider text-plum-light/55 font-bold mb-1">
                  A small thought for today
                </span>
                <p className="text-[10px] font-serif italic text-plum-dark leading-relaxed font-light">
                  "{reflectionInspiration.text}"
                  {(reflectionInspiration.author || reflectionInspiration.source) && (
                    <span className="block text-[8px] text-plum-light/50 font-normal font-sans mt-0.5">
                      — {reflectionInspiration.author && reflectionInspiration.source 
                          ? `${reflectionInspiration.author}, ${reflectionInspiration.source}` 
                          : (reflectionInspiration.author || reflectionInspiration.source)}
                    </span>
                  )}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Status picker */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-2 ml-1">
                  Status
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'completed', label: 'Completed' },
                    { value: 'partial', label: 'Partial' },
                    { value: 'not_done', label: 'Not Done' }
                  ].map((statusOpt) => {
                    const isSelected = selectedStatus === statusOpt.value
                    return (
                      <button
                        key={statusOpt.value}
                        type="button"
                        onClick={() => setSelectedStatus(statusOpt.value as any)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer select-none text-center ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30'
                        }`}
                        disabled={submittingReflection}
                      >
                        {statusOpt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

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
