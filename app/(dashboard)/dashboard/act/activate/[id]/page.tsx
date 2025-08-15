import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { parseTaskContent, type TaskContent } from '@/lib/tasks/contentSchema'
import type { TablesInsert, Json } from '@/types/supabase'

function computeStartDate(option: string | null): string {
  const now = new Date()
  // Use app default timezone Europe/Lisbon for stable local dates
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }))
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
    return `${base}09:00:00.000Z`
  } catch {
    return null
  }
}

function normalizePillar(input?: string | null): string | null {
  if (!input) return null
  const v = String(input).trim().toLowerCase()
  if (!v) return null
  switch (v) {
    case 'breath':
      return 'breathwork'
    case 'focus':
      return 'mindset'
    case 'food':
      return 'nutrition'
    case 'breathwork':
    case 'movement':
    case 'sleep':
    case 'nutrition':
    case 'mindset':
    case 'joy':
      return v
    default:
      return v
  }
}

const ALLOWED_SLOT_HINTS = new Set(['wake','mid_morning','midday','afternoon','evening','pre_sleep','flexible'])

type WithZeitgeber = { zeitgeber_tags?: string[] | null }
type WithLibCirc = { default_circadian_slots?: string[] | null; zeitgeber_tags?: string[] | null }

function normalizeSlotHint(item: { slot_hint?: string | null; default_circadian_slot?: string | null } & WithZeitgeber, taskDef?: WithLibCirc | null): string {
  const fromItemZeitgeber = Array.isArray(item?.zeitgeber_tags) ? (item.zeitgeber_tags as string[])[0] : undefined
  const fromLibDefault = Array.isArray(taskDef?.default_circadian_slots) ? (taskDef?.default_circadian_slots as string[])[0] : undefined
  const fromLibZeitgeber = Array.isArray(taskDef?.zeitgeber_tags) ? (taskDef?.zeitgeber_tags as string[])[0] : undefined
  const pick = item.slot_hint ?? item.default_circadian_slot ?? fromItemZeitgeber ?? fromLibDefault ?? fromLibZeitgeber ?? 'flexible'
  const v = String(pick).trim().toLowerCase()
  return ALLOWED_SLOT_HINTS.has(v) ? v : 'flexible'
}

// normalizeDuration no longer used; duration is computed explicitly

