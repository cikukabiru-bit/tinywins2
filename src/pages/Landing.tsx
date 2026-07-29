import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-bg-start via-bg-mid to-bg-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-accent/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-surface rounded-3xl border border-surface-dark/40 p-8 md:p-10 shadow-2xl shadow-border-main/10 text-center z-10">
        {/* Minimalist leaf illustration representing quiet growth */}
        <svg 
          className="w-16 h-16 mx-auto text-primary/80 mb-6" 
          viewBox="0 0 64 64" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M32 52V24" strokeLinecap="round"/>
          <path d="M32 24C32 24 46 22 46 12C46 12 34 10 32 24Z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05"/>
          <path d="M32 32C32 32 18 30 18 20C18 20 30 18 32 32Z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05"/>
          <path d="M32 40C32 40 44 38 44 28C44 28 34 26 32 40Z" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.05"/>
          <circle cx="32" cy="8" r="1.5" fill="currentColor"/>
        </svg>

        <h1 className="font-serif text-5xl md:text-6xl font-normal text-text-main italic leading-none mb-4">
          TinyWins
        </h1>

        <p className="font-sans text-base md:text-lg font-light text-text-muted leading-relaxed max-w-[260px] mx-auto">
          Grow quietly, consistently, and kindly — with grace.
        </p>

        <div className="flex flex-col gap-3 mt-8 max-w-[240px] mx-auto">
          <Link
            to="/register"
            className="w-full bg-primary hover:bg-primary-strong text-on-primary py-3 px-5 rounded-2xl font-medium tracking-wide transition-colors duration-200 shadow-md shadow-border-main/10 text-sm md:text-base inline-block"
          >
            Create account
          </Link>
          <Link
            to="/login"
            className="w-full border border-border-main/20 hover:border-border-main/40 text-primary py-3 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-surface/30 hover:bg-surface/60 text-sm md:text-base inline-block"
          >
            Log in
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-border-main/10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-60"></span>
        </div>
      </div>
    </main>
  )
}
