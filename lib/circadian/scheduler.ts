import type { PlanPayload, DayPlan, DayTask } from '@/lib/llm/planAgent'

export type CircadianInputs = {
  chronotype: 'lark' | 'neutral' | 'owl'
  wakeTime: string // 'HH:MM'
  bedtime: string  // 'HH:MM'
  tz: string
  availability?: 'morning' | 'midday' | 'afternoon' | 'evening' | 'flexible'
}

const OFFSET_MIN = {
  morning: { lark: 0, neutral: 30, owl: 45 }, // minutes from wake
  midday: { lark: 4 * 60, neutral: 4.5 * 60, owl: 5 * 60 },
  afternoon: { lark: 6 * 60, neutral: 7 * 60, owl: 8 * 60 },
  eveningFromBed: { lark: 4 * 60, neutral: 3.5 * 60, owl: 3 * 60 }, // minutes before bed
  pre_sleep: 60,
}

const PILLAR_DEFAULT_SLOT: Record<DayTask['type'], 'morning'|'midday'|'afternoon'|'evening'> = {
  sleep: 'evening',
  breathwork: 'morning',
  movement: 'morning',
  mindset: 'morning',
  nutrition: 'midday',
}

// Removed unused legacy parser (kept in history via git)

// Helpers for timezone-aware scheduling
function atLocal(dateISO: string, hhmm: string, tz: string): Date {
  const [y, m, d] = dateISO.split('-').map(Number)
  const [hh, mm] = (hhmm.match(/^([01]\d|2[0-3]):([0-5]\d)/) || [,'00','00']).slice(1).map(Number)
  let guess = new Date(Date.UTC(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0))
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(guess)
  const map: Record<string,string> = {}
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value
  const oy = Number(map.year), om = Number(map.month), od = Number(map.day)
  const oh = Number(map.hour), on = Number(map.minute)
  const intendedMin = Date.UTC(y, (m || 1)-1, d || 1, hh || 0, mm || 0, 0) / 60000
  const observedMin = Date.UTC(oy, (om || 1)-1, od || 1, oh || 0, on || 0, 0) / 60000
  const diffMin = observedMin - intendedMin
  guess = new Date(guess.getTime() - diffMin * 60000)
  return guess
}

function addMinutes(d: Date, m: number): Date { return new Date(d.getTime() + m * 60000) }

function roundToQuarter(d: Date): Date {
  const copy = new Date(d.getTime())
  const minutes = copy.getUTCMinutes()
  const rounded = Math.round(minutes / 15) * 15
  copy.setUTCMinutes(rounded, 0, 0)
  return copy
}

function clamp(d: Date, min: Date, max: Date): Date {
  if (d.getTime() < min.getTime()) return new Date(min.getTime())
  if (d.getTime() > max.getTime()) return new Date(max.getTime())
  return d
}

function nextIsoDay(dateISO: string): string {
  const base = new Date(`${dateISO}T00:00:00Z`)
  const next = new Date(base.getTime() + 24 * 60 * 60000)
  return next.toISOString().slice(0, 10)
}

