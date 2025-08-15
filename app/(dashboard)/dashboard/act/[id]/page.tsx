import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HelpCircle, CheckCircle2, Circle } from 'lucide-react'

type EvidenceRef = {
  url: string
  label: string
  summary?: string | null
}

type ProgramTask = {
  slug: string
  title?: string | null
  pillar?: string | null
  evidence?: EvidenceRef[] | null
  description?: string | null
  duration_min?: number | null
  duration_max?: number | null
  zeitgeber_tags?: string[] | null
  default_circadian_slot?: string | null
}

// (TemplateDay legacy type removed to avoid unused var lint error)

type LibTask = {
  slug: string
  title: string | null
  description: string | null
  pillar: string | null
  duration_min: number | null
  duration_max: number | null
  intensity_tags: string[] | null
  evidence_refs: string[] | null
  zeitgeber_tags: string[] | null
  default_circadian_slots: string[] | null
  content: unknown
}

function isNonEmptyArray<T>(val: unknown): val is T[] {
  return Array.isArray(val) && val.length > 0
}

function sanitizeContent(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object') return {}
  const obj = input as Record<string, unknown>
  const out: Record<string, unknown> = {}
  const pickStringArray = (k: string) => {
    const v = obj[k]
    if (Array.isArray(v)) {
      const arr = v.map(x => (typeof x === 'string' ? x : null)).filter(Boolean) as string[]
      if (arr.length) out[k] = arr
    }
  }
  // const pickNumber = (k: string) => {
  //   const v = obj[k]
  //   if (typeof v === 'number') out[k] = v
  // }
  const pickNullableNumber = (k: string) => {
    const v = obj[k]
    if (v == null) return
    if (typeof v === 'number') out[k] = v
  }
  const pickString = (k: string) => {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) out[k] = v.trim()
  }
  // Simple picks; media/alternatives minimally validated
  pickString('description')
  pickStringArray('how_to')
  pickStringArray('cues')
  pickStringArray('modifications')
  pickStringArray('common_mistakes')
  const media = obj['media']
  if (Array.isArray(media)) {
    const cleaned = media.map(m => {
      if (!m || typeof m !== 'object') return null
      const mm = m as Record<string, unknown>
      const type = mm.type === 'video' || mm.type === 'audio' ? mm.type : undefined
      const url = typeof mm.url === 'string' && mm.url.trim() ? mm.url.trim() : undefined
      const caption = typeof mm.caption === 'string' && mm.caption.trim() ? mm.caption.trim() : undefined
      const start_time = typeof mm.start_time === 'string' && mm.start_time.trim() ? mm.start_time.trim() : undefined
      const transcript_url = typeof mm.transcript_url === 'string' && mm.transcript_url.trim() ? mm.transcript_url.trim() : undefined
      if (!type || !url) return null
      return { type, url, caption, start_time, transcript_url }
    }).filter(Boolean)
    if (cleaned.length) out['media'] = cleaned
  }
  const alternatives = obj['alternatives']
  if (Array.isArray(alternatives)) {
    const cleaned = alternatives.map(a => {
      if (!a || typeof a !== 'object') return null
      const aa = a as Record<string, unknown>
      const slug = typeof aa.slug === 'string' && aa.slug.trim() ? aa.slug.trim() : undefined
      const note = typeof aa.note === 'string' && aa.note.trim() ? aa.note.trim() : undefined
      if (!slug) return null
      return { slug, note }
    }).filter(Boolean)
    if (cleaned.length) out['alternatives'] = cleaned
  }
  pickStringArray('contraindications')
  pickStringArray('equipment')
  pickString('location')
  pickNullableNumber('intensity_step')
  pickNullableNumber('effort_rpe')
  return out
}

