import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import TasksClient from './TasksClient'
import { ToastProvider } from '@/components/ui/useToast'

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) redirect('/')

  const { data, error } = await supabase
    .from('v_task_library_min')
    .select('*')
    .order('pillar')

  if (error) {
    throw new Error(error.message)
  }

  return (
    <ToastProvider>
      <TasksClient tasks={(data ?? []) as unknown as import('./TasksClient').TaskMin[]} />
    </ToastProvider>
  )
}


