import { createClient } from '@/utils/supabase/server'
import { 
  AccountDetailsWidget, 
  BiometricSyncWidget, 
  RecoveryStatsWidget, 
  QuickActionsWidget,
  DailyPulseWidget,
  RecoveryPlanWidget 
} from '@/components/widgets'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  
  // User is guaranteed to exist due to layout guard
  if (!data.user) {
    throw new Error('User not found')
  }
  
  const user = data.user

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900 mb-2">
          Your Recovery Journey
        </h2>
        <p className="text-neutral-600">
          Track your progress and stay connected to your wellness goals.
        </p>
      </div>

      {/* Three-column layout on large screens: [Pulse] [Plan] [Stats+Sync+Account] */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Col 1: Today's Pulse */}
        <div className="h-full">
          <DailyPulseWidget />
        </div>
        {/* Col 2: Recovery Plan */}
        <div className="h-full">
          <RecoveryPlanWidget />
        </div>
        {/* Col 3: Stacked widgets */}
        <div className="space-y-6">
          <RecoveryStatsWidget />
          <BiometricSyncWidget userId={user.id} />
          <AccountDetailsWidget user={user} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActionsWidget />
      

    </div>
  )
}