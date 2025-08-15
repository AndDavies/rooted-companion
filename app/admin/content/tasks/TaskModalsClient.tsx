"use client"
import { useCallback, useMemo, useState } from 'react'
import { z } from 'zod'
import { TaskContentSchema, parseTaskContent } from '@/lib/tasks/contentSchema'
import MediaRepeater, { MediaItem } from '@/components/admin/MediaRepeater'

const TaskPayload = z.object({
  pillar: z.enum(['breath','sleep','food','movement','focus','joy']),
  slug: z.string().min(3).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  description: z.string().optional(),
  duration_min: z.number().int().positive().optional(),
  duration_max: z.number().int().positive().optional(),
  intensity_tags: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  evidence_refs: z.array(z.string()).optional(),
  zeitgeber_tags: z.array(z.string()).optional(),
  default_circadian_slots: z.array(z.string()).optional(),
  version: z.number().int().positive().optional(),
  content: TaskContentSchema.optional(),
}).refine((v) => {
  if (v.duration_min != null || v.duration_max != null) {
    if (v.duration_min == null || v.duration_max == null) return false
    return v.duration_min > 0 && v.duration_max >= v.duration_min
  }
  return true
}, { message: 'If duration is provided, both min and max must be positive and max >= min' })

type Task = z.infer<typeof TaskPayload>

type ContentDraft = {
  description?: string
  how_to?: string[]
  cues?: string[]
  modifications?: string[]
  common_mistakes?: string[]
  media?: MediaItem[]
  alternatives?: { slug: string; note?: string }[]
  contraindications?: string[]
  equipment?: string[]
  location?: string
  intensity_step?: number | null
  effort_rpe?: number | null
}

