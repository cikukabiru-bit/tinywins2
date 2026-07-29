import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  // Loading and feedback
  const [loading, setLoading] = useState(true)
  const [submittingConsent, setSubmittingConsent] = useState(false)
  const [submittingPassword, setSubmittingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Consent toggles
  const [aiConsent, setAiConsent] = useState(false)
  const [supportConsent, setSupportConsent] = useState(false)
  const [scoreConsent, setScoreConsent] = useState(false)
  const [inspirationConsent, setInspirationConsent] = useState(false)
  const [journalConsent, setJournalConsent] = useState(false)

  // Password fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Phone number (Account)
  const [phone, setPhone] = useState('')
  const [submittingPhone, setSubmittingPhone] = useState(false)

  // Account deletion type-to-confirm
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Load consents and profile
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return

      // Load consents independently
      try {
        let { data: consentData, error: consentError } = await supabase
          .from('user_consents')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (consentError) throw consentError

        // If no consents exist yet, create default entry using resilient upsert
        if (!consentData) {
          try {
            const { data: newConsents, error: insertError } = await supabase
              .from('user_consents')
              .upsert({
                user_id: user.id,
                data_storage_consent: true,
                ai_personalization_consent: false,
                support_content_consent: false,
                habit_score_personalization_consent: false,
                inspiration_personalization_consent: false,
                journal_ai_consent: false,
                consent_version: '1.0'
              }, { onConflict: 'user_id' })
              .select()
              .single()

            if (insertError) throw insertError
            consentData = newConsents
          } catch (upsertErr) {
            console.warn('Resilient consents upsert failed, trying fallback select:', upsertErr)
            const { data: retryData, error: retryError } = await supabase
              .from('user_consents')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
            if (retryError) throw retryError
            consentData = retryData
          }
        }

        if (consentData) {
          setAiConsent(consentData.ai_personalization_consent)
          setSupportConsent(consentData.support_content_consent)
          setScoreConsent(consentData.habit_score_personalization_consent)
          setInspirationConsent(consentData.inspiration_personalization_consent)
          setJournalConsent(consentData.journal_ai_consent || false)
        }
      } catch (err) {
        console.error('Error loading consents:', err)
        setError('Could not load privacy consents. Other settings remain available.')
      }

      // Load profile / metadata independently
      try {
        setPhone(user.phone || '')
      } catch (err) {
        console.error('Error loading profile phone:', err)
      }

      setLoading(false)
    }

    fetchSettings()
  }, [user])

  // Helper to log security audit events
  const logAuditEvent = async (action: string) => {
    if (!user) return
    try {
      await supabase.from('security_audit_logs').insert({
        user_id: user.id,
        action,
        user_agent: navigator.userAgent
      })
    } catch (err) {
      console.error('Audit log failed:', err)
    }
  }

  // Update Consents
  const handleToggleConsent = async (type: string, value: boolean) => {
    if (!user || submittingConsent) return
    setSubmittingConsent(true)
    setError(null)
    setSuccess(null)

    try {
      const updates: any = {}
      if (type === 'ai') updates.ai_personalization_consent = value
      if (type === 'support') updates.support_content_consent = value
      if (type === 'score') updates.habit_score_personalization_consent = value
      if (type === 'inspiration') updates.inspiration_personalization_consent = value
      if (type === 'journal') updates.journal_ai_consent = value

      const { error: updateError } = await supabase
        .from('user_consents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Log audit event
      await logAuditEvent(`consent_toggle_${type}_${value ? 'enabled' : 'disabled'}`)

      // Update state
      if (type === 'ai') setAiConsent(value)
      if (type === 'support') setSupportConsent(value)
      if (type === 'score') setScoreConsent(value)
      if (type === 'inspiration') setInspirationConsent(value)
      if (type === 'journal') setJournalConsent(value)

      setSuccess('Privacy preferences updated.')
    } catch (err) {
      console.error(err)
      setError('Could not update consents.')
    } finally {
      setSubmittingConsent(false)
    }
  }

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submittingPassword) return

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSubmittingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      await logAuditEvent('password_changed')

      setSuccess('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Password update failed.')
    } finally {
      setSubmittingPassword(false)
    }
  }

  // Change Phone Number
  const handleChangePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || submittingPhone) return

    setSubmittingPhone(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        phone: phone.trim() || undefined
      })

      if (updateError) throw updateError

      await logAuditEvent('phone_changed')
      setSuccess('Phone number settings updated.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Could not update phone number.')
    } finally {
      setSubmittingPhone(false)
    }
  }

  // Export Data (CSV and JSON)
  const handleExportData = async () => {
    if (!user) return
    setError(null)
    setSuccess(null)

    try {
      const fetchSafe = async (query: any, fallback: any = []) => {
        try {
          const res = await query
          if (res.error) {
            console.error('Error fetching data for export:', res.error)
            return fallback
          }
          return res.data || fallback
        } catch (err) {
          console.error('Unexpected error fetching data for export:', err)
          return fallback
        }
      }

      // Gather all tables independently and safely
      const profile = await fetchSafe(supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(), null) as any
      const goals = await fetchSafe(supabase.from('goals').select('*').eq('user_id', user.id)) as any[]
      const habits = await fetchSafe(supabase.from('habits').select('*').eq('user_id', user.id)) as any[]
      const logs = await fetchSafe(supabase.from('habit_logs').select('*').eq('user_id', user.id)) as any[]
      const scores = await fetchSafe(supabase.from('habit_scores').select('*').eq('user_id', user.id)) as any[]
      const reminders = await fetchSafe(supabase.from('reminders').select('*').eq('user_id', user.id)) as any[]
      const inspiration = await fetchSafe(supabase.from('inspiration_items').select('*').eq('user_id', user.id)) as any[]
      const content = await fetchSafe(supabase.from('content_items').select('*').eq('user_id', user.id)) as any[]
      const journal = await fetchSafe(supabase.from('journal_entries').select('*').eq('user_id', user.id)) as any[]

      const dataBundle = {
        profile,
        goals: goals || [],
        habits: habits || [],
        habit_logs: logs || [],
        habit_scores: scores || [],
        reminders: reminders || [],
        custom_inspirations: inspiration || [],
        custom_support_links: content || [],
        journal_entries: journal || []
      }

      // 1. Export JSON
      const jsonStr = JSON.stringify(dataBundle, null, 2)
      const jsonBlob = new Blob([jsonStr], { type: 'application/json' })
      const jsonUrl = URL.createObjectURL(jsonBlob)
      const jsonLink = document.createElement('a')
      jsonLink.href = jsonUrl
      jsonLink.download = `tinywins_data_export_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(jsonLink)
      jsonLink.click()
      document.body.removeChild(jsonLink)

      // 2. Export CSV (Generate simple CSV for habits & logs)
      let csvContent = 'Type,Name,Goal/Details,Date/Time,Additional\n'
      csvContent += `Profile,${profile?.name || ''},${profile?.coach_tone || 'calm'},${profile?.created_at || ''},\n`
      
      ;(goals || []).forEach(g => {
        csvContent += `Goal,${g.area},${g.growth_preference || ''},${g.created_at || ''},"${g.why || ''}"\n`
      })
      ;(habits || []).forEach(h => {
        csvContent += `Habit,${h.name},${h.tiny_goal},${h.start_date || ''},${h.frequency}\n`
      })
      ;(logs || []).forEach(l => {
        csvContent += `Habit Log,Status: ${l.status},Mood: ${l.mood || ''},${l.log_date},"${l.reflection || ''}"\n`
      })
      ;(journal || []).forEach((j: any) => {
        csvContent += `Journal,${j.title || 'Untitled'},"${j.body ? j.body.replace(/"/g, '""') : ''}",${j.entry_date},Mood: ${j.mood || ''}\n`
      })

      const csvBlob = new Blob([csvContent], { type: 'text/csv' })
      const csvUrl = URL.createObjectURL(csvBlob)
      const csvLink = document.createElement('a')
      csvLink.href = csvUrl
      csvLink.download = `tinywins_habits_export_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(csvLink)
      csvLink.click()
      document.body.removeChild(csvLink)

      await logAuditEvent('data_export')
      setSuccess('Data exported successfully in JSON & CSV.')
    } catch (err) {
      console.error(err)
      setError('Could not export your data.')
    }
  }

  // Delete Specific Data (Reflections, logs, reminders)
  const handleDeleteSpecificData = async (type: string) => {
    if (!user) return
    
    const messages: any = {
      reflections: "Clear all reflections? Your habit scores and streaks will remain, but reflection descriptions will be emptied. This cannot be undone.",
      logs: "Delete all habit history logs? This resets all your streaks and completion rates to zero. This cannot be undone.",
      reminders: "Delete all scheduled reminders? This cannot be undone.",
      journal: "Delete all journal entries? This cannot be undone."
    }

    const confirm = window.confirm(messages[type])
    if (!confirm) return

    setError(null)
    setSuccess(null)

    try {
      if (type === 'reflections') {
        const { error: delError } = await supabase
          .from('habit_logs')
          .update({ reflection: null })
          .eq('user_id', user.id)
        if (delError) throw delError
      } else if (type === 'logs') {
        const { error: delError } = await supabase
          .from('habit_logs')
          .delete()
          .eq('user_id', user.id)
        if (delError) throw delError
      } else if (type === 'reminders') {
        const { error: delError } = await supabase
          .from('reminders')
          .delete()
          .eq('user_id', user.id)
        if (delError) throw delError
      } else if (type === 'journal') {
        const { error: delError } = await supabase
          .from('journal_entries')
          .delete()
          .eq('user_id', user.id)
        if (delError) throw delError
      }

      await logAuditEvent(`data_delete_${type}`)
      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} cleared successfully.`)
    } catch (err) {
      console.error(err)
      setError(`Could not clear ${type}.`)
    }
  }

  // Delete Account
  const handleDeleteAccount = async () => {
    if (!user) return
    if (deleteConfirmText.trim().toLowerCase() !== 'delete my account') {
      setError('Please type "delete my account" exactly to proceed.')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      // 1. Audit log the attempt
      await logAuditEvent('account_deleted')

      // 2. Cascade delete will handle profiles & tables
      const { error: deleteProfileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id)

      if (deleteProfileError) throw deleteProfileError

      // Note: Supabase Admin API is typically required to fully delete the Auth user.
      // Deleting the profiles cascade deletes user data, then we sign them out.
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error(err)
      setError('Could not delete account. Please contact support.')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-bg-start via-bg-mid to-bg-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-surface rounded-3xl border border-surface-dark/40 p-8 shadow-2xl shadow-border-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-primary/60 hover:text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-text-muted/50 font-semibold">
            Privacy & Settings
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-primary font-medium tracking-wide animate-pulse">Loading settings...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between text-left max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
            {error && (
              <div className="bg-coral-50/10 border border-border-main/10 rounded-2xl p-3 text-xs text-text-muted mb-4 animate-fadeIn">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-success/15 border border-success/10 rounded-2xl p-3 text-xs text-green-800 mb-4 animate-fadeIn">
                {success}
              </div>
            )}

             {/* THEME SELECTION */}
            <div className="bg-surface-dark/10 border border-border-main/5 p-4 rounded-2xl mb-6 flex flex-col gap-3 select-none animate-fadeIn">
              <span className="block text-[8px] uppercase tracking-wider text-text-muted/50 font-bold mb-0.5">
                Appearance / Theme
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'sunset', label: 'Sunset', previewBg: 'from-[#fff0e6] via-[#ffd1b3] to-[#ff7a60]', text: 'text-[#220b19]' },
                  { id: 'peach', label: 'Peach', previewBg: 'from-[#fffaf5] via-[#ffede0] to-[#ffd4b8]', text: 'text-[#4a2c22]' },
                  { id: 'teal', label: 'Teal', previewBg: 'from-[#f0fdfa] via-[#ccfbf1] to-[#99f6e4]', text: 'text-[#042f2e]' },
                  { id: 'plum', label: 'Plum', previewBg: 'from-[#faf5ff] via-[#f3e8ff] to-[#e9d5ff]', text: 'text-[#2e1065]' },
                  { id: 'dark', label: 'Dark', previewBg: 'from-[#151c2c] via-[#0f131f] to-[#080a10]', text: 'text-[#f8fafc]' },
                  { id: 'device', label: 'Device', previewBg: 'from-[#fcfaf2] via-[#ffd1b3] to-[#0f131f]', text: 'text-text-main' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id as any)}
                    className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      theme === t.id
                        ? 'bg-surface border-primary ring-2 ring-primary/20 scale-105 shadow-sm'
                        : 'bg-surface/50 border-border-main/15 hover:bg-surface hover:border-border-main/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.previewBg} border border-border-main/20 flex items-center justify-center shadow-inner`}>
                      <span className={`text-[9px] font-serif italic ${t.text}`}>A</span>
                    </div>
                    <span className="text-[9px] font-medium text-text-main">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PRIVACY STATEMENT */}
            <div className="bg-surface-dark/20 border border-border-main/5 p-4 rounded-2xl mb-6">
              <p className="text-[10px] text-text-muted leading-relaxed font-light select-none">
                "Your TinyWins are private. Your habits, reflections, scores, and preferences belong to you. We store them only to help you form tiny habits, never for advertising or tracking."
              </p>
            </div>

            {/* PREFERENCES NAVIGATION LINK */}
            <div className="bg-surface-dark/10 border border-border-main/5 p-4 rounded-2xl mb-6 flex flex-col gap-1.5 select-none">
              <span className="block text-[8px] uppercase tracking-wider text-text-muted/50 font-bold mb-0.5">
                Profile Settings
              </span>
              <p className="text-[10px] text-text-main/95 leading-normal font-light">
                Revisit and change your consistency blockers, coach tone, preferred inspirations, and support styles.
              </p>
              <Link
                to="/settings/preferences"
                className="inline-block text-[10px] text-accent hover:text-primary font-semibold mt-2 transition-colors underline decoration-dotted cursor-pointer"
              >
                Edit my onboarding answers →
              </Link>
              <Link
                to="/journal"
                className="inline-block text-[10px] text-accent hover:text-primary font-semibold mt-1.5 transition-colors underline decoration-dotted cursor-pointer"
              >
                My Private Journal →
              </Link>
            </div>

            {/* CONSENTS SECTION */}
            <section className="mb-6">
              <h3 className="text-[9px] uppercase tracking-wider text-text-muted/55 font-bold mb-3 ml-1">Consent Preferences</h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiConsent}
                    onChange={(e) => handleToggleConsent('ai', e.target.checked)}
                    className="w-4 h-4 rounded border-border-main/20 text-primary focus:ring-plum-main/30 accent-plum-main mt-0.5"
                    disabled={submittingConsent}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-text-main block">Personalize Tiny Coach</span>
                    <span className="text-[9px] text-text-muted/60 leading-normal block mt-0.5">Allow the Tiny Coach engine to utilize habit trends for personalized suggestions.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={supportConsent}
                    onChange={(e) => handleToggleConsent('support', e.target.checked)}
                    className="w-4 h-4 rounded border-border-main/20 text-primary focus:ring-plum-main/30 accent-plum-main mt-0.5"
                    disabled={submittingConsent}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-text-main block">Personalize Library Links</span>
                    <span className="text-[9px] text-text-muted/60 leading-normal block mt-0.5">Use habit category tags to surface relevant support articles and videos.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scoreConsent}
                    onChange={(e) => handleToggleConsent('score', e.target.checked)}
                    className="w-4 h-4 rounded border-border-main/20 text-primary focus:ring-plum-main/30 accent-plum-main mt-0.5"
                    disabled={submittingConsent}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-text-main block">Habit Score Recommendations</span>
                    <span className="text-[9px] text-text-muted/60 leading-normal block mt-0.5">Process microhabit completion rates to suggest friction-reducing solutions.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inspirationConsent}
                    onChange={(e) => handleToggleConsent('inspiration', e.target.checked)}
                    className="w-4 h-4 rounded border-border-main/20 text-primary focus:ring-plum-main/30 accent-plum-main mt-0.5"
                    disabled={submittingConsent}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-text-main block">Inspiration Settings Sharing</span>
                    <span className="text-[9px] text-text-muted/60 leading-normal block mt-0.5">Use quote categories (e.g. spiritual) to curate your Today dashboard encouragement.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={journalConsent}
                    onChange={(e) => handleToggleConsent('journal', e.target.checked)}
                    className="w-4 h-4 rounded border-border-main/20 text-primary focus:ring-plum-main/30 accent-plum-main mt-0.5"
                    disabled={submittingConsent}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-text-main block">Let Tiny Coach read my journal entries</span>
                    <span className="text-[9px] text-text-muted/60 leading-normal block mt-0.5">Used ONLY locally/AI (default off). Journals will never be sent anywhere without your explicit permission.</span>
                  </div>
                </label>
              </div>
            </section>

            <hr className="border-border-main/10 mb-6" />

            {/* PASSWORD UPDATE */}
            <section className="mb-6">
              <h3 className="text-[9px] uppercase tracking-wider text-text-muted/55 font-bold mb-3 ml-1">Account & Security</h3>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-text-muted/60 font-bold mb-1 ml-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-surface-dark/25 border border-border-main/10 rounded-2xl py-2 px-3 text-text-main font-sans text-xs focus:outline-none focus:border-border-main/40"
                    placeholder="Min 6 characters"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-text-muted/60 font-bold mb-1 ml-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-surface-dark/25 border border-border-main/10 rounded-2xl py-2 px-3 text-text-main font-sans text-xs focus:outline-none focus:border-border-main/40"
                    placeholder="Re-enter password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="bg-primary hover:bg-primary-strong text-on-primary py-2 rounded-2xl text-xs font-medium tracking-wide transition-all shadow-md shadow-border-main/10 text-center cursor-pointer disabled:opacity-50 mt-1"
                >
                  {submittingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </form>

              {/* Phone Settings */}
              <form onSubmit={handleChangePhone} className="flex flex-col gap-3 mt-4">
                <div>
                  <label className="block text-[8px] uppercase tracking-wider text-text-muted/60 font-bold mb-1 ml-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface-dark/25 border border-border-main/10 rounded-2xl py-2 px-3 text-text-main font-sans text-xs focus:outline-none focus:border-border-main/40"
                    placeholder="e.g. +123456789"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingPhone}
                  className="bg-primary/80 hover:bg-primary-strong text-on-primary py-2 rounded-2xl text-xs font-medium tracking-wide transition-all text-center cursor-pointer disabled:opacity-50"
                >
                  {submittingPhone ? 'Saving...' : 'Save Phone Number'}
                </button>
              </form>
            </section>

            <hr className="border-border-main/10 mb-6" />

            {/* DATA RIGHTS */}
            <section className="mb-6">
              <h3 className="text-[9px] uppercase tracking-wider text-text-muted/55 font-bold mb-3 ml-1">My Data Rights</h3>
              <div className="flex flex-col gap-3">
                {/* Export */}
                <div className="bg-surface-dark/10 p-3 rounded-2xl border border-border-main/5">
                  <h4 className="text-xs font-semibold text-text-main mb-1">Export My Data</h4>
                  <p className="text-[9px] text-text-muted/75 leading-relaxed mb-3">Download your full history, profile parameters, logs, and goals in plain CSV and JSON formats.</p>
                  <button
                    onClick={handleExportData}
                    className="bg-primary hover:bg-primary-strong text-on-primary py-1.5 px-3 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Export Data
                  </button>
                </div>

                {/* Specific Clears */}
                <div className="bg-surface-dark/10 p-3 rounded-2xl border border-border-main/5 flex flex-col gap-2">
                  <h4 className="text-xs font-semibold text-text-main">Clear Specific History</h4>
                  <button
                    onClick={() => handleDeleteSpecificData('reflections')}
                    className="w-full border border-border-main/20 hover:bg-primary/5 text-primary py-1.5 rounded-xl text-xs font-medium text-left px-3 cursor-pointer"
                  >
                    🗑️ Clear Reflections (Leaves logs)
                  </button>
                  <button
                    onClick={() => handleDeleteSpecificData('logs')}
                    className="w-full border border-border-main/20 hover:bg-primary/5 text-primary py-1.5 rounded-xl text-xs font-medium text-left px-3 cursor-pointer"
                  >
                    🗑️ Clear Habit Log History & Streaks
                  </button>
                  <button
                    onClick={() => handleDeleteSpecificData('reminders')}
                    className="w-full border border-border-main/20 hover:bg-primary/5 text-primary py-1.5 rounded-xl text-xs font-medium text-left px-3 cursor-pointer"
                  >
                    🗑️ Clear Scheduled Reminders
                  </button>
                  <button
                    onClick={() => handleDeleteSpecificData('journal')}
                    className="w-full border border-border-main/20 hover:bg-primary/5 text-primary py-1.5 rounded-xl text-xs font-medium text-left px-3 cursor-pointer"
                  >
                    🗑️ Clear Journal Entries
                  </button>
                </div>

                {/* Account Deletion */}
                <div className="border border-red-500/10 bg-red-50/5 p-3 rounded-2xl mt-2">
                  <h4 className="text-xs font-semibold text-red-700 mb-1">Delete My Account</h4>
                  <p className="text-[9px] text-red-600/70 leading-relaxed mb-3">This permanently removes your profile, habit logs, custom settings, and signs you out. This action is absolute and cannot be reversed.</p>
                  
                  {!showDeleteModal ? (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-on-primary py-1.5 px-3 rounded-xl text-xs font-medium cursor-pointer"
                    >
                      Delete Account...
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2.5 animate-fadeIn mt-2">
                      <label className="block text-[8px] uppercase tracking-wider text-red-700 font-bold ml-1">Type "delete my account" to confirm:</label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full bg-surface border border-red-500/20 rounded-xl py-1.5 px-3 text-text-main font-sans text-xs focus:outline-none focus:border-red-500/50"
                        placeholder="Type verification sentence..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          className="bg-red-700 hover:bg-red-800 text-on-primary py-1 px-3 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                          className="border border-border-main/20 text-primary py-1 px-3 rounded-xl text-xs font-medium cursor-pointer bg-surface"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

          </div>
        )}
      </div>
    </main>
  )
}
