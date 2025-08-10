import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

const TaskPayload = z.object({
  pillar: z.enum(['breath','sleep','food','movement','focus','joy']),
  slug: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  duration_min: z.number().int().positive().optional(),
  duration_max: z.number().int().positive().optional(),
  intensity_tags: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
  evidence_refs: z.array(z.string()).optional(),
  zeitgeber_tags: z.array(z.string()).optional(),
  default_circadian_slots: z.array(z.string()).optional(),
  version: z.number().int().positive().optional(),
})

const ImportTasksSchema = z.array(TaskPayload.strict()).min(1)

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isUserAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => null)
  const parsed = ImportTasksSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('import_task_library', { tasks: parsed.data })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}


