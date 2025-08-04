import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart } from 'lucide-react'

interface RecoveryStatsWidgetProps {
  stats?: {
    sessions: number
    streak: number
    totalTime: number
  }
}

export default function RecoveryStatsWidget({ stats }: RecoveryStatsWidgetProps) {
  const defaultStats = {
    sessions: 0,
    streak: 0,
    totalTime: 0
  }

  const displayStats = stats || defaultStats

  return (
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
            <span className="font-medium">{displayStats.sessions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Streak</span>
            <span className="font-medium">{displayStats.streak} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-neutral-600">Total time</span>
            <span className="font-medium">{displayStats.totalTime} mins</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 