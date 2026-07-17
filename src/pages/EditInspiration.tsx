import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const TYPES = ['motivational', 'calm', 'restart', 'gratitude', 'focus', 'self_care', 'prayer', 'bible_verse', 'saint_quote']

export default function EditInspiration() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [source, setSource] = useState('')
  const [type, setType] = useState('motivational')
  const [category, setCategory] = useState('General')
  const [tone, setTone] = useState('calm')
  const [tagsInput, setTagsInput] = useState('')
  const [isEditable, setIsEditable] = useState(false)

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!user || !id) return

      try {
        const { data, error: fetchError } = await supabase
          .from('inspiration_items')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (!data) {
          setError('Could not find this quote or you do not have permission to edit it.')
          return
        }

        setText(data.text)
        setAuthor(data.author || '')
        setSource(data.source || '')
        setType(data.type)
        setCategory(data.category || 'General')
        setTone(data.tone || 'calm')
        setTagsInput((data.tags || []).join(', '))
        setIsEditable(data.is_user_added)
      } catch (err) {
        console.error('Error fetching quote details:', err)
        setError('A small issue occurred while loading details.')
      } finally {
        setLoading(false)
      }
    }

    fetchItemDetails()
  }, [id, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id || !isEditable) return

    if (!text.trim()) {
      setError('Please enter the quote text.')
      return
    }

    setSubmitting(true)
    setError(null)

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)

    try {
      const { error: updateError } = await supabase
        .from('inspiration_items')
        .update({
          text: text.trim(),
          author: author.trim() || null,
          source: source.trim() || null,
          type,
          category: category.trim(),
          tone: tone.trim(),
          tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError
      navigate('/library/inspiration')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Could not save updates. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !id || !isEditable) return
    const confirm = window.confirm('Are you sure you want to remove this quote?')
    if (!confirm) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('inspiration_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      navigate('/library/inspiration')
    } catch (err) {
      console.error(err)
      setError('Could not delete quote.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/library/inspiration" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Edit Inspiration
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading setup...</span>
          </div>
        ) : error && !text ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-xs text-plum-light/80 text-center mb-4">{error}</p>
            <Link to="/library/inspiration" className="bg-plum-main hover:bg-plum-dark text-cream-light py-2 px-4 rounded-xl text-xs">
              Back to Inspirations
            </Link>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between text-left">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin my-1">
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-3 text-xs text-plum-light leading-relaxed animate-fadeIn">
                  {error}
                </div>
              )}

              {/* Text */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Quote Text</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35 h-20 resize-none"
                  placeholder="e.g. One step at a time."
                  required
                  maxLength={400}
                  disabled={submitting || !isEditable}
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Author (Optional)</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                  placeholder="e.g. Unknown, Saint, St. Augustine"
                  disabled={submitting || !isEditable}
                />
              </div>

              {/* Source */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Source (Optional)</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                  placeholder="e.g. Psalm 23, Letter to Friends"
                  disabled={submitting || !isEditable}
                />
              </div>

              {/* Type & Tone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Theme Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer capitalize"
                    disabled={submitting || !isEditable}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                    disabled={submitting || !isEditable}
                  >
                    <option value="calm">Calm</option>
                    <option value="friendly">Friendly</option>
                    <option value="direct">Direct</option>
                  </select>
                </div>
              </div>

              {/* Category & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40"
                    disabled={submitting || !isEditable}
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Tags (split by comma)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                    placeholder="e.g. strength, peace"
                    disabled={submitting || !isEditable}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-plum-main/10">
                <button
                  type="submit"
                  disabled={submitting || !isEditable}
                  className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/10 text-center cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Quote'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting || !isEditable}
                  className="w-full border border-red-500/20 hover:border-red-500/40 text-red-600 py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all text-center bg-cream-light cursor-pointer"
                >
                  Delete Quote
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
