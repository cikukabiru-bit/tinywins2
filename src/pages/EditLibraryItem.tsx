import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Physical', 'Mental', 'Spiritual', 'Self-care', 'Work', 'Routine']
const TYPES = ['video', 'music', 'article', 'podcast', 'prayer']
const MOODS = ['calm', 'anxious', 'tired', 'focused', 'unmotivated', 'restless']

export default function EditLibraryItem() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('Physical')
  const [type, setType] = useState('video')
  const [platform, setPlatform] = useState('Web')
  const [shortDescription, setShortDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [estimatedDuration, setEstimatedDuration] = useState('')
  const [mood, setMood] = useState('calm')
  const [isEditable, setIsEditable] = useState(false)

  // Simple URL validation helper
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  useEffect(() => {
    const fetchItemDetails = async () => {
      if (!user || !id) return

      try {
        const { data, error: fetchError } = await supabase
          .from('content_items')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (fetchError) throw fetchError

        if (!data) {
          setError('Could not find this resource or you do not have permission to edit it.')
          return
        }

        setTitle(data.title)
        setUrl(data.url)
        setCategory(data.category)
        setType(data.type)
        setPlatform(data.platform || '')
        setShortDescription(data.short_description || '')
        setTagsInput((data.tags || []).join(', '))
        setEstimatedDuration(data.estimated_duration || '')
        setMood(data.mood || 'calm')
        setIsEditable(data.is_user_added)
      } catch (err) {
        console.error('Error fetching item details:', err)
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

    if (!title.trim() || !url.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (starting with http:// or https://).')
      return
    }

    setSubmitting(true)
    setError(null)

    // Parse comma separated tags
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)

    try {
      const { error: updateError } = await supabase
        .from('content_items')
        .update({
          title: title.trim(),
          category,
          type,
          url: url.trim(),
          platform: platform.trim(),
          short_description: shortDescription.trim(),
          tags,
          estimated_duration: estimatedDuration.trim() || null,
          mood,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError
      navigate('/library')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Could not save updates. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !id || !isEditable) return
    const confirm = window.confirm('Are you sure you want to remove this support link?')
    if (!confirm) return

    setSubmitting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('content_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      navigate('/library')
    } catch (err) {
      console.error(err)
      setError('Could not delete support link.')
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
          <Link to="/library" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            Edit Support Link
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading setup...</span>
          </div>
        ) : error && !title ? (
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-xs text-plum-light/80 text-center mb-4">{error}</p>
            <Link to="/library" className="bg-plum-main hover:bg-plum-dark text-cream-light py-2 px-4 rounded-xl text-xs">
              Back to Library
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

              {/* Title */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                  placeholder="e.g. 5 Minute Breathing Exercise"
                  required
                  disabled={submitting || !isEditable}
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Resource URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                  placeholder="https://example.com/video"
                  required
                  disabled={submitting || !isEditable}
                />
              </div>

              {/* Category & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                    disabled={submitting || !isEditable}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Format</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                    disabled={submitting || !isEditable}
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Platform & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Platform</label>
                  <input
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                    placeholder="e.g. YouTube, Spotify"
                    disabled={submitting || !isEditable}
                  />
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Duration</label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                    placeholder="e.g. 5 mins"
                    disabled={submitting || !isEditable}
                  />
                </div>
              </div>

              {/* Mood & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Recommended Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                    disabled={submitting || !isEditable}
                  >
                    {MOODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Tags (split by comma)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35"
                    placeholder="e.g. calm, stretch"
                    disabled={submitting || !isEditable}
                  />
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-plum-light/60 font-bold mb-1 ml-1">Description</label>
                <textarea
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-3 text-plum-dark font-sans text-xs focus:outline-none focus:border-plum-main/40 placeholder-plum-light/35 h-16 resize-none"
                  placeholder="Write a brief, encouraging note about this resource..."
                  maxLength={250}
                  disabled={submitting || !isEditable}
                />
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-plum-main/10">
                <button
                  type="submit"
                  disabled={submitting || !isEditable}
                  className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/10 text-center cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Resource Link'}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting || !isEditable}
                  className="w-full border border-red-500/20 hover:border-red-500/40 text-red-600 py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all text-center bg-cream-light cursor-pointer"
                >
                  Delete Support Link
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
