import { useSearchParams, Link } from 'react-router-dom'

export default function HabitScore() {
  const [searchParams] = useSearchParams()
  const goalId = searchParams.get('goalId')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 text-center z-10">
        <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold mb-3">
          Onboarding Complete
        </span>

        <h1 className="font-serif text-3xl font-normal text-plum-dark italic leading-tight mb-4">
          All set!
        </h1>

        <p className="font-sans text-base text-plum-light leading-relaxed mb-6 max-w-[240px] mx-auto">
          You're in. Habit score dashboard coming soon.
        </p>

        {goalId && (
          <div className="bg-cream-dark/20 rounded-2xl p-4 mb-8 text-xs text-plum-light break-all select-all font-mono">
            <span className="font-semibold block text-[10px] uppercase tracking-wider text-plum-light/70 mb-1 font-sans">
              New Goal ID
            </span>
            {goalId}
          </div>
        )}

        <Link
          to="/today"
          className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm inline-block"
        >
          Go to Dashboard
        </Link>

        <div className="mt-8 pt-6 border-t border-plum-main/10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-sunset-end opacity-60"></span>
        </div>
      </div>
    </main>
  )
}
