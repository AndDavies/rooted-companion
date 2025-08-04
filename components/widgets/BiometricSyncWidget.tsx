import { createClient } from '@/utils/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'
import Link from 'next/link'

interface BiometricSyncWidgetProps {
  userId: string
}

export default async function BiometricSyncWidget({ userId }: BiometricSyncWidgetProps) {
  const supabase = await createClient()

  // Check for Garmin connection
  const { data: garminConnection } = await supabase
    .from('wearable_connections')
    .select('wearable_user_id, created_at')
    .eq('user_id', userId)
    .eq('wearable_type', 'garmin')
    .maybeSingle()

  const isGarminConnected = !!garminConnection

  return (
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
        {isGarminConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Garmin Connected</span>
            </div>
            <div className="text-sm text-neutral-600">
              <p>User ID: {garminConnection?.wearable_user_id}</p>
              <p>Connected: {garminConnection?.created_at ? new Date(garminConnection.created_at).toLocaleDateString() : 'Unknown'}</p>
            </div>
            <Link href="/dashboard/settings/integrations">
              <Button size="sm" variant="outline" className="w-full">
                Manage Connections
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-500 mb-4">No devices connected</p>
            <Link href="/dashboard/settings/integrations">
              <Button size="sm">
                Connect Garmin
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 