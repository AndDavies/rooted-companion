import type { DerivedCircadian } from './derive'

export type WearableSummary = {
  avgSleepOnsetLocal?: string // 'HH:MM'
  avgWakeLocal?: string // 'HH:MM'
  midpointLocal?: string // 'HH:MM'
  stable: boolean
}

export type CircadianSuggestion = null | {
  reason: 'midpoint_shift'
  suggestedChronotype: 'lark' | 'neutral' | 'owl'
  suggestedWake?: string
  suggestedBed?: string
}

function parseHHMM(hhmm: string): number | null {
  const m = hhmm.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

function biasFromMidpoint(midMin: number): 'lark' | 'neutral' | 'owl' {
  const m0100 = 1 * 60
  const m0300 = 3 * 60
  const m0600 = 6 * 60
  if (midMin >= m0100 && midMin <= m0300) return 'lark'
  if (midMin >= m0600) return 'owl'
  return 'neutral'
}

export function suggestChronotypeUpdate(current: DerivedCircadian, wearable?: WearableSummary): CircadianSuggestion {
  if (!wearable || !wearable.stable) return null
  let mid = wearable.midpointLocal ? parseHHMM(wearable.midpointLocal) : null
  if (mid == null) {
    const w = wearable.avgWakeLocal ? parseHHMM(wearable.avgWakeLocal) : null
    const s = wearable.avgSleepOnsetLocal ? parseHHMM(wearable.avgSleepOnsetLocal) : null
    if (w == null || s == null) return null
    const normBed = s < w ? s + 24 * 60 : s
    mid = (w + Math.floor((normBed - w) / 2)) % (24 * 60)
  }
  const bias = biasFromMidpoint(mid)
  if (current.chronotype === 'neutral' && (bias === 'lark' || bias === 'owl')) {
    return { reason: 'midpoint_shift', suggestedChronotype: bias }
  }
  if (current.chronotype === 'lark' && bias === 'neutral') return null
  if (current.chronotype === 'owl' && bias === 'neutral') return null
  return null
}


