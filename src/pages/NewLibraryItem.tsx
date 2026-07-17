import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Physical', 'Mental', 'Spiritual', 'Self-care', 'Work', 'Routine']
const TYPES = ['video', 'music', 'article', 'podcast', 'prayer']
const MOODS = ['calm', 'anxious', 'tired', 'focused', 'unmotivated', 'restless']

export default function NewLibraryItem() {
  const { user } = useAuth()
  const navigate = useNavigate()

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

  // Simple URL validation helper
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

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
      const { error: insertError } = await supabase
        .from('content_items')
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          type,
          url: url.trim(),
          platform: platform.trim(),
          short_description: shortDescription.trim(),
          tags,
          estimated_duration: estimatedDuration.trim() || null,
          mood,
          is_user_added: true,
          is_default: false,
          is_favourite: false
        })

      if (insertError) throw insertError
      navigate('/library')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Could not save the support link. Please try again.')
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
            Add Support Link
          </span>
          <div className="w-5"></div>
        </div>

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
                disabled={submitting}
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
                disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-plum-main/10">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-2.5 rounded-2xl font-medium text-xs tracking-wide transition-all shadow-md shadow-plum-main/10 text-center cursor-pointer"
              >
                {submitting ? 'Saving...' : 'Add Resource Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
