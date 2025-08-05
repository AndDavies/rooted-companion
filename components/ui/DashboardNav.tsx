'use client'

import { Button } from '@/components/ui/button'
import { User as UserIcon, Home, LogOut, Settings, Menu, X, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'

interface DashboardNavProps {
  user: User
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand and Navigation */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-logo font-semibold text-neutral-900">ROOTED</h1>
              </div>
              <div className="sm:hidden">
                <h1 className="font-logo font-semibold text-neutral-900">ROOTED</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </Link>
              <Link href="/dashboard/planning">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Recovery Plans
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>

          {/* Right: User Info and Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:block text-right">
              <p className="text-sm text-neutral-600">
                Welcome back, {user?.email?.split('@')[0]}
              </p>
            </div>
            <div className="hidden md:block">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link 
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>
              <Link 
                href="/dashboard/planning"
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="w-4 h-4" />
                Recovery Plans
              </Link>
              <Link 
                href="/dashboard/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center gap-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors w-full text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}