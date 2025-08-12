import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function computeStartDate(option: string | null): string {
  const now = new Date()
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const day = new Date(tzNow)
  const start = (opt: string) => {
    switch (opt) {
      case 'now':
        return day
      case 'next_monday': {
        const d = new Date(day)
        const dayOfWeek = d.getUTCDay()
        const delta = (8 - dayOfWeek) % 7 || 7
        d.setUTCDate(d.getUTCDate() + delta)
        return d
      }
      case 'tomorrow':
      default: {
        const d = new Date(day)
        d.setUTCDate(d.getUTCDate() + 1)
        return d
      }
    }
  }
  const chosen = start(option ?? 'tomorrow')
  const y = chosen.getUTCFullYear()
  const m = String(chosen.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(chosen.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

async function mapPillarToCategory(pillar?: string | null): Promise<string | null> {
  if (!pillar) return null
  switch (pillar) {
    case 'movement': return 'movement'
    case 'breath': return 'breathwork'
    case 'focus': return 'mindset'
    case 'sleep': return 'sleep'
    case 'food': return 'nutrition'
    case 'joy': return 'mindset'
    default: return null
  }
}

function pickTimeSuggestion(slot?: string | null): string | null {
  switch (slot) {
    case 'wake': return 'morning'
    case 'mid_morning': return 'morning'
    case 'midday': return 'flexible'
    case 'afternoon': return 'afternoon'
    case 'evening': return 'evening'
    case 'pre_sleep': return 'evening'
    default: return null
  }
}

function buildScheduledAt(dayDate: string, slot: string | null, wakeTime?: string | null, bedtime?: string | null): string | null {
  // Build a UTC timestamp aligned to dayDate.
  // Simplified windows: wake -> wakeTime+60m; midday -> 12:30Z; afternoon -> 16:00Z; pre_sleep -> (bedtime - 60m) if available
  const base = `${dayDate}T`
  try {
    if (slot === 'wake' || slot === 'mid_morning') {
      if (wakeTime) {
        // timetz like 07:00:00+00, use HH:MM
        const hhmm = wakeTime.slice(0,5)
        const [hh, mm] = hhmm.split(':').map(Number)
        const d = new Date(`${dayDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00.000Z`)
        d.setUTCMinutes(d.getUTCMinutes() + 60)
        return d.toISOString()
      }
      return `${base}08:00:00.000Z`
    }
    if (slot === 'midday') return `${base}12:30:00.000Z`
    if (slot === 'afternoon') return `${base}16:00:00.000Z`
    if (slot === 'evening' || slot === 'pre_sleep') {
      if (bedtime) {
        const hhmm = bedtime.slice(0,5)
        const [hh, mm] = hhmm.split(':').map(Number)
        const d = new Date(`${dayDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00.000Z`)
        d.setUTCMinutes(d.getUTCMinutes() - 60)
        return d.toISOString()
      }
      return `${base}20:30:00.000Z`
    }
    return `${base}12:00:00.000Z`
  } catch {
    return null
  }
}

export default async function ActivateTemplatePage({ searchParams, params }: { searchParams: { start?: string }, params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load template
  const { data: tpl, error: tplErr } = await supabase
    .from('program_templates')
    .select('id,name,version,description,audience_tags,days')
    .eq('id', params.id)
    .maybeSingle()
  if (tplErr || !tpl) {
    redirect(`/dashboard/act?error=not_found`)
  }
  if (!Array.isArray(tpl.audience_tags) || !tpl.audience_tags.includes('public')) {
    redirect(`/dashboard/act?error=forbidden`)
  }

  // Personalization context
  const { data: circ } = await supabase
    .from('user_circadian_profiles')
    .select('wake_time,bedtime')
    .eq('user_id', user.id)
    .maybeSingle()
  await supabase
    .from('user_onboarding')
    .select('availability')
    .eq('user_id', user.id)
    .maybeSingle()

  const startDate = computeStartDate(searchParams?.start ?? null)
  const daysRaw = (tpl.days ?? []) as unknown
  type RawItem = { task_ref?: unknown; slot_hint?: unknown; default_duration?: unknown }
  type RawDay = { day?: unknown; items?: unknown }
  const days: { day?: number; items?: { task_ref?: string; slot_hint?: string; default_duration?: number }[] }[] = Array.isArray(daysRaw)
    ? (daysRaw as RawDay[]).map((d) => {
        const dayNum = typeof d?.day === 'number' ? d.day : Number(d?.day) || 1
        const rawItems = Array.isArray(d?.items) ? (d.items as RawItem[]) : []
        const items = rawItems.map((it) => ({
          task_ref: typeof it?.task_ref === 'string' ? it.task_ref : undefined,
          slot_hint: typeof it?.slot_hint === 'string' ? it.slot_hint : undefined,
          default_duration: typeof it?.default_duration === 'number' ? it.default_duration : undefined,
        }))
        return { day: dayNum, items }
      })
    : []
  const sortedDays = [...days].sort((a,b) => (a.day ?? 0) - (b.day ?? 0))
  const lengthDays = sortedDays.length
  const endDate = (() => {
    const d = new Date(`${startDate}T00:00:00.000Z`)
    d.setUTCDate(d.getUTCDate() + Math.max(0, lengthDays - 1))
    return d.toISOString().slice(0,10)
  })()

  // Overwrite existing plan: delete tasks then plans for this user
  const { data: existingPlans } = await supabase
    .from('recovery_plans')
    .select('id')
    .eq('user_id', user.id)
  const existingIds = (existingPlans ?? []).map((p: { id: string }) => p.id)
  if (existingIds.length) {
    await supabase.from('recovery_plan_tasks').delete().in('plan_id', existingIds)
    await supabase.from('recovery_plans').delete().in('id', existingIds)
  }

  // Create plan
  const { data: planRow, error: planErr } = await supabase
    .from('recovery_plans')
    .insert({
      user_id: user.id,
      title: tpl.name,
      description: tpl.description ?? null,
      start_date: startDate,
      end_date: endDate,
      length_days: lengthDays,
      source: 'template',
      source_ref: tpl.id,
      version: tpl.version ?? 1,
      metadata: { activated_from: 'library' },
    })
    .select('id')
    .single()
  if (planErr || !planRow) {
    redirect(`/dashboard/act/${tpl.id}?error=plan_create`)
  }

  // Instantiate tasks
  type Circ = { wake_time?: string | null; bedtime?: string | null }
  const wakeTime: string | null = (circ as Circ | null)?.wake_time ?? null
  const bedtime: string | null = (circ as Circ | null)?.bedtime ?? null

  for (const d of sortedDays) {
    const dayNum = d.day ?? 1
    const base = new Date(`${startDate}T00:00:00.000Z`)
    base.setUTCDate(base.getUTCDate() + (dayNum - 1))
    const ymd = base.toISOString().slice(0,10)
    for (const it of (d.items ?? [])) {
      const ref = it.task_ref ?? ''
      const { data: taskDef } = await supabase
        .from('task_library')
        .select('slug,title,description,duration_min,duration_max,pillar,intensity_tags,zeitgeber_tags,default_circadian_slots')
        .eq('slug', ref)
        .maybeSingle()

      const title = taskDef?.title ?? ref
      const duration = typeof it.default_duration === 'number' ? it.default_duration : (taskDef?.duration_min ?? 15)
      const slot = it.slot_hint ?? (taskDef?.default_circadian_slots?.[0] ?? null)
      const scheduled_at = buildScheduledAt(ymd, slot ?? null, wakeTime, bedtime)
      const time_suggestion = pickTimeSuggestion(slot ?? null)
      const category = await mapPillarToCategory((taskDef as { pillar?: string | null } | null)?.pillar ?? null)

      await supabase.from('recovery_plan_tasks').insert({
        plan_id: planRow.id,
        user_id: user.id,
        date: ymd,
        action: title,
        rationale: (taskDef?.description ?? null),
        category,
        time_suggestion,
        recipe_id: null,
        scheduled_at,
        task_payload: taskDef ?? { ref },
        evidence_ids: null,
        duration_minutes: duration,
        slot_hint: slot ?? null,
      })
    }
  }

  redirect(`/dashboard/planning?activated=${encodeURIComponent(tpl.name)}`)
}


