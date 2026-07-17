import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const FOCUS_AREAS = [
  'Health', 'Fitness', 'Sleep', 'Focus', 'Learning',
  'Prayer/Spirituality', 'Money', 'Work/Productivity',
  'Self-care', 'Relationships', 'Emotional wellbeing'
]

const TIME_AMOUNTS = [
  '1 minute', '3 minutes', '5 minutes', '10 minutes', '15 minutes', 'Flexible'
]

const TIMES_OF_DAY = [
  'Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'
]

const GROWTH_PREFS = [
  'Keep tiny', 'Increase slowly', 'Increase only when I choose', 'Let Tiny Coach suggest'
]

interface Habit {
  id: string
  name: string
  tiny_goal: string
  frequency: string
}

export default function EditGoal() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [otherHabits, setOtherHabits] = useState<any[]>([])

  // Form states
  const [area, setArea] = useState('')
  const [availableTime, setAvailableTime] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [growthPreference, setGrowthPreference] = useState('')
  const [why, setWhy] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const fetchGoalDetails = async () => {
      if (!user || !id) return

      try {
        const { data: goalData, error: goalError } = await supabase
          .from('goals')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (goalError) throw goalError
        if (!goalData) {
          setError('Could not find this focus area.')
          return
        }

        setArea(goalData.area)
        setAvailableTime(goalData.available_time)
        setPreferredTime(goalData.preferred_time)
        setGrowthPreference(goalData.growth_preference)
        setWhy(goalData.why || '')
        setIsActive(goalData.active)

        // Fetch active habits under this goal
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('id, name, tiny_goal, frequency')
          .eq('goal_id', id)
          .eq('active', true)

        if (habitsError) throw habitsError
        setHabits(habitsData || [])

        // Fetch other active habits for dropdown
        const { data: otherHabitsData, error: otherHabitsError } = await supabase
          .from('habits')
          .select('id, name, tiny_goal, frequency, goal_id, goals(area)')
          .eq('user_id', user.id)
          .eq('active', true)
          .neq('goal_id', id)

        if (otherHabitsError) throw otherHabitsError
        setOtherHabits(otherHabitsData || [])
      } catch (err: any) {
        console.error(err)
        setError('A small issue occurred while loading details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchGoalDetails()
  }, [id, user])

  const handleMoveHabit = async (habitId: string) => {
    if (!user || !id) return
    const habit = otherHabits.find((h) => h.id === habitId)
    if (!habit) return

    const currentArea = habit.goals?.area || 'General'
    const confirm = window.confirm(
      `This will move '${habit.name}' from ${currentArea} to ${area}. That's okay?`
    )
    if (!confirm) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('habits')
        .update({ goal_id: id, updated_at: new Date().toISOString() })
        .eq('id', habitId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Refresh list
      const movedHabit = {
        id: habit.id,
        name: habit.name,
        tiny_goal: habit.tiny_goal || '',
        frequency: habit.frequency || 'daily'
      }
      setHabits((prev) => [...prev, movedHabit])
      setOtherHabits((prev) => prev.filter((h) => h.id !== habitId))
    } catch (err: any) {
      console.error(err)
      setError('Could not move habit. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({
          area,
          available_time: availableTime,
          preferred_time: preferredTime,
          growth_preference: growthPreference,
          why: why.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError
      navigate('/goals')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Could not save updates. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleRestGoal = async () => {
    if (!user || !id) return
    const confirm = window.confirm("Rest this goal — you can return to it anytime.")
    if (!confirm) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError
      navigate('/goals')
    } catch (err) {
      console.error(err)
      setError('Could not rest this goal.')
    } finally {
      setSaving(false)
    }
  }

  const handleReviveGoal = async () => {
    if (!user || !id) return
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ active: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError
      setIsActive(true)
    } catch (err) {
      console.error(err)
      setError('Could not revive this goal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/goals" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Edit Goal Focus
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading details...</span>
          </div>
        ) : error && !area ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-xs text-plum-light/80 text-center mb-4">{error}</p>
            <Link to="/goals" className="bg-plum-main hover:bg-plum-dark text-cream-light py-2 px-4 rounded-xl text-xs">
              Back to Goals
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between text-left">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-3 text-xs text-plum-light leading-relaxed">
                  {error}
                </div>
              )}

              {/* Area select */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                  Focus Area
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 select-none"
                >
                  {FOCUS_AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Timing settings row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                    Daily Time
                  </label>
                  <select
                    value={availableTime}
                    onChange={(e) => setAvailableTime(e.target.value)}
                    className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                  >
                    {TIME_AMOUNTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                    Time of Day
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                  >
                    {TIMES_OF_DAY.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Growth preference */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                  How should it grow?
                </label>
                <select
                  value={growthPreference}
                  onChange={(e) => setGrowthPreference(e.target.value)}
                  className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                >
                  {GROWTH_PREFS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Motivation description */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                  Why does this matter?
                </label>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  className="w-full bg-cream-dark/15 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 h-16 resize-none"
                  placeholder="Keep it brief and honest..."
                  maxLength={400}
                />
              </div>

              {/* Add existing habit dropdown */}
              {otherHabits.length > 0 && (
                <div className="bg-cream-dark/10 border border-plum-main/5 p-4 rounded-2xl mb-4 select-none animate-fadeIn">
                  <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                    Add an existing habit to this goal
                  </label>
                  <select
                    onChange={(e) => handleMoveHabit(e.target.value)}
                    value=""
                    className="w-full bg-cream-light border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 cursor-pointer"
                  >
                    <option value="" disabled>Choose a habit to move...</option>
                    {otherHabits.map((h) => {
                      const currentArea = h.goals?.area || 'General'
                      return (
                        <option key={h.id} value={h.id}>
                          {h.name} (currently in {currentArea})
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Active habits under this goal */}
              <div className="border-t border-plum-main/5 pt-3">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold">
                    Habits under this focus
                  </span>
                  <Link
                    to={`/habits/new?goalId=${id}`}
                    className="text-[9px] text-sunset-end hover:text-plum-main transition-colors font-bold"
                  >
                    + Add tiny habit
                  </Link>
                </div>

                {habits.length === 0 ? (
                  <p className="text-[10px] text-plum-light/60 italic pl-1">
                    No active habits linked to this focus yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin select-none">
                    {habits.map((habit) => (
                      <Link
                        key={habit.id}
                        to={`/habits/${habit.id}/edit`}
                        className="bg-cream-dark/10 hover:bg-cream-dark/20 border border-plum-main/5 px-2.5 py-1.5 rounded-xl flex justify-between items-center text-[10px] text-plum-dark font-medium transition-colors"
                      >
                        <span>{habit.name}</span>
                        <span className="text-[8px] text-plum-light/60 font-normal italic">
                          ({habit.frequency})
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Form submit & Deactivate controls */}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-plum-main/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/10 text-center cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Focus Area'}
                </button>

                {isActive ? (
                  <button
                    type="button"
                    onClick={handleRestGoal}
                    disabled={saving}
                    className="w-full border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all text-center bg-cream-light cursor-pointer"
                  >
                    Rest this focus area
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReviveGoal}
                    disabled={saving}
                    className="w-full bg-sunset-end/10 hover:bg-sunset-end/20 border border-sunset-end/20 text-sunset-end py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all text-center cursor-pointer"
                  >
                    Bring back this focus area
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
