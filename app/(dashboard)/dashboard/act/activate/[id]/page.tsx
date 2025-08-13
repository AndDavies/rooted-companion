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
  const { data: circTimesRaw } = await supabase
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
  const rawDays = (tpl.days ?? []) as unknown
  // derive wake/bed immediately to use and avoid lint warning
  const wakeTime: string | null = (circTimesRaw as { wake_time?: string | null } | null)?.wake_time ?? null
  const bedtime: string | null = (circTimesRaw as { bedtime?: string | null } | null)?.bedtime ?? null

  type RawTask = { slug?: string; title?: string; pillar?: string; description?: string | null; duration_min?: number | null; duration_max?: number | null; zeitgeber_tags?: string[] | null; default_circadian_slot?: string | null }
  type RawDay = { day?: number; tasks?: RawTask[] }
  const days: RawDay[] = Array.isArray(rawDays) ? (rawDays as RawDay[]) : []
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
    await supabase.from('recovery_plan_reflections').delete().in('plan_id', existingIds)
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

  // Instantiate tasks using tasks array per day
  for (const d of sortedDays) {
    const dayNum = d.day ?? 1
    const base = new Date(`${startDate}T00:00:00.000Z`)
    base.setUTCDate(base.getUTCDate() + (dayNum - 1))
    const ymd = base.toISOString().slice(0,10)

    for (const it of (d.tasks ?? [])) {
      const ref = it.slug ?? ''
      // Best-effort enrich from task_library if present; otherwise use inline data
      const { data: taskDef } = await supabase
        .from('task_library')
        .select('slug,title,description,duration_min,duration_max,pillar,intensity_tags,zeitgeber_tags,default_circadian_slots')
        .eq('slug', ref)
        .maybeSingle()

      const title = it.title ?? taskDef?.title ?? ref
      const duration = (it.duration_min ?? it.duration_max) ?? taskDef?.duration_min ?? null
      const slot = it.default_circadian_slot ?? (taskDef?.default_circadian_slots?.[0] ?? null)
      const scheduled_at = buildScheduledAt(ymd, slot ?? null, wakeTime, bedtime)
      const time_suggestion = pickTimeSuggestion(slot ?? null)
      const pillar = (it.pillar ?? (taskDef as { pillar?: string | null } | null)?.pillar ?? null)
      const category = await mapPillarToCategory(pillar)
      const rationale = it.description ?? taskDef?.description ?? null

      await supabase.from('recovery_plan_tasks').insert({
        plan_id: planRow.id,
        user_id: user.id,
        date: ymd,
        action: title,
        rationale,
        category,
        time_suggestion,
        recipe_id: null,
        scheduled_at,
        task_payload: { template_ref: ref, inline: it, lib: taskDef ?? null },
        evidence_ids: null,
        duration_minutes: duration,
        slot_hint: slot ?? null,
      })
    }
  }

  redirect(`/dashboard/planning?activated=${encodeURIComponent(tpl.name)}`)
}


