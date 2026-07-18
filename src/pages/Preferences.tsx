import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const BLOCKERS = [
  'Forgetfulness',
  'Tiredness',
  'Lack of motivation',
  'Anxiety/overwhelm',
  'Too much work',
  'Unclear goals',
  'Low energy',
  'Procrastination'
]

const TONES = ['Gentle', 'Motivational', 'Spiritual', 'Practical', 'Playful', 'Firm but kind', 'Calm']

const SUPPORT_STYLES = [
  'Reminders',
  'Reflection prompts',
  'Music',
  'Videos',
  'Prayer prompts',
  'Progress charts',
  'Accountability messages',
  'Motivational notes'
]

const INSPIRATION_PREFS = [
  'Motivational quotes',
  'Calm reflections',
  'Bible verses',
  'Saint quotes',
  'Prayer prompts',
  'Gratitude prompts',
  'Focus prompts',
  'Self-care reminders',
  'Mixed'
]

export default function Preferences() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile-level states
  const [consistencyBlocker, setConsistencyBlocker] = useState('')
  const [coachTone, setCoachTone] = useState('Gentle')
  const [supportStyle, setSupportStyle] = useState<string[]>([])
  const [inspirationPreferences, setInspirationPreferences] = useState<string[]>([])
  const [eveningHour, setEveningHour] = useState(20)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('consistency_blocker, coach_tone, support_style, inspiration_preferences, evening_reflection_hour')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profileError) throw profileError

        if (data) {
          setConsistencyBlocker(data.consistency_blocker || '')
          setCoachTone(data.coach_tone || 'Gentle')
          setSupportStyle(data.support_style || [])
          setInspirationPreferences(data.inspiration_preferences || [])
          setEveningHour(data.evening_reflection_hour ?? 20)
        }
      } catch (err) {
        console.error('Error fetching preferences:', err)
        setError('Could not load preferences. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleToggleSupport = (item: string) => {
    setSupportStyle((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const handleToggleInspiration = (item: string) => {
    setInspirationPreferences((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submitting) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          consistency_blocker: consistencyBlocker,
          coach_tone: coachTone,
          support_style: supportStyle,
          inspiration_preferences: inspirationPreferences,
          evening_reflection_hour: eveningHour,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Log security audit log for changes
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action: 'preferences_updated',
        user_agent: navigator.userAgent
      })

      setSuccess('Preferences saved.')
    } catch (err: any) {
      console.error('Save preferences error:', err)
      setError('Could not save your preferences. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/settings" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Edit Preferences
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading choices...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between text-left">
            <form onSubmit={handleSave} className="flex flex-col gap-5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin my-1">
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-3 text-xs text-plum-light mb-1 animate-fadeIn">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50/15 border border-green-600/10 rounded-2xl p-3 text-xs text-green-800 mb-1 animate-fadeIn">
                  {success}
                </div>
              )}

              {/* Consistency Blocker */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  What blocks consistency?
                </label>
                <select
                  value={consistencyBlocker}
                  onChange={(e) => setConsistencyBlocker(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer capitalize"
                  disabled={submitting}
                >
                  <option value="" disabled>Select blocker...</option>
                  {BLOCKERS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Tiny Coach Tone */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Tiny Coach Tone
                </label>
                <select
                  value={coachTone}
                  onChange={(e) => setCoachTone(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer capitalize"
                  disabled={submitting}
                >
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Evening reflection hour */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Evening Reflection Time
                </label>
                <select
                  value={eveningHour}
                  onChange={(e) => setEveningHour(parseInt(e.target.value))}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                  disabled={submitting}
                >
                  {[17, 18, 19, 20, 21, 22, 23].map((hr) => {
                    const ampm = hr >= 12 ? 'PM' : 'AM';
                    const displayHr = hr > 12 ? hr - 12 : hr;
                    return (
                      <option key={hr} value={hr}>
                        {displayHr}:00 {ampm}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Support Style Options */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-2 ml-1">
                  Types of Support
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SUPPORT_STYLES.map((style) => {
                    const isChecked = supportStyle.includes(style)
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => handleToggleSupport(style)}
                        disabled={submitting}
                        className={`py-1.5 px-3 rounded-xl text-[10px] font-semibold transition-all border cursor-pointer ${
                          isChecked
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-main border-plum-main/5 hover:bg-cream-dark/25'
                        }`}
                      >
                        {style}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Inspiration preferences */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-2 ml-1">
                  Preferred Inspiration Types
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {INSPIRATION_PREFS.map((pref) => {
                    const isChecked = inspirationPreferences.includes(pref)
                    return (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => handleToggleInspiration(pref)}
                        disabled={submitting}
                        className={`py-1.5 px-3 rounded-xl text-[10px] font-semibold transition-all border cursor-pointer ${
                          isChecked
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-main border-plum-main/5 hover:bg-cream-dark/25'
                        }`}
                      >
                        {pref}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Goal-level redirect notice */}
              <div className="bg-cream-dark/10 p-3.5 rounded-2xl border border-plum-main/5 mt-2">
                <span className="block text-[8px] uppercase tracking-wider text-plum-light/50 font-bold mb-1">
                  Looking for Goal Settings?
                </span>
                <p className="text-[10.5px] text-plum-dark/95 leading-relaxed font-light">
                  Goal parameters (improvement area, times, growth modes) live inside each individual goal.
                </p>
                <Link
                  to="/goals"
                  className="inline-block text-[10px] text-sunset-end hover:text-plum-main font-semibold mt-2.5 transition-colors underline decoration-dotted cursor-pointer"
                >
                  Adjust your specific goal details here →
                </Link>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-plum-main/10">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/10 text-center cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