/*
function normalizeEvidenceIds(templateEvidence?: unknown, libraryEvidence?: unknown): string[] {
  const extract = (src?: unknown): string[] => {
    if (!src) return []
    if (Array.isArray(src)) {
      const urls: string[] = []
      for (const it of src) {
        if (typeof it === 'string') {
          const u = it.trim()
          if (u) urls.push(u)
        } else if (it && typeof it === 'object') {
          const obj = it as { url?: unknown; href?: unknown }
          const maybeUrl = (typeof obj.url === 'string' ? obj.url : undefined) ?? (typeof obj.href === 'string' ? obj.href : undefined)
          if (typeof maybeUrl === 'string') {
            const u = maybeUrl.trim()
            if (u) urls.push(u)
          }
        }
      }
      return urls
    }
    return []
  }
  const merged = [...extract(libraryEvidence), ...extract(templateEvidence)]
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of merged) {
    if (!seen.has(u)) {
      seen.add(u)
      out.push(u)
    }
  }
  return out
}
*/

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

  type TemplateItem = {
    slug?: string | null
    pillar?: string | null
    title?: string | null
    rationale?: string | null
    duration_minutes?: number | null
    slot_hint?: string | null
    time_suggestion?: string | null
    recipe_id?: string | null
    evidence_ids?: string[] | null
    overrides?: unknown
    // legacy support
    description?: string | null
    duration_min?: number | null
    duration_max?: number | null
    default_circadian_slot?: string | null
  }
  type TemplateDay = { day_index?: number; notes?: string | null; items?: TemplateItem[]; day?: number; tasks?: TemplateItem[] }
  const days: TemplateDay[] = Array.isArray(rawDays) ? (rawDays as TemplateDay[]) : []
  const sortedDays = [...days].sort((a,b) => (a.day_index ?? a.day ?? 0) - (b.day_index ?? b.day ?? 0))
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

  function mergeContent(base: TaskContent | null, override: TaskContent | null): TaskContent {
    const baseContent = base ?? {}
    const overrideContent = override ?? {}
    const out: TaskContent = { ...baseContent }
    
    const mergeArr = (a?: string[], b?: string[]) => {
      if (!a && !b) return undefined
      const vals = [...(a ?? []), ...(b ?? [])]
      return vals.length ? Array.from(new Set(vals)) : undefined
    }
    
    out.description = overrideContent.description ?? out.description
    out.how_to = mergeArr(out.how_to, overrideContent.how_to)
    out.cues = mergeArr(out.cues, overrideContent.cues)
    out.modifications = mergeArr(out.modifications, overrideContent.modifications)
    out.common_mistakes = mergeArr(out.common_mistakes, overrideContent.common_mistakes)
    out.contraindications = mergeArr(out.contraindications, overrideContent.contraindications)
    out.equipment = mergeArr(out.equipment, overrideContent.equipment)
    out.location = overrideContent.location ?? out.location
    out.intensity_step = overrideContent.intensity_step ?? out.intensity_step ?? undefined
    out.effort_rpe = overrideContent.effort_rpe ?? out.effort_rpe ?? undefined
    
    if (baseContent.media || overrideContent.media) {
      const b = baseContent.media ?? []
      const o = overrideContent.media ?? []
      out.media = [...b, ...o]
    }
    if (baseContent.alternatives || overrideContent.alternatives) {
      const b = baseContent.alternatives ?? []
      const o = overrideContent.alternatives ?? []
      out.alternatives = [...b, ...o]
    }
    return out
  }

  // Instantiate tasks using items per day (max 3)
  for (const d of sortedDays) {
    const dayNum = (d.day_index ?? d.day ?? 1)
    const base = new Date(`${startDate}T00:00:00.000Z`)
    base.setUTCDate(base.getUTCDate() + (dayNum - 1))
    const ymd = base.toISOString().slice(0,10)

    const sourceItems = (d.items ?? d.tasks ?? []) as TemplateItem[]
    const limitedItems = sourceItems.slice(0, 3)
    for (const it of limitedItems) {
      const ref = (it.slug ?? (it as unknown as { task_ref?: string | null })?.task_ref ?? '') || ''
      const hasSlug = !!ref
      const { data: taskDef } = hasSlug ? await supabase
        .from('task_library')
        .select('slug,title,description,duration_min,duration_max,pillar,intensity_tags,zeitgeber_tags,default_circadian_slots,evidence_refs,content')
        .eq('slug', ref)
        .maybeSingle() : { data: null }

      const pillarRaw = (it.pillar ?? (taskDef as { pillar?: string | null } | null)?.pillar ?? null)
      const pillar = normalizePillar(pillarRaw)
      const category = await mapPillarToCategory(pillar)
      const rawTitle = (it.title ?? taskDef?.title ?? (hasSlug ? ref : 'Task'))
      const title = String(rawTitle ?? 'Task').trim() || 'Task'
      const rationale = (it.rationale ?? it.description ?? taskDef?.description ?? null)?.toString().trim() || null

      const preferredMinutes =
        (typeof it.duration_min === 'number' ? it.duration_min : undefined)
        ?? (typeof taskDef?.duration_min === 'number' ? taskDef!.duration_min : undefined)
        ?? undefined
      const defaultMinutes = (() => {
        const chosen = typeof preferredMinutes === 'number' ? preferredMinutes : 15
        const clamped = Math.max(5, Math.min(120, Math.round(chosen)))
        return clamped
      })()

      const slotHint = normalizeSlotHint(it as WithZeitgeber, taskDef as WithLibCirc)
      const scheduled_at = buildScheduledAt(ymd, slotHint ?? null, wakeTime, bedtime)
      const time_suggestion = it.time_suggestion ?? pickTimeSuggestion(slotHint ?? null)

      // const evidence_ids = normalizeEvidenceIds(it.evidence_ids, taskDef?.evidence_refs)

      // content: base from library (if any), apply overrides
      const baseContent = parseTaskContent((taskDef as { content?: unknown } | null)?.content ?? {})
      const overrides = parseTaskContent(it.overrides ?? {})
      const templateDescriptive: TaskContent = {}
      if (typeof it.description === 'string' && it.description.trim().length) {
        templateDescriptive.description = it.description.trim()
      }
      const mergedContent = mergeContent(
        mergeContent(baseContent, overrides),
        templateDescriptive
      )

      // Build normalized payload to persist rich fields for planning
      const payload = (() => {
        const tplAny = it as unknown as { zeitgeber_tags?: unknown; default_circadian_slots?: unknown }
        const tplZeit = Array.isArray(tplAny?.zeitgeber_tags) ? (tplAny.zeitgeber_tags as unknown[]).filter(x => typeof x === 'string') as string[] : []
        const tplCirc = Array.isArray(tplAny?.default_circadian_slots) ? (tplAny.default_circadian_slots as unknown[]).filter(x => typeof x === 'string') as string[] : []
        const out: Record<string, unknown> = {
          slug: hasSlug ? ref : null,
          title,
          pillar,
          duration_min: (typeof it.duration_min === 'number' ? it.duration_min : (taskDef?.duration_min ?? null)),
          duration_max: (typeof it.duration_max === 'number' ? it.duration_max : (taskDef?.duration_max ?? null)),
          intensity_tags: (taskDef?.intensity_tags ?? []) as string[],
          evidence_refs: (taskDef?.evidence_refs ?? []) as string[],
          zeitgeber_tags: (tplZeit.length ? tplZeit : ((taskDef?.zeitgeber_tags ?? []) as string[])),
          default_circadian_slots: (tplCirc.length ? tplCirc : ((taskDef?.default_circadian_slots ?? []) as string[])),
          content: mergedContent,
        }
        // Drop undefined keys
        Object.keys(out).forEach(k => { if (out[k] === undefined) delete out[k] })
        return out
      })()

      const payloadHasData = Object.keys(payload).length > 0 && !!(payload['content'] as object)
      if (!payloadHasData) {
        redirect(`/dashboard/act/${tpl.id}?error=empty_payload`)
      }

      const row: TablesInsert<'recovery_plan_tasks'> = {
        plan_id: planRow.id,
        user_id: user.id,
        date: ymd,
        title,
        rationale,
        category,
        pillar,
        slug: hasSlug ? ref : null,
        time_suggestion,
        recipe_id: it.recipe_id ?? null,
        scheduled_at,
        task_payload: payload as unknown as Json,
        evidence_ids: null,
        duration_minutes: defaultMinutes,
        slot_hint: slotHint ?? null,
      }
      await supabase.from('recovery_plan_tasks').insert(row)
    }
  }

  redirect(`/dashboard/planning?activated=${encodeURIComponent(tpl.name)}`)
}


