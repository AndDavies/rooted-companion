"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/useToast'
import { ProgramTemplateSchema } from './ProgramModalsClient'

type Pillar = 'breath' | 'sleep' | 'food' | 'movement' | 'focus' | 'joy'

type TaskMin = {
  id: string
  slug: string | null
  title: string | null
  pillar: Pillar | null
  duration_min: number | null
  duration_max: number | null
  default_circadian_slots: string[] | null
}

type BuilderItem = {
  slot_hint: 'wake' | 'mid_morning' | 'midday' | 'afternoon' | 'evening' | 'pre_sleep'
  task_ref: string
  default_duration?: number
  notes?: string
}

type BuilderDay = {
  day: number
  items: BuilderItem[]
}

export function ProgramBuilderModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initial?: z.infer<typeof ProgramTemplateSchema>
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [version, setVersion] = useState<number>(initial?.version ?? 1)
  const [description, setDescription] = useState<string>(initial?.description ?? '')
  const [isPublic, setIsPublic] = useState<boolean>(
    (initial?.audience_tags ?? []).includes('public')
  )
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(
    (initial?.audience_tags ?? []).filter(t => t !== 'public')
  )

  const [days, setDays] = useState<BuilderDay[]>(
    initial?.days?.length
      ? initial.days.map(d => ({ day: d.day, items: d.items.map(it => ({
          slot_hint: (it.slot_hint as BuilderItem['slot_hint']) ?? 'midday',
          task_ref: it.task_ref,
          default_duration: it.default_duration,
          notes: it.notes,
        })) }))
      : [{ day: 1, items: [] }]
  )

  const [tasks, setTasks] = useState<TaskMin[]>([])
  const [taskSearch, setTaskSearch] = useState('')

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter(t =>
      (t.title ?? '').toLowerCase().includes(q) ||
      (t.slug ?? '').toLowerCase().includes(q) ||
      (t.pillar ?? '').toLowerCase().includes(q)
    )
  }, [tasks, taskSearch])

  useEffect(() => {
    if (!open) return
    let mounted = true
    ;(async () => {
      try {
        const [tasksRes, tagsRes] = await Promise.all([
          fetch('/api/admin/tasks/list'),
          fetch('/api/admin/program-templates/tags')
        ])
        const tasksBody = (await tasksRes.json()) as { data?: TaskMin[]; error?: string }
        if (mounted && tasksRes.ok && tasksBody.data) setTasks(tasksBody.data)
        const tagsBody = (await tagsRes.json()) as { data?: string[] }
        if (mounted && tagsRes.ok && tagsBody.data) setAvailableTags(tagsBody.data)
      } catch {
        // ignore; show empty state
      } finally {
      }
    })()
    return () => {
      mounted = false
    }
  }, [open])

  const matchingTags = useMemo(() => {
    const q = tagInput.trim().toLowerCase()
    const pool = availableTags.filter(t => !selectedTags.includes(t))
    if (!q) return pool
    return pool.filter(t => t.toLowerCase().includes(q))
  }, [availableTags, selectedTags, tagInput])

  const addTag = (t: string) => {
    const v = t.trim()
    if (!v) return
    if (selectedTags.includes(v)) { setTagInput(''); return }
    setSelectedTags(prev => [...prev, v])
    if (!availableTags.includes(v)) setAvailableTags(prev => [...prev, v])
    setTagInput('')
  }
  const removeTag = (t: string) => setSelectedTags(prev => prev.filter(x => x !== t))

  const addDay = () => {
    setDays(prev => [...prev, { day: (prev.at(-1)?.day ?? prev.length) + 1, items: [] }])
  }

  const removeDay = (dayIndex: number) => {
    setDays(prev => prev.filter((_, i) => i !== dayIndex))
  }

  const addItem = (dayIndex: number) => {
    setDays(prev => prev.map((d, i) => i === dayIndex ? {
      ...d,
      items: [...d.items, { slot_hint: 'midday', task_ref: '', default_duration: undefined }]
    } : d))
  }

  const removeItem = (dayIndex: number, itemIndex: number) => {
    setDays(prev => prev.map((d, i) => i === dayIndex ? {
      ...d,
      items: d.items.filter((_, j) => j !== itemIndex)
    } : d))
  }

  const setItemField = (dayIndex: number, itemIndex: number, field: keyof BuilderItem, value: string | number) => {
    setDays(prev => prev.map((d, i) => i === dayIndex ? {
      ...d,
      items: d.items.map((it, j) => j === itemIndex ? { ...it, [field]: value } : it)
    } : d))
  }

  const canSave = useMemo(() => {
    if (!name.trim() || version <= 0) return false
    if (!days.length) return false
    for (const d of days) {
      if (d.items.length === 0) return false
      for (const it of d.items) {
        if (!it.task_ref) return false
      }
    }
    return true
  }, [name, version, days])

  const missingReasons = useMemo(() => {
    const reasons: string[] = []
    if (!name.trim()) reasons.push('Name')
    if (version <= 0) reasons.push('Version')
    if (!days.length) reasons.push('At least 1 day')
    days.forEach((d) => {
      if (d.items.length === 0) reasons.push(`Day ${d.day}: add an item`)
      d.items.forEach((it, ii) => {
        if (!it.task_ref) reasons.push(`Day ${d.day} item ${ii + 1}: choose a task`)
      })
    })
    return Array.from(new Set(reasons)).slice(0, 6)
  }, [name, version, days])

  const submit = useCallback(async () => {
    setPending(true)
    setError(null)
    try {
      const audienceTags: string[] = []
      if (isPublic) audienceTags.push('public')
      if (selectedTags.length) audienceTags.push(...selectedTags)

      const payload = {
        name: name.trim(),
        version,
        description: description.trim() || undefined,
        audience_tags: audienceTags.length ? audienceTags : undefined,
        days: days.map(d => ({
          day: d.day,
          items: d.items.map(it => ({
            slot_hint: it.slot_hint,
            task_ref: it.task_ref,
            default_duration: typeof it.default_duration === 'number' ? it.default_duration : undefined,
            notes: it.notes && it.notes.trim() ? it.notes.trim() : undefined,
          }))
        }))
      }

      const parsed = ProgramTemplateSchema.safeParse(payload)
      if (!parsed.success) {
        setError(parsed.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
        setPending(false)
        return
      }

      const r = await fetch('/api/admin/program-templates/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data)
      })
      const body = await r.json().catch(() => ({})) as { error?: unknown }
      if (!r.ok) {
        setError(String(body?.error ?? 'Failed to save template'))
        toast({ title: 'Failed to save template', description: String(body?.error ?? 'Error'), variant: 'destructive' })
        setPending(false)
        return
      }

      toast({ title: 'Template saved', variant: 'success' })
      setPending(false)
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
      setPending(false)
    }
  }, [name, version, description, isPublic, selectedTags, days, toast, onSaved, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center" onKeyDown={(e) => { if (e.key === 'Escape' && !pending) onClose() }}>
      <div className="bg-white rounded-lg shadow-xl w-[1120px] max-w-[96vw] p-0 flex flex-col max-h-[90vh]">
        <div className="px-4 pt-4 pb-3 border-b">
          <h2 className="text-lg font-semibold">Create Program Template</h2>
        </div>
        <div className="flex-1 overflow-auto px-4 py-4 flex items-start gap-4">
          <div className="flex-1 space-y-4">
            <Card className="border-neutral-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-neutral-700">Name <span className="text-red-500">*</span></label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="7 Day Metabolic Reset" aria-invalid={!name.trim()} />
                    <div className="text-[11px] text-neutral-500 mt-1">Shown to users when browsing programs.</div>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-700">Version <span className="text-red-500">*</span></label>
                    <Input type="number" value={String(version)} onChange={e => setVersion(Number(e.target.value) || 1)} min={1} aria-invalid={version <= 0} />
                    <div className="text-[11px] text-neutral-500 mt-1">Increment when updating a template.</div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-neutral-700">Description</label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short purpose/notes" />
                    <div className="text-[11px] text-neutral-500 mt-1">1–2 short sentences.</div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-neutral-700">Audience tags</label>
                    <div className="border rounded-md p-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={tagInput}
                          onChange={e => setTagInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
                            if (e.key === 'Backspace' && !tagInput) removeTag(selectedTags[selectedTags.length - 1])
                          }}
                          placeholder="Type a tag and press Enter"
                        />
                        <Button variant="outline" onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Add</Button>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-2">Use tags to categorize programs. Public toggle controls visibility.</div>
                      {matchingTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {matchingTags.slice(0, 10).map(t => (
                            <button key={t} onClick={() => addTag(t)} className="px-2 py-1 text-xs rounded-full border border-blue-200 text-blue-700 hover:bg-blue-50">
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedTags.map(t => (
                            <span key={t} className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              {t}
                              <button className="text-blue-600 hover:text-blue-800" onClick={() => removeTag(t)} aria-label={`Remove ${t}`}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    <span className="text-sm text-neutral-700">Public</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Days</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {days.map((d, di) => (
                  <div key={di} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-neutral-700">Day</span>
                        <Input type="number" className="w-24" value={String(d.day)} onChange={e => {
                          const val = Math.max(1, Number(e.target.value) || d.day)
                          setDays(prev => prev.map((x, i) => i === di ? { ...x, day: val } : x))
                        }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => addItem(di)}>Add Item</Button>
                        <Button variant="outline" onClick={() => removeDay(di)} disabled={days.length <= 1}>Remove Day</Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {d.items.map((it, ii) => (
                        <div key={ii} className="space-y-2">
                          <div>
                            <label className="text-xs text-neutral-600">Slot</label>
                            <Select className="w-full" value={it.slot_hint} onChange={e => setItemField(di, ii, 'slot_hint', e.target.value)}>
                              <option value="wake">Wake</option>
                              <option value="mid_morning">Mid-morning</option>
                              <option value="midday">Midday</option>
                              <option value="afternoon">Afternoon</option>
                              <option value="evening">Evening</option>
                              <option value="pre_sleep">Pre-sleep</option>
                            </Select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 gap-3 items-end">
                            <div className="md:col-span-2 xl:col-span-3">
                              <label className="text-xs text-neutral-700">Task <span className="text-red-500">*</span></label>
                              <Input
                                list={`task-datalist-${di}-${ii}`}
                                value={it.task_ref}
                                onChange={e => setItemField(di, ii, 'task_ref', e.target.value)}
                                placeholder="Type to search slug or title"
                              />
                              <datalist id={`task-datalist-${di}-${ii}`}>
                                {filteredTasks.map(t => (
                                  <option key={t.id} value={t.slug ?? ''}>{`${t.title ?? ''} (${t.pillar ?? ''})`}</option>
                                ))}
                              </datalist>
                              <div className="mt-1 relative">
                                <Input placeholder="Search tasks by title or slug..." value={taskSearch} onChange={e => setTaskSearch(e.target.value)} />
                                {taskSearch && (
                                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto border rounded-md bg-white z-20 shadow">
                                    {filteredTasks.length === 0 ? (
                                      <div className="text-xs text-neutral-500 p-2">No matching tasks</div>
                                    ) : (
                                      filteredTasks.slice(0, 30).map(t => (
                                        <button
                                          key={`opt-${t.id}`}
                                          type="button"
                                          onClick={() => setItemField(di, ii, 'task_ref', t.slug ?? '')}
                                          className="w-full text-left px-2 py-1 text-sm hover:bg-neutral-50"
                                        >
                                          {(t.title ?? '')} <span className="text-neutral-500">({t.slug ?? ''})</span>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-neutral-700">Default duration (min)</label>
                              <Input type="number" value={String(it.default_duration ?? '')} onChange={e => setItemField(di, ii, 'default_duration', Number(e.target.value))} />
                              <div className="text-[11px] text-neutral-500 mt-1">Optional minutes for this item.</div>
                            </div>
                            <div className="md:col-span-1 flex gap-2">
                              <Button variant="outline" onClick={() => removeItem(di, ii)}>Remove</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                       {d.items.length === 0 && (
                        <div className="text-xs text-neutral-500">No items yet. Click &quot;Add Item&quot;.</div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={addDay}>Add Day</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-[360px] space-y-3 sticky top-0 self-start">
            <Card className="border-neutral-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  <div className="text-sm font-medium text-neutral-900">{name || 'Untitled Template'}</div>
                  {description && <div className="text-xs text-neutral-600">{description}</div>}
                  <div className="text-xs text-neutral-500">v{version} {isPublic ? '• Public' : ''}</div>
                  <div className="mt-2 space-y-2">
                    {days.map(d => (
                      <div key={`p-${d.day}`} className="border rounded p-2">
                        <div className="text-xs font-medium text-neutral-800">Day {d.day}</div>
                        <ul className="text-xs list-disc pl-5 mt-1 space-y-1">
                          {d.items.map((it, idx) => (
                            <li key={`pi-${d.day}-${idx}`}>
                              <span className="font-mono">{it.slot_hint}</span> – <span className="font-mono">{it.task_ref || 'task'}</span>{typeof it.default_duration === 'number' ? ` (${it.default_duration}m)` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && <div className="text-xs text-red-600">{error}</div>}
            <div className="flex justify-end gap-2 pt-2 pb-2">
              <Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button>
              <Button onClick={submit} disabled={pending || !canSave} className="bg-neutral-900 text-white">
                {pending ? 'Saving…' : 'Save Template'}
              </Button>
            </div>
            {!canSave && (
              <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
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
      </div>
    </div>
  )
}


