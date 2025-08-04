import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/server'
import { User, Home, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

async function logout() {
  'use server'
  
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardNav() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  
  // This component assumes we're already authenticated due to layout guard
  const user = data?.user

  return (
    <nav className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand and User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-serif font-semibold text-neutral-900">ROOTED Dashboard</h1>
                <p className="text-sm text-neutral-600">
                  Welcome back, {user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Navigation Actions */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
            <form action={logout}>
              <Button variant="outline" size="sm" type="submit" className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}