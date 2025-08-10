import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isUserAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data, error } = await supabase
    .from('v_task_library_min')
    .select('*')
    .order('pillar')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}


