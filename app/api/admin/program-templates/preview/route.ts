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

  if (!data || data.length === 0) {
    const { data: raw, error: err2 } = await supabase
      .from('program_templates')
      .select('id, days')
      .eq('name', name)
      .eq('version', version)
      .limit(1)
      .maybeSingle()

    if (err2) return NextResponse.json({ error: err2.message }, { status: 400 })
    if (!raw || !(raw as { days?: unknown }).days) return NextResponse.json({ data: [] })

    const tplId = (raw as { id: string }).id
    const days = (raw as { days: { day?: number; items?: { slot_hint: string; task_ref: string; default_duration?: number }[] }[] }).days
    const synthesized = (Array.isArray(days) ? days : []).map((d) => ({
      template_id: tplId,
      day_number: d?.day ?? null,
      items: Array.isArray(d?.items) ? d.items : [],
    }))
    return NextResponse.json({ data: synthesized })
  }

  return NextResponse.json({ data })
}


