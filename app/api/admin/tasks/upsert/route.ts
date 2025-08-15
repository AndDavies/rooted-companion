import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { TaskContentSchema, parseTaskContent } from '@/lib/tasks/contentSchema'

const allowedZeitgeber = ['morning','midday','afternoon','evening','night'] as const

const TaskPayload = z.object({
  pillar: z.enum(['breath','sleep','food','movement','focus','joy']),
  slug: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  duration_min: z.number().int().positive().optional(),
  duration_max: z.number().int().positive().optional(),
  intensity_tags: z.array(z.string()).default([]),
  contraindications: z.array(z.string()).optional(),
  evidence_refs: z.array(z.string()).default([]),
  zeitgeber_tags: z.array(z.enum(allowedZeitgeber)).default([]),
  default_circadian_slots: z.array(z.enum(allowedZeitgeber)).default([]),
  version: z.number().int().positive().optional(),
  content: TaskContentSchema.optional(),
})

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => null) as unknown
  const payload = (json && typeof json === 'object' && 'task' in (json as Record<string, unknown>))
    ? (json as { task: unknown }).task
    : json
  const parsed = TaskPayload.strict().safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const safeContent = parseTaskContent((parsed.data as { content?: unknown }).content) || {}

  // Normalize arrays
  const dedupe = (arr: string[]) => Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)))
  const normalizeUrls = (arr: string[]) => arr.map(u => {
    try {
      const url = new URL(u)
      url.host = url.host.toLowerCase()
      if (url.pathname.endsWith('/') && url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '')
      return url.toString()
    } catch { return u }
  })
  const intensity_tags = dedupe(parsed.data.intensity_tags)
  const evidence_refs = normalizeUrls(dedupe(parsed.data.evidence_refs))
  const zeitgeber_tags = dedupe(parsed.data.zeitgeber_tags.map(s => s.toLowerCase())) as typeof parsed.data.zeitgeber_tags
  const default_circadian_slots = dedupe(parsed.data.default_circadian_slots.map(s => s.toLowerCase())) as typeof parsed.data.default_circadian_slots

  const row = {
    pillar: parsed.data.pillar,
    slug: parsed.data.slug,
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    duration_min: parsed.data.duration_min ?? null,
    duration_max: parsed.data.duration_max ?? null,
    intensity_tags,
    contraindications: parsed.data.contraindications ?? null,
    evidence_refs,
    zeitgeber_tags,
    default_circadian_slots,
    version: parsed.data.version ?? 1,
    content: safeContent,
  }

  const { data, error } = await supabase
    .from('task_library')
    .upsert(row, { onConflict: 'slug' })
    .select('id')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}


