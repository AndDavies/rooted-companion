"use client"
import { useCallback, useState } from 'react'
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
      body: JSON.stringify(parsed.data),
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
  }, [values, onSaved, onClose, toast])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-md shadow-lg w-[640px] max-w-[90vw] p-4 space-y-3">
        <div className="text-lg font-semibold">{initial ? 'Edit Task' : 'Create Task'}</div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm col-span-1">Pillar
            <select className="mt-1 w-full border rounded p-2"
              value={values.pillar ?? ''}
              onChange={(e) => setValues(v => ({ ...v, pillar: e.target.value as Task['pillar'] }))}
            >
              <option value="" disabled>Select pillar</option>
              {['breath','sleep','food','movement','focus','joy'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="text-sm col-span-1">Slug
            <input className="mt-1 w-full border rounded p-2" placeholder="kebab-case"
              value={values.slug ?? ''}
              onChange={(e) => setValues(v => ({ ...v, slug: e.target.value }))}
            />
          </label>
          <label className="text-sm col-span-2">Title
            <input className="mt-1 w-full border rounded p-2" placeholder="Task title"
              value={values.title ?? ''}
              onChange={(e) => setValues(v => ({ ...v, title: e.target.value }))}
            />
          </label>
          <label className="text-sm col-span-2">Description
            <textarea className="mt-1 w-full border rounded p-2 min-h-[80px]"
              value={values.description ?? ''}
              onChange={(e) => setValues(v => ({ ...v, description: e.target.value }))}
            />
          </label>
          <label className="text-sm">Duration min
            <input type="number" className="mt-1 w-full border rounded p-2"
              value={values.duration_min ?? ''}
              onChange={(e) => setValues(v => ({ ...v, duration_min: e.target.value === '' ? undefined : Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm">Duration max
            <input type="number" className="mt-1 w-full border rounded p-2"
              value={values.duration_max ?? ''}
              onChange={(e) => setValues(v => ({ ...v, duration_max: e.target.value === '' ? undefined : Number(e.target.value) }))}
            />
          </label>
          {([
            ['intensity_tags','Intensity tags'],
            ['contraindications','Contraindications'],
            ['evidence_refs','Evidence refs'],
            ['zeitgeber_tags','Zeitgeber tags'],
            ['default_circadian_slots','Default circadian slots'],
          ] as const).map(([key, label]) => (
            <label key={key} className="text-sm col-span-2">{label}
              <input className="mt-1 w-full border rounded p-2" placeholder="comma,separated"
                value={Array.isArray((values as Record<string, unknown>)[key]) ? ((values as Record<string, unknown>)[key] as string[]).join(',') : ''}
                onChange={(e) => setValues(v => ({ ...v, [key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              />
            </label>
          ))}
          <label className="text-sm col-span-1">Version
            <input type="number" className="mt-1 w-full border rounded p-2"
              value={values.version ?? 1}
              onChange={(e) => setValues(v => ({ ...v, version: e.target.value === '' ? undefined : Number(e.target.value) }))}
            />
          </label>
        </div>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border rounded" disabled={pending} onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-50" disabled={pending} onClick={submit}>
            {pending ? 'Saving…' : 'Save Task'}
          </button>
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


