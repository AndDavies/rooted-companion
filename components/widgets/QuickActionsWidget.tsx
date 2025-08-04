import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Heart, Target } from 'lucide-react'

interface QuickAction {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'outline'
  disabled?: boolean
  onClick?: () => void
}

interface QuickActionsWidgetProps {
  actions?: QuickAction[]
}

export default function QuickActionsWidget({ actions }: QuickActionsWidgetProps) {
  const defaultActions: QuickAction[] = [
    {
      id: 'breathwork',
      title: 'Start Breathwork',
      icon: Activity,
      disabled: true
    },
    {
      id: 'mood',
      title: 'Log Mood',
      icon: Heart,
      variant: 'outline',
      disabled: true
    },
    {
      id: 'goals',
      title: 'Set Goals',
      icon: Target,
      variant: 'outline',
      disabled: true
    }
  ]

  const displayActions = actions || defaultActions

  return (
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
          {displayActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Button
                key={action.id}
                className="h-auto p-4 flex flex-col items-center gap-2"
                variant={action.variant || 'default'}
                disabled={action.disabled}
                onClick={action.onClick}
              >
                <IconComponent className="w-6 h-6" />
                <span>{action.title}</span>
              </Button>
            )
          })}
        </div>
        <p className="text-xs text-neutral-500 mt-4">
          Features coming soon! This is a demo implementation.
        </p>
      </CardContent>
    </Card>
  )
} 