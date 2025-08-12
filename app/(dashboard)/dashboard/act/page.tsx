import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type TemplateRow = {
  id: string
  name: string
  description: string | null
  audience_tags: string[] | null
  version: number
  days: unknown
}

export default async function ProgramLibraryPage() {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('program_templates')
    .select('id,name,description,audience_tags,version,days')
    .contains('audience_tags', ['public'])
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const templates = (data ?? []) as TemplateRow[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900">Program Library</h1>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t) => {
          const days = Array.isArray(t.days) ? (t.days as { day?: number; items?: unknown[] }[]) : []
          const dayCount = days.length
          const desc = (t.description ?? '').trim()
          const short = desc.length > 120 ? `${desc.slice(0, 120)}…` : desc
          return (
            <Card key={t.id} className="border-neutral-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="font-medium text-neutral-900">{t.name}</span>
                  {Array.isArray(t.audience_tags) && t.audience_tags.includes('public') && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border bg-emerald-50 text-emerald-700 border-emerald-200">Public</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {short ? <div className="text-sm text-neutral-700">{short}</div> : null}
                <div className="mt-3 text-xs text-neutral-600">Days: {dayCount}</div>
                <div className="mt-4 flex justify-end">
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/act/${t.id}`}>View details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


