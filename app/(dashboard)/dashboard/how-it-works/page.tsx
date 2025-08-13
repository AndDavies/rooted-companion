import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Play, TrendingUp, Settings } from 'lucide-react'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-logo font-bold text-neutral-900">
          How ROOTED Companion Works
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Understand how each part of your dashboard helps you build consistent recovery habits.
        </p>
      </div>

      {/* Content Container */}
      <div className="space-y-12">
        {/* Planning Section */}
        <section id="planning" className="scroll-mt-24">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-700" />
                </div>
                <CardTitle className="text-xl">Your Recovery Plan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-700">
                Your recovery plan is a personalized roadmap that adapts to your biometric signals and wellness goals. 
                It maps daily actions across the Six Pillars, ensuring you have a clear path forward each day.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What you&apos;ll see:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Daily task breakdown with time suggestions</li>
                  <li>• Progress tracking across your plan</li>
                  <li>• Reflection prompts for deeper awareness</li>
                  <li>• Plan regeneration based on your latest data</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Act Section */}
        <section id="act" className="scroll-mt-24">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-700" />
                </div>
                <CardTitle className="text-xl">Today&apos;s Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-700">
                This is where you see what needs to happen today. Each action is sized to your current energy 
                and recovery state, making it easier to show up consistently without overwhelm.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">What you&apos;ll see:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Today&apos;s prioritized recovery actions</li>
                  <li>• Energy-appropriate task sizing</li>
                  <li>• Quick completion tracking</li>
                  <li>• Available recovery programs</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Progress Section */}
        <section id="progress" className="scroll-mt-24">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-700" />
                </div>
                <CardTitle className="text-xl">Progress & Trends</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-700">
                Track your momentum and spot patterns in your recovery journey. This view combines your daily 
                actions with biometric data to show you what&apos;s working and where you might adjust.
              </p>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">What you&apos;ll see:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Weekly completion trends</li>
                  <li>• Biometric recovery signals</li>
                  <li>• Streak tracking and momentum</li>
                  <li>• Personalized insights and recommendations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Settings Section */}
        <section id="settings" className="scroll-mt-24">
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-neutral-700" />
                </div>
                <CardTitle className="text-xl">Settings & Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-700">
                Customize your ROOTED experience to match your preferences and needs. Control notifications, 
                manage integrations, and update your wellness profile as your goals evolve.
              </p>
              <div className="bg-neutral-50 p-4 rounded-lg">
                <h4 className="font-medium text-neutral-900 mb-2">What you&apos;ll see:</h4>
                <ul className="text-sm text-neutral-800 space-y-1">
                  <li>• Wellness profile management</li>
                  <li>• Device integration controls</li>
                  <li>• Notification preferences</li>
                  <li>• Privacy and security settings</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Getting Started */}
        <Card className="border-neutral-200 shadow-sm bg-neutral-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium text-neutral-900">Ready to get started?</h3>
              <p className="text-neutral-600">
                Each section of your dashboard works together to support your recovery journey. 
                Start with your daily pulse, then explore what feels most relevant to you today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard/act">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    Take Daily Pulse
                  </button>
                </Link>
                <Link href="/dashboard/planning">
                  <button className="bg-neutral-600 hover:bg-neutral-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    View Recovery Plan
                  </button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
