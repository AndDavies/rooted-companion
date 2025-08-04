import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'

interface AccountDetailsWidgetProps {
  user: {
    id: string
    email?: string
    created_at: string
  }
}

export default function AccountDetailsWidget({ user }: AccountDetailsWidgetProps) {
  return (
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
          <p className="font-medium">{user.email || 'Not provided'}</p>
          <p className="text-sm text-neutral-600">User ID</p>
          <p className="font-mono text-xs text-neutral-500">{user.id}</p>
          <p className="text-sm text-neutral-600">Joined</p>
          <p className="text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
        </div>
      </CardContent>
    </Card>
  )
} 