function normalizeTemplateDays(days: unknown): { day: number; tasks: ProgramTask[]; isLegacy: boolean }[] {
  const list: { day: number; tasks: ProgramTask[]; isLegacy: boolean }[] = []
  if (!Array.isArray(days)) return list
  for (const d of days) {
    const dayIndex = (d && typeof d === 'object' && 'day' in (d as Record<string, unknown>)) ? Number((d as Record<string, unknown>).day) : NaN
    const day = Number.isFinite(dayIndex) ? dayIndex : 0
    const hasTasks = d && typeof d === 'object' && 'tasks' in (d as Record<string, unknown>) && Array.isArray((d as Record<string, unknown>).tasks)
    const hasItems = d && typeof d === 'object' && 'items' in (d as Record<string, unknown>) && Array.isArray((d as Record<string, unknown>).items)
    const tasks: ProgramTask[] = []
    if (hasTasks) {
      const arr = (d as { tasks: unknown[] }).tasks
      for (const t of arr) {
        if (!t || typeof t !== 'object') continue
        const tt = t as Record<string, unknown>
        const slug = typeof tt.slug === 'string' ? tt.slug : ''
        if (!slug) continue
        tasks.push({
          slug,
          title: typeof tt.title === 'string' ? tt.title : null,
          pillar: typeof tt.pillar === 'string' ? tt.pillar : null,
          description: typeof tt.description === 'string' ? tt.description : null,
          duration_min: typeof tt.duration_min === 'number' ? tt.duration_min : null,
          duration_max: typeof tt.duration_max === 'number' ? tt.duration_max : null,
          zeitgeber_tags: Array.isArray(tt.zeitgeber_tags) ? (tt.zeitgeber_tags as unknown[]).filter(x => typeof x === 'string') as string[] : null,
          default_circadian_slot: typeof tt.default_circadian_slot === 'string' ? tt.default_circadian_slot : null,
          evidence: Array.isArray(tt.evidence) ? (tt.evidence as unknown[]).map(e => {
            if (!e || typeof e !== 'object') return null
            const ee = e as Record<string, unknown>
            const url = typeof ee.url === 'string' ? ee.url : ''
            if (!url) return null
            return { url, label: typeof ee.label === 'string' ? ee.label : new URL(url).host, summary: typeof ee.summary === 'string' ? ee.summary : undefined }
          }).filter(Boolean) as EvidenceRef[] : null,
        })
      }
    } else if (hasItems) {
      const arr = (d as { items: unknown[] }).items
      for (const it of arr) {
        if (!it || typeof it !== 'object') continue
        const ii = it as Record<string, unknown>
        const slug = typeof ii.task_ref === 'string' ? ii.task_ref : ''
        if (!slug) continue
        const default_duration = typeof ii.default_duration === 'number' ? ii.default_duration : null
        tasks.push({
          slug,
          title: null,
          pillar: null,
          description: null,
          duration_min: default_duration,
          duration_max: default_duration,
          zeitgeber_tags: null,
          default_circadian_slot: typeof ii.slot_hint === 'string' ? ii.slot_hint : null,
          evidence: null,
        })
      }
    }
    list.push({ day, tasks, isLegacy: hasItems && !hasTasks })
  }
  return list
}

function computeSlot(task: ProgramTask, lib?: LibTask | null): string {
  return task.default_circadian_slot
    || (isNonEmptyArray<string>(task.zeitgeber_tags) ? task.zeitgeber_tags![0] : undefined)
    || (isNonEmptyArray<string>(lib?.default_circadian_slots) ? (lib!.default_circadian_slots as string[])[0] : undefined)
    || 'flexible'
}

function humanDuration(min?: number | null, max?: number | null): string | null {
  if (typeof min !== 'number' && typeof max !== 'number') return null
  if (typeof min === 'number' && typeof max === 'number') {
    return min === max ? `${min} min` : `${min}-${max} min`
  }
  const v = (typeof min === 'number' ? min : max) as number
  return `${v} min`
}

function mergeTaskWithLibrary(task: ProgramTask, lib?: LibTask | null) {
  const merged = {
    slug: task.slug,
    title: task.title ?? lib?.title ?? task.slug,
    pillar: task.pillar ?? lib?.pillar ?? 'general',
    description: task.description ?? lib?.description ?? null,
    duration_min: task.duration_min ?? lib?.duration_min ?? null,
    duration_max: task.duration_max ?? lib?.duration_max ?? null,
    zeitgeber_tags: (task.zeitgeber_tags ?? lib?.zeitgeber_tags ?? []) as string[] | null,
    default_circadian_slot: task.default_circadian_slot ?? null,
    intensity_tags: (lib?.intensity_tags ?? []) as string[] | null,
    evidence_refs: (lib?.evidence_refs ?? []) as string[] | null,
    content: sanitizeContent(lib?.content ?? {}),
    evidence: task.evidence ?? null,
  }
  return merged
}

function normalizeCategoryFromPillar(pillar: string | null | undefined): string {
  const p = (pillar || '').toLowerCase()
  if (p === 'breath' || p === 'breathwork') return 'breathwork'
  if (p === 'movement') return 'movement'
  if (p === 'sleep') return 'sleep'
  if (p === 'food' || p === 'nutrition') return 'nutrition'
  if (p === 'focus' || p === 'mindset') return 'mindset'
  return 'general'
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'breathwork': return '🫁'
    case 'movement': return '🚶'
    case 'sleep': return '😴'
    case 'nutrition': return '🥗'
    case 'mindset': return '🧠'
    default: return '✨'
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'breathwork': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'movement': return 'bg-green-50 text-green-700 border-green-200'
    case 'sleep': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'nutrition': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'mindset': return 'bg-pink-50 text-pink-700 border-pink-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function getTimeIcon(slot: string | null | undefined): string {
  const s = (slot || '').toLowerCase()
  if (s.includes('morning')) return '☀️'
  if (s.includes('midday') || s.includes('afternoon')) return '🌅'
  if (s.includes('evening') || s.includes('night')) return '🌙'
  return '⏰'
}

