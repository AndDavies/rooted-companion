import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Activity, Heart, Target } from 'lucide-react'

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
        <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
          Your Recovery Journey
        </h2>
        <p className="text-neutral-600">
          Track your progress and stay connected to your wellness goals.
        </p>
      </div>

      {/* User Info Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">Email</p>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-neutral-600">User ID</p>
              <p className="font-mono text-xs text-neutral-500">{user.id}</p>
              <p className="text-sm text-neutral-600">Joined</p>
              <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Biometric Sync
            </CardTitle>
            <CardDescription>
              Connect your wearable devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-neutral-500 mb-4">No devices connected</p>
              <Button size="sm" disabled>
                Connect Garmin
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Recovery Stats
            </CardTitle>
            <CardDescription>
              Your wellness metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Sessions</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Streak</span>
                <span className="font-medium">0 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-600">Total time</span>
                <span className="font-medium">0 mins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Start your recovery session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex flex-col items-center gap-2" disabled>
              <Activity className="w-6 h-6" />
              <span>Start Breathwork</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" disabled>
              <Heart className="w-6 h-6" />
              <span>Log Mood</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2" disabled>
              <Target className="w-6 h-6" />
              <span>Set Goals</span>
            </Button>
          </div>
          <p className="text-xs text-neutral-500 mt-4">
            Features coming soon! This is a demo implementation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}