export function mapTasksToTimes(
  plan: PlanPayload,
  inputs: CircadianInputs
): PlanPayload & { days: Array<DayPlan & { tasks: Array<DayTask & { scheduled_at: string }> }> } {
  const scheduledDays = plan.days.map((day): DayPlan & { tasks: Array<DayTask & { scheduled_at: string }> } => {
    const wake = atLocal(day.date, inputs.wakeTime, inputs.tz)
    let bed = atLocal(day.date, inputs.bedtime, inputs.tz)
    if (bed.getTime() <= wake.getTime()) bed = atLocal(nextIsoDay(day.date), inputs.bedtime, inputs.tz)

    const dayStart = wake
    const dayEnd = addMinutes(bed, -30)

    const candidates = day.tasks.map((task) => {
      const slot = task.time_suggestion ?? PILLAR_DEFAULT_SLOT[task.type]
      let target: Date

      if (task.type === 'sleep') {
        const title = task.title.toLowerCase()
        const winddown = /wind[- ]?down|digital sunset|pre[- ]?sleep|prebed/.test(title)
        if (winddown) {
          target = roundToQuarter(addMinutes(bed, -90))
        } else {
          // treat a custom 'pre_sleep' hint if present in title or notes
          const isPreSleep = /pre[- ]?sleep|prebed/.test(title)
          if (isPreSleep) target = addMinutes(bed, -60)
          else if (slot === 'evening') {
            const eighteen = atLocal(day.date, '18:00', inputs.tz)
            target = addMinutes(bed, -180)
            if (target.getTime() < eighteen.getTime()) target = eighteen
          } else {
            const eighteen = atLocal(day.date, '18:00', inputs.tz)
            target = addMinutes(bed, -120)
            if (target.getTime() < eighteen.getTime()) target = eighteen
          }
          target = roundToQuarter(clamp(target, atLocal(day.date, '18:00', inputs.tz), dayEnd))
        }
      } else if (task.type === 'nutrition') {
        if (!task.time_suggestion) target = atLocal(day.date, '12:00', inputs.tz)
        else if (slot === 'morning') target = addMinutes(wake, OFFSET_MIN.morning[inputs.chronotype])
        else if (slot === 'midday') target = addMinutes(wake, OFFSET_MIN.midday[inputs.chronotype])
        else if (slot === 'afternoon') target = addMinutes(wake, OFFSET_MIN.afternoon[inputs.chronotype])
        else target = addMinutes(bed, -180)
        target = roundToQuarter(target)
      } else {
        if (slot === 'morning') target = addMinutes(wake, Math.max(15, OFFSET_MIN.morning[inputs.chronotype]))
        else if (slot === 'midday') target = addMinutes(wake, OFFSET_MIN.midday[inputs.chronotype])
        else if (slot === 'afternoon') target = addMinutes(wake, OFFSET_MIN.afternoon[inputs.chronotype])
        else if (slot === 'evening') target = addMinutes(bed, -OFFSET_MIN.eveningFromBed[inputs.chronotype])
        else {
          const def = PILLAR_DEFAULT_SLOT[task.type]
          if (def === 'morning') target = addMinutes(wake, 30)
          else if (def === 'midday') target = atLocal(day.date, '12:00', inputs.tz)
          else if (def === 'afternoon') target = addMinutes(wake, 7 * 60)
          else target = addMinutes(bed, -120)
        }
        if (task.type === 'movement') {
          const twenty = atLocal(day.date, '20:00', inputs.tz)
          target = clamp(target, dayStart, twenty)
        }
        target = roundToQuarter(target)
      }

      if (task.type !== 'sleep' && (task.time_suggestion === 'flexible' || !task.time_suggestion) && inputs.availability && inputs.availability !== 'flexible') {
        let center: Date
        if (inputs.availability === 'morning') center = addMinutes(wake, 45)
        else if (inputs.availability === 'midday') center = addMinutes(wake, 270)
        else if (inputs.availability === 'afternoon') center = addMinutes(wake, 420)
        else {
          const minEvening = atLocal(day.date, '18:30', inputs.tz)
          const preferred = addMinutes(bed, -180)
          center = preferred.getTime() < minEvening.getTime() ? minEvening : preferred
        }
        target = roundToQuarter(new Date((target.getTime() * 3 + center.getTime()) / 4))
      }

      target = clamp(target, dayStart, dayEnd)
      return { task, target }
    })

    candidates.sort((a, b) => a.target.getTime() - b.target.getTime())
    const seen = new Set<number>()
    for (const c of candidates) {
      let t = c.target
      while (seen.has(t.getTime())) {
        t = addMinutes(t, 15)
        t = clamp(t, dayStart, dayEnd)
      }
      seen.add(t.getTime())
      c.target = t
    }

    const tasks = candidates.map(({ task, target }) => ({
      ...task,
      scheduled_at: target.toISOString(),
    }))

    return { ...day, tasks }
  })

  return { ...plan, days: scheduledDays }
}

export const SCHEDULER_OFFSETS = OFFSET_MIN


