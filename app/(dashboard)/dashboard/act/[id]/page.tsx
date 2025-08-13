import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { HelpCircle, CheckCircle2, Circle } from 'lucide-react'

type EvidenceRef = {
  url: string
  label: string
  summary?: string | null
}

type ProgramTask = {
  slug: string
  title: string
  pillar: string
  evidence?: EvidenceRef[] | null
  description?: string | null
  duration_min?: number | null
  duration_max?: number | null
  zeitgeber_tags?: string[] | null
  default_circadian_slot?: string | null
}

type TemplateDay = {
  day?: number
  tasks?: ProgramTask[]
}

function normalizeCategoryFromPillar(pillar: string | null | undefined): string {
  const p = (pillar || '').toLowerCase()
  if (p === 'breath' || p === 'breathwork') return 'breathwork'
  if (p === 'movement') return 'movement'
  if (p === 'sleep') return 'sleep'
  if (p === 'food' || p === 'nutrition') return 'nutrition'
  if (p === 'focus' || p === 'mindset') return 'mindset'
  return 'general'
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'breathwork': return '🫁'
    case 'movement': return '🚶'
    case 'sleep': return '😴'
    case 'nutrition': return '🥗'
    case 'mindset': return '🧠'
    default: return '✨'
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'breathwork': return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'movement': return 'bg-green-50 text-green-700 border-green-200'
    case 'sleep': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'nutrition': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'mindset': return 'bg-pink-50 text-pink-700 border-pink-200'
    default: return 'bg-gray-50 text-gray-700 border-gray-200'
  }
}

function getTimeIcon(slot: string | null | undefined): string {
  const s = (slot || '').toLowerCase()
  if (s.includes('morning')) return '☀️'
  if (s.includes('midday') || s.includes('afternoon')) return '🌅'
  if (s.includes('evening') || s.includes('night')) return '🌙'
  return '⏰'
}

export default async function ProgramDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createSupabaseServerClient()
  const { data: tpl, error } = await supabase
    .from('program_templates')
    .select('id,name,version,description,audience_tags,days')
    .eq('id', params.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!tpl) return notFound()

  const days: TemplateDay[] = Array.isArray(tpl.days) ? (tpl.days as TemplateDay[]) : []
  const sortedDays = [...days].sort((a, b) => (a.day ?? 0) - (b.day ?? 0))

  return (
    <div className="w-full space-y-8">
      {/* Page Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-logo font-bold text-neutral-900">Program Details</h1>
          <p className="text-lg text-neutral-600 max-w-2xl">Review the full program outline before activating it.</p>
          <Link href="/dashboard/act" className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors">← Back to Program Library</Link>
        </div>
        <Link href="/how-it-works#act" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Learn more</span>
        </Link>
      </div>

      {/* Program Intro */}
      <Card className="border-neutral-200 shadow-sm">
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            
            <CardTitle className="text-2xl text-neutral-900">{tpl.name}</CardTitle>
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

      {/* Program Days - mirrors planning daily cards */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Program Days</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedDays.map((d) => {
            const dayNumber = d.day ?? 0
            const items = d.tasks ?? []
            return (
              <Card key={`day-${dayNumber}`} className="rounded-xl shadow-sm transition-all duration-200 hover:shadow-md border-neutral-200 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-neutral-900">Day {dayNumber}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((it, idx) => {
                      const category = normalizeCategoryFromPillar(it.pillar)
                      const hasRange = (it.duration_min ?? null) !== null && (it.duration_max ?? null) !== null
                      const humanDuration = hasRange
                        ? (it!.duration_min === it!.duration_max ? `${it!.duration_min} min` : `${it!.duration_min}-${it!.duration_max} min`)
                        : null
                      const slot = it.default_circadian_slot || (it.zeitgeber_tags?.[0] ?? 'flexible')
                      return (
                        <div key={`it-${dayNumber}-${idx}`} className="border rounded-lg p-3 transition-all duration-200 bg-white border-neutral-200 hover:border-neutral-300">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Circle className="w-4 h-4 text-neutral-400" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getCategoryColor(category)}`}>
                                  {getCategoryIcon(category)} {category}
                                </span>
                                {slot && (
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                                    {getTimeIcon(slot)} {slot}
                                  </span>
                                )}
                                {humanDuration && (
                                  <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                                    ⏱️ {humanDuration}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h4 className="font-medium text-neutral-900 text-sm mb-1">{it.title}</h4>
                                {it.description ? (
                                  <p className="text-xs text-neutral-600">{it.description}</p>
                                ) : null}
                              </div>
                              {Array.isArray(it.evidence) && it.evidence.length > 0 && (
                                <div className="pt-2 border-t border-neutral-200">
                                  <div className="text-[11px] text-neutral-500 mb-1">Evidence</div>
                                  <ul className="space-y-1">
                                    {it.evidence.map((e, i) => (
                                      <li key={`ev-${idx}-${i}`} className="text-xs">
                                        <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                                          {e.label}
                                        </a>
                                        {e.summary ? <span className="text-neutral-500"> — {e.summary}</span> : null}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}


