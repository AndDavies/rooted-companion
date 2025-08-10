'use client'
import { useMemo, useState } from 'react'
import { computeCaffeineCutoff } from '@/lib/circadian/derive'

export default function CircadianInline({ onChange }: { onChange: (v: { selfId: 'morning'|'neither'|'evening'; wakeTime?: string; bedtime?: string } | null) => void }) {
  const [selfId, setSelfId] = useState<'morning'|'neither'|'evening' | ''>('')
  const [wakeTime, setWakeTime] = useState<string>('')
  const [bedtime, setBedtime] = useState<string>('')

  const caffeine = useMemo(() => {
    if (!bedtime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(bedtime)) return ''
    try { return computeCaffeineCutoff(bedtime) } catch { return '' }
  }, [bedtime])

  const emit = (next: { selfId: 'morning'|'neither'|'evening' | ''; wakeTime?: string; bedtime?: string }) => {
    if (!next.selfId) { onChange(null); return }
    const payload: { selfId: 'morning'|'neither'|'evening'; wakeTime?: string; bedtime?: string } = { selfId: (next.selfId as 'morning'|'neither'|'evening') }
    if (next.wakeTime) payload.wakeTime = next.wakeTime
    if (next.bedtime) payload.bedtime = next.bedtime
    onChange(payload)
  }

  return (
    <div className="border rounded-md p-4">
      <div className="text-sm font-medium mb-2">Your daily rhythm (optional)</div>
      <div className="flex flex-wrap gap-4 text-sm mb-3">
        {([
          ['morning','Morning'] as const,
          ['neither','Neither'] as const,
          ['evening','Evening'] as const,
        ]).map(([val, label]) => (
          <label key={val} className="flex items-center gap-2">
            <input type="radio" name="circadian-self" checked={selfId === val} onChange={() => { setSelfId(val); emit({ selfId: val, wakeTime, bedtime }) }} />
            {label}
          </label>
        ))}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer select-none">Advanced</summary>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label>Wake time (HH:MM)
            <input className="mt-1 w-full border rounded p-2" value={wakeTime} onChange={(e) => { const v = e.target.value; setWakeTime(v); emit({ selfId, wakeTime: v, bedtime }) }} placeholder="06:30" />
          </label>
          <label>Bedtime (HH:MM)
            <input className="mt-1 w-full border rounded p-2" value={bedtime} onChange={(e) => { const v = e.target.value; setBedtime(v); emit({ selfId, wakeTime, bedtime: v }) }} placeholder="22:30" />
          </label>
        </div>
        {!!caffeine && <div className="text-xs text-neutral-600 mt-2">Suggested caffeine cutoff: {caffeine}</div>}
      </details>
    </div>
  )
}


