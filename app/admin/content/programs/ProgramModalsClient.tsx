"use client"
import { useCallback, useState } from 'react'
import { useToast } from '@/components/ui/useToast'
import { z } from 'zod'

export const ProgramTemplateSchema = z.object({
  name: z.string().min(3),
  version: z.number().int().positive().default(1),
  description: z.string().optional(),
  audience_tags: z.array(z.string()).optional(),
  days: z.array(z.object({
    day: z.number().int().positive(),
    items: z.array(z.object({
      slot_hint: z.string().min(2),
      task_ref: z.string().min(2),
      default_duration: z.number().int().positive().optional(),
      notes: z.string().optional(),
    })),
  })),
}).strict()

type Tpl = z.infer<typeof ProgramTemplateSchema>

export function TemplateJsonModal({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial?: Tpl; onSaved: () => void }) {
  const { toast } = useToast()
  const [text, setText] = useState<string>(() => JSON.stringify(initial ?? { name: '', version: 1, days: [] }, null, 2))
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
    const res = ProgramTemplateSchema.safeParse(parsed)
    if (!res.success) {
      setPending(false)
      setError(res.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
      return
    }
    const r = await fetch('/api/admin/program-templates/upsert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res.data) })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      setPending(false)
      toast({ title: 'Failed to save template', description: String(body?.error ?? 'Error'), variant: 'destructive' })
      setError(String(body?.error ?? 'Request failed'))
      return
    }
    toast({ title: 'Template saved', variant: 'success' })
    setPending(false)
    onSaved()
    onClose()
  }, [text, onSaved, onClose, toast])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-md shadow-lg w-[820px] max-w-[95vw] p-4 space-y-3">
        <div className="text-lg font-semibold">{initial ? 'Edit Template' : 'Create Template'}</div>
        <textarea className="w-full font-mono text-sm border rounded p-3 min-h-[320px]" value={text} onChange={e => setText(e.target.value)} />
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="px-3 py-2 border rounded" disabled={pending} onClick={onClose}>Cancel</button>
          <button className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-50" disabled={pending} onClick={submit}>
            {pending ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function TemplateImportModal({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
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
    const res = z.array(ProgramTemplateSchema).safeParse(parsed)
    if (!res.success) {
      setPending(false)
      setError(res.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
      return
    }
    const r = await fetch('/api/admin/program-templates/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(res.data) })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      setPending(false)
      toast({ title: 'Import failed', description: String(body?.error ?? 'Error'), variant: 'destructive' })
      setError(String(body?.error ?? 'Request failed'))
      return
    }
    toast({ title: 'Templates imported', variant: 'success' })
    setPending(false)
    onImported()
    onClose()
  }, [text, onImported, onClose, toast])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-md shadow-lg w-[820px] max-w-[95vw] p-4 space-y-3">
        <div className="text-lg font-semibold">Bulk Import Templates (JSON)</div>
        <textarea className="w-full font-mono text-sm border rounded p-3 min-h-[320px]" value={text} onChange={e => setText(e.target.value)} />
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

export function TemplatePreview({ name, version }: { name: string; version: number }) {
  const [data, setData] = useState<unknown[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const r = await fetch(`/api/admin/program-templates/preview?name=${encodeURIComponent(name)}&version=${version}`)
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      setError(String(body?.error ?? 'Failed to load'))
      setLoading(false)
      return
    }
    setData((body?.data as unknown[]) ?? [])
    setLoading(false)
  }, [name, version])

  return (
    <div className="border rounded p-3">
      <button className="px-3 py-2 rounded border mb-3" onClick={load} disabled={loading}>
        {loading ? 'Loading…' : 'Load Preview'}
      </button>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <div className="space-y-3">
        {data?.map((d) => {
          const row = d as { template_id?: string; day_number?: string | number; items?: { slot_hint: string; task_ref: string; default_duration?: number }[] }
          return (
          <div key={`${row.template_id}-${row.day_number}`} className="border rounded p-2">
            <div className="font-medium">Day {row.day_number}</div>
            <ul className="list-disc pl-6 text-sm">
              {(row.items ?? []).map((it, idx: number) => (
                <li key={`${row.template_id}-${row.day_number}-${idx}`}>
                  <span className="font-mono">{it.slot_hint}</span> – <span className="font-mono">{it.task_ref}</span>{it.default_duration ? ` (${it.default_duration}m)` : ''}
                </li>
              ))}
            </ul>
          </div>
        )})}
      </div>
    </div>
  )
}


