"use client"
import { useState } from 'react'
import { useToast } from '@/components/ui/useToast'

const SEED = [
  {"pillar":"breath","slug":"breath-threshold-3","title":"Three Threshold Breaths","description":"Pause at thresholds (wake, start work, enter home) and take 3 conscious breaths.","duration_min":1,"duration_max":3,"intensity_tags":["beginner","reset"],"evidence_refs":["doc:breath-hrv-001"],"zeitgeber_tags":["transition"],"default_circadian_slots":["wake","mid_morning"],"version":1},
  {"pillar":"breath","slug":"breath-box-5-5-5-5","title":"Box Breathing 5-5-5-5","description":"Inhale 5, hold 5, exhale 5, hold 5—repeat ~5 minutes.","duration_min":5,"duration_max":6,"intensity_tags":["moderate"],"evidence_refs":["doc:breath-anxiety-002"],"zeitgeber_tags":["focus-reset"],"default_circadian_slots":["midday","afternoon"],"version":1},
  {"pillar":"sleep","slug":"sleep-digital-sunset","title":"Digital Sunset (60 min)","description":"Shut screens 60 minutes before bed; dim lights and unwind.","duration_min":30,"duration_max":60,"intensity_tags":["hygiene","beginner"],"evidence_refs":["doc:sleep-hygiene-001"],"zeitgeber_tags":["no-screens","dim-light"],"default_circadian_slots":["pre_sleep"],"version":1},
  {"pillar":"sleep","slug":"sleep-breath-prebed","title":"Pre‑Sleep Breath (4‑7‑8)","description":"4‑7‑8 breathing for 5 minutes to downshift before bed.","duration_min":5,"duration_max":8,"intensity_tags":["relaxation"],"evidence_refs":["doc:sleep-breath-004"],"zeitgeber_tags":["dark"],"default_circadian_slots":["pre_sleep"],"version":1},
  {"pillar":"food","slug":"food-listening-meal","title":"Listening Meal","description":"One distraction‑free meal; chew slowly; note sensations before/during/after.","duration_min":10,"duration_max":20,"intensity_tags":["mindful-eating"],"evidence_refs":["doc:mindful-eating-001"],"zeitgeber_tags":["meal"],"default_circadian_slots":["midday","evening"],"version":1},
  {"pillar":"food","slug":"food-hydration-ritual","title":"Hydration Ritual (AM)","description":"12–16 oz water right after waking; pause 60s before caffeine.","duration_min":1,"duration_max":2,"intensity_tags":["beginner"],"evidence_refs":["doc:hydration-alertness-001"],"zeitgeber_tags":["wake","light"],"default_circadian_slots":["wake"],"version":1},
  {"pillar":"movement","slug":"move-10min-flow","title":"10‑Minute Silent Flow","description":"Move in silence—stretch/walk/shake; let the body choose.","duration_min":10,"duration_max":15,"intensity_tags":["beginner","reset"],"evidence_refs":["doc:light-movement-stress-001"],"zeitgeber_tags":["daylight"],"default_circadian_slots":["midday","afternoon"],"version":1},
  {"pillar":"movement","slug":"move-morning-mobility-5","title":"Morning Mobility (5)","description":"5‑minute joints‑to‑spine mobility after waking.","duration_min":5,"duration_max":6,"intensity_tags":["gentle"],"evidence_refs":["doc:mobility-wake-001"],"zeitgeber_tags":["light"],"default_circadian_slots":["wake"],"version":1},
  {"pillar":"focus","slug":"focus-one-thing","title":"One Thing Fully","description":"Choose one routine task and do it with full attention.","duration_min":2,"duration_max":5,"intensity_tags":["beginner","mindfulness"],"evidence_refs":["doc:attention-training-001"],"zeitgeber_tags":["anchor"],"default_circadian_slots":["wake","mid_morning"],"version":1},
  {"pillar":"focus","slug":"focus-interval-15","title":"15‑Minute Deep Focus","description":"Single‑task for 15 minutes; remove distractions.","duration_min":15,"duration_max":20,"intensity_tags":["workday"],"evidence_refs":["doc:focus-intervals-001"],"zeitgeber_tags":["focus-reset"],"default_circadian_slots":["mid_morning","afternoon"],"version":1},
  {"pillar":"joy","slug":"joy-hunt","title":"Daily Joy Hunt","description":"Find one small spark of joy; name it and feel it fully for 60s.","duration_min":1,"duration_max":2,"intensity_tags":["uplift"],"evidence_refs":["doc:positive-affect-001"],"zeitgeber_tags":["any"],"default_circadian_slots":["midday","evening"],"version":1},
  {"pillar":"joy","slug":"joy-nature-5","title":"Five Minutes in Nature","description":"Step outside; notice light, air, and a single natural detail.","duration_min":5,"duration_max":10,"intensity_tags":["reset"],"evidence_refs":["doc:nature-stress-001"],"zeitgeber_tags":["light","daylight"],"default_circadian_slots":["midday","afternoon"],"version":1}
]

export function SeedButtonClient() {
  const { toast } = useToast()
  const [pending, setPending] = useState(false)
  const run = async () => {
    setPending(true)
    const r = await fetch('/api/admin/tasks/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(SEED) })
    const body = await r.json().catch(() => ({}))
    if (!r.ok) {
      toast({ title: 'Seed failed', description: String(body?.error ?? 'Error'), variant: 'destructive' })
    } else {
      const slugs = Array.isArray(body?.data)
        ? (body.data as { slug?: string }[]).map((x) => x.slug).filter((s): s is string => Boolean(s))
        : []
      toast({ title: 'Seeded tasks', description: slugs.join(', '), variant: 'success' })
      window.location.reload()
    }
    setPending(false)
  }
  return <button className="px-3 py-2 rounded border" onClick={run} disabled={pending}>{pending ? 'Seeding…' : 'Quick Seed'}</button>
}


