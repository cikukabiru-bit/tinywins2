import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function HabitScore() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const goalId = searchParams.get('goalId')

  const [goalArea, setGoalArea] = useState<string>('')
  const [loadingGoal, setLoadingGoal] = useState<boolean>(true)
  
  // List of locally added habits
  const [habitsList, setHabitsList] = useState<any[]>([])
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [softPrompt, setSoftPrompt] = useState<string | null>(null)

  // Form states for a single habit
  const [habitName, setHabitName] = useState('')
  const [category, setCategory] = useState('Physical')
  const [score, setScore] = useState<number>(5)
  const [note, setNote] = useState('')
  const [currentFrequency, setCurrentFrequency] = useState('Every day')
  const [desiredImprovement, setDesiredImprovement] = useState('Improve')
  const [difficultyLevel, setDifficultyLevel] = useState('Moderate')
  const [emotionalFeeling, setEmotionalFeeling] = useState('Neutral')
  const [priority, setPriority] = useState('Medium')

  useEffect(() => {
    const fetchGoal = async () => {
      if (!goalId) {
        setLoadingGoal(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('goals')
          .select('area')
          .eq('id', goalId)
          .maybeSingle()

        if (error) throw error
        if (data) {
          setGoalArea(data.area)
        }
      } catch (err) {
        console.error('Error fetching goal:', err)
      } finally {
        setLoadingGoal(false)
      }
    }

    fetchGoal()
  }, [goalId])

  // Redirect if no goalId is present and goal loading is complete
  if (!goalId && !loadingGoal) {
    navigate('/today')
    return null
  }

  const resetForm = () => {
    setHabitName('')
    setCategory('Physical')
    setScore(5)
    setNote('')
    setCurrentFrequency('Every day')
    setDesiredImprovement('Improve')
    setDifficultyLevel('Moderate')
    setEmotionalFeeling('Neutral')
    setPriority('Medium')
  }

  const handleAddHabitLocal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!habitName.trim()) return

    const newHabit = {
      id: Math.random().toString(36).substring(2, 9), // unique local ID for removing
      habit_name: habitName,
      category,
      score,
      note,
      current_frequency: currentFrequency,
      desired_improvement: desiredImprovement,
      difficulty_level: difficultyLevel,
      emotional_feeling: emotionalFeeling,
      priority
    }

    setHabitsList([...habitsList, newHabit])
    setIsAdding(false)
    setSoftPrompt(null) // Clear soft warning
    resetForm()
  }

  const handleRemoveHabitLocal = (id: string) => {
    setHabitsList(habitsList.filter((h) => h.id !== id))
    setSoftPrompt(null)
  }

  const handleSaveToDatabase = async () => {
    if (!user || !goalId) return

    setSubmitting(true)
    setError(null)

    try {
      const payload = habitsList.map((h) => ({
        user_id: user.id,
        goal_id: goalId,
        habit_name: h.habit_name,
        category: h.category,
        score: h.score,
        note: h.note,
        current_frequency: h.current_frequency,
        desired_improvement: h.desired_improvement,
        difficulty_level: h.difficulty_level,
        emotional_feeling: h.emotional_feeling,
        priority: h.priority,
        converted_to_habit: false
      }))

      const { error: insertError } = await supabase
        .from('habit_scores')
        .insert(payload)

      if (insertError) throw insertError

      navigate('/today')
    } catch (err) {
      console.error(err)
      setError('We had some trouble saving your habit reflection. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const triggerSubmitCheck = () => {
    if (habitsList.length < 3) {
      setSoftPrompt('To get a clear picture of your routines, we gently recommend reflecting on at least 3 habits related to this goal.')
      return
    }
    handleSaveToDatabase()
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        
        {loadingGoal ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-plum-main font-medium tracking-wide animate-pulse">Loading reflection...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header */}
              <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold mb-2">
                Habit Reflection
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-normal text-plum-dark italic leading-tight mb-2">
                {goalArea || 'Goal'}
              </h1>
              
              {!isAdding && (
                <p className="text-xs text-plum-light/70 mb-4 leading-relaxed">
                  Let's reflect on the habits you already have that relate to this goal. Try to add between 3 and 7 habits.
                </p>
              )}

              {error && (
                <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left">
                  {error}
                </div>
              )}

              {/* soft warning prompt */}
              {softPrompt && !isAdding && (
                <div className="bg-coral-50/10 border border-plum-main/15 rounded-2xl p-4 mb-6 text-xs text-plum-light text-left leading-relaxed">
                  <p className="font-semibold text-plum-dark mb-1">A gentle reminder</p>
                  <p className="mb-3">{softPrompt}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSoftPrompt(null); setIsAdding(true); }}
                      className="bg-plum-main hover:bg-plum-dark text-cream-light py-1.5 px-3 rounded-xl font-medium cursor-pointer text-[11px]"
                    >
                      Add Habit
                    </button>
                    <button
                      onClick={() => { setSoftPrompt(null); handleSaveToDatabase(); }}
                      className="border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-1.5 px-3 rounded-xl font-medium cursor-pointer text-[11px]"
                    >
                      Submit Anyway
                    </button>
                  </div>
                </div>
              )}

              {/* LIST VIEW */}
              {!isAdding && (
                <div>
                  <div className="flex flex-col gap-2.5 max-h-[260px] overflow-y-auto pr-1 text-left scrollbar-thin my-4">
                    {habitsList.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-plum-main/10 rounded-2xl text-xs text-plum-light/50 font-medium">
                        No habits added yet.
                      </div>
                    ) : (
                      habitsList.map((habit) => (
                        <div 
                          key={habit.id} 
                          className="bg-cream-dark/15 border border-plum-main/10 rounded-2xl p-3.5 flex justify-between items-start"
                        >
                          <div className="flex-1 pr-3">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-plum-light/50 bg-cream-dark/35 px-1.5 py-0.5 rounded">
                                {habit.category}
                              </span>
                              <span className="text-[9px] font-bold text-sunset-end bg-sunset-end/10 px-1.5 py-0.5 rounded">
                                Score: {habit.score}/10
                              </span>
                            </div>
                            <h4 className="font-semibold text-plum-dark text-xs mb-0.5">{habit.habit_name}</h4>
                            {habit.note && <p className="text-[10px] text-plum-light/80 italic">"{habit.note}"</p>}
                          </div>
                          <button
                            onClick={() => handleRemoveHabitLocal(habit.id)}
                            className="text-plum-light/40 hover:text-red-500 transition-colors p-0.5 cursor-pointer"
                            title="Remove habit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-plum-light/50 font-semibold mb-4 px-1 select-none">
                    <span>Count: {habitsList.length}/7</span>
                    {habitsList.length >= 3 && <span className="text-green-600/70 font-semibold">Min requirement met</span>}
                  </div>
                </div>
              )}

              {/* FORM VIEW (ADD HABIT) */}
              {isAdding && (
                <form onSubmit={handleAddHabitLocal} className="flex flex-col gap-3 text-left max-h-[340px] overflow-y-auto pr-1 scrollbar-thin my-2">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Habit Name</label>
                    <input
                      type="text"
                      value={habitName}
                      onChange={(e) => setHabitName(e.target.value)}
                      className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-3 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35"
                      placeholder="e.g. morning walk, water check"
                      maxLength={120}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      >
                        <option value="Physical">Physical</option>
                        <option value="Mental">Mental</option>
                        <option value="Work">Work</option>
                        <option value="Spiritual">Spiritual</option>
                        <option value="Social">Social</option>
                        <option value="Financial">Financial</option>
                        <option value="Self-care">Self-care</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Frequency</label>
                      <select
                        value={currentFrequency}
                        onChange={(e) => setCurrentFrequency(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      >
                        <option value="Every day">Every day</option>
                        <option value="Most days">Most days</option>
                        <option value="A few times a week">A few times a week</option>
                        <option value="Once a week">Once a week</option>
                        <option value="Rarely">Rarely</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1 ml-1">
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold">How are you doing with this?</label>
                      <span className="text-xs font-bold text-sunset-end">{score} / 10</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-plum-main/10 rounded-lg appearance-none cursor-pointer accent-plum-main my-2"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Why did you give this score?</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2 px-4 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors placeholder-plum-light/35 resize-none h-16"
                      placeholder="Share a short note..."
                      maxLength={300}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Hope for this</label>
                      <select
                        value={desiredImprovement}
                        onChange={(e) => setDesiredImprovement(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      >
                        <option value="Improve">Improve</option>
                        <option value="Maintain">Maintain</option>
                        <option value="Replace">Replace</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Difficulty</label>
                      <select
                        value={difficultyLevel}
                        onChange={(e) => setDifficultyLevel(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Difficult">Difficult</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">How does it feel?</label>
                      <select
                        value={emotionalFeeling}
                        onChange={(e) => setEmotionalFeeling(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      >
                        <option value="Proud">Proud</option>
                        <option value="Frustrated">Frustrated</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Hopeful">Hopeful</option>
                        <option value="Overwhelmed">Overwhelmed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-plum-light/70 font-semibold mb-1 ml-1">Priority</label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full bg-cream-dark/25 border border-plum-main/10 rounded-2xl py-2.5 px-3 text-plum-dark font-sans text-sm focus:outline-none focus:border-plum-main/40 transition-colors cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => { setIsAdding(false); resetForm(); }}
                      className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-cream-light/30 hover:bg-cream-light/60 text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-2 bg-plum-main hover:bg-plum-dark text-cream-light py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* BUTTON BAR */}
            {!isAdding && (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-plum-main/10">
                {habitsList.length < 7 && (
                  <button
                    type="button"
                    onClick={() => { setIsAdding(true); setSoftPrompt(null); }}
                    disabled={submitting}
                    className="w-full border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-cream-light/30 hover:bg-cream-light/60 text-sm cursor-pointer disabled:opacity-50"
                  >
                    + Add a habit
                  </button>
                )}

                <button
                  type="button"
                  onClick={triggerSubmitCheck}
                  disabled={submitting || habitsList.length === 0}
                  className="w-full bg-plum-main hover:bg-plum-dark text-cream-light py-3.5 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-35"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-cream-light" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving assessment...</span>
                    </>
                  ) : (
                    <span>Finish Reflection</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
