'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface OnboardingStep {
  key: keyof OnboardingData
  label: string
  options: Array<{
    value: string
    label: string
    emoji?: string
  }>
}

export interface OnboardingData {
  sleep_quality: string
  energy_level: string
  stress_level: string
  preferred_focus: string
  availability: string
}

interface OnboardingStepperProps {
  onComplete: (data: OnboardingData) => void
  isSubmitting?: boolean
  renderExtraInStep?: (ctx: { currentStep: number; totalSteps: number; isLastStep: boolean }) => React.ReactNode
}

const onboardingSteps: OnboardingStep[] = [
  {
    key: 'sleep_quality',
    label: 'How would you rate your sleep recently?',
    options: [
      { value: 'excellent', label: 'Excellent', emoji: '😴' },
      { value: 'good', label: 'Good', emoji: '🙂' },
      { value: 'fair', label: 'Fair', emoji: '😐' },
      { value: 'poor', label: 'Poor', emoji: '😵‍💫' },
      { value: 'very_poor', label: 'Very Poor', emoji: '😫' }
    ]
  },
  {
    key: 'energy_level',
    label: "How's your energy level during the day?",
    options: [
      { value: 'high', label: 'High Energy', emoji: '⚡' },
      { value: 'moderate', label: 'Moderate', emoji: '🔋' },
      { value: 'low', label: 'Low Energy', emoji: '🪫' },
      { value: 'very_low', label: 'Very Low', emoji: '😴' },
      { value: 'fluctuates', label: 'Fluctuates', emoji: '📈' }
    ]
  },
  {
    key: 'stress_level',
    label: 'How often do you feel stressed?',
    options: [
      { value: 'rarely', label: 'Rarely', emoji: '😌' },
      { value: 'sometimes', label: 'Sometimes', emoji: '🙂' },
      { value: 'often', label: 'Often', emoji: '😰' },
      { value: 'very_often', label: 'Very Often', emoji: '😫' },
      { value: 'constantly', label: 'Constantly', emoji: '🚨' }
    ]
  },
  {
    key: 'preferred_focus',
    label: 'What would you like to focus on most?',
    options: [
      { value: 'sleep', label: 'Better Sleep', emoji: '🌙' },
      { value: 'stress', label: 'Stress Management', emoji: '🧘‍♀️' },
      { value: 'energy', label: 'Energy & Vitality', emoji: '⚡' },
      { value: 'recovery', label: 'Recovery & Rest', emoji: '🛀' },
      { value: 'mindfulness', label: 'Mindfulness', emoji: '🧠' }
    ]
  },
  {
    key: 'availability',
    label: 'When are you most available for short recovery activities?',
    options: [
      { value: 'morning', label: 'Morning (6-10 AM)', emoji: '🌅' },
      { value: 'midday', label: 'Midday (10 AM-2 PM)', emoji: '☀️' },
      { value: 'afternoon', label: 'Afternoon (2-6 PM)', emoji: '🌤️' },
      { value: 'evening', label: 'Evening (6-10 PM)', emoji: '🌆' },
      { value: 'flexible', label: 'Flexible', emoji: '🕐' }
    ]
  }
]

export default function OnboardingStepper({ onComplete, isSubmitting = false, renderExtraInStep }: OnboardingStepperProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Partial<OnboardingData>>({})
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const currentStepData = onboardingSteps[currentStep]
  const totalSteps = onboardingSteps.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const currentAnswer = answers[currentStepData.key]

  const handleOptionSelect = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentStepData.key]: value
    }))
  }

  const handleNext = useCallback(() => {
    if (!currentAnswer) return
    setDirection('forward')
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1))
  }, [currentAnswer, totalSteps])

  const handleBack = useCallback(() => {
    setDirection('backward')
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }, [])

  const handleComplete = useCallback(() => {
    if (!currentAnswer || isSubmitting) return
    const finalAnswers = { ...answers, [currentStepData.key]: currentAnswer }
    onComplete(finalAnswers as OnboardingData)
  }, [currentAnswer, isSubmitting, answers, currentStepData.key, onComplete])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && currentAnswer && !isSubmitting) {
        if (isLastStep) {
          handleComplete()
        } else {
          handleNext()
        }
      } else if (e.key === 'Escape' && !isFirstStep && !isSubmitting) {
        handleBack()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentAnswer, isLastStep, isFirstStep, isSubmitting, handleComplete, handleNext, handleBack])

  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -300 : 300,
      opacity: 0
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-neutral-600">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="text-sm text-neutral-600">
            {Math.round(((currentStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="border-neutral-200 shadow-lg">
        <CardContent className="p-8">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="min-h-[400px] flex flex-col"
            >
              {/* Question */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-logo font-semibold text-neutral-900 mb-4">
                  {currentStepData.label}
                </h2>
                <p className="text-neutral-600">
                  Choose the option that best describes your current situation
                </p>
              </div>

              {/* Options */}
              <div className="flex-1 space-y-3 mb-8">
                {currentStepData.options.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`
                      w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                      flex items-center gap-4 hover:shadow-md
                      ${currentAnswer === option.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }
                    `}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className={`
                      font-medium transition-colors
                      ${currentAnswer === option.value ? 'text-blue-700' : 'text-neutral-700'}
                    `}>
                      {option.label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Extra injected content (e.g., circadian screener) */}
              {renderExtraInStep && (
                <div className="mb-6">
                  {renderExtraInStep({ currentStep, totalSteps, isLastStep })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isFirstStep || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>

                <div className="text-sm text-neutral-500">
                  Press Enter to continue, Escape to go back
                </div>

                {isLastStep ? (
                  <Button
                    onClick={handleComplete}
                    disabled={!currentAnswer || isSubmitting}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    {isSubmitting ? 'Saving...' : 'Complete'}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!currentAnswer || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}