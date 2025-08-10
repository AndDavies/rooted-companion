import { requireServerUser } from '@/lib/auth/user'
import { ToastProvider } from '@/components/ui/useToast'
import OnboardingCircadianClient from './OnboardingCircadianClient'

export default async function OnboardingCircadianPage() {
  const { supabase, userId } = await requireServerUser()
  const { data } = await supabase.from('user_circadian_profiles').select('*').eq('user_id', userId).maybeSingle()

  const initial = data ? {
    selfId: (data.chronotype === 'lark' ? 'morning' : data.chronotype === 'owl' ? 'evening' : 'neither') as 'morning'|'neither'|'evening',
    wakeTime: (data.wake_time as unknown as string) ?? '07:00',
    bedtime: (data.bedtime as unknown as string) ?? '23:00',
    shiftWork: !!data.shift_work_flag,
  } : {
    selfId: 'neither' as const,
    wakeTime: '07:00',
    bedtime: '23:00',
    shiftWork: false,
  }

  return (
    <ToastProvider>
      <OnboardingCircadianClient initial={initial} />
    </ToastProvider>
  )
}


