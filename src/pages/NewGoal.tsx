import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function NewGoal() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newGoalId, setNewGoalId] = useState<string | null>(null)

  // Form states
  const [area, setArea] = useState('')
  const [availableTime, setAvailableTime] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [growthPreference, setGrowthPreference] = useState('')
  const [why, setWhy] = useState('')

  const handleNext = () => {
    if (step === 1 && !area) {
      setError('Please choose a focus area.')
      return
    }
    if (step === 2 && !availableTime) {
      setError('Please select your preferred daily time.')
      return
    }
    if (step === 3 && !preferredTime) {
      setError('Please choose a preferred time of day.')
      return
    }
    if (step === 4 && !growthPreference) {
      setError('Please choose a growth preference.')
      return
    }

    setError(null)
    setStep((prev) => prev + 1)
  }

  const handleBack = () => {
    setError(null)
    setStep((prev) => Math.max(1, prev - 1))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          area,
          available_time: availableTime,
          preferred_time: preferredTime,
          growth_preference: growthPreference,
          why: why.trim() || null,
          active: true
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      if (data) {
        setNewGoalId(data.id)
        setStep(6) // Move to success step
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message ? `Could not save goal: ${err.message}` : 'A small hiccup occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const progressPct = ((step - 1) / 5) * 100

  // 1. Success Screen (Step 6)
  if (step === 6 && newGoalId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
        <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

        <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 text-center select-none animate-fadeIn">
          <svg className="w-12 h-12 text-sunset-end mx-auto mb-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
          </svg>
          
          <h3 className="font-serif text-3xl font-normal text-plum-dark italic mb-2">Goal created! ✨</h3>
          <p className="text-xs text-plum-light/80 leading-relaxed mb-8 max-w-[240px] mx-auto">
            You've added "{area}" as a new focus. What would you like to do next?
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to={`/habit-score?goalId=${newGoalId}`}
              className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-5 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/15 text-center"
            >
              Score existing habits first
            </Link>
            
            <Link
              to={`/habits/new?goalId=${newGoalId}`}
              className="w-full border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 px-5 rounded-2xl font-medium text-xs tracking-wide transition-all text-center bg-cream-light"
            >
              Create a new tiny habit
            </Link>

            <Link
              to="/today"
              className="text-[10px] text-plum-light/50 hover:text-plum-main transition-colors mt-4 block"
            >
              Go to Today Dashboard
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/goals" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Step {step} of 5
          </span>
          <div className="w-5"></div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-cream-dark/20 h-1 rounded-full mb-6 overflow-hidden select-none">
          <div
            className="bg-sunset-end h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-3.5 mb-4 text-xs text-plum-light text-left animate-fadeIn">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Step 1: Area */}
            {step === 1 && (
              <div className="animate-fadeIn">
                <h2 className="font-serif text-2xl font-normal text-plum-dark italic text-left leading-tight mb-4">
                  What area of your life does this goal focus on?
                </h2>
                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
                  {FOCUS_AREAS.map((a) => {
                    const isSelected = area === a
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => { setArea(a); setError(null) }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs text-left border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-dark border-plum-main/10 hover:bg-cream-dark/35'
                        }`}
                      >
                        {a}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Time Daily */}
            {step === 2 && (
              <div className="animate-fadeIn">
                <h2 className="font-serif text-2xl font-normal text-plum-dark italic text-left leading-tight mb-4">
                  How much time do you want to allocate to this daily?
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {TIME_AMOUNTS.map((t) => {
                    const isSelected = availableTime === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setAvailableTime(t); setError(null) }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs text-left border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-dark border-plum-main/10 hover:bg-cream-dark/35'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Time of Day */}
            {step === 3 && (
              <div className="animate-fadeIn">
                <h2 className="font-serif text-2xl font-normal text-plum-dark italic text-left leading-tight mb-4">
                  What time of day fits best for this focus area?
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {TIMES_OF_DAY.map((t) => {
                    const isSelected = preferredTime === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setPreferredTime(t); setError(null) }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs text-left border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-dark border-plum-main/10 hover:bg-cream-dark/35'
                        }`}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Growth Preference */}
            {step === 4 && (
              <div className="animate-fadeIn">
                <h2 className="font-serif text-2xl font-normal text-plum-dark italic text-left leading-tight mb-4">
                  How should habits under this goal grow over time?
                </h2>
                <div className="grid grid-cols-1 gap-2">
                  {GROWTH_PREFS.map((g) => {
                    const isSelected = growthPreference === g
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setGrowthPreference(g); setError(null) }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs text-left border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-dark border-plum-main/10 hover:bg-cream-dark/35'
                        }`}
                      >
                        {g}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Why */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="animate-fadeIn text-left">
                <h2 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight mb-2">
                  Why does this goal matter to you?
                </h2>
                <p className="text-[10px] text-plum-light/70 mb-4 font-light leading-relaxed">
                  Optional. Writing down your motivation helps you build a deeper connection to this area.
                </p>
                <textarea
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35 h-28 resize-none"
                  placeholder="e.g. to feel more energetic throughout the day, and set a peaceful example for my kids."
                  maxLength={400}
                  disabled={loading}
                />
              </form>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-plum-main/10">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 rounded-2xl font-medium text-xs text-center cursor-pointer transition-colors bg-cream-light disabled:opacity-50"
              >
                Back
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-plum-main hover:bg-plum-dark text-cream-light py-3 rounded-2xl font-medium text-xs text-center cursor-pointer transition-colors shadow-md"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-plum-main hover:bg-plum-dark text-cream-light py-3 rounded-2xl font-medium text-xs text-center cursor-pointer transition-colors shadow-md disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create goal'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
