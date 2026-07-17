import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Goal {
  id: string
  area: string
  available_time: string
  preferred_time: string
  growth_preference: string
  why: string
  active: boolean
  habitsCount?: number
}

export default function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchGoalsData = async () => {
      if (!user) return

      try {
        // Fetch active goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('active', true)

        if (goalsError) throw goalsError

        // Fetch active habits to count them
        const { data: habitsData, error: habitsError } = await supabase
          .from('habits')
          .select('id, goal_id')
          .eq('user_id', user.id)
          .eq('active', true)

        if (habitsError) throw habitsError

        const enrichedGoals = (goalsData || []).map((g) => {
          const habitsForGoal = (habitsData || []).filter((h) => h.goal_id === g.id)
          return {
            ...g,
            habitsCount: habitsForGoal.length
          }
        })

        setGoals(enrichedGoals)
      } catch (err) {
        console.error('Error fetching goals:', err)
        setError('Could not load goals. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchGoalsData()
  }, [user])

  const handleRestGoal = async (goalId: string) => {
    if (!user) return
    setSubmittingId(goalId)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', goalId)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Remove from active list locally
      setGoals((prev) => prev.filter((g) => g.id !== goalId))
    } catch (err) {
      console.error(err)
      setError('Could not rest this goal. Please try again.')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/today" className="text-plum-main/60 hover:text-plum-main transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold">
            My Goals
          </span>
          <div className="w-5"></div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading goals...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Heading */}
              <header className="text-left mb-6 select-none">
                <h1 className="font-serif text-2xl font-normal text-plum-dark italic leading-tight">
                  My Focus Areas
                </h1>
                <p className="text-xs text-plum-light/70 font-light">Growing several paths gently at once.</p>
              </header>

              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left">
                  {error}
                </div>
              )}

              {goals.length === 0 ? (
                <div className="text-center py-12 select-none">
                  <p className="text-sm font-medium text-plum-dark/60 mb-2">No active goals yet.</p>
                  <p className="text-xs text-plum-light/60 max-w-[220px] mx-auto leading-normal">
                    Create a new goal area to begin building tiny habits underneath it.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin my-2 text-left">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex flex-col transition-all hover:border-plum-main/20"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[8px] font-semibold uppercase tracking-wider text-sunset-end bg-sunset-end/5 px-1.5 py-0.5 rounded border border-sunset-end/10">
                            {goal.area}
                          </span>
                          {goal.why && (
                            <p className="text-[10px] text-plum-dark italic font-serif leading-relaxed mt-2 pl-1 border-l-2 border-sunset-start">
                              "{goal.why}"
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => handleRestGoal(goal.id)}
                          disabled={submittingId === goal.id}
                          className="text-[9px] text-plum-light/50 hover:text-plum-main transition-colors font-medium border border-plum-main/10 hover:border-plum-main/35 px-2.5 py-1 rounded-xl cursor-pointer disabled:opacity-50"
                        >
                          {submittingId === goal.id ? 'Resting...' : 'Rest goal'}
                        </button>
                      </div>

                      {/* Goal Stats Info */}
                      <div className="flex gap-4 mt-2 text-[9px] text-plum-light/60 font-semibold select-none border-t border-plum-main/5 pt-2.5">
                        <span>⏱️ {goal.available_time}</span>
                        <span>🌅 {goal.preferred_time}</span>
                        <span>🌱 {goal.habitsCount} {goal.habitsCount === 1 ? 'active habit' : 'active habits'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Area */}
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-plum-main/10">
              <Link
                to="/goals/new"
                className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm text-center inline-block"
              >
                Add a goal
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
