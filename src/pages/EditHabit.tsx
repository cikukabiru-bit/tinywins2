import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Goal {
  id: string
  area: string
}

export default function EditHabit() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Custom rest confirmation overlay state
  const [showRestConfirm, setShowRestConfirm] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Physical')
  const [tinyGoal, setTinyGoal] = useState('')
  const [goalId, setGoalId] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [customDays, setCustomDays] = useState<number[]>([])
  const [preferredTime, setPreferredTime] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [growthMode, setGrowthMode] = useState('Increase slowly')

  const [submitting, setSubmitting] = useState(false)

  // Fetch goals and habit details
  useEffect(() => {
    const fetchInitData = async () => {
      if (!user || !id) return

      try {
        // 1. Fetch user's goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('id, area')
          .eq('user_id', user.id)
          .eq('active', true)

        if (goalsError) throw goalsError
        setGoals(goalsData || [])

        // 2. Fetch the habit
        const { data: habitData, error: habitError } = await supabase
          .from('habits')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (habitError) throw habitError
        if (!habitData) {
          setError('We could not find the requested habit.')
          return
        }

        // 3. Pre-populate states
        setName(habitData.name)
        setCategory(habitData.category || 'Physical')
        setTinyGoal(habitData.tiny_goal || '')
        setGoalId(habitData.goal_id)
        setFrequency(habitData.frequency)
        setCustomDays(habitData.custom_days || [])
        setPreferredTime(habitData.preferred_time || '')
        setReminderEnabled(habitData.reminder_enabled)
        setGrowthMode(habitData.growth_mode || 'Increase slowly')

      } catch (err) {
        console.error('Error fetching edit data:', err)
        setError('A small issue occurred while loading this habit.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitData()
  }, [user, id])

  const handleToggleCustomDay = (dayIdx: number) => {
    setCustomDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    )
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return

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
        goal_id: goalId,
        name: name.trim(),
        category,
        tiny_goal: tinyGoal.trim(),
        frequency,
        custom_days: daysArray,
        preferred_time: preferredTime,
        reminder_enabled: reminderEnabled,
        growth_mode: growthMode,
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('habits')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      navigate('/habits')
    } catch (err) {
      console.error(err)
      setError('Could not update this habit. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestHabit = async () => {
    if (!user || !id) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: restError } = await supabase
        .from('habits')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (restError) throw restError

      navigate('/habits')
    } catch (err) {
      console.error(err)
      setError('Could not rest this habit. Please check your connection.')
      setShowRestConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isNextDisabled = frequency === 'custom' && customDays.length === 0

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
            Edit Habit
          </span>
          <div className="w-5"></div> {/* spacer */}
        </div>

        {/* Custom Confirmation Overlay */}
        {showRestConfirm && (
          <div className="absolute inset-0 bg-cream-light/95 rounded-3xl p-8 flex flex-col justify-center items-center z-20 text-center animate-fadeIn">
            <svg className="w-12 h-12 text-plum-main/40 mb-4 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-serif text-2xl font-normal text-plum-dark italic mb-2">Rest this habit?</h3>
            <p className="text-xs text-plum-light/80 mb-6 max-w-[220px] leading-relaxed">
              Resting this habit will pause tracking. You can bring it back anytime.
            </p>
            <div className="flex gap-3 w-full max-w-[240px]">
              <button
                type="button"
                onClick={() => setShowRestConfirm(false)}
                className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-2.5 rounded-xl font-medium text-xs cursor-pointer bg-cream-light"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRestHabit}
                className="flex-1 bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-xl font-medium text-xs cursor-pointer shadow-sm"
              >
                Rest Habit
              </button>
            </div>
          </div>
        )}

        {loading ? (
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

              <form onSubmit={handleUpdate} className="flex flex-col gap-3 text-left max-h-[350px] overflow-y-auto pr-1 scrollbar-thin my-2">
                
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

                {/* Custom days select (conditional) */}
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
                <div className="flex flex-col gap-3 mt-4 pt-3 border-t border-plum-main/10">
                  <div className="flex gap-3">
                    <Link
                      to="/habits"
                      className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-cream-light/30 hover:bg-cream-light/60 text-sm text-center"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      disabled={submitting || isNextDisabled}
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
                        <span>Save changes</span>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRestConfirm(true)}
                    disabled={submitting}
                    className="w-full border border-plum-main/15 text-red-500 hover:bg-red-50 py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 text-sm cursor-pointer disabled:opacity-50"
                  >
                    Rest this habit
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
