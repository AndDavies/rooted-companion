import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch templates
  const { data: templates, error: tplErr } = await supabase
    .from('program_templates')
    .select('id,name,version,description,audience_tags,updated_at')
    .order('updated_at', { ascending: false })

  if (tplErr) return NextResponse.json({ error: tplErr.message }, { status: 400 })

  // Fetch day rows and aggregate counts per template
  const { data: dayRows, error: dayErr } = await supabase
    .from('v_program_templates_days')
    .select('template_id, day_number')

  if (dayErr) return NextResponse.json({ error: dayErr.message }, { status: 400 })

  const dayCountByTpl: Record<string, number> = {}
  for (const row of dayRows ?? []) {
    const tid = (row as { template_id?: string }).template_id
    const day = (row as { day_number?: string | number }).day_number
    if (!tid || day === undefined || day === null) continue
    dayCountByTpl[tid] = (dayCountByTpl[tid] ?? 0) + 0 // initialize
  }
  // Since v_program_templates_days returns one row per day, but potentially per item, we must count unique day_numbers.
  // Recompute using a Set per template id.
  const uniques: Record<string, Set<string | number>> = {}
  for (const row of dayRows ?? []) {
    const tid = (row as { template_id?: string }).template_id
    const day = (row as { day_number?: string | number }).day_number
    if (!tid || day === undefined || day === null) continue
    if (!uniques[tid]) uniques[tid] = new Set()
    uniques[tid].add(day)
  }
  const dayCount: Record<string, number> = {}
  Object.entries(uniques).forEach(([tid, set]) => { dayCount[tid] = set.size })

  const data = (templates ?? []).map(t => ({
    ...t,
    day_count: dayCount[t.id] ?? 0,
  }))

  return NextResponse.json({ data })
}


