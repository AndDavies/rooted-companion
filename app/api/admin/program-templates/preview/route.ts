import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')
  const versionParam = searchParams.get('version')
  const version = versionParam ? Number(versionParam) : undefined

  if (!name || !version || Number.isNaN(version)) {
    return NextResponse.json({ error: 'name and version are required' }, { status: 400 })
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isUserAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data, error } = await supabase
    .from('v_program_templates_days')
    .select('*')
    .eq('name', name)
    .eq('version', version)
    .order('day_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}


