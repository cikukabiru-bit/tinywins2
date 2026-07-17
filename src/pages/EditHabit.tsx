import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Goal {
  id: string
  area: string
}

// Client-side default seeds in case database lacks them on cold boot
const DEFAULT_SEEDS = [
  {
    id: 'seed-1',
    user_id: null,
    title: 'Gentle 10-Minute Morning Stretch',
    category: 'Physical',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=g_tea8ZNk5A',
    platform: 'YouTube',
    short_description: 'A calm, slow morning stretch routine to wake up your muscles.',
    tags: ['stretch', 'morning', 'fitness'],
    estimated_duration: '10 mins',
    mood: 'calm',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  },
  {
    id: 'seed-2',
    user_id: null,
    title: 'Calm Ambient Rain Music',
    category: 'Mental',
    type: 'music',
    url: 'https://www.youtube.com/watch?v=q76bN0Gy6zo',
    platform: 'YouTube',
    short_description: 'Deep ambient sounds of rain falling on leaves for focusing or resting.',
    tags: ['rain', 'ambient', 'focus', 'sleep'],
    estimated_duration: 'flexible',
    mood: 'focus',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  },
  {
    id: 'seed-3',
    user_id: null,
    title: 'Daily Breathing Exercise',
    category: 'Self-care',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=5DqTuWve9t8',
    platform: 'YouTube',
    short_description: 'Box breathing exercise to reduce anxiety and anchor your day.',
    tags: ['breathing', 'self-care', 'calm'],
    estimated_duration: '3 mins',
    mood: 'anxious',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  },
  {
    id: 'seed-4',
    user_id: null,
    title: 'The Quiet Mind Meditation',
    category: 'Spiritual',
    type: 'prayer',
    url: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
    platform: 'YouTube',
    short_description: 'A short, gentle guidance to calm the mind and find spiritual presence.',
    tags: ['prayer', 'spiritual', 'calm'],
    estimated_duration: '5 mins',
    mood: 'calm',
    is_user_added: false,
    is_default: true,
    is_favourite: false
  }
]

