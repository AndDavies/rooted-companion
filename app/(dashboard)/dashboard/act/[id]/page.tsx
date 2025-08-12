import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type TaskRow = { slug: string; title: string }

export default async function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: tpl, error } = await supabase
    .from('program_templates')
    .select('id,name,version,description,audience_tags,days')
    .eq('id', params.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!tpl) return notFound()

  const days = Array.isArray(tpl.days) ? tpl.days as { day?: number; items?: { task_ref?: string; slot_hint?: string; default_duration?: number }[] }[] : []
  const firstThree = days.slice(0, 3)

  const slugs = Array.from(new Set(firstThree.flatMap(d => (d.items ?? []).map(i => i.task_ref).filter(Boolean) as string[])))
  let titles: Record<string, string> = {}
  if (slugs.length) {
    const { data: tasks } = await supabase
      .from('task_library')
      .select('slug,title')
      .in('slug', slugs)
    titles = Object.fromEntries((tasks ?? []).map((t: TaskRow) => [t.slug, t.title]))
  }

  return (
    <div className="space-y-6">
      <Card className="border-neutral-200">
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-neutral-900">{tpl.name}</CardTitle>
            <div className="text-sm text-neutral-500">v{tpl.version} {Array.isArray(tpl.audience_tags) && tpl.audience_tags.includes('public') ? (<span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200">Public</span>) : null}</div>
          </div>
          <form action={`/dashboard/act/activate/${tpl.id}`} method="get" className="flex items-center gap-2">
            <select name="start" className="border rounded px-2 h-9 text-sm">
              <option value="now">Start Now</option>
              <option value="tomorrow" selected>Tomorrow</option>
              <option value="next_monday">Next Monday</option>
            </select>
            <Button type="submit" className="h-9">Activate</Button>
          </form>
        </CardHeader>
        <CardContent>
          {tpl.description ? <p className="text-neutral-700">{tpl.description}</p> : null}
        </CardContent>
      </Card>

      <Card className="border-neutral-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-neutral-900">Preview (first 3 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {firstThree.map(d => (
              <div key={`d-${d.day}`} className="border rounded p-3">
                <div className="font-medium text-sm">Day {d.day}</div>
                <ul className="list-disc pl-6 text-sm mt-1">
                  {(d.items ?? []).map((it, idx) => (
                    <li key={`it-${idx}`}>
                      <span className="font-mono">{it.task_ref}</span> — {titles[it.task_ref ?? ''] ?? ''}
                      {it.default_duration ? ` (${it.default_duration}m)` : ''}
                      {it.slot_hint ? ` · ${it.slot_hint}` : ''} <span className="text-neutral-500">(example window)</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


