import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface QuestionDef {
  id: string
  title: string
  subtitle?: string
  options: string[]
  multiple: boolean
}

// Rearranged questions as requested by the user
const QUESTIONS: QuestionDef[] = [
  {
    id: 'consistency_blocker',
    title: 'What usually blocks your consistency?',
    options: [
      'Forgetfulness',
      'Tiredness',
      'Lack of motivation',
      'Anxiety/overwhelm',
      'Too much work',
      'Unclear goals',
      'Low energy',
      'Procrastination'
    ],
    multiple: false
  },
  {
    id: 'coach_tone',
    title: 'What tone should Tiny Coach use?',
    options: ['Gentle', 'Motivational', 'Spiritual', 'Practical', 'Playful', 'Firm but kind', 'Calm'],
    multiple: false
  },
  {
    id: 'support_style',
    title: 'What type of support helps you most?',
    subtitle: 'Select all that apply.',
    options: [
      'Reminders',
      'Reflection prompts',
      'Music',
      'Videos',
      'Prayer prompts',
      'Progress charts',
      'Accountability messages',
      'Motivational notes'
    ],
    multiple: true
  },
  {
    id: 'inspiration_preferences',
    title: 'Preferred inspiration types',
    subtitle: 'Select all that apply.',
    options: [
      'Motivational quotes',
      'Calm reflections',
      'Bible verses',
      'Saint quotes',
      'Prayer prompts',
      'Gratitude prompts',
      'Focus prompts',
      'Self-care reminders',
      'Mixed'
    ],
    multiple: true
  },
  {
    id: 'primary_goal',
    title: 'What area do you want to improve first?',
    options: [
      'Health',
      'Fitness',
      'Sleep',
      'Focus',
      'Learning',
      'Prayer/Spirituality',
      'Money',
      'Work/Productivity',
      'Self-care',
      'Relationships',
      'Emotional wellbeing'
    ],
    multiple: false
  },
  {
    id: 'available_time',
    title: 'How much time can you realistically give this daily?',
    options: ['1 minute', '3 minutes', '5 minutes', '10 minutes', '15 minutes', 'Flexible'],
    multiple: false
  },
  {
    id: 'preferred_time',
    title: 'What time of day works best for this goal?',
    options: ['Morning', 'Afternoon', 'Evening', 'Night', 'Flexible'],
    multiple: false
  },
  {
    id: 'growth_preference',
    title: 'How should this habit grow?',
    options: [
      'Keep tiny',
      'Increase slowly',
      'Increase only when I choose',
      'Let Tiny Coach suggest growth'
    ],
    multiple: false
  }
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, any>>({
    consistency_blocker: '',
    coach_tone: '',
    support_style: [] as string[],
    inspiration_preferences: [] as string[],
    primary_goal: '',
    available_time: '',
    preferred_time: '',
    growth_preference: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentQuestion = QUESTIONS[step - 1]

  const handleSelect = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option
    }))
  }

  const handleSelectMultiple = (option: string) => {
    setAnswers((prev) => {
      const currentList = prev[currentQuestion.id] as string[]
      const newList = currentList.includes(option)
        ? currentList.filter((item) => item !== option)
        : [...currentList, option]
      return {
        ...prev,
        [currentQuestion.id]: newList
      }
    })
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError(null)
    }
  }

  const handleNext = () => {
    if (step < QUESTIONS.length) {
      setStep(step + 1)
      setError(null)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setSubmitting(true)
    setError(null)

    try {
      const profilePayload = {
        user_id: user.id,
        consistency_blocker: answers.consistency_blocker,
        support_style: answers.support_style,
        coach_tone: answers.coach_tone,
        inspiration_preferences: answers.inspiration_preferences,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }

      const goalPayload = {
        user_id: user.id,
        area: answers.primary_goal,
        available_time: answers.available_time,
        preferred_time: answers.preferred_time,
        growth_preference: answers.growth_preference,
        active: true,
        updated_at: new Date().toISOString()
      }

      // Check if profile exists already
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      let profileError
      if (existingProfile) {
        // Update profile
        const { error } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('user_id', user.id)
        profileError = error
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('profiles')
          .insert(profilePayload)
        profileError = error
      }

      if (profileError) {
        console.error(profileError)
        setError('We had some trouble saving your profile details. Please try again.')
        return
      }

      // Insert the initial goal and select its ID
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .insert(goalPayload)
        .select('id')
        .single()

      if (goalError || !goalData) {
        console.error(goalError)
        setError('We saved your profile, but had trouble creating your first goal. Please try again.')
        return
      }

      // Insert default consents (silent fallback if exists)
      await supabase
        .from('user_consents')
        .insert({
          user_id: user.id,
          data_storage_consent: true,
          ai_personalization_consent: false,
          support_content_consent: false,
          habit_score_personalization_consent: false,
          inspiration_personalization_consent: false,
          consent_version: '1.0'
        })

      // Redirect to /habit-score with the new goal id
      navigate(`/habit-score?goalId=${goalData.id}`)
    } catch (err) {
      console.error(err)
      setError('A small connection issue occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isNextDisabled = currentQuestion.multiple
    ? (answers[currentQuestion.id] as string[]).length === 0
    : answers[currentQuestion.id] === ''

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 flex flex-col z-10 min-h-[500px]">
        
        {/* Progress indicator */}
        <div className="w-full flex items-center justify-between mb-4">
          <span className="text-[10px] tracking-[0.2em] uppercase text-plum-light/50 font-semibold">
            Step {step} of {QUESTIONS.length}
          </span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-plum-light/50 font-semibold">
            {Math.round((step / QUESTIONS.length) * 100)}%
          </span>
        </div>

        <div className="w-full bg-plum-main/10 h-1.5 rounded-full overflow-hidden mb-6">
          <div 
            className="bg-sunset-end h-full transition-all duration-300" 
            style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
          ></div>
        </div>

        {error && (
          <div className="bg-coral-50/10 border border-plum-main/10 rounded-2xl p-4 mb-4 text-xs text-plum-light text-left">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <div className="mb-6">
            <h2 className="font-serif text-2xl md:text-3xl font-normal text-plum-dark italic leading-tight text-left mb-2">
              {currentQuestion.title}
            </h2>
            {currentQuestion.subtitle && (
              <p className="text-xs text-plum-light/70 text-left mb-4">
                {currentQuestion.subtitle}
              </p>
            )}

            {/* Scrollable container for question options */}
            <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1 text-left scrollbar-thin mt-2">
              {currentQuestion.options.map((option) => {
                const isSelected = currentQuestion.multiple
                  ? (answers[currentQuestion.id] as string[]).includes(option)
                  : answers[currentQuestion.id] === option

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => currentQuestion.multiple ? handleSelectMultiple(option) : handleSelect(option)}
                    className={`w-full py-3.5 px-4 rounded-2xl text-sm font-medium transition-all duration-200 text-left border cursor-pointer ${
                      isSelected
                        ? 'bg-plum-main text-cream-light border-plum-main shadow-md shadow-plum-main/15'
                        : 'bg-cream-dark/15 text-plum-main border-plum-main/10 hover:bg-cream-dark/30 hover:border-plum-main/20'
                    }`}
                    disabled={submitting}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {isSelected && (
                        <svg className="w-4 h-4 text-cream-light" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-plum-main/10">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="flex-1 border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-cream-light/30 hover:bg-cream-light/60 text-sm cursor-pointer disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isNextDisabled || submitting}
              className="flex-[2] bg-plum-main hover:bg-plum-dark text-cream-light py-3 rounded-2xl font-medium tracking-wide transition-all duration-200 shadow-md shadow-plum-main/10 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-35"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-cream-light" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>{step === QUESTIONS.length ? 'Finish' : 'Next'}</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