export default function EditHabit() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusField = searchParams.get('focus')
  const tinyGoalInputRef = useRef<HTMLInputElement>(null)

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [recommendedLinks, setRecommendedLinks] = useState<any[]>([])
  const [supportLinksEnabled, setSupportLinksEnabled] = useState(true)
  
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
  const [reminderTime, setReminderTime] = useState('08:00')
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [reminderMessage, setReminderMessage] = useState('Time for your tiny win.')

  useEffect(() => {
    if (focusField === 'tiny_goal' && !loading) {
      setTimeout(() => {
        tinyGoalInputRef.current?.focus()
        tinyGoalInputRef.current?.select()
      }, 100)
    }
  }, [focusField, loading])

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

        // 4. Fetch Support links & user preferences
        const isEnabled = localStorage.getItem(`support_links_enabled_${user.id}`) !== 'false'
        setSupportLinksEnabled(isEnabled)

        if (isEnabled) {
          // Fetch user profile for preferred formats (support_style)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('support_style')
            .eq('user_id', user.id)
            .maybeSingle()

          const preferredFormats = profileData?.support_style || []

          // Fetch all content items
          const { data: contentData } = await supabase
            .from('content_items')
            .select('*')
            .or(`user_id.eq.${user.id},is_default.eq.true`)

          let allItems = contentData || []
          const hasDefaults = allItems.some((i) => i.is_default)
          if (!hasDefaults) {
            allItems = [...allItems, ...DEFAULT_SEEDS]
          }

          // Simple rule-based match on category/tags/type
          const habitCategory = habitData.category || 'Physical'
          
          let matched = allItems.filter((item) => {
            // If preferredFormats is specified, filter by it
            if (preferredFormats.length > 0 && !preferredFormats.includes(item.type)) {
              return false
            }

            const catMatch = item.category?.toLowerCase() === habitCategory.toLowerCase()
            const tagMatch = item.tags?.some((t: string) => t.toLowerCase() === habitCategory.toLowerCase())
            const typeMatch = item.type?.toLowerCase() === habitCategory.toLowerCase()
            return catMatch || tagMatch || typeMatch
          })

          setRecommendedLinks(matched.slice(0, 3))
        }

        // Fetch existing reminder
        const { data: reminderData } = await supabase
          .from('reminders')
          .select('*')
          .eq('habit_id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (reminderData) {
          setReminderEnabled(reminderData.is_active)
          setReminderTime(reminderData.reminder_time ? reminderData.reminder_time.slice(0, 5) : '08:00')
          setReminderDays(reminderData.reminder_days || [0, 1, 2, 3, 4, 5, 6])
          setReminderMessage(reminderData.message || 'Time for your tiny win.')
        }

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

      // Update/Upsert reminder row
      if (reminderEnabled) {
        const { data: existingRem } = await supabase
          .from('reminders')
          .select('id')
          .eq('habit_id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (existingRem) {
          const { error: remUpError } = await supabase
            .from('reminders')
            .update({
              reminder_time: reminderTime,
              reminder_days: reminderDays,
              message: reminderMessage.trim() || 'Time for your tiny win.',
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRem.id)
          if (remUpError) throw remUpError
        } else {
          const { error: remInError } = await supabase
            .from('reminders')
            .insert({
              user_id: user.id,
              habit_id: id,
              reminder_type: 'preferred_time',
              reminder_time: reminderTime,
              reminder_days: reminderDays,
              message: reminderMessage.trim() || 'Time for your tiny win.',
              is_active: true
            })
          if (remInError) throw remInError
        }
      } else {
        // Set inactive if disabled
        await supabase
          .from('reminders')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('habit_id', id)
          .eq('user_id', user.id)
      }

      navigate('/habits')
    } catch (err: any) {
      console.error(err)
      setError(err?.message ? `Could not update habit: ${err.message}` : 'Could not update this habit. Please check your connection.')
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
    } catch (err: any) {
      console.error(err)
      setError(err?.message ? `Could not rest habit: ${err.message}` : 'Could not rest this habit. Please check your connection.')
      setShowRestConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteHabit = async () => {
    if (!user || !id) return
    
    const confirm = window.confirm(
      `Delete '${name}' for good? This removes it and its check-in history and can't be undone.`
    )
    if (!confirm) return

    setSubmitting(true)
    setError(null)

    try {
      // 1. Delete associated reminders
      await supabase
        .from('reminders')
        .delete()
        .eq('habit_id', id)
        .eq('user_id', user.id)

      // 2. Delete associated logs manually
      const { error: logsError } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', id)
        .eq('user_id', user.id)

      if (logsError) throw logsError

      // 3. Delete the habit
      const { error: habitError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (habitError) throw habitError

      // 4. Log security audit event
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: `delete_habit_${id}`,
        user_agent: navigator.userAgent
      })

      // Go back with confirmation state
      navigate('/habits', { state: { infoMessage: 'Habit removed.' } })
    } catch (err: any) {
      console.error('Delete habit error:', err)
      setError(err?.message || 'Could not delete this habit. Please try again.')
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
                    ref={tinyGoalInputRef}
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

                 {/* Reminders Settings UI */}
                 <div className="flex flex-col gap-2 mt-2 select-none">
                   <label className="flex items-center gap-2 cursor-pointer">
                     <input
                       type="checkbox"
                       id="reminder-toggle"
                       checked={reminderEnabled}
                       onChange={(e) => setReminderEnabled(e.target.checked)}
                       className="w-4 h-4 rounded border-plum-main/20 text-plum-main focus:ring-plum-main/30 accent-plum-main cursor-pointer"
                       disabled={submitting}
                     />
                     <span className="text-xs text-plum-light/80">
                       Enable habit reminders
                     </span>
                   </label>

                   {reminderEnabled && (
                     <div className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 mt-1 text-left animate-fadeIn flex flex-col gap-3">
                       {/* Time */}
                       <div>
                         <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                           Reminder Time
                         </label>
                         <input
                           type="time"
                           value={reminderTime}
                           onChange={(e) => setReminderTime(e.target.value)}
                           className="w-full bg-cream-light border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                           disabled={submitting}
                         />
                       </div>

                       {/* Days */}
                       <div>
                         <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                           Active Days
                         </label>
                         <div className="flex gap-1 justify-between">
                           {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                             const isChecked = reminderDays.includes(idx)
                             return (
                               <button
                                 key={idx}
                                 type="button"
                                 onClick={() =>
                                   setReminderDays((prev) =>
                                     prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx].sort()
                                   )
                                 }
                                 className={`w-7 h-7 rounded-full text-[10px] font-bold transition-all border cursor-pointer select-none ${
                                   isChecked
                                     ? 'bg-plum-main text-cream-light border-plum-main'
                                     : 'bg-cream-light text-plum-main border-plum-main/10 hover:bg-cream-dark/15'
                                 }`}
                                 disabled={submitting}
                               >
                                 {day}
                               </button>
                             )
                           })}
                         </div>
                       </div>

                       {/* Message */}
                       <div>
                         <label className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1.5 ml-1">
                           Reminder Message
                         </label>
                         <input
                           type="text"
                           value={reminderMessage}
                           onChange={(e) => setReminderMessage(e.target.value)}
                           className="w-full bg-cream-light border border-plum-main/10 rounded-xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                           placeholder="Time for your tiny win."
                           maxLength={100}
                           disabled={submitting}
                         />
                       </div>
                     </div>
                   )}
                 </div>

                {/* Recommended Support Links */}
                {supportLinksEnabled && recommendedLinks.length > 0 && (
                  <div className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 mt-4 text-left select-none animate-fadeIn">
                    <h4 className="text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-2 ml-0.5">
                      Recommended Support Links
                    </h4>
                    <div className="flex flex-col gap-2">
                      {recommendedLinks.map((link) => (
                        <div key={link.id} className="bg-cream-light border border-plum-main/5 p-2.5 rounded-xl flex items-center justify-between gap-3 hover:border-plum-main/20 transition-all duration-200">
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-plum-dark text-[10px] truncate">{link.title}</h5>
                            <span className="text-[8px] text-plum-light/50 font-normal">⏱️ {link.estimated_duration || 'flexible'}</span>
                          </div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-plum-main hover:bg-plum-dark text-cream-light py-1 px-3 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer"
                          >
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                    {/* Disclaimer */}
                    <p className="text-[7px] text-plum-light/50 mt-2 leading-normal select-none italic text-center">
                      "Support links open outside TinyWins."
                    </p>
                  </div>
                )}

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

                  <button
                    type="button"
                    onClick={handleDeleteHabit}
                    disabled={submitting}
                    className="text-plum-light/50 hover:text-red-500 text-[10px] font-medium tracking-wider uppercase transition-colors duration-200 cursor-pointer self-center mt-1 select-none"
                  >
                    Delete habit permanently
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
