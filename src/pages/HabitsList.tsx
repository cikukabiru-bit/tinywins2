import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Habit {
  id: string
  user_id: string
  goal_id: string
  name: string
  category: string
  tiny_goal: string
  preferred_time: string
  active: boolean
  goals: {
    area: string
  } | null
}

export default function HabitsList() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHabits = async () => {
      if (!user) return

      try {
        const { data, error: fetchError } = await supabase
          .from('habits')
          .select('*, goals(area)')
          .eq('user_id', user.id)
          .eq('active', true)
          .order('created_at', { ascending: true })

        if (fetchError) throw fetchError
        setHabits(data || [])
      } catch (err) {
        console.error('Error fetching habits:', err)
        setError('A small issue occurred while loading your habits. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchHabits()
  }, [user])

  // Group habits by their goal area
  const groupedHabits: Record<string, Habit[]> = {}
  habits.forEach((habit) => {
    const areaName = habit.goals?.area || 'General'
    if (!groupedHabits[areaName]) {
      groupedHabits[areaName] = []
    }
    groupedHabits[areaName].push(habit)
  })

  const goalAreas = Object.keys(groupedHabits)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
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
            My Habits
          </span>
          <div className="w-5"></div> {/* spacer */}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading habits...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left">
                  {error}
                </div>
              )}

              {/* EMPTY STATE */}
              {habits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none">
                  <svg 
                    className="w-12 h-12 text-plum-main/30 mb-4" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-plum-dark/60 mb-2">No tiny habits yet.</p>
                  <p className="text-xs text-plum-light/60 max-w-[200px] leading-normal">
                    Add your first one to start growing quietly and consistently.
                  </p>
                </div>
              ) : (
                /* HABITS LIST */
                <div className="flex flex-col gap-5 max-h-[340px] overflow-y-auto pr-1 text-left scrollbar-thin my-2">
                  {goalAreas.map((area) => (
                    <div key={area} className="flex flex-col gap-2">
                      {/* Goal section heading */}
                      <h3 className="text-[10px] tracking-[0.2em] uppercase font-bold text-sunset-end ml-1 mb-1">
                        {area}
                      </h3>

                      {groupedHabits[area].map((habit) => (
                        <div 
                          key={habit.id} 
                          className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-4 flex justify-between items-center transition-all hover:border-plum-main/20"
                        >
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                {habit.category}
                              </span>
                              {habit.preferred_time && (
                                <span className="text-[9px] text-plum-light/60 bg-plum-main/5 px-1.5 py-0.5 rounded font-medium">
                                  {habit.preferred_time}
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold text-plum-dark text-sm mb-0.5">{habit.name}</h4>
                            <p className="text-xs text-plum-light/80 font-light">
                              Tiny goal: {habit.tiny_goal}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => navigate(`/habits/${habit.id}/edit`)}
                            className="text-plum-light/40 hover:text-plum-main transition-colors p-1 cursor-pointer"
                            title="Edit habit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-plum-main/10">
              <Link
                to="/habits/new"
                className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm text-center inline-block"
              >
                Add habit
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}
