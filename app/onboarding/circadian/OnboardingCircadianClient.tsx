"use client"
import { useState } from 'react'
import { useToast } from '@/components/ui/useToast'

export default function OnboardingCircadianClient({ initial }: { initial: { selfId: 'morning'|'neither'|'evening'; wakeTime: string; bedtime: string; shiftWork: boolean } }) {
  const { toast } = useToast()
  const [form, setForm] = useState(initial)
  const [pending, setPending] = useState(false)

  const submit = async () => {
    setPending(true)
    const r = await fetch('/api/circadian/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      toast({ title: 'Save failed', description: String(body?.error ?? 'Error'), variant: 'destructive' })
      setPending(false)
      return
    }
    toast({ title: 'Profile saved', variant: 'success' })
    window.location.href = '/onboarding'
  }

  return (
    <div className="container mx-auto max-w-xl py-8 space-y-4">
      <h1 className="text-2xl font-semibold">Your Daily Rhythm</h1>
      <div className="space-y-2">
        <div className="text-sm font-medium">I am generally a…</div>
        <div className="flex gap-4 text-sm">
          {([
            ['morning','Morning'] as const,
            ['neither','Neither'] as const,
            ['evening','Evening'] as const,
          ]).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input type="radio" name="selfId" checked={form.selfId === value} onChange={() => setForm(f => ({ ...f, selfId: value }))} />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm">Wake time
          <input className="mt-1 w-full border rounded p-2" value={form.wakeTime} onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))} placeholder="07:00" />
        </label>
        <label className="text-sm">Bedtime
          <input className="mt-1 w-full border rounded p-2" value={form.bedtime} onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))} placeholder="23:00" />
        </label>
        <label className="text-sm col-span-2 flex items-center gap-2">
          <input type="checkbox" checked={form.shiftWork} onChange={e => setForm(f => ({ ...f, shiftWork: e.target.checked }))} />
          Shift work
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button className="px-3 py-2 rounded bg-neutral-900 text-white disabled:opacity-50" disabled={pending} onClick={submit}>{pending ? 'Saving…' : 'Save & Continue'}</button>
      </div>
    </div>
  )
}


