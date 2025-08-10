// LandingPage.tsx – Marketing landing page for ROOTED Companion

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Activity,
  Wind,
  Moon,
  Utensils,
  Move,
  Target,
  Sparkles,
  HeartPulse,
  ListChecks,
  BarChart3,
  Bot,
  Flame,
  Users,
  Handshake,
} from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
        <h1 className="text-2xl font-logo font-semibold tracking-tight">ROOTED Companion</h1>
        <nav className="flex items-center gap-6">
          <a href="#pillars" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Pillars</a>
          <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">How it works</a>
          <a href="#faq" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">FAQ</a>
          <Link href="/login">
            <Button variant="outline" size="sm">
              Log in
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container-custom py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-logo font-bold leading-tight text-neutral-900">
                Out of the mind.
                <br />
                Into the body.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed">
                ROOTED Companion guides you toward alignment and balance with the Six Pillars of the Rooted Way—
                weaving breath, sleep, food, movement, focus, and joy into your daily life.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="px-8 py-3 text-base">
                    Start Free
                  </Button>
                </Link>
                <a href="#pillars">
                  <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                    Explore the Pillars
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative">
              <div className="w-full h-[400px] md:h-[500px] rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 flex items-center justify-center text-center p-6">
                <div className="space-y-2">
                  <p className="font-medium text-neutral-700">Hero Image Placeholder</p>
                  <p className="text-sm text-neutral-500">
                    Suggested: lifestyle + UI mockup composite that evokes calm, alignment, and embodiment.
                  </p>
                  <p className="text-xs text-neutral-400">Recommended dimensions: 1200×900 (16:12)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pillars Section */}
        <section id="pillars" className="container-custom py-16 md:py-24 bg-neutral-50">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">The Six Pillars of the Rooted Way</h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Practices that return you to presence, power, and embodied clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 1. Breath */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Wind className="w-6 h-6 text-blue-700" />
                </div>
                <CardTitle className="text-xl font-logo">Breath: Our first teacher</CardTitle>
                <CardDescription className="text-neutral-600">
                  Choose rhythm over reactivity. Tune your nervous system and clear the fog between thought and body.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> Three threshold breaths at daily transitions.</p>
              </CardContent>
            </Card>

            {/* 2. Sleep */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Moon className="w-6 h-6 text-indigo-700" />
                </div>
                <CardTitle className="text-xl font-logo">Sleep: A deep way of meditation</CardTitle>
                <CardDescription className="text-neutral-600">
                  Invite rest, don’t force it. Lead with calmer intuition and stamina.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> One-hour digital sunset before bed.</p>
              </CardContent>
            </Card>

            {/* 3. Food */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Utensils className="w-6 h-6 text-emerald-700" />
                </div>
                <CardTitle className="text-xl font-logo">Food: Living information</CardTitle>
                <CardDescription className="text-neutral-600">
                  Eat as ritual. Listen to what supports energy and clarity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> One distraction‑free listening meal.</p>
              </CardContent>
            </Card>

            {/* 4. Movement */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Move className="w-6 h-6 text-orange-700" />
                </div>
                <CardTitle className="text-xl font-logo">Movement: Memory in motion</CardTitle>
                <CardDescription className="text-neutral-600">
                  Move to reveal, not impress. Let the body guide you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> 10‑minute silent flow, daily.</p>
              </CardContent>
            </Card>

            {/* 5. Focus */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-purple-700" />
                </div>
                <CardTitle className="text-xl font-logo">Focus: Mind as garden</CardTitle>
                <CardDescription className="text-neutral-600">
                  Choose where your awareness lives, moment by moment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> Do one thing fully, each day.</p>
              </CardContent>
            </Card>

            {/* 6. Joy */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-amber-700" />
                </div>
                <CardTitle className="text-xl font-logo">Joy: The forgotten fuel</CardTitle>
                <CardDescription className="text-neutral-600">
                  Not performance or chasing—just permission to feel good again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> Find one spark of joy, daily.</p>
              </CardContent>
            </Card>
          </div>

          {/* Optional visual placeholder */}
          <div className="mt-16 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <p className="font-medium text-neutral-700">Pillars Collage Placeholder</p>
            <p className="text-sm text-neutral-500">Six-card collage or illustration representing the pillars.</p>
            <p className="text-xs text-neutral-400">Recommended dimensions: 1440×600 (12:5)</p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="container-custom py-16 md:py-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">How ROOTED Companion works</h3>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              A simple daily rhythm blends wearable signals, behavioral science, and the Rooted Way principles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
                  <HeartPulse className="w-6 h-6 text-rose-700" />
                </div>
                <CardTitle className="font-logo">Daily Pulse</CardTitle>
                <CardDescription>
                  A morning pulse reads readiness and recovery from your wearable to set your day&apos;s tone.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <ListChecks className="w-6 h-6 text-teal-700" />
                </div>
                <CardTitle className="font-logo">Plan Generation</CardTitle>
                <CardDescription>
                  Generate a simple, personalized plan mapped to the Six Pillars—actionable in minutes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-sky-700" />
                </div>
                <CardTitle className="font-logo">Progress</CardTitle>
                <CardDescription>
                  Track your completion, trends, and capacity building over time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="w-6 h-6 text-violet-700" />
                </div>
                <CardTitle className="font-logo">AI Coaching</CardTitle>
                <CardDescription>
                  Coaching trained on the Rooted Way principles helps you choose aligned practices—science and soul.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                  <Flame className="w-6 h-6 text-amber-700" />
                </div>
                <CardTitle className="font-logo">Streaks</CardTitle>
                <CardDescription>
                  Celebrate consistency with gentle streak tracking that reinforces momentum.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-neutral-700" />
                </div>
                <CardTitle className="font-logo">Peer & Human Support</CardTitle>
                <CardDescription>
                  Connect with peers and optionally integrate human coaching for deeper accountability.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Visual placeholder for flow diagram */}
          <div className="mt-16 rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
            <p className="font-medium text-neutral-700">Flow Diagram Placeholder</p>
            <p className="text-sm text-neutral-500">Linear flow: Daily Pulse → Plan → Actions → Progress → Coaching → Streaks.</p>
            <p className="text-xs text-neutral-400">Recommended dimensions: 1200×500 (12:5)</p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container-custom py-16 md:py-24 bg-neutral-50">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">FAQ</h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">Answers grounded in how ROOTED Companion works today.</p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            <details className="group rounded-lg border border-neutral-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-medium text-neutral-900">What is the Daily Pulse?</span>
                <Activity className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-neutral-600">
                A lightweight morning check that reads readiness and recovery indicators and offers a right‑sized plan for the day.
              </div>
            </details>

            <details className="group rounded-lg border border-neutral-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-medium text-neutral-900">How are plans generated?</span>
                <ListChecks className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-neutral-600">
                Plans combine your wearable signals with the Six Pillars and are refined by AI coaching trained on Rooted Way principles.
              </div>
            </details>

            <details className="group rounded-lg border border-neutral-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-medium text-neutral-900">Do I need a wearable?</span>
                <HeartPulse className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-neutral-600">
                Wearables help personalize your plan. If none is connected, ROOTED prioritizes your onboarding focus to keep you moving.
              </div>
            </details>

            <details className="group rounded-lg border border-neutral-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-medium text-neutral-900">What progress can I track?</span>
                <BarChart3 className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-neutral-600">
                Completion, trends across pillars, and streaks to reinforce momentum without pressure.
              </div>
            </details>

            <details className="group rounded-lg border border-neutral-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-medium text-neutral-900">Is there human coaching?</span>
                <Handshake className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-neutral-600">
                Yes, you can integrate human coaching for accountability and depth alongside AI guidance.
              </div>
            </details>

            <details className="group rounded-lg border border-neutral-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <span className="font-medium text-neutral-900">Which platforms and integrations are supported?</span>
                <Users className="h-5 w-5 text-neutral-400 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-neutral-600">
                Start with Garmin integration for biometrics, with more platforms planned. Peer features and groups are in active development.
              </div>
            </details>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container-custom py-16 md:py-24">
          <div className="text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900">
              Ready to Begin?
            </h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Join others who are building alignment and balance with ROOTED Companion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-3 text-base">
                  Start Free
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                  See How it Works
                </Button>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="container-custom py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-neutral-500">&copy; {new Date().getFullYear()} ROOTED. All rights reserved.</p>
            <div className="flex justify-center gap-6 text-sm text-neutral-500">
              <Link href="/privacy" className="hover:text-neutral-700 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-neutral-700 transition-colors">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-neutral-700 transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
