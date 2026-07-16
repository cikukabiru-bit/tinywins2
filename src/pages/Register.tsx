import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [consent, setConsent] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Form Validations
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Your password should be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError("Hmm, the passwords you entered don't seem to match. Let's double check them.")
      return
    }

    if (!consent) {
      setError('Please agree to store your data securely to create an account.')
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (signUpError) {
        const message = signUpError.message.toLowerCase()
        if (message.includes('user already registered')) {
          setError('An account with this email already exists. Try logging in instead!')
        } else {
          setError("We couldn't create your account just now. Please check your connection and try again.")
        }
        return
      }

      // Check if session was created (implies email confirmation is turned off)
      if (data?.session) {
        navigate('/today')
      } else {
        // If email confirmation is enabled on Supabase
        setSuccessMessage("Account created! Please check your email inbox to confirm your address and log in.")
        // Clear fields
        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setConsent(false)
      }
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
          Create account
        </h1>
        <p className="font-sans text-xs text-plum-light/70 tracking-wide uppercase mb-6">
          Start your TinyWins journey
        </p>

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-6 text-sm text-plum-light text-left">
            <p className="font-medium text-plum-dark mb-1">Take a look</p>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50/10 border border-green-600/20 rounded-2xl p-4 mb-6 text-sm text-plum-dark text-left">
            <p className="font-medium text-green-800 mb-1">Almost there</p>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-4 text-left">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1.5 ml-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
              placeholder="Your name"
              disabled={loading}
              required
            />
          </div>

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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 pl-4 pr-12 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
                placeholder="At least 6 characters"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-plum-light/60 hover:text-plum-main p-1.5 focus:outline-none transition-colors cursor-pointer flex items-center justify-center"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1.5 ml-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 pl-4 pr-12 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
                placeholder="Repeat password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-plum-light/60 hover:text-plum-main p-1.5 focus:outline-none transition-colors cursor-pointer flex items-center justify-center"
              >
                {showConfirmPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.822 7.822L21 21m-2.228-2.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 mt-1 text-xs text-plum-light/80 ml-1 select-none leading-tight">
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-plum-main/20 text-plum-main focus:ring-plum-main/30 accent-plum-main cursor-pointer"
              disabled={loading}
              required
            />
            <label htmlFor="consent-checkbox" className="cursor-pointer">
              I agree to create an account and store my TinyWins data securely
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
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-plum-light/80">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-plum-main hover:underline">
            Log in
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-plum-main/10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-sunset-end opacity-60"></span>
        </div>
      </div>
    </main>
  )
}
