import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic Validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in both fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Map technical error messages to gentle, friendly ones
        const message = signInError.message.toLowerCase()
        if (message.includes('invalid login credentials')) {
          setError("Hmm, that email or password doesn't match our records. Please try again.")
        } else if (message.includes('email not confirmed')) {
          setError('Please confirm your email address to log in.')
        } else if (message.includes('too many requests')) {
          setError('We have received too many requests. Please take a short break and try again.')
        } else {
          setError("We couldn't sign you in just now. Please check your connection and try again.")
        }
        return
      }

      // On success, redirect to today dashboard
      navigate('/today')
    } catch (err) {
      console.error(err)
      setError('A small hiccup occurred. Let’s try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 text-center z-10">
        <Link to="/" className="inline-block text-plum-main/60 hover:text-plum-main transition-colors mb-4">
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        <h1 className="font-serif text-4xl font-normal text-plum-dark italic leading-none mb-2">
          Welcome back
        </h1>
        <p className="font-sans text-xs text-plum-light/70 tracking-wide uppercase mb-6">
          Sign in to your TinyWins account
        </p>

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-6 text-sm text-plum-light text-left">
            <p className="font-medium text-plum-dark mb-1">Take a look</p>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1.5 ml-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
              placeholder="you@example.com"
              disabled={loading}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <div className="flex items-center justify-between mt-1 text-xs text-plum-light/80 ml-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-plum-main/20 text-plum-main focus:ring-plum-main/30 accent-plum-main"
                disabled={loading}
              />
              <span>Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3.5 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm md:text-base mt-4 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-cream-light" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <span>Log in</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-plum-light/80">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-plum-main hover:underline">
            Create one
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-plum-main/10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-sunset-end opacity-60"></span>
        </div>
      </div>
    </main>
  )
}
