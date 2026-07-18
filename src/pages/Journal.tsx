import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface JournalEntry {
  id: string
  user_id: string
  habit_id: string | null
  goal_id: string | null
  title: string | null
  body: string
  mood: string | null
  entry_date: string
  created_at: string
  updated_at: string
  habits?: { name: string } | null
  goals?: { area: string } | null
}

interface Goal {
  id: string
  area: string
}

interface Habit {
  id: string
  name: string
}

export default function Journal() {
  const { user } = useAuth()

  // Tab state: 'list' or 'write'
  const [activeTab, setActiveTab] = useState<'list' | 'write'>('list')

  // List states
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Write Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState('')
  const [selectedHabitId, setSelectedHabitId] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  // Selector data
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])

  // Read Modal states
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null)

  const MOODS = ['calm', 'happy', 'tired', 'hopeful', 'overwhelmed', 'neutral']

  const fetchEntriesAndSelectors = async () => {
    if (!user) return
    setLoading(true)
    try {
      // 1. Fetch entries
      const { data: entriesData, error: entriesError } = await supabase
        .from('journal_entries')
        .select('*, habits:habits(name), goals:goals(area)')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (entriesError) throw entriesError
      setEntries(entriesData || [])

      // 2. Fetch active goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, area')
        .eq('user_id', user.id)
        .eq('active', true)
      setGoals(goalsData || [])

      // 3. Fetch active habits
      const { data: habitsData } = await supabase
        .from('habits')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('active', true)
      setHabits(habitsData || [])
    } catch (err) {
      console.error('Error fetching journal:', err)
      setError('Could not load your journal. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntriesAndSelectors()
  }, [user])

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !body.trim() || submitting) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const payload = {
      user_id: user.id,
      title: title.trim() || null,
      body: body.trim(),
      mood: mood || null,
      habit_id: selectedHabitId || null,
      goal_id: selectedGoalId || null,
      entry_date: entryDate,
      updated_at: new Date().toISOString()
    }

    try {
      if (editingId) {
        // Update
        const { error: updateError } = await supabase
          .from('journal_entries')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', user.id)

        if (updateError) throw updateError
        setSuccess('Journal entry updated.')
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('journal_entries')
          .insert(payload)

        if (insertError) throw insertError
        setSuccess('Journal entry saved.')
      }

      // Reset form
      handleCancelEdit()
      // Refresh list
      await fetchEntriesAndSelectors()
      // Switch back
      setActiveTab('list')
    } catch (err) {
      console.error('Save journal entry failed:', err)
      setError('Could not save your entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditClick = (entry: JournalEntry) => {
    setEditingId(entry.id)
    setTitle(entry.title || '')
    setBody(entry.body)
    setMood(entry.mood || '')
    setSelectedHabitId(entry.habit_id || '')
    setSelectedGoalId(entry.goal_id || '')
    setEntryDate(entry.entry_date)
    setViewingEntry(null)
    setActiveTab('write')
  }

  const handleDeleteClick = async (id: string) => {
    const confirm = window.confirm('Delete this journal entry? This cannot be undone.')
    if (!confirm) return

    setError(null)
    setSuccess(null)

    try {
      const { error: deleteError } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)

      if (deleteError) throw deleteError

      setSuccess('Journal entry deleted.')
      setViewingEntry(null)
      // Refresh
      fetchEntriesAndSelectors()
    } catch (err) {
      console.error('Delete entry failed:', err)
      setError('Could not delete journal entry.')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setTitle('')
    setBody('')
    setMood('')
    setSelectedHabitId('')
    setSelectedGoalId('')
    setEntryDate(new Date().toISOString().split('T')[0])
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link to="/timeline" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Private Journal
          </span>
          <div className="w-5"></div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-cream-dark/30 rounded-2xl p-1 mb-5 select-none">
          <button
            onClick={() => {
              setActiveTab('list')
              handleCancelEdit()
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-plum-main text-cream-light'
                : 'text-plum-main hover:bg-cream-dark/20'
            }`}
          >
            My Entries
          </button>
          <button
            onClick={() => setActiveTab('write')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              activeTab === 'write'
                ? 'bg-plum-main text-cream-light'
                : 'text-plum-main hover:bg-cream-dark/20'
            }`}
          >
            {editingId ? 'Edit Entry' : 'New Entry'}
          </button>
        </div>

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-3 text-xs text-plum-light mb-4 text-left animate-fadeIn">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50/15 border border-green-600/10 rounded-2xl p-3 text-xs text-green-800 mb-4 text-left animate-fadeIn">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading journal...</span>
          </div>
        ) : activeTab === 'list' ? (
          /* ENTRIES LIST VIEW */
          <div className="flex-1 flex flex-col justify-between">
            {entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center select-none">
                <svg className="w-10 h-10 text-plum-main/30 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                <p className="text-sm font-medium text-plum-dark/75 mb-1.5">A quiet place for your thoughts.</p>
                <p className="text-xs text-plum-light/50 max-w-[200px] leading-normal font-light">
                  Write whenever you like.
                </p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="mt-5 border border-plum-main/15 text-plum-main hover:bg-cream-dark/30 py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Write your first entry
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-[360px] overflow-y-auto pr-1 text-left scrollbar-thin">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setViewingEntry(entry)}
                    className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 transition-all hover:border-plum-main/20 cursor-pointer flex flex-col gap-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-bold text-sunset-end uppercase tracking-wider">
                        {new Date(entry.entry_date + 'T12:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {entry.mood && (
                        <span className="text-[8px] bg-plum-main/5 text-plum-light px-1.5 py-0.5 rounded uppercase font-semibold">
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold text-plum-dark text-xs mb-1 truncate">
                        {entry.title || 'Untitled note'}
                      </h4>
                      <p className="text-[11px] text-plum-light/80 leading-relaxed font-light line-clamp-2">
                        {entry.body}
                      </p>
                    </div>

                    {(entry.habits || entry.goals) && (
                      <div className="flex gap-1.5 flex-wrap mt-1 border-t border-plum-main/5 pt-2">
                        {entry.goals && (
                          <span className="text-[7.5px] uppercase tracking-wider font-semibold text-plum-light/60 bg-cream-dark/40 px-1.5 py-0.5 rounded border border-plum-main/5">
                            🎯 {entry.goals.area}
                          </span>
                        )}
                        {entry.habits && (
                          <span className="text-[7.5px] uppercase tracking-wider font-semibold text-plum-light/60 bg-cream-dark/40 px-1.5 py-0.5 rounded border border-plum-main/5">
                            ⚡ {entry.habits.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* WRITE ENTRY VIEW */
          <div className="flex-1 flex flex-col justify-between text-left">
            <form onSubmit={handleSaveEntry} className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {/* Entry Date */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Date
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/30"
                  placeholder="e.g. Quiet reflections..."
                  disabled={submitting}
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Body *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/30 resize-none h-24"
                  placeholder="Write your private thoughts here..."
                  disabled={submitting}
                  required
                />
              </div>

              {/* Mood picker */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/60 font-bold mb-2 ml-1">
                  Current Mood
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map((m) => {
                    const isSelected = mood === m
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMood(isSelected ? '' : m)}
                        disabled={submitting}
                        className={`py-1 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                          isSelected
                            ? 'bg-plum-main text-cream-light border-plum-main'
                            : 'bg-cream-dark/15 text-plum-main border-plum-main/5 hover:bg-cream-dark/35'
                        }`}
                      >
                        {m}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Goal Link */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Link to a Goal (Optional)
                </label>
                <select
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 cursor-pointer capitalize"
                  disabled={submitting}
                >
                  <option value="">No goal link</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>{g.area}</option>
                  ))}
                </select>
              </div>

              {/* Habit Link */}
              <div>
                <label className="block text-[8px] uppercase tracking-wider text-plum-light/60 font-bold mb-1.5 ml-1">
                  Link to a Habit (Optional)
                </label>
                <select
                  value={selectedHabitId}
                  onChange={(e) => setSelectedHabitId(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 cursor-pointer"
                  disabled={submitting}
                >
                  <option value="">No habit link</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 mt-3 pt-3 border-t border-plum-main/10">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      handleCancelEdit()
                      setActiveTab('list')
                    }}
                    className="flex-1 border border-plum-main/15 hover:bg-cream-dark/20 text-plum-main py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-plum-main/10 text-center cursor-pointer disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* READ MODAL */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-plum-dark/30 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 shadow-2xl text-left flex flex-col justify-between min-h-[300px]">
            <div>
              <div className="flex justify-between items-start mb-3 select-none">
                <span className="text-[9px] font-bold text-sunset-end uppercase tracking-wider">
                  {new Date(viewingEntry.entry_date + 'T12:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {viewingEntry.mood && (
                  <span className="text-[8px] bg-plum-main/10 text-plum-main px-2 py-0.5 rounded uppercase font-semibold">
                    Mood: {viewingEntry.mood}
                  </span>
                )}
              </div>

              <h3 className="font-serif text-xl font-normal text-plum-dark italic leading-tight mb-2">
                {viewingEntry.title || 'Journal entry'}
              </h3>

              <div className="max-h-[180px] overflow-y-auto pr-1 font-sans text-xs text-plum-dark/95 leading-relaxed font-light whitespace-pre-wrap scrollbar-thin mb-4">
                {viewingEntry.body}
              </div>

              {(viewingEntry.habits || viewingEntry.goals) && (
                <div className="flex gap-1.5 flex-wrap border-t border-plum-main/5 pt-2 mb-2">
                  {viewingEntry.goals && (
                    <span className="text-[8px] uppercase tracking-wider font-semibold text-plum-light/70 bg-cream-dark/50 px-2 py-0.5 rounded border border-plum-main/5">
                      🎯 Goal: {viewingEntry.goals.area}
                    </span>
                  )}
                  {viewingEntry.habits && (
                    <span className="text-[8px] uppercase tracking-wider font-semibold text-plum-light/70 bg-cream-dark/50 px-2 py-0.5 rounded border border-plum-main/5">
                      ⚡ Habit: {viewingEntry.habits.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-plum-main/10">
              <button
                onClick={() => setViewingEntry(null)}
                className="flex-2 border border-plum-main/15 hover:bg-cream-dark/20 text-plum-main py-2.5 rounded-xl text-xs font-semibold cursor-pointer text-center"
              >
                Close
              </button>
              <button
                onClick={() => handleEditClick(viewingEntry)}
                className="flex-1 border border-plum-main/15 text-plum-main hover:bg-cream-dark/20 py-2.5 rounded-xl text-xs font-semibold cursor-pointer text-center"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteClick(viewingEntry.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-cream-light py-2.5 rounded-xl text-xs font-semibold cursor-pointer text-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
