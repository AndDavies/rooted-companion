'use server'

import { createClientForActions } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function disconnectGarmin() {
  const supabase = await createClientForActions()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    // Delete the wearable connection
    const { error } = await supabase
      .from('wearable_connections')
      .delete()
      .eq('user_id', user.id)
      .eq('wearable_type', 'garmin')

    if (error) {
      console.error('Error disconnecting Garmin:', error)
      throw new Error('Failed to disconnect Garmin device')
    }

    // Revalidate the integrations page to show updated connection status
    revalidatePath('/dashboard/settings/integrations')
    
  } catch (error) {
    console.error('Disconnect error:', error)
    throw new Error('Failed to disconnect device')
  }
} 