export type Screener = {
  selfId: 'morning' | 'neither' | 'evening'
  wakeTime: string // 'HH:MM'
  bedtime: string  // 'HH:MM'
  shiftWork?: boolean
}

export type DerivedCircadian = {
  chronotype: 'lark' | 'neutral' | 'owl'
  wakeTime: string // 'HH:MM'
  bedtime: string  // 'HH:MM'
  caffeineCutoff: string // 'HH:MM'
  shiftWork: boolean
}

function parseHHMM(hhmm: string): number {
  const m = hhmm.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!m) throw new Error(`Invalid time: ${hhmm}`)
  const h = Number(m[1])
  const min = Number(m[2])
  return h * 60 + min
}

function toHHMM(totalMinutes: number): string {
  const m = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function normalizeBedMinutes(wakeMin: number, bedMin: number): number {
  // If bedtime is earlier than wake in the same 0-24, treat as next day
  return bedMin < wakeMin ? bedMin + 24 * 60 : bedMin
}

function midpoint(wakeMin: number, bedMinNorm: number): number {
  const span = bedMinNorm - wakeMin
  return wakeMin + Math.floor(span / 2)
}

export function deriveChronotype(s: Screener): 'lark' | 'neutral' | 'owl' {
  const base: 'lark' | 'neutral' | 'owl' = s.selfId === 'morning' ? 'lark' : s.selfId === 'evening' ? 'owl' : 'neutral'
  if (base !== 'neutral') return base
  // Apply light bias based on midpoint
  const w = parseHHMM(s.wakeTime)
  const b0 = parseHHMM(s.bedtime)
  const b = normalizeBedMinutes(w, b0)
  const mid = midpoint(w, b) % (24 * 60)
  // Bias bands
  // [01:00–03:00] -> lean lark, [04:00–05:30] -> neutral, >= 06:00 -> lean owl
  const m0100 = 1 * 60
  const m0300 = 3 * 60
  // bands kept for reference in comments; ranges implemented above
  const m0600 = 6 * 60
  if (mid >= m0100 && mid <= m0300) return 'lark'
  if (mid >= m0600) return 'owl'
  // else keep neutral (includes [04:00–05:30] and others)
  return 'neutral'
}

export function computeCaffeineCutoff(bedtimeHHMM: string): string {
  const b = parseHHMM(bedtimeHHMM)
  const cutoff = b - 8 * 60
  return toHHMM(cutoff)
}

export function buildDerivedCircadian(s: Screener): DerivedCircadian {
  const chronotype = deriveChronotype(s)
  const caffeineCutoff = computeCaffeineCutoff(s.bedtime)
  return {
    chronotype,
    wakeTime: s.wakeTime,
    bedtime: s.bedtime,
    caffeineCutoff,
    shiftWork: !!s.shiftWork,
  }
}


