import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

const ProgramTemplate = z.object({
  name: z.string().min(3),
  version: z.number().int().positive().default(1),
  description: z.string().optional(),
  audience_tags: z.array(z.string()).optional(),
  days: z.array(z.object({
    day: z.number().int().positive(),
    items: z.array(z.object({
      slot_hint: z.string().min(2),
      task_ref: z.string().min(2),
      task_id: z.string().uuid().optional(),
      default_duration: z.number().int().positive().optional(),
      notes: z.string().optional(),
    })),
  })),
})

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isUserAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const json = await req.json().catch(() => null)
  const parsed = ProgramTemplate.strict().safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('upsert_program_template', { tpl: parsed.data })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}