export function TaskCreateEditModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initial?: Partial<Task>
  onSaved: () => void
}) {
  const [pending, setPending] = useState(false)
  const [values, setValues] = useState<Partial<Task>>(() => initial ?? {
    intensity_tags: [],
    evidence_refs: [],
    zeitgeber_tags: [],
    default_circadian_slots: [],
  })
  const [error, setError] = useState<string | null>(null)

  // UI-only state
  const [fixedDuration, setFixedDuration] = useState(false)
  const [canEditSlug, setCanEditSlug] = useState(false)
  const [contentDraft, setContentDraft] = useState<ContentDraft>(() => {
    const raw = (initial as unknown as { content?: unknown })?.content
    let value: unknown = raw
    if (typeof raw === 'string') {
      try { value = JSON.parse(raw) } catch { value = {} }
    }
    return (parseTaskContent(value) || {}) as ContentDraft
  })

  // Curated options
  const pillarOptions: { label: string, value: Task['pillar'] }[] = [
    { label: 'Breath', value: 'breath' },
    { label: 'Sleep', value: 'sleep' },
    { label: 'Movement', value: 'movement' },
    { label: 'Nutrition', value: 'food' },
    { label: 'Mindset', value: 'focus' },
    { label: 'Joy', value: 'joy' },
  ]

  // Save gating
  const missingReasons = useMemo(() => {
    const reasons: string[] = []
    if (!values.pillar) reasons.push('Pillar')
    if (!values.title || (values.title ?? '').trim().length < 3) reasons.push('Title')
    if (!values.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) reasons.push('Slug (auto)')
    const hasDur = values.duration_min != null && values.duration_max != null && Number(values.duration_min) > 0 && Number(values.duration_max) >= Number(values.duration_min)
    if (!hasDur) reasons.push('Duration (min & max)')
    return reasons
  }, [values.pillar, values.title, values.slug, values.duration_min, values.duration_max])

  const canSave = missingReasons.length === 0 && !pending

  // Helpers
  const handleTitleChange = (title: string) => {
    setValues(v => {
      const next: Partial<Task> = { ...v, title }
      if (!canEditSlug) {
        const slug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
        next.slug = slug
      }
      return next
    })
  }

  const handleDurationMinChange = (val: string) => {
    const n = val === '' ? undefined : Number(val)
    setValues(v => ({
      ...v,
      duration_min: n,
      duration_max: fixedDuration ? n : v.duration_max,
    }))
  }

  function parseLines(val: string): string[] | undefined {
    const lines = val.split('\n').map(s => s.trim()).filter(Boolean)
    return lines.length ? lines : undefined
  }

  function isValidUrl(url: string | undefined): boolean {
    if (!url) return false
    try { new URL(url); return true } catch { return false }
  }

  function normalizeUrlStrict(url: string): string {
    try {
      const u = new URL(url)
      u.host = u.host.toLowerCase()
      if (u.pathname.endsWith('/') && u.pathname !== '/') {
        u.pathname = u.pathname.replace(/\/+$/, '')
      }
      return u.toString()
    } catch {
      return url
    }
  }

  function dedupeStringArray(arr: string[] | undefined): string[] {
    const out: string[] = []
    const seen = new Set<string>()
    for (const s of arr ?? []) {
      const v = s.trim()
      if (!v) continue
      if (!seen.has(v)) { seen.add(v); out.push(v) }
    }
    return out
  }

  const allowedZeitgeber = ['morning','midday','afternoon','evening','night'] as const
  type Zeitgeber = typeof allowedZeitgeber[number]

  function toggleArrayValue(key: 'zeitgeber_tags' | 'default_circadian_slots', val: Zeitgeber) {
    setValues(v => {
      const cur = (v[key] as string[] | undefined) ?? []
      const has = cur.includes(val)
      const next = has ? cur.filter(x => x !== val) : [...cur, val]
      return { ...v, [key]: dedupeStringArray(next.map(s => s.toLowerCase())) }
    })
  }

  function addTagToArray(key: 'intensity_tags' | 'evidence_refs', input: string) {
    const val = input.trim()
    if (!val) return
    if (key === 'evidence_refs' && !isValidUrl(val)) {
      setError('Evidence URL is invalid')
      return
    }
    setError(null)
    const toStore = key === 'evidence_refs' ? normalizeUrlStrict(val) : val
    setValues(v => {
      const cur = (v[key] as string[] | undefined) ?? []
      const next = dedupeStringArray([...cur, toStore])
      return { ...v, [key]: next }
    })
  }

  function removeTagFromArray(key: 'intensity_tags' | 'evidence_refs', val: string) {
    setValues(v => {
      const cur = (v[key] as string[] | undefined) ?? []
      return { ...v, [key]: cur.filter(x => x !== val) }
    })
  }

  function buildContentFromDraft(d: ContentDraft) {
    const out: ContentDraft = {}
    if (d.description) out.description = d.description
    if (d.how_to?.length) out.how_to = d.how_to
    if (d.cues?.length) out.cues = d.cues
    if (d.modifications?.length) out.modifications = d.modifications
    if (d.common_mistakes?.length) out.common_mistakes = d.common_mistakes
    if (d.alternatives?.length) out.alternatives = d.alternatives
    if (d.contraindications?.length) out.contraindications = d.contraindications
    if (d.equipment?.length) out.equipment = d.equipment
    if (d.location) out.location = d.location
    if (d.intensity_step != null) out.intensity_step = d.intensity_step
    if (d.effort_rpe != null) out.effort_rpe = d.effort_rpe
    if (Array.isArray(d.media)) {
      const cleaned = d.media
        .map(m => {
          if (!isValidUrl(m.url)) return null
          const transcript = isValidUrl(m.transcript_url || undefined) ? m.transcript_url : undefined
          const start = (m.start_time || '').trim() || undefined
          const caption = (m.caption || '').trim() || undefined
          return { type: m.type, url: m.url, caption, start_time: start, transcript_url: transcript }
        })
        .filter(Boolean) as Exclude<ContentDraft['media'], undefined>
      if (cleaned.length) out.media = cleaned
    }
    return out
  }

  const submit = useCallback(async () => {
    setPending(true)
    setError(null)
    const parsed = TaskPayload.safeParse(values)
    if (!parsed.success) {
      setPending(false)
      setError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
      return
    }
    // Sanitize, omit empty keys, and filter invalid media prior to validation
    const cleaned = buildContentFromDraft(contentDraft)
    const contentValidation = TaskContentSchema.safeParse(cleaned)
    const safeContent = contentValidation.success ? (parseTaskContent(contentValidation.data) || {}) : {}
    if (!contentValidation.success) {
      setError(prev => {
        const issues = contentValidation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
        return [prev, `Content invalid; saving empty content. ${issues}`].filter(Boolean).join(' | ')
      })
    }
    const res = await fetch('/api/admin/tasks/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...parsed.data,
        content: safeContent,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPending(false)
      setError(String(body?.error ?? 'Request failed'))
      return
    }
    setPending(false)
    onSaved()
    onClose()
  }, [values, onSaved, onClose, contentDraft])

  if (!open) return null

  // Tooltip helper with improved styling and reliable tooltip
  const Hint = ({ text }: { text: string }) => (
    <div className="relative group">
      <span 
        className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-sm font-medium cursor-help border border-blue-200 hover:bg-blue-200 transition-colors" 
      >
        ?
      </span>
      <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 w-80">
        <div className="whitespace-normal leading-relaxed">{text}</div>
        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-md shadow-lg w-[1100px] max-w-[98vw] max-h-[92vh] p-0 flex flex-col">
        <div className="px-4 pt-4 pb-3 border-b flex items-center justify-between">
          <div className="text-lg font-semibold">{initial ? 'Edit Task' : 'Create Task'}</div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded border text-sm" disabled={pending} onClick={onClose}>Cancel</button>
            <button className="px-3 py-1.5 rounded bg-neutral-900 text-white text-sm disabled:opacity-50" disabled={!canSave} onClick={submit}>
              {pending ? 'Saving…' : 'Save Task'}
            </button>
          </div>
        </div>
        <div className="px-4 py-4 overflow-auto">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">Pillar
                  <select className="mt-1 w-full border rounded px-2 h-9"
                    value={values.pillar ?? ''}
                    onChange={(e) => setValues(v => ({ ...v, pillar: e.target.value as Task['pillar'] }))}
                  >
                    <option value="" disabled>Select pillar</option>
                    {pillarOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">Title
                  <input className="mt-1 w-full border rounded px-2 h-9" placeholder="Task title"
                    value={values.title ?? ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </label>
                <div className="sm:col-span-2 grid grid-cols-3 gap-3 items-end">
                  <label className="text-sm">Duration min
                    <input type="number" className="mt-1 w-full border rounded px-2 h-9"
                      value={values.duration_min ?? ''}
                      onChange={(e) => handleDurationMinChange(e.target.value)}
                    />
                  </label>
                  <label className="text-sm">Duration max
                    <input type="number" className="mt-1 w-full border rounded px-2 h-9 disabled:bg-neutral-100"
                      value={values.duration_max ?? ''}
                      disabled={fixedDuration}
                      onChange={(e) => setValues(v => ({ ...v, duration_max: e.target.value === '' ? undefined : Number(e.target.value) }))}
                    />
                  </label>
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4" checked={fixedDuration} onChange={(e) => setFixedDuration(e.target.checked)} />
                    Fixed duration
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm">Slug {canEditSlug ? <span className="text-neutral-500">(editable)</span> : <span className="text-neutral-500">(auto)</span>}</div>
                  <div className="mt-1 flex gap-2">
                    <input className="flex-1 border rounded px-2 h-9 disabled:bg-neutral-100" placeholder="auto-generated"
                      value={values.slug ?? ''}
                      disabled={!canEditSlug}
                      onChange={(e) => setValues(v => ({ ...v, slug: e.target.value }))}
                    />
                    <button type="button" className="px-3 h-9 border rounded" onClick={() => setCanEditSlug(s => !s)}>
                      {canEditSlug ? 'Lock' : 'Edit advanced'}
                    </button>
                  </div>
                </div>

                <label className="text-sm sm:col-span-2">User instructions
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[100px]"
                    value={values.description ?? ''}
                    onChange={(e) => setValues(v => ({ ...v, description: e.target.value }))}
                    placeholder="Short, user-facing how-to (1–3 sentences)"
                  />
                </label>

                {/* Structured content editor */}
                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Description <Hint text="Purpose: Give the overall context and purpose of this task so the user knows why it's included. Example: 'Box breathing is a calming breath technique to reset the nervous system before stressful events.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" value={contentDraft.description ?? ''} onChange={e => setContentDraft(d => ({ ...d, description: e.target.value || undefined }))} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">How to <Hint text="Purpose: Step-by-step instructions for completing the task correctly. Keep each step clear and concise. Example: '1. Inhale through your nose for 4 seconds. 2. Hold for 4 seconds. 3. Exhale through your mouth for 4 seconds. 4. Hold for 4 seconds.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[100px]" placeholder="One step per line" value={(contentDraft.how_to ?? []).join('\n')} onChange={e => setContentDraft(d => ({ ...d, how_to: parseLines(e.target.value) }))} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Cues <Hint text="Purpose: Short reminders that help the user focus on key points during the task. Example: 'Relax your shoulders.' / 'Breathe through your nose.' / 'Keep movements slow and controlled.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" placeholder="One cue per line" value={(contentDraft.cues ?? []).join('\n')} onChange={e => setContentDraft(d => ({ ...d, cues: parseLines(e.target.value) }))} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Modifications <Hint text="Purpose: Ways to adapt the task for different ability levels, limitations, or available time. Example: 'If you feel lightheaded, try a 3-3-3-3 breathing pattern instead of 4-4-4-4.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" placeholder="One modification per line" value={(contentDraft.modifications ?? []).join('\n')} onChange={e => setContentDraft(d => ({ ...d, modifications: parseLines(e.target.value) }))} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Common mistakes <Hint text="Purpose: Frequent errors that reduce effectiveness or increase risk, so the user can avoid them. Example: 'Holding the breath too tightly.' / 'Shrugging shoulders during inhale.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" placeholder="One mistake per line" value={(contentDraft.common_mistakes ?? []).join('\n')} onChange={e => setContentDraft(d => ({ ...d, common_mistakes: parseLines(e.target.value) }))} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Media <Hint text="Attach optional video/audio to guide the user. Keep clips short (≤2–3 min). Add a caption that says what they'll learn." /></div>
                  <MediaRepeater 
                    value={contentDraft.media ?? []} 
                    onChange={(media) => setContentDraft(d => ({ ...d, media: media.length ? media : undefined }))} 
                  />
                </div>

                {/* Create-only advanced arrays */}
                {!initial && (
                  <div className="sm:col-span-2 space-y-4">
                    <div>
                      <div className="text-sm flex items-center">Intensity tags <Hint text="Free-form tags to characterize difficulty (e.g., 'gentle', 'mobility', 'calming'). Use to aid search and grouping." /></div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(values.intensity_tags ?? []).map(t => (
                          <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs">
                            {t}
                            <button type="button" onClick={() => removeTagFromArray('intensity_tags', t)} aria-label={`Remove ${t}`}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input className="flex-1 border rounded px-2 h-9" placeholder="Add tag and press Enter" onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addTagToArray('intensity_tags', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' }
                        }} />
                        <button className="px-3 h-9 border rounded" onClick={(e) => {
                          const ip = (e.currentTarget.previousElementSibling as HTMLInputElement)
                          addTagToArray('intensity_tags', ip?.value ?? ''); if (ip) ip.value = ''
                        }}>Add</button>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm flex items-center">Evidence refs <Hint text="External sources supporting this task (URLs). We'll validate and normalize the links." /></div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(values.evidence_refs ?? []).map(u => (
                          <span key={u} className="inline-flex items-center gap-1 px-2 py-0.5 border rounded-full text-xs">
                            {u}
                            <button type="button" onClick={() => removeTagFromArray('evidence_refs', u)} aria-label={`Remove ${u}`}>×</button>
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input className="flex-1 border rounded px-2 h-9" placeholder="https://example.com/article" onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); addTagToArray('evidence_refs', (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' }
                        }} />
                        <button className="px-3 h-9 border rounded" onClick={(e) => {
                          const ip = (e.currentTarget.previousElementSibling as HTMLInputElement)
                          addTagToArray('evidence_refs', ip?.value ?? ''); if (ip) ip.value = ''
                        }}>Add</button>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm flex items-center">Zeitgeber tags <Hint text="Optional scheduling zeitgebers (time-of-day cues). Allowed: morning, midday, afternoon, evening, night." /></div>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {allowedZeitgeber.map(z => (
                          <label key={`zg-${z}`} className="text-sm inline-flex items-center gap-2">
                            <input type="checkbox" checked={(values.zeitgeber_tags ?? []).includes(z)} onChange={() => toggleArrayValue('zeitgeber_tags', z)} />
                            {z}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm flex items-center">Default circadian slots <Hint text="Default recommended windows for this task. Select 0 or more. Allowed: morning, midday, afternoon, evening, night." /></div>
                      <div className="mt-2 flex flex-wrap gap-3">
                        {allowedZeitgeber.map(z => (
                          <label key={`cs-${z}`} className="text-sm inline-flex items-center gap-2">
                            <input type="checkbox" checked={(values.default_circadian_slots ?? []).includes(z)} onChange={() => toggleArrayValue('default_circadian_slots', z)} />
                            {z}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Alternatives <Hint text="Purpose: Other tasks that achieve a similar effect, useful if the user wants variety or needs to swap. Example: 'Physiological sigh for rapid stress downshift.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" placeholder="slug,note" value={(contentDraft.alternatives ?? []).map(a => `${a.slug}${a.note ? ',' + a.note : ''}`).join('\n')} onChange={e => {
                    const lines = parseLines(e.target.value)
                    const alts = (lines ?? []).map(line => {
                      const [slug, ...rest] = line.split(',').map(s => s.trim())
                      const note = rest.join(',') || undefined
                      return { slug, note }
                    }).filter(a => a.slug)
                    setContentDraft(d => ({ ...d, alternatives: alts.length ? alts : undefined }))
                  }} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Contraindications <Hint text="Purpose: Conditions or situations where the task shouldn't be done for safety reasons. Example: 'Avoid breath-holding if you have uncontrolled high blood pressure.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" placeholder="One per line" value={(contentDraft.contraindications ?? []).join('\n')} onChange={e => setContentDraft(d => ({ ...d, contraindications: parseLines(e.target.value) }))} />
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm flex items-center">Equipment <Hint text="Purpose: Any gear the user needs to perform the task as described. Example: 'Yoga mat' / 'Resistance band' / 'Timer.'" /></div>
                  <textarea className="mt-1 w-full border rounded px-2 py-2 min-h-[80px]" placeholder="One per line" value={(contentDraft.equipment ?? []).join('\n')} onChange={e => setContentDraft(d => ({ ...d, equipment: parseLines(e.target.value) }))} />
                </div>

                <label className="text-sm">Location <Hint text="Purpose: Recommended setting where the task works best or is most practical. Example: 'Home' / 'Quiet outdoor space' / 'Gym.'" />
                  <input className="mt-1 w-full border rounded px-2 h-9" value={contentDraft.location ?? ''} onChange={e => setContentDraft(d => ({ ...d, location: e.target.value || undefined }))} />
                </label>

                <label className="text-sm">Intensity step <Hint text="Purpose: Indicates how challenging this task is compared to similar tasks, so the plan can progress or deload. Example: '0 = baseline, +1 = more challenging version, -1 = easier version.'" />
                  <input type="number" className="mt-1 w-full border rounded px-2 h-9" min={1} max={5} value={contentDraft.intensity_step ?? ''} onChange={e => setContentDraft(d => ({ ...d, intensity_step: e.target.value === '' ? null : Number(e.target.value) }))} />
                </label>

                <label className="text-sm">Effort RPE <Hint text="Purpose: The target Rate of Perceived Exertion (1–10 scale) so users can gauge the effort level. Example: 'Aim for RPE 4–5: moderate effort, breathing slightly elevated but still able to talk.'" />
                  <input type="number" className="mt-1 w-full border rounded px-2 h-9" min={1} max={10} value={contentDraft.effort_rpe ?? ''} onChange={e => setContentDraft(d => ({ ...d, effort_rpe: e.target.value === '' ? null : Number(e.target.value) }))} />
                </label>

                {error && <div className="text-xs text-red-600 sm:col-span-2">{error}</div>}
              </div>
            </div>

            <div className="xl:col-span-5">
              <div className="sticky top-0 space-y-4">
                <div className="border rounded-md">
                  <div className="p-3 border-b">
                    <div className="text-sm text-neutral-500">Preview</div>
                    <div className="text-lg font-semibold">{values.title || 'Task title'}</div>
                    <div className="text-xs text-neutral-500">{values.slug}</div>
                  </div>
                  <div className="p-3 space-y-2 text-sm">
                    <div><span className="text-neutral-500">Pillar:</span> <span className="capitalize">{values.pillar}</span></div>
                    <div><span className="text-neutral-500">Duration:</span> {values.duration_min ?? '—'}{values.duration_max ? `–${values.duration_max}` : ''} min</div>
                    <div><span className="text-neutral-500">Intensity:</span> {(values.intensity_tags ?? []).join(', ') || '—'}</div>
                    <div><span className="text-neutral-500">Zeitgeber:</span> {(values.zeitgeber_tags ?? []).join(', ') || '—'}</div>
                    <div><span className="text-neutral-500">Circadian:</span> {(values.default_circadian_slots ?? []).join(', ') || '—'}</div>
                    <div className="pt-2 text-neutral-700 whitespace-pre-wrap">{values.description}</div>
                    {(() => {
                      const c = parseTaskContent(buildContentFromDraft(contentDraft))
                      if (!c) return <div className="text-xs text-gray-500">No content to preview</div>
                      
                      const blocks: JSX.Element[] = []
                      const hasWhy = !!(values.description || c.description)
                      if (hasWhy) {
                        blocks.push(
                          <details key="why" className="mt-1">
                            <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Why</summary>
                            <div className="mt-1 text-xs text-neutral-600 space-y-1">
                              {values.description ? <p>{values.description}</p> : null}
                              {c.description ? <p>{c.description}</p> : null}
                            </div>
                          </details>
                        )
                      }
                      if (Array.isArray(c.how_to) && c.how_to.length) {
                        blocks.push(
                          <details key="howto" className="mt-1">
                            <summary className="text-xs font-medium text-neutral-800 cursor-pointer">How to</summary>
                            <ol className="mt-1 list-decimal list-inside text-xs text-neutral-700 space-y-1">
                              {c.how_to.map((s, i) => (<li key={i}>{s}</li>))}
                            </ol>
                          </details>
                        )
                      }
                      if (Array.isArray(c.cues) && c.cues.length) {
                        blocks.push(
                          <details key="cues" className="mt-1">
                            <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Cues</summary>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {c.cues.map((s, i) => (<span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded-full border">{s}</span>))}
                            </div>
                          </details>
                        )
                      }
                      if (Array.isArray(c.modifications) && c.modifications.length) {
                        blocks.push(
                          <details key="mods" className="mt-1">
                            <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Modifications</summary>
                            <ul className="mt-1 list-disc list-inside text-xs text-neutral-700 space-y-1">
                              {c.modifications.map((s, i) => (<li key={i}>{s}</li>))}
                            </ul>
                          </details>
                        )
                      }
                      if (Array.isArray(c.common_mistakes) && c.common_mistakes.length) {
                        blocks.push(
                          <details key="mistakes" className="mt-1">
                            <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Common mistakes</summary>
                            <ul className="mt-1 list-disc list-inside text-xs text-neutral-700 space-y-1">
                              {c.common_mistakes.map((s, i) => (<li key={i}>{s}</li>))}
                            </ul>
                          </details>
                        )
                      }
                      if (Array.isArray(c.media) && c.media.length) {
                        blocks.push(
                          <details key="media" className="mt-1">
                            <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Media</summary>
                            <div className="mt-1 space-y-2">
                              {c.media.map((m, i) => (
                                <div key={i} className="space-y-1">
                                  {m.type === 'video' ? (
                                    <video controls playsInline className="w-full rounded border">
                                      <source src={m.url} />
                                    </video>
                                  ) : (
                                    <audio controls className="w-full">
                                      <source src={m.url} />
                                    </audio>
                                  )}
                                  {m.caption ? <div className="text-[11px] text-neutral-500">{m.caption}</div> : null}
                                </div>
                              ))}
                            </div>
                          </details>
                        )
                      }
                      return <div className="space-y-1">{blocks}</div>
                    })()}
                  </div>
                </div>

                <div className="border rounded-md">
                  <div className="p-3 border-b">
                    <div className="text-sm text-neutral-500">Content JSON (read-only)</div>
                  </div>
                  <div className="p-3">
                    <pre className="text-xs font-mono whitespace-pre overflow-auto max-h-64 bg-neutral-50 border rounded p-2">
                      {JSON.stringify(parseTaskContent(buildContentFromDraft(contentDraft)) || {}, null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Validation box moved here */}
                {!canSave && (
                  <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                    <span className="font-medium">To save, fix:</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {missingReasons.map((r) => (
                        <span key={r} className="px-2 py-1 rounded-full bg-amber-100 border border-amber-200">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async () => {
    setPending(true)
    setError(null)
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      setPending(false); setError('Invalid JSON'); return
    }
    const res = z.array(TaskPayload).safeParse(parsed)
    if (!res.success) {
      setPending(false)
      setError(res.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
      return
    }
    const r = await fetch('/api/admin/tasks/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res.data)
    })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      setPending(false)
      setError(String(body?.error ?? 'Request failed'))
      return
    }
    setPending(false)
    onImported()
    onClose()
  }, [text, onImported, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-md shadow-lg w-[760px] max-w-[95vw] p-4 space-y-3">
        <div className="text-lg font-semibold">Bulk Import Tasks (JSON)</div>
        <textarea className="w-full font-mono text-sm border rounded p-3 min-h-[260px]" value={text} onChange={e => setText(e.target.value)} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-1.5 border rounded" disabled={pending} onClick={onClose}>Cancel</button>
          <button className="px-3 py-1.5 rounded bg-neutral-900 text-white disabled:opacity-50" disabled={pending} onClick={submit}>
            {pending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}


