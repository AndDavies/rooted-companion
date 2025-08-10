import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'

export default async function AdminContentPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isUserAdmin(user)) redirect('/')

  const [{ count: tasksCount }, { count: programsCount }] = await Promise.all([
    supabase.from('v_task_library_min').select('id', { count: 'exact', head: true }),
    supabase.from('program_templates').select('id', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Content</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <div className="text-sm text-muted-foreground">Task Library</div>
          <div className="text-3xl font-bold">{tasksCount ?? 0}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-muted-foreground">Program Templates</div>
          <div className="text-3xl font-bold">{programsCount ?? 0}</div>
        </div>
      </div>
    </div>
  )
}


