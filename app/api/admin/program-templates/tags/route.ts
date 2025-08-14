import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch all audience_tags arrays and build distinct set
  const { data, error } = await supabase
    .from('program_templates')
    .select('audience_tags')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const set = new Set<string>()
  for (const row of data ?? []) {
    const tags = (row?.audience_tags as unknown as string[] | null) ?? []
    for (const t of tags) {
      if (typeof t === 'string' && t.trim()) set.add(t.trim())
    }
  }
  return NextResponse.json({ data: Array.from(set).sort((a, b) => a.localeCompare(b)) })
}


