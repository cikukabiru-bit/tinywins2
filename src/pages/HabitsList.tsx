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
  const { user } = useAuth()
  const navigate = useNavigate()

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

  const fetchHabits = async () => {
    if (!user) return

    try {
      const { data, error: fetchError } = await supabase
        .from('habits')
        .select('*, goals(area), habit_logs(*)')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setHabits(data || [])
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
        <div className="flex items-center justify-between mb-6">
          <Link to="/today" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            My Habits
          </span>
          <div className="w-5"></div>
        </div>

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

                        return (
                          <div 
                            key={habit.id} 
                            className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col transition-all hover:border-plum-main/20"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span className="text-[9px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                    {habit.category}
                                  </span>
                                  {habit.preferred_time && (
                                    <span className="text-[9px] text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded font-medium">
                                      {habit.preferred_time}
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

                            {/* Streaks & Stats */}
                            <div className="flex gap-4 mt-3 text-[10px] text-plum-light/60 font-semibold select-none border-t border-plum-main/5 pt-2.5">
                              <span>🔥 {stats.current_streak} streak</span>
                              <span>🏆 {stats.longest_streak} longest</span>
                              <span>✨ {stats.total_completions} completions</span>
                            </div>

                            {/* Check In Action */}
                            <div className="mt-3">
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
