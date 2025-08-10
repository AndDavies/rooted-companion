import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isUserAdmin } from '@/lib/auth/admin'
import { ToastProvider } from '@/components/ui/useToast'
import ProgramsClient from './ProgramsClient'

export default async function ProgramsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isUserAdmin(user)) redirect('/')

  const { data, error } = await supabase
    .from('program_templates')
    .select('id,name,version,description,audience_tags,updated_at')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (
    <ToastProvider>
      <ProgramsClient templates={(data ?? []) as { id: string; name: string; version: number; description: string | null; audience_tags: string[] | null; updated_at: string | null }[]} />
    </ToastProvider>
  )
}


