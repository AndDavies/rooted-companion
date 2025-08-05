'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import OnboardingStepper, { OnboardingData } from '@/components/onboarding/OnboardingStepper'
import { motion } from 'framer-motion'
import { saveOnboardingData } from './actions'

interface OnboardingFlowProps {
  existingData: {
    sleep_quality: string | null
    energy_level: string | null
    stress_level: string | null
    preferred_focus: string | null
    availability: string | null
  } | null
}

export default function OnboardingFlow({ existingData }: OnboardingFlowProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isUpdate = searchParams.get('update') === 'true'
  
  // If user has completed onboarding and this isn't an update, redirect to dashboard
  useEffect(() => {
    if (existingData && !isUpdate) {
      router.push('/dashboard')
    }
  }, [existingData, isUpdate, router])

  const handleOnboardingComplete = async (data: OnboardingData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Use Server Action for reliable database operations and cache management
      const result = await saveOnboardingData(data)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save onboarding data')
      }

      // Success! Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error saving onboarding data:', err)
      setError('Failed to save your preferences. Please try again.')
      setIsSubmitting(false)
    }
  }

  // Don't show anything if user has completed onboarding and this isn't an update
  if (existingData && !isUpdate) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center"
        >
          {error}
        </motion.div>
      )}

      <OnboardingStepper 
        onComplete={handleOnboardingComplete}
        isSubmitting={isSubmitting}
      />

      {/* Additional context for updates */}
      {isUpdate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8 p-4 bg-blue-50 rounded-lg"
        >
          <p className="text-blue-700 text-sm">
            💡 You&apos;re updating your wellness profile. Your new preferences will help us provide better recommendations.
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}