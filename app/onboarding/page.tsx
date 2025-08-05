import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import OnboardingFlow from './OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  // Redirect to login if not authenticated
  if (error || !data?.user) {
    redirect('/login')
  }

  const user = data.user

  // Check if user has already completed onboarding
  const { data: existingOnboarding } = await supabase
    .from('user_onboarding')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If coming from settings to update profile, don't redirect
  // We'll handle this in the client component

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-logo font-bold text-neutral-900 mb-4">
            Welcome to ROOTED Way
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Let&apos;s personalize your recovery journey with a few quick questions. 
            This will help us create the perfect wellness experience for you.
          </p>
        </div>

        {/* Onboarding Form */}
        <OnboardingFlow 
          existingData={existingOnboarding} 
        />
      </div>
    </div>
  )
}