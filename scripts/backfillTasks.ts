/*
  Backfill script for recovery_plan_tasks
  - If pillar is null but category present → copy mapped category → pillar
  - If title is null → derive from task_payload; fallback "Task"
  - Ensure task_payload exists and is an object (fallback {})

  Usage:
    npx tsx scripts/backfillTasks.ts           # dry run (no writes)
    npx tsx scripts/backfillTasks.ts --apply   # apply updates
*/

import { supabaseAdmin } from '@/utils/supabase/admin'
import type { Tables, Json } from '@/types/supabase'

type RptRow = Tables<'recovery_plan_tasks'>

function mapCategoryToPillar(category?: string | null): string | null {
  if (!category) return null
  const c = String(category).toLowerCase()
  if (c === 'breath' || c === 'breathwork') return 'breath'
  if (c === 'movement') return 'movement'
  if (c === 'sleep') return 'sleep'
  if (c === 'nutrition' || c === 'food') return 'food'
  if (c === 'mindset' || c === 'focus') return 'focus'
  if (c === 'joy') return 'joy'
  return null
}

function deriveTitleFromPayload(payload: unknown): string | null {
  try {
    if (!payload || typeof payload !== 'object') return null
    const obj = payload as Record<string, unknown>
    const direct = obj['title']
    if (typeof direct === 'string' && direct.trim()) return direct.trim()
    const inline = (obj['inline'] as { title?: unknown } | undefined)?.title
    if (typeof inline === 'string' && inline.trim()) return inline.trim()
    const lib = (obj['lib'] as { title?: unknown } | undefined)?.title
    if (typeof lib === 'string' && lib.trim()) return lib.trim()
  } catch {}
  return null
}

function normalizePayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as Record<string, unknown>
  }
  return {}
}

async function backfillBatch(apply: boolean, from: number, to: number): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('recovery_plan_tasks')
    .select('id,title,category,pillar,task_payload')
    .or('pillar.is.null,title.is.null,task_payload.is.null')
    .order('created_at', { ascending: true })
    .range(from, to)

  if (error) throw error
  const rows = (data ?? []) as Array<Pick<RptRow, 'id' | 'title' | 'category' | 'pillar' | 'task_payload'>>
  if (!rows.length) return 0

  let updates = 0
  for (const row of rows) {
    let nextTitle = row.title ?? null
    let nextPillar = row.pillar ?? null
    let nextPayload = normalizePayload(row.task_payload as unknown)

    if (!nextPillar) {
      const mapped = mapCategoryToPillar(row.category ?? null)
      if (mapped) nextPillar = mapped
    }

    if (!nextTitle) {
      const derived = deriveTitleFromPayload(nextPayload)
      if (derived) nextTitle = derived
      else nextTitle = 'Task'
    }

    const changed = (nextTitle !== row.title) || (nextPillar !== row.pillar) || (JSON.stringify(nextPayload) !== JSON.stringify(row.task_payload))
    if (!changed) continue

    updates++
    if (apply) {
      const { error: upErr } = await supabaseAdmin
        .from('recovery_plan_tasks')
        .update({ title: nextTitle, pillar: nextPillar, task_payload: nextPayload as unknown as Json })
        .eq('id', row.id)
      if (upErr) throw upErr
    } else {
      // eslint-disable-next-line no-console
      console.log('[DRYRUN] would update', {
        id: row.id,
        set: { title: nextTitle, pillar: nextPillar, task_payload: nextPayload }
      })
    }
  }
  return updates
}

async function main() {
  const apply = process.argv.includes('--apply') || process.env.APPLY === '1'
  // page through results; stop when no rows returned for a page
  const pageSize = 500
  let page = 0
  let totalUpdates = 0
  while (true) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const count = await backfillBatch(apply, from, to)
    if (count === 0) {
      if (page === 0) {
        // also break if first page had zero candidates
        break
      }
      // fetch next page to see if more
    }
    totalUpdates += count
    page++
    if (!count && page > 10) break // safety guard
  }
  // eslint-disable-next-line no-console
  console.log(apply ? `Applied ${totalUpdates} update(s).` : `Dry run complete; ${totalUpdates} row(s) would be updated.`)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})


