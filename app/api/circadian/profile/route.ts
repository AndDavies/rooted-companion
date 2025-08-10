import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireServerUser } from '@/lib/auth/user'
import { buildDerivedCircadian } from '@/lib/circadian/derive'

const Body = z.object({
  selfId: z.enum(['morning','neither','evening']),
  wakeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  bedtime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  shiftWork: z.boolean().optional(),
})

async function upsert(req: Request) {
  const { supabase, userId } = await requireServerUser()
  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const derived = buildDerivedCircadian({ ...parsed.data, shiftWork: !!parsed.data.shiftWork })
  const { data, error } = await supabase
    .from('user_circadian_profiles')
    .upsert({
      user_id: userId,
      chronotype: derived.chronotype,
      wake_time: derived.wakeTime,
      bedtime: derived.bedtime,
      caffeine_cutoff: derived.caffeineCutoff,
      shift_work_flag: derived.shiftWork,
    }, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) { return upsert(req) }
export async function PUT(req: Request) { return upsert(req) }


