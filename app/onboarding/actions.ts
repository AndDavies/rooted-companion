'use server'

import { createClientForActions } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function saveOnboardingData(data: {
  sleep_quality: string
  energy_level: string
  stress_level: string
  preferred_focus: string
  availability: string
}) {
  try {
    const supabase = await createClientForActions()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect('/login')
    }

    // Check if user already has onboarding data
    const { data: existingData } = await supabase
      .from('user_onboarding')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_onboarding')
        .update({
          ...data,
          created_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        throw new Error('Failed to update onboarding data')
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('user_onboarding')
        .insert({
          ...data,
          user_id: user.id,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        throw new Error('Failed to save onboarding data')
      }
    }

    // Revalidate paths to clear cache
    revalidatePath('/dashboard')
    revalidatePath('/onboarding')
    
    return { success: true }
  } catch (error) {
    console.error('Error saving onboarding data:', error)
    return { success: false, error: 'Failed to save onboarding preferences' }
  }
}