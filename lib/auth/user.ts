import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getServerUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null as null, userId: null as null }
  return { supabase, user, userId: user.id }
}

export async function requireServerUser() {
  const { supabase, user, userId } = await getServerUser()
  if (!user) redirect('/login')
  return { supabase, user, userId: userId! }
}