export default async function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: tpl, error } = await supabase
    .from('program_templates')
    .select('id,name,version,description,audience_tags,days')
    .eq('id', params.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!tpl) return notFound()

  const normalizedDays = normalizeTemplateDays(tpl.days)
  const sortedDays = [...normalizedDays].sort((a, b) => (a.day ?? 0) - (b.day ?? 0))
  const isLegacyOverall = normalizedDays.some(d => d.isLegacy)

  // Hydrate from library by distinct slugs
  const slugs = Array.from(new Set(sortedDays.flatMap(d => d.tasks.map(t => t.slug)).filter(Boolean)))
  let libMap = new Map<string, LibTask>()
  if (slugs.length) {
    const { data: libRows } = await supabase
      .from('task_library')
      .select('slug,title,description,pillar,duration_min,duration_max,intensity_tags,evidence_refs,zeitgeber_tags,default_circadian_slots,content')
      .in('slug', slugs)
    if (Array.isArray(libRows)) {
      libMap = new Map(libRows.map(row => [row.slug, row as LibTask]))
    }
  }

  return (
    <div className="w-full space-y-8">
      {/* Page Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-logo font-bold text-neutral-900">Program Details</h1>
          <p className="text-lg text-neutral-600 max-w-2xl">Review the full program outline before activating it.</p>
          <Link href="/dashboard/act" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">← Back to Program Library</Link>
        </div>
        <Link href="/how-it-works#act" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Learn more</span>
        </Link>
      </div>

      {/* Program Intro */}
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            
            <CardTitle className="text-2xl text-neutral-900">{tpl.name}</CardTitle>
            <div className="text-sm text-neutral-500">v{tpl.version} {Array.isArray(tpl.audience_tags) && tpl.audience_tags.includes('public') ? (<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200">Public</span>) : null}</div>
          </div>
          <form action={`/dashboard/act/activate/${tpl.id}`} method="get" className="flex items-center gap-2">
            <select name="start" className="border rounded px-2 h-9 text-sm">
              <option value="now">Start Now</option>
              <option value="tomorrow" selected>Tomorrow</option>
              <option value="next_monday">Next Monday</option>
            </select>
            <Button type="submit" className="h-9">Activate</Button>
          </form>
        </CardHeader>
        <CardContent>
          {tpl.description ? <p className="text-neutral-700">{tpl.description}</p> : null}
        </CardContent>
      </Card>

      {/* Program Days - mirrors planning daily cards */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Program Days</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedDays.map((d) => {
            const dayNumber = d.day ?? 0
            const items = (d.tasks ?? []).map(t => mergeTaskWithLibrary(t, libMap.get(t.slug)))
            return (
              <Card key={`day-${dayNumber}`} className="rounded-xl shadow-sm transition-all duration-200 hover:shadow-md border-neutral-200 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-neutral-900">Day {dayNumber}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((it, idx) => {
                      const category = normalizeCategoryFromPillar(it.pillar)
                      const durationText = humanDuration(it.duration_min, it.duration_max)
                      const slot = computeSlot(it as ProgramTask, libMap.get(it.slug))
                      return (
                        <div key={`it-${dayNumber}-${idx}`} className="border rounded-lg p-3 transition-all duration-200 bg-white border-neutral-200 hover:border-neutral-300">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Circle className="w-4 h-4 text-neutral-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getCategoryColor(category)}`}>
                                  {getCategoryIcon(category)} {category}
                                </span>
                                {slot && (
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                                    {getTimeIcon(slot)} {slot}
                                  </span>
                                )}
                                {durationText && (
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                                    ⏱️ {durationText}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-neutral-900 text-sm mb-1">{it.title || it.slug}</h4>
                                {it.description ? (
                                  <p className="text-xs text-neutral-600">{it.description}</p>
                                ) : null}
                              </div>
                              {Array.isArray(it.evidence) && it.evidence.length > 0 && (
                                <div className="pt-2 border-t border-neutral-200">
                                  <div className="text-[11px] text-neutral-500 mb-1">Evidence</div>
                                  <ul className="space-y-1">
                                    {it.evidence.map((e, i) => (
                                      <li key={`ev-${idx}-${i}`} className="text-xs">
                                        <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                                          {e.label}
                                        </a>
                                        {e.summary ? <span className="text-neutral-500"> — {e.summary}</span> : null}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {!isNonEmptyArray(it.evidence) && isNonEmptyArray<string>(it.evidence_refs) && (
                                <div className="pt-2 border-t border-neutral-200">
                                  <div className="text-[11px] text-neutral-500 mb-1">Evidence</div>
                                  <ul className="space-y-1">
                                    {it.evidence_refs!.map((u: string, i: number) => (
                                      <li key={`evu-${idx}-${i}`} className="text-xs">
                                        <a href={u} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">{u}</a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Details collapsible */}
                              {(() => {
                                const c = sanitizeContent((it as unknown as { content?: unknown })?.content)
                                const hasAny = Boolean(
                                  (Array.isArray(c.how_to) && c.how_to.length) ||
                                  (Array.isArray(c.cues) && c.cues.length) ||
                                  (Array.isArray(c.modifications) && c.modifications.length) ||
                                  (Array.isArray(c.common_mistakes) && c.common_mistakes.length) ||
                                  (Array.isArray(c.equipment) && c.equipment.length) ||
                                  c.location || c.intensity_step != null || c.effort_rpe != null ||
                                  (Array.isArray(c.media) && c.media.length)
                                )
                                if (!hasAny) return null
                                return (
                                  <details className="mt-1">
                                    <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Details</summary>
                                    <div className="mt-1 text-xs text-neutral-700 space-y-2">
                                      {Array.isArray(c.how_to) && c.how_to.length ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">How to</div>
                                          <ol className="list-decimal list-inside space-y-0.5">{(c.how_to as string[]).map((s,i)=>(<li key={i}>{s}</li>))}</ol>
                                        </div>
                                      ) : null}
                                      {Array.isArray(c.cues) && c.cues.length ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Cues</div>
                                          <div className="flex flex-wrap gap-1">{(c.cues as string[]).map((s,i)=>(<span key={i} className="px-2 py-0.5 bg-neutral-100 border rounded-full">{s}</span>))}</div>
                                        </div>
                                      ) : null}
                                      {Array.isArray(c.modifications) && c.modifications.length ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Modifications</div>
                                          <ul className="list-disc list-inside space-y-0.5">{(c.modifications as string[]).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
                                        </div>
                                      ) : null}
                                      {Array.isArray(c.common_mistakes) && c.common_mistakes.length ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Common mistakes</div>
                                          <ul className="list-disc list-inside space-y-0.5">{(c.common_mistakes as string[]).map((s,i)=>(<li key={i}>{s}</li>))}</ul>
                                        </div>
                                      ) : null}
                                      {Array.isArray(c.equipment) && c.equipment.length ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Equipment</div>
                                          <div className="flex flex-wrap gap-1">{(c.equipment as string[]).map((s,i)=>(<span key={i} className="px-2 py-0.5 bg-neutral-100 border rounded-full">{s}</span>))}</div>
                                        </div>
                                      ) : null}
                                      {c.location ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Location</div>
                                          <div>{String(c.location)}</div>
                                        </div>
                                      ) : null}
                                      {c.intensity_step != null || c.effort_rpe != null ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Progression</div>
                                          <div className="flex flex-wrap gap-2">
                                            {c.intensity_step != null ? (<span className="px-2 py-0.5 bg-neutral-100 border rounded-full">Intensity step: {String(c.intensity_step)}</span>) : null}
                                            {c.effort_rpe != null ? (<span className="px-2 py-0.5 bg-neutral-100 border rounded-full">Effort RPE: {String(c.effort_rpe)}</span>) : null}
                                          </div>
                                        </div>
                                      ) : null}
                                      {Array.isArray(c.media) && c.media.length ? (
                                        <div>
                                          <div className="font-medium text-neutral-800">Media</div>
                                          <div className="space-y-1">
                                            {(c.media as {type:'video'|'audio';url:string;caption?:string}[]).map((m,i)=> (
                                              <div key={i} className="flex items-center gap-2 text-xs">
                                                <a className="text-blue-600 hover:text-blue-700" href={m.url} target="_blank" rel="noreferrer">{m.type === 'video' ? 'Video' : 'Audio'}</a>
                                                {m.caption ? <span className="text-neutral-500">— {m.caption}</span> : null}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  </details>
                                )
                              })()}
                              {!libMap.get(it.slug) && (
                                <div className="mt-1 text-[11px] inline-flex px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Unknown task slug: {it.slug}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {isLegacyOverall && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">Legacy template format — consider migrating.</div>
        )}
      </div>
    </div>
  )
}


