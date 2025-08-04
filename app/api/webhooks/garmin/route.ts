/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/utils/supabase/admin'

function percentEncode(str: string) {
  return encodeURIComponent(str)
    .replace(/[!*']/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())
}

function parseOAuthHeader(header: string): Record<string, string> {
  const out: Record<string, string> = {}
  const prefix = 'OAuth '
  if (!header.startsWith(prefix)) return out
  const params = header.slice(prefix.length).split(',')
  for (const p of params) {
    const [k, v] = p.trim().split('=')
    if (k && v) out[k] = decodeURIComponent(v.replace(/"/g, ''))
  }
  return out
}

function buildBaseString(req: NextRequest, oauthParams: Record<string, string>): string {
  const url = new URL(req.url)
  const baseUrl = `${url.origin}${url.pathname}`

  // gather query params
  const queryPairs: [string, string][] = []
  url.searchParams.forEach((val, key) => {
    queryPairs.push([key, val])
  })

  // oauth params except signature
  Object.entries(oauthParams).forEach(([k, v]) => {
    if (k !== 'oauth_signature') queryPairs.push([k, v])
  })

  // sort
  queryPairs.sort((a, b) => (a[0] === b[0] ? a[1].localeCompare(b[1]) : a[0].localeCompare(b[0])))

  const paramString = queryPairs
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&')

  return `${req.method.toUpperCase()}&${percentEncode(baseUrl)}&${percentEncode(paramString)}`
}

// Returns true if signature matches OR header absent (temporary until full verification confirmed)
function verifyOAuth1(req: NextRequest, consumerSecret: string): boolean {
  const authHeader = req.headers.get('authorization') || ''
  const params = parseOAuthHeader(authHeader)
  if (!params.oauth_signature) return true // TODO: remove this fallback once Garmin sends signed payloads

  const baseString = buildBaseString(req, params)
  const computed = crypto
    .createHmac('sha1', `${consumerSecret}&`)
    .update(baseString)
    .digest('base64')

  console.debug('[Garmin] Base string', baseString)
  console.debug('[Garmin] Computed sig', computed)
  console.debug('[Garmin] Garmin sig', params.oauth_signature)

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(params.oauth_signature))
}

export async function POST(request: NextRequest) {
  // --- Debugging: log signature details (remove once verified) ---
  const debugAuth = request.headers.get('authorization') || ''
  console.debug('[Garmin] Auth header', debugAuth)
  console.debug('[Garmin] Raw URL', request.url)
  const rawBody = await request.text()

  // Optional signature verification
  const consumerSecret = process.env.GARMIN_CLIENT_SECRET || ''
  if (consumerSecret && !verifyOAuth1(request, consumerSecret)) {
    return new NextResponse('invalid signature', { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new NextResponse('bad json', { status: 400 })
  }

  // Store raw payload for black-box debugging
  try {
    await (supabaseAdmin as any).from('wearable_event_raw').insert({ payload })
  } catch (e) {
    console.error('[Garmin] Failed to persist raw payload', e)
  }

  // Helper cache to avoid repeated DB look-ups during this request
  const connCache: Record<string, string | undefined> = {}

  async function getConnectionId(garminUserId: string): Promise<string | undefined> {
    if (connCache[garminUserId] !== undefined) return connCache[garminUserId]

    const { data, error } = await (supabaseAdmin as any)
      .from('wearable_connections')
      .select('id')
      .eq('wearable_user_id', garminUserId)
      .eq('wearable_type', 'garmin')
      .maybeSingle()

    if (error) {
      console.error(`[Garmin] Failed to get connection for user ${garminUserId}:`, error)
      return undefined
    }

    connCache[garminUserId] = data?.id
    return data?.id
  }

  async function insertMetric(
    connId: string,
    metric: string,
    value: number,
    unit: string | null,
    ts: string | number,
  ): Promise<boolean> {
    try {
      const timestamp = typeof ts === 'number' ? new Date(ts * 1000).toISOString() : new Date(ts).toISOString()
      
      const { error } = await (supabaseAdmin as any).from('wearable_data').upsert({
        connection_id: connId,
        metric_type: metric,
        value,
        unit,
        timestamp,
        source: 'garmin',
      }, { 
        onConflict: 'connection_id,metric_type,timestamp',
        ignoreDuplicates: false 
      })

      if (error) {
        console.error(`[Garmin] Failed to insert metric ${metric}=${value} for connection ${connId}:`, error)
        return false
      }

      console.log(`[Garmin] ✓ Inserted ${metric}=${value}${unit ? ` ${unit}` : ''} at ${timestamp}`)
      return true
    } catch (e) {
      console.error(`[Garmin] Exception inserting metric ${metric}:`, e)
      return false
    }
  }

  // Track metrics for summary
  let totalMetrics = 0
  let successfulInserts = 0
  let failedInserts = 0

  // If Garmin sends the old structure with a top-level `events` array we continue to support it.
  const eventWrappers: any[] = payload?.events ?? []

  // Newer Garmin pushes seem to include domain-specific arrays directly on the root
  if (Array.isArray(payload?.dailies)) {
    eventWrappers.push(...payload.dailies.map((d: any) => ({ dailies: d, userId: d.userId })))
  }

  if (Array.isArray(payload?.wellnessSleep)) {
    eventWrappers.push(...payload.wellnessSleep.map((s: any) => ({ wellnessSleep: s, userId: s.userId })))
  }

  if (Array.isArray(payload?.sleeps)) {
    eventWrappers.push(...payload.sleeps.map((s: any) => ({ sleeps: s, userId: s.userId })))
  }

  if (Array.isArray(payload?.hrv)) {
    eventWrappers.push(...payload.hrv.map((h: any) => ({ hrv: h, userId: h.userId })))
  }

  if (Array.isArray(payload?.stress)) {
    eventWrappers.push(...payload.stress.map((st: any) => ({ stress: st, userId: st.userId })))
  }

  if (Array.isArray(payload?.respirationEpoch)) {
    eventWrappers.push(...payload.respirationEpoch.map((r: any) => ({ respirationEpoch: r, userId: r.userId })))
  }

  if (Array.isArray(payload?.allDayRespiration)) {
    // Flatten allDayRespiration summaries – compute average respiration rate for now.
    eventWrappers.push(
      ...payload.allDayRespiration.map((r: any) => {
        const breathsObj = r.timeOffsetEpochToBreaths || {}
        const breaths = Object.values(breathsObj).filter((b: any) => typeof b === 'number' && b > 0)
        const avg = breaths.length ? (breaths as number[]).reduce((a, b) => a + (b as number), 0) / breaths.length : undefined
        return { allDayRespiration: { ...r, avgRespirationRate: avg }, userId: r.userId }
      }),
    )
  }

  for (const evt of eventWrappers) {
    const garminUserId = evt.userId
    if (!garminUserId) {
      console.warn('[Garmin] Event missing userId, skipping')
      continue
    }

    const connId = await getConnectionId(garminUserId)
    if (!connId) {
      console.warn(`[Garmin] No connection found for user ${garminUserId}`)
      continue
    }

    // Dailies - Extract comprehensive metrics
    if (evt.dailies) {
      const d = evt.dailies
      const timestamp = d.startTimeInSeconds ?? Date.now() / 1000

      // Activity metrics
      if (d.steps !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'steps', d.steps, 'steps', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.activeKilocalories !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'active_calories', d.activeKilocalories, 'kcal', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.bmrKilocalories !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'bmr_calories', d.bmrKilocalories, 'kcal', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.floorsClimbed !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'floors', d.floorsClimbed, 'floors', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.distanceInMeters !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'distance', d.distanceInMeters, 'm', timestamp)) successfulInserts++; else failedInserts++
      }

      // Time metrics
      if (d.durationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'duration', d.durationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.activeTimeInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'active_time', d.activeTimeInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }

      // Heart rate metrics
      if (d.maxHeartRateInBeatsPerMinute !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'heart_rate_max', d.maxHeartRateInBeatsPerMinute, 'bpm', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.averageHeartRateInBeatsPerMinute !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'heart_rate_avg', d.averageHeartRateInBeatsPerMinute, 'bpm', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.restingHeartRateInBeatsPerMinute !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'heart_rate_resting', d.restingHeartRateInBeatsPerMinute, 'bpm', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.minHeartRateInBeatsPerMinute !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'heart_rate_min', d.minHeartRateInBeatsPerMinute, 'bpm', timestamp)) successfulInserts++; else failedInserts++
      }

      // Stress metrics from dailies
      if (d.maxStressLevel !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_max', d.maxStressLevel, 'score', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.averageStressLevel !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_avg', d.averageStressLevel, 'score', timestamp)) successfulInserts++; else failedInserts++
      }

      // Stress duration metrics
      if (d.stressDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_duration', d.stressDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.lowStressDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_low_duration', d.lowStressDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.mediumStressDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_medium_duration', d.mediumStressDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.highStressDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_high_duration', d.highStressDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }

      // Intensity metrics
      if (d.moderateIntensityDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'intensity_moderate_duration', d.moderateIntensityDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (d.vigorousIntensityDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'intensity_vigorous_duration', d.vigorousIntensityDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
    }

    // Wellness Sleep
    if (evt.wellnessSleep) {
      const s = evt.wellnessSleep
      const timestamp = s.calendarDate

      if (s.totalSleepSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_total_seconds', s.totalSleepSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.deepSleepSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_deep_seconds', s.deepSleepSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.remSleepSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_rem_seconds', s.remSleepSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.lightSleepSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_light_seconds', s.lightSleepSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.awakeDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_awake_seconds', s.awakeDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.sleepStartTimeInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_start_time', s.sleepStartTimeInSeconds, 'timestamp', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.sleepEndTimeInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_end_time', s.sleepEndTimeInSeconds, 'timestamp', timestamp)) successfulInserts++; else failedInserts++
      }
    }

    // Sleep data (from 'sleeps' array)
    if (evt.sleeps) {
      const s = evt.sleeps
      const timestamp = s.calendarDate

      if (s.durationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_total_seconds', s.durationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.deepSleepDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_deep_seconds', s.deepSleepDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.remSleepInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_rem_seconds', s.remSleepInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.lightSleepDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_light_seconds', s.lightSleepDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.awakeDurationInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_awake_seconds', s.awakeDurationInSeconds, 's', timestamp)) successfulInserts++; else failedInserts++
      }
      if (s.startTimeInSeconds !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'sleep_start_time', s.startTimeInSeconds, 'timestamp', timestamp)) successfulInserts++; else failedInserts++
      }
      // Calculate sleep end time if we have start time and duration
      if (s.startTimeInSeconds !== undefined && s.durationInSeconds !== undefined) {
        const sleepEndTime = s.startTimeInSeconds + s.durationInSeconds
        totalMetrics++
        if (await insertMetric(connId, 'sleep_end_time', sleepEndTime, 'timestamp', timestamp)) successfulInserts++; else failedInserts++
      }
    }

    // HRV (using lastNightAvg as proxy for RMSSD)
    if (evt.hrv) {
      const h = evt.hrv
      if (h.lastNightAvg !== undefined) {
        totalMetrics++
        const timestamp = h.calendarDate ?? h.startTimeInSeconds
        if (await insertMetric(connId, 'hrv_rmssd', h.lastNightAvg, 'ms', timestamp)) successfulInserts++; else failedInserts++
      }
    }

    // Stress summary
    if (evt.stress) {
      const st = evt.stress
      if (st.stressScore !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'stress_score', st.stressScore, 'score', st.calendarDate)) successfulInserts++; else failedInserts++
      }
    }

    // Respiration epoch (single value per event)
    if (evt.respirationEpoch) {
      const r = evt.respirationEpoch
      if (r.respirationRate !== undefined) {
        totalMetrics++
        if (await insertMetric(connId, 'respiration_rate', r.respirationRate, 'rpm', r.startTimeInSeconds)) successfulInserts++; else failedInserts++
      }
    }

    // All-day respiration – store average breaths-per-min if we computed one
    if (evt.allDayRespiration) {
      const r = evt.allDayRespiration
      if (r.avgRespirationRate !== undefined && r.avgRespirationRate > 0) {
        totalMetrics++
        if (await insertMetric(connId, 'respiration_rate', r.avgRespirationRate, 'rpm', r.startTimeInSeconds)) successfulInserts++; else failedInserts++
      }
    }
  }

  console.log(`[Garmin] Processing complete: ${successfulInserts}/${totalMetrics} metrics inserted successfully, ${failedInserts} failed`)
  
  return new NextResponse('ok', { status: 200 })
} 