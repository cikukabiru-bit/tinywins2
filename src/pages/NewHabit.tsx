import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Goal {
  id: string
  area: string
}

export default function NewHabit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Query parameter pre-fills
  const preGoalId = searchParams.get('goalId') || ''
  const preName = searchParams.get('name') || ''
  const preCategory = searchParams.get('category') || 'Physical'
  const habitScoreId = searchParams.get('habitScoreId') || ''

  // Goals list for dropdown
  const [goals, setGoals] = useState<Goal[]>([])
  const [loadingGoals, setLoadingGoals] = useState<boolean>(true)

  // Form states
  const [name, setName] = useState(preName)
  const [category, setCategory] = useState(preCategory)
  const [tinyGoal, setTinyGoal] = useState('')
  const [goalId, setGoalId] = useState(preGoalId)
  const [frequency, setFrequency] = useState('daily')
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]) // Default to weekdays
  const [preferredTime, setPreferredTime] = useState('Morning')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [growthMode, setGrowthMode] = useState('Increase slowly')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch active goals for dropdown
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return

      try {
        const { data, error: fetchError } = await supabase
          .from('goals')
          .select('id, area')
          .eq('user_id', user.id)
          .eq('active', true)

        if (fetchError) throw fetchError
        setGoals(data || [])

        // If no goalId pre-filled, default to first active goal
        if (!preGoalId && data && data.length > 0) {
          setGoalId(data[0].id)
        }
      } catch (err) {
        console.error('Error fetching goals:', err)
        setError('Could not load your active goals. Please try again.')
      } finally {
        setLoadingGoals(false)
      }
    }

    fetchGoals()
  }, [user, preGoalId])

  const handleToggleCustomDay = (dayIdx: number) => {
    setCustomDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!name.trim() || !tinyGoal.trim() || !goalId) {
      setError('Please fill in all required fields.')
      return
    }

    // Determine custom_days value based on frequency choice
    let daysArray: number[] = []
    if (frequency === 'daily') {
      daysArray = [0, 1, 2, 3, 4, 5, 6]
    } else if (frequency === 'weekdays') {
      daysArray = [1, 2, 3, 4, 5]
    } else if (frequency === 'weekends') {
      daysArray = [0, 6]
    } else if (frequency === 'custom') {
      if (customDays.length === 0) {
        setError('Please select at least one day for custom frequency.')
        return
      }
      daysArray = customDays
    }

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        user_id: user.id,
        goal_id: goalId,
        name: name.trim(),
        category,
        tiny_goal: tinyGoal.trim(),
        frequency,
        custom_days: daysArray,
        preferred_time: preferredTime,
        reminder_enabled: reminderEnabled,
        growth_mode: growthMode,
        active: true
      }

      // Insert habit
      const { error: insertError } = await supabase
        .from('habits')
        .insert(payload)

      if (insertError) throw insertError

      // If this came from a habit score card reflection, mark it as converted
      if (habitScoreId) {
        const { error: updateError } = await supabase
          .from('habit_scores')
          .update({ converted_to_habit: true })
          .eq('id', habitScoreId)

        if (updateError) {
          console.error('Error marking score converted:', updateError)
        }
      }

      navigate('/habits')
    } catch (err) {
      console.error(err)
      setError('Could not save this habit. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/habits" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            New Habit
          </span>
          <div className="w-5"></div> {/* spacer */}
        </div>

        {loadingGoals ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading setup...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left leading-relaxed">
                  {error}
                </div>
              )}

              {goals.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-medium text-plum-dark/60 mb-4">No active goals found.</p>
                  <p className="text-xs text-plum-light/60 mb-6 leading-normal">
                    You must complete onboarding or set up an active goal before creating a habit.
                  </p>
                  <Link
                    to="/onboarding"
                    className="bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 px-4 rounded-xl font-medium text-xs transition-colors"
                  >
                    Go to Onboarding
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left max-h-[350px] overflow-y-auto pr-1 scrollbar-thin my-2">
                  
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Habit Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
                      placeholder="e.g. morning stretch"
                      required
                      disabled={submitting}
                    />
                  </div>

                  {/* Tiny Goal */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Tiny Goal</label>
                    <input
                      type="text"
                      value={tinyGoal}
                      onChange={(e) => setTinyGoal(e.target.value)}
                      className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
                      placeholder="e.g. Stretch for 2 minutes"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Goal Association */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Belongs to Goal</label>
                      <select
                        value={goalId}
                        onChange={(e) => setGoalId(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs md:text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                        disabled={submitting}
                      >
                        {goals.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.area}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs md:text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                        disabled={submitting}
                      >
                        <option value="Physical">Physical</option>
                        <option value="Mental">Mental</option>
                        <option value="Work">Work</option>
                        <option value="Spiritual">Spiritual</option>
                        <option value="Social">Social</option>
                        <option value="Financial">Financial</option>
                        <option value="Self-care">Self-care</option>
                        <option value="Routine">Routine</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Frequency */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Frequency</label>
                      <select
                        value={frequency}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs md:text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                        disabled={submitting}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekdays">Weekdays</option>
                        <option value="weekends">Weekends</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    {/* Preferred Time */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Preferred Time</label>
                      <input
                        type="text"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
                        placeholder="e.g. Morning, 8:00 AM"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Custom days multi-select (conditional) */}
                  {frequency === 'custom' && (
                    <div className="mt-1 mb-2 animate-fadeIn text-center">
                      <label className="block text-[10px] text-left uppercase tracking-wider text-plum-light/70 font-semibold mb-2 ml-1">
                        Select Active Days
                      </label>
                      <div className="flex gap-1.5 justify-between">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                          const isChecked = customDays.includes(idx)
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleToggleCustomDay(idx)}
                              className={`w-9 h-9 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer select-none ${
                                isChecked
                                  ? 'bg-plum-main text-cream-light border-plum-main shadow-sm'
                                  : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30'
                              }`}
                              disabled={submitting}
                            >
                              {day}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Growth Mode */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Growth Mode</label>
                    <select
                      value={growthMode}
                      onChange={(e) => setGrowthMode(e.target.value)}
                      className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      disabled={submitting}
                    >
                      <option value="Keep tiny">Keep tiny</option>
                      <option value="Increase slowly">Increase slowly</option>
                      <option value="Increase only when I choose">Increase only when I choose</option>
                      <option value="Let Tiny Coach suggest">Let Tiny Coach suggest</option>
                    </select>
                  </div>

                  {/* Reminders Toggle */}
                  <div className="flex items-center gap-2 mt-2 select-none">
                    <input
                      type="checkbox"
                      id="reminder-toggle"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="w-4 h-4 rounded border-plum-main/20 text-plum-main focus:ring-plum-main/30 accent-plum-main cursor-pointer"
                      disabled={submitting}
                    />
                    <label htmlFor="reminder-toggle" className="text-xs text-plum-light/80 cursor-pointer">
                      Enable daily reminder (placeholder)
                    </label>
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 mt-4 pt-3 border-t border-plum-main/10">
                    <Link
                      to="/habits"
                      className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-cream-light/30 hover:bg-cream-light/60 text-sm text-center"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-2 bg-plum-main hover:bg-plum-dark text-cream-light py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-cream-light" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Create habit</span>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
