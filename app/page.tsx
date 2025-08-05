// LandingPage.tsx – Basic Landing Page for ROOTED Way Companion

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Wind, BookOpen } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
        <h1 className="text-2xl font-logo font-semibold tracking-tight">
          ROOTED Way Companion
        </h1>
        <nav className="flex items-center gap-6">
          <Link href="/about" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            About
          </Link>
          <Link href="/retreats" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
            Retreats
          </Link>
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
                Root down.
                <br />
                Rise strong.
              </h2>
              <p className="text-lg md:text-xl text-neutral-600 leading-relaxed">
                A digital recovery companion blending wearable insights, breathwork, and personalized coaching.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" className="px-8 py-3 text-base">
                    Start Your Reset
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Right Column - Hero Image */}
            <div className="relative">
              <div className="w-full h-[400px] md:h-[500px] relative">
                <Image
                  src="/images/rooted_companion_hero.png"
                  alt="ROOTED Way Companion - Digital recovery companion blending wearable insights, breathwork, and personalized coaching"
                  fill
                  className="object-cover rounded-xl"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container-custom py-16 md:py-24 bg-neutral-50">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">
              Your Recovery Journey
            </h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Three pillars of support to guide your transformation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Biometric Sync */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-6 h-6 text-green-700" />
                </div>
                <CardTitle className="text-xl font-logo">Biometric Sync</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-neutral-600">
                  Integrates with your Garmin to personalize recovery strategies based on your body&apos;s signals.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2: Guided Breathwork */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Wind className="w-6 h-6 text-blue-700" />
                </div>
                <CardTitle className="text-xl font-logo">Guided Breathwork</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-neutral-600">
                  Curated sessions for energy, focus, or calm—tailored to your nervous system needs.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3: ROOTED Recovery Plans */}
            <Card className="border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-amber-700" />
                </div>
                <CardTitle className="text-xl font-logo">ROOTED Recovery Plans</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-neutral-600">
                  Science & soul combined in structured coaching rhythms for lasting transformation.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container-custom py-16 md:py-24">
          <div className="text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900">
              Ready to Begin?
            </h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Join thousands who have transformed their recovery journey with ROOTED Way Companion.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="px-8 py-3 text-base">
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="px-8 py-3 text-base">
                Schedule Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="container-custom py-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} ROOTED. All rights reserved.
            </p>
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
