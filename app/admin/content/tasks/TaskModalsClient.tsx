"use client"
import { useCallback, useMemo, useState } from 'react'
import { useToast } from '@/components/ui/useToast'
import { z } from 'zod'

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
}).refine((v) => {
  if (v.duration_min != null || v.duration_max != null) {
    if (v.duration_min == null || v.duration_max == null) return false
    return v.duration_min > 0 && v.duration_max >= v.duration_min
  }
  return true
}, { message: 'If duration is provided, both min and max must be positive and max >= min' })

type Task = z.infer<typeof TaskPayload>

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
  const { toast } = useToast()
  const [pending, setPending] = useState(false)
  const [values, setValues] = useState<Partial<Task>>(() => initial ?? {})
  const [error, setError] = useState<string | null>(null)

  // UI-only state
  const [fixedDuration, setFixedDuration] = useState(false)
  const [canEditSlug, setCanEditSlug] = useState(false)
  const [evidence, setEvidence] = useState<{ label: string; url: string; type?: 'RCT' | 'Review' | 'Meta' | 'Other' }[]>([])

  // Curated options
  const pillarOptions: { label: string, value: Task['pillar'] }[] = [
    { label: 'Breath', value: 'breath' },
    { label: 'Sleep', value: 'sleep' },
    { label: 'Movement', value: 'movement' },
    { label: 'Nutrition', value: 'food' },
    { label: 'Mindset', value: 'focus' },
    { label: 'Joy', value: 'joy' },
  ]

  const zeitgeberOptions = [
    { label: 'Light', value: 'light', hint: 'Bright outdoor/daylight exposure to advance/stabilize circadian phase' },
    { label: 'Feeding', value: 'feeding', hint: 'Caloric intake that anchors the daily eating window' },
    { label: 'Movement', value: 'movement', hint: 'Exercise or physical activity as a secondary time cue' },
    { label: 'Temperature', value: 'temperature', hint: 'Cold/heat exposure affecting arousal and sleep pressure' },
    { label: 'Stimulant', value: 'stimulant', hint: 'Caffeine-like substances influencing alertness and cutoff rules' },
    { label: 'Social', value: 'social', hint: 'Timed social interaction that reinforces routine' },
    { label: 'Dark', value: 'dark', hint: 'Light restriction/blue-light hygiene to support melatonin onset' },
  ] as const

  const circadianOptions = [
    { label: 'Post-wake (0–2h)', value: 'post_wake_0_2h' },
    { label: 'Mid-morning (2–5h)', value: 'mid_morning_2_5h' },
    { label: 'Early afternoon (13–15h)', value: 'early_afternoon_13_15' },
    { label: 'Late afternoon (15–18h)', value: 'late_afternoon_15_18' },
    { label: 'Early evening (18–20h)', value: 'early_evening_18_20' },
    { label: 'Wind-down (−120m → bed)', value: 'wind_down_bed_minus_120_0' },
    { label: 'Dark window (bed → wake)', value: 'dark_window_bed_wake' },
  ] as const

  const intensityLevels = [ 'Low', 'Moderate', 'High', 'Beginner', 'Advanced' ] as const
  const contraindicationOptions = [ 'acute injury', 'hypertension', 'pregnancy, 2nd–3rd tri', 'heat-sensitive', 'caffeine-sensitive' ] as const

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

  const submit = useCallback(async () => {
    setPending(true)
    setError(null)
    const parsed = TaskPayload.safeParse(values)
    if (!parsed.success) {
      setPending(false)
      setError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
      return
    }
    const res = await fetch('/api/admin/tasks/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...parsed.data,
        // Map structured evidence to string array for backend compatibility
        evidence_refs: evidence.length
          ? evidence.map(e => e.type ? `${e.label} — ${e.url} [${e.type}]` : `${e.label} — ${e.url}`)
          : (values.evidence_refs ?? []),
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPending(false)
      setError(String(body?.error ?? 'Request failed'))
      toast({ title: 'Failed to save task', description: String(body?.error ?? 'Error'), variant: 'destructive' })
      return
    }
    toast({ title: 'Task saved', variant: 'success' })
    setPending(false)
    onSaved()
    onClose()
  }, [values, onSaved, onClose, toast, evidence])

  if (!open) return null

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

                <div className="sm:col-span-2">
                  <div className="text-sm">Intensity level</div>
                  <div className="mt-1 flex flex-wrap gap-3">
                    {intensityLevels.map(level => {
                      const code = level.toLowerCase()
                      const selected = (values.intensity_tags ?? []).includes(code)
                      return (
                        <label key={level} className={`px-3 h-9 inline-flex items-center rounded-full border cursor-pointer ${selected ? 'bg-neutral-900 text-white' : ''}`}>
                          <input
                            type="radio"
                            name="intensity"
                            className="hidden"
                            checked={selected}
                            onChange={() => setValues(v => ({ ...v, intensity_tags: [code] }))}
                          />
                          {level}
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm">Zeitgeber tags</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Zeitgeber tags — Zeitgeber is German for “time giver.” These tags classify the type of physiological cue a task delivers to the body clock. They help the scheduler place tasks at the most biologically effective time of day. Coaches should choose the tag(s) that best match the primary circadian signal the task provides, not its general purpose or fitness goal.
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {zeitgeberOptions.map(opt => {
                      const selected = (values.zeitgeber_tags ?? []).includes(opt.value)
                      return (
                        <button type="button" key={opt.value}
                          className={`px-3 h-9 rounded-full border text-sm ${selected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-200 text-blue-700'}`}
                          title={opt.hint}
                          onClick={() => setValues(v => {
                            const curr = new Set(v.zeitgeber_tags ?? [])
                            if (curr.has(opt.value)) curr.delete(opt.value); else curr.add(opt.value)
                            return { ...v, zeitgeber_tags: Array.from(curr) }
                          })}
                        >{opt.label}</button>
                      )
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm">Default circadian slots</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {circadianOptions.map(opt => {
                      const selected = (values.default_circadian_slots ?? []).includes(opt.value)
                      return (
                        <button type="button" key={opt.value}
                          className={`px-3 h-9 rounded-full border text-sm ${selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                          onClick={() => setValues(v => {
                            const curr = new Set(v.default_circadian_slots ?? [])
                            if (curr.has(opt.value)) curr.delete(opt.value); else curr.add(opt.value)
                            return { ...v, default_circadian_slots: Array.from(curr) }
                          })}
                        >{opt.label}</button>
                      )
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm">Contraindications</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contraindicationOptions.map(opt => {
                      const selected = (values.contraindications ?? []).includes(opt)
                      return (
                        <button type="button" key={opt}
                          className={`px-3 h-9 rounded-full border text-sm ${selected ? 'bg-rose-600 border-rose-600 text-white' : 'bg-rose-50 border-rose-200 text-rose-700'}`}
                          onClick={() => setValues(v => {
                            const curr = new Set(v.contraindications ?? [])
                            if (curr.has(opt)) curr.delete(opt); else curr.add(opt)
                            return { ...v, contraindications: Array.from(curr) }
                          })}
                        >{opt}</button>
                      )
                    })}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input className="flex-1 border rounded px-2 h-9" placeholder="Add custom tag and press Enter" onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value.trim()
                        if (val) setValues(v => ({ ...v, contraindications: [ ...(v.contraindications ?? []), val ] }));
                        (e.target as HTMLInputElement).value = ''
                      }
                    }} />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="text-sm">Evidence refs</div>
                  <div className="mt-2 space-y-2">
                    {evidence.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                        <input className="md:col-span-2 border rounded px-2 h-9" placeholder="Label"
                          value={it.label}
                          onChange={(e) => setEvidence(arr => arr.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                        />
                        <input className="md:col-span-3 border rounded px-2 h-9" placeholder="URL or DOI"
                          value={it.url}
                          onChange={(e) => setEvidence(arr => arr.map((x, i) => i === idx ? { ...x, url: e.target.value } : x))}
                        />
                        <select className="md:col-span-1 border rounded px-2 h-9"
                          value={it.type ?? 'Other'}
                          onChange={(e) => setEvidence(arr => arr.map((x, i) => i === idx ? { ...x, type: e.target.value as 'RCT' | 'Review' | 'Meta' | 'Other' } : x))}
                        >
                          {['RCT','Review','Meta','Other'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="md:col-span-6 flex justify-end">
                          <button type="button" className="px-2 py-1 border rounded" onClick={() => setEvidence(arr => arr.filter((_, i) => i !== idx))}>Remove</button>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="px-3 h-9 rounded border" onClick={() => setEvidence(arr => [...arr, { label: '', url: '' }])}>Add reference</button>
                  </div>
                </div>

                <label className="text-sm">Version
                  <input type="number" className="mt-1 w-full border rounded px-2 h-9"
                    value={values.version ?? 1}
                    onChange={(e) => setValues(v => ({ ...v, version: e.target.value === '' ? undefined : Number(e.target.value) }))}
                  />
                </label>

                {error && <div className="text-xs text-red-600 sm:col-span-2">{error}</div>}
                {!canSave && (
                  <div className="sm:col-span-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                    <span className="font-medium">To save, fix:</span>
                    <span className="ml-1">
                      {missingReasons.map((r) => (
                        <span key={r} className="inline-block mr-2 mt-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200">{r}</span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="xl:col-span-5">
              <div className="sticky top-0">
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TaskImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const { toast } = useToast()
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
      toast({ title: 'Import failed', description: String(body?.error ?? 'Error'), variant: 'destructive' })
      return
    }
    const slugs = Array.isArray(body?.data)
      ? (body.data as { slug?: string }[]).map((x) => x.slug).filter((s): s is string => Boolean(s))
      : []
    toast({ title: `Imported ${slugs.length} task(s)`, description: slugs.join(', '), variant: 'success' })
    setPending(false)
    onImported()
    onClose()
  }, [text, onImported, onClose, toast])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-md shadow-lg w-[760px] max-w-[95vw] p-4 space-y-3">
        <div className="text-lg font-semibold">Bulk Import Tasks (JSON)</div>
        <textarea className="w-full font-mono text-sm border rounded p-3 min-h-[260px]" value={text} onChange={e => setText(e.target.value)} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border rounded" disabled={pending} onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-50" disabled={pending} onClick={submit}>
            {pending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  )
}


