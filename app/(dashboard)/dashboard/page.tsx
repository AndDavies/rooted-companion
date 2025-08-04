import { createClient } from '@/utils/supabase/server'
import { 
  AccountDetailsWidget, 
  BiometricSyncWidget, 
  RecoveryStatsWidget, 
  QuickActionsWidget 
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

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <AccountDetailsWidget user={user} />
        <BiometricSyncWidget userId={user.id} />
        <RecoveryStatsWidget />
      </div>

      {/* Quick Actions */}
      <QuickActionsWidget />
      

    </div>
  )
}