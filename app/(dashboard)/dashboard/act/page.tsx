import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

type TemplateRow = {
  id: string
  name: string
  description: string | null
  audience_tags: string[] | null
  version: number
  days: unknown
}

export default async function ActPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has an active plan
  const { data: activePlan } = await supabase
    .from('recovery_plans')
    .select('id, title')
    .eq('user_id', user?.id ?? '')
    .eq('status', 'active')
    .maybeSingle()

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
    <div className="w-full space-y-8">
      {/* Page Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-logo font-bold text-neutral-900">
            Program Library
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl">
            See the day at a glance and complete what matters most, one small step at a time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/how-it-works#act" 
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Learn more</span>
          </Link>
        </div>
      </div>

      {/* Active Plan Notice (inline under description) */}
      {activePlan ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You currently have “{activePlan.title}” loaded. Starting a new plan will overwrite the current plan and progress.
        </div>
      ) : null}

      {/* Content Container */}
      <div className="space-y-8">
        {/* Program Library */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">Available Programs</h2>
            <p className="text-sm text-neutral-600">Choose from curated recovery programs</p>
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
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/act/${t.id}`}>View details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Why am I seeing this? */}
        <Card className="border-neutral-200 shadow-sm bg-neutral-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-neutral-500 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-neutral-900">Why am I seeing this?</h3>
                <p className="text-sm text-neutral-600">
                  These programs are available to help you build consistent recovery habits. 
                  Start with one that feels right for your current energy and schedule.
                </p>
                <Link 
                  href="/how-it-works#act" 
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Learn more about daily actions
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


