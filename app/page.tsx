"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
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
  Menu,
  X,
} from "lucide-react"

const WaitlistLauncher = dynamic(() => import("@/components/waitlist/WaitlistLauncher"), { ssr: false })

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Smooth anchor scrolling
    if (typeof document !== "undefined") {
      document.documentElement.style.scrollBehavior = "smooth";
    }

    // Reveal-on-scroll for elements with the 'reveal' class
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.remove("opacity-0", "translate-y-4");
            el.classList.add("opacity-100", "translate-y-0");
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-neutral-200">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/rooted_logo_circle.png"
            alt="ROOTED"
            width={32}
            height={32}
            className="h-[1em] w-auto"
          />
          <h1 className="text-2xl font-logo font-semibold tracking-tight hidden md:block">
            ROOTED Companion
          </h1>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">How it works</a>
          <a href="#pillars" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">Pillars</a>
          <a href="#faq" className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors">FAQ</a>
                      <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("open-waitlist"))}
                className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm bg-[#e0e111] text-neutral-800 hover:bg-[#d4d50f] h-10"
              >
                Join the Waitlist
              </button>
              <Link href="/login">
                <Button variant="outline" size="sm" className="rounded-full px-5 h-10">
                  Log in
                </Button>
              </Link>
            </div>
        </nav>

        {/* Mobile hamburger */}
        <div className="md:hidden">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

              {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-b border-neutral-200">
            <nav className="px-6 py-4 flex flex-col gap-3">
              <a href="#how-it-works" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors">How it works</a>
              <a href="#pillars" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors">Pillars</a>
              <a href="#faq" className="text-sm text-neutral-700 hover:text-neutral-900 transition-colors">FAQ</a>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { window.dispatchEvent(new Event("open-waitlist")); setMobileOpen(false); }}
                className="flex-1 rounded-full bg-[#e0e111] text-neutral-800 hover:bg-[#d4d50f] px-4 py-2 h-10"
              >
                Join the Waitlist
              </button>
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full rounded-full h-10">
                  Log in
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative w-full bg-[#fbf3ec] min-h-[70svh] md:min-h-0">
          {/* Background image shown on md+ only */}
          <div className="hidden md:block relative w-full aspect-[1920/1080]">
            <Image
              src="/images/rooted_hero_bg.png"
              alt="ROOTED hero"
              fill
              priority
              className="object-cover"
            />
          </div>

          {/* Gradient scrim for readability on md+ */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#fbf3ec]/90 via-[#fbf3ec]/40 to-transparent" />

          {/* Copy overlay centered within left half */}
          <div className="md:absolute md:inset-0 z-10">
            <div className="container-custom h-full">
              <div className="h-full grid md:grid-cols-12">
                <div className="col-span-12 md:col-span-6 flex items-center md:items-center justify-center md:justify-center text-center md:text-left px-5 sm:px-6 md:px-0 py-12 md:py-0">
                  <div className="space-y-4 sm:space-y-5 md:space-y-6 max-w-[22rem] sm:max-w-xl md:max-w-2xl">
                    <h2 className="text-[28px] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-logo font-bold leading-snug text-neutral-900">
                      Out of the mind.
                      <br />
                      Into the body.
                    </h2>
                    <p className="text-pretty text-base sm:text-lg md:text-xl text-neutral-700 leading-relaxed">
                    A personalised recovery system for high performers and teams. Reduce stress and burnout with data‑driven daily actions.                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center md:justify-start">
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new Event("open-waitlist"))}
                        className="inline-flex items-center justify-center rounded-full px-5 py-3 text-base sm:px-8 sm:py-4 sm:text-lg bg-[#e0e111] text-neutral-800 hover:bg-[#d4d50f] sm:min-w-[160px] h-12 sm:h-14"
                      >
                        Join Waitlist
                      </button>
                      <a href="#how-it-works" className="inline-flex">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto px-5 py-3 text-base sm:px-8 sm:py-4 sm:text-lg rounded-full sm:min-w-[160px] h-12 sm:h-14">
                          How It Works
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
                {/* Right half left empty for background graphic */}
                <div className="hidden md:block md:col-span-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Observe → Act → Reflect (Animated) - Moved here directly under hero */}
        <section id="oar-flow" aria-label="Observe Act Reflect flow" className="w-full bg-white scroll-mt-24">
          <div className="container-custom py-12 md:py-16">
            <div className="text-center mb-6">
              <h4 className="font-logo text-2xl md:text-3xl font-bold text-neutral-900">Observe → Act → Reflect</h4>
              <p className="text-neutral-600">A simple loop that adapts every day.</p>
            </div>

            <div className="relative mx-auto max-w-5xl h-44 md:h-52 reveal opacity-0 translate-y-4 transition-all duration-700">
              {/* Connector track (gradient) */}
              <div className="oar-track absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 h-2 rounded-full" />

              {/* Moving indicator dot */}
              <div className="oar-dot absolute top-1/2 -translate-y-1/2" />

              {/* Pill bubbles */}
              <div className="absolute inset-0 flex items-center justify-between px-8 md:px-10">
                <div className="oar-bubble bg-[#e5e900] text-neutral-900">
                  <span className="font-medium">Observe</span>
                </div>
                <div className="oar-bubble bg-[#a5a5f8] text-neutral-900">
                  <span className="font-medium">Act</span>
                </div>
                <div className="oar-bubble bg-[#f878cd] text-neutral-900">
                  <span className="font-medium">Reflect</span>
                </div>
              </div>
            </div>
          </div>

          {/* Local styles for the OAR animation */}
          <style jsx>{`
            @media (prefers-reduced-motion: reduce) {
              .oar-bubble { animation: none !important; }
              .oar-dot { animation: none !important; }
            }
            .oar-bubble {
              width: 112px; height: 112px; border-radius: 9999px;
              display: flex; align-items: center; justify-content: center;
              box-shadow: 0 10px 24px rgba(0,0,0,0.08);
              animation: oar-bob 6s ease-in-out infinite;
            }
            .oar-bubble:nth-child(2) { animation-delay: .2s; }
            .oar-bubble:nth-child(3) { animation-delay: .4s; }

            .oar-track {
              background: linear-gradient(90deg, #e5e900, #a5a5f8, #f878cd);
            }

            .oar-dot {
              width: 14px; height: 14px; border-radius: 9999px;
              background: #ffffff; /* no borders/outlines */
              box-shadow: 0 6px 18px rgba(0,0,0,0.22);
              left: 10%;
              animation: oar-travel 7.5s ease-in-out infinite;
            }

            @keyframes oar-bob {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-6px); }
            }

            /* Move the dot across the track and loop */
            @keyframes oar-travel {
              0%   { left: 10%; }
              33%  { left: 50%; }
              66%  { left: 90%; }
              100% { left: 10%; }
            }

            @media (min-width: 768px) {
              .oar-bubble { width: 132px; height: 132px; }
              .oar-dot { width: 16px; height: 16px; }
            }
          `}</style>
        </section>

        {/* How it works - Moved here second */}
        <section id="how-it-works" className="container-custom py-16 md:py-24 scroll-mt-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">How ROOTED Companion works</h3>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              A simple daily rhythm blends wearable signals, behavioral science, and the Rooted Way principles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
                  <HeartPulse className="w-6 h-6 text-rose-700" />
                </div>
                <CardTitle className="font-logo">Daily Pulse</CardTitle>
                <CardDescription>
                   A morning pulse reads readiness and recovery from your wearable to set your day&#39;s tone.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                  <ListChecks className="w-6 h-6 text-teal-700" />
                </div>
                <CardTitle className="font-logo">Plan Generation</CardTitle>
                <CardDescription>
                  Generate a simple, personalized plan mapped to the Six Pillars—actionable in minutes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-3">
                  <BarChart3 className="w-6 h-6 text-sky-700" />
                </div>
                <CardTitle className="font-logo">Progress</CardTitle>
                <CardDescription>
                  Track your completion, trends, and capacity building over time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center mb-3">
                  <Bot className="w-6 h-6 text-violet-700" />
                </div>
                <CardTitle className="font-logo">AI Coaching</CardTitle>
                <CardDescription>
                  Coaching trained on the Rooted Way principles helps you choose aligned practices—science and soul.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                  <Flame className="w-6 h-6 text-amber-700" />
                </div>
                <CardTitle className="font-logo">Streaks</CardTitle>
                <CardDescription>
                  Celebrate consistency with gentle streak tracking that reinforces momentum.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200">
              <CardHeader>
                <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-neutral-700" />
                </div>
                <CardTitle className="font-logo">Peer & Human Support</CardTitle>
                <CardDescription>
                  Connect with peers and optionally integrate human coaching for deeper accountability.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Pillars Section - Moved here third */}
        <section id="pillars" className="container-custom py-16 md:py-24 bg-neutral-50 scroll-mt-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">The Six Pillars of the Rooted Way</h3>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Practices that return you to presence, power, and embodied clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 1. Breath */}
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
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
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                  <Moon className="w-6 h-6 text-indigo-700" />
                </div>
                <CardTitle className="text-xl font-logo">Sleep: A deep way of meditation</CardTitle>
                <CardDescription className="text-neutral-600">
                  Invite rest, don&apos;t force it. Lead with calmer intuition and stamina.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-700"><span className="font-medium">Weekly task:</span> One-hour digital sunset before bed.</p>
              </CardContent>
            </Card>

            {/* 3. Food */}
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
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
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
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
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
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
            <Card className="reveal opacity-0 translate-y-4 transition-all duration-700 border-neutral-200 hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
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
        </section>

        {/* Outcomes / Stats (full-bleed, no margins) */}
        <section id="outcomes" className="w-full bg-white scroll-mt-24">
          <div className="py-16 md:py-24">
            {/* Top row: three bold stats */}
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* 29% stress reduction */}
              <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 border-t border-neutral-300 py-10 md:py-12 text-center reveal opacity-0 translate-y-4 transition-all duration-700 will-change-transform">
                <div className="font-logo text-4xl sm:text-6xl md:text-7xl leading-tight tracking-tight text-neutral-900">29%</div>
                <p className="mt-4 text-lg md:text-xl text-neutral-700">reduction in perceived stress.</p>
              </div>
              {/* 84% consistent habit */}
              <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 border-t border-neutral-300 py-10 md:py-12 text-center reveal opacity-0 translate-y-4 transition-all duration-700 will-change-transform">
                <div className="font-logo text-4xl sm:text-6xl md:text-7xl leading-tight tracking-tight text-neutral-900">84%</div>
                <p className="mt-4 text-lg md:text-xl text-neutral-700">build a consistent mindfulness habit by week 8.</p>
              </div>
              {/* 51% less productivity impairment */}
              <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 border-t border-neutral-300 py-10 md:py-12 text-center reveal opacity-0 translate-y-4 transition-all duration-700 will-change-transform">
                <div className="font-logo text-4xl sm:text-6xl md:text-7xl leading-tight tracking-tight text-neutral-900">51%</div>
                <p className="mt-4 text-lg md:text-xl text-neutral-700">less productivity impairment.</p>
              </div>
            </div>

            {/* Second row: two bold stats */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* 25% lower burnout risk */}
              <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 border-t border-neutral-300 py-10 md:py-12 text-center reveal opacity-0 translate-y-4 transition-all duration-700 will-change-transform">
                <div className="font-logo text-4xl sm:text-6xl md:text-7xl leading-tight tracking-tight text-neutral-900">25%</div>
                <p className="mt-4 text-lg md:text-xl text-neutral-700">lower burnout risk.</p>
              </div>
              {/* 20% lower mental-health risk */}
              <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-36 border-t border-neutral-300 py-10 md:py-12 text-center reveal opacity-0 translate-y-4 transition-all duration-700 will-change-transform">
                <div className="font-logo text-4xl sm:text-6xl md:text-7xl leading-tight tracking-tight text-neutral-900">20%</div>
                <p className="mt-4 text-lg md:text-xl text-neutral-700">lower mental‑health risk.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why ROOTED is different */}
        <section id="difference" className="relative w-full overflow-hidden bg-neutral-50 scroll-mt-24">
          {/* Animated accent line */}
          <div className="diff-accent absolute inset-x-0 top-0 h-[2px]" />

          {/* Soft ambient glows (no outlines) */}
          <div aria-hidden className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(229,233,0,.25), transparent 70%)" }} />
          <div aria-hidden className="pointer-events-none absolute top-16 -right-10 h-80 w-80 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(165,165,248,.25), transparent 70%)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-20 left-1/3 h-72 w-72 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(248,120,205,.22), transparent 70%)" }} />

          <div className="container-custom py-16 md:py-24">
            <div className="text-center mb-12 reveal opacity-0 translate-y-4 transition-all duration-700">
              <h3 className="text-3xl md:text-4xl font-logo font-bold text-neutral-900 mb-4">Whole‑person recovery. Not another meditation app.</h3>
              <p className="text-lg text-neutral-600 max-w-3xl mx-auto">Personalised from your wearable signals and Wellness Profile, then mapped to complete programs across the Six Pillars: Breath, Sleep, Food, Movement, Focus, and Joy.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-12">
              {/* Feature Highlights */}
              <div className="md:col-span-7">
                <div className="feature-card relative rounded-2xl bg-white/80 backdrop-blur p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.06)] reveal opacity-0 translate-y-4 transition-all duration-700">
                  <ul className="space-y-5 text-neutral-800">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-3.5 w-3.5 rounded-full" style={{ background: "linear-gradient(135deg,#e5e900,#a5a5f8)" }} />
                      <span><span className="font-semibold">Personalisation & AI</span> — Wearable data + your Wellness Profile shape each day’s plan.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-3.5 w-3.5 rounded-full" style={{ background: "linear-gradient(135deg,#a5a5f8,#f878cd)" }} />
                      <span><span className="font-semibold">Programs, not one‑offs</span> — Adaptive protocols across all Six Pillars.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-3.5 w-3.5 rounded-full" style={{ background: "linear-gradient(135deg,#f878cd,#e5e900)" }} />
                      <span><span className="font-semibold">Human & AI coaching on‑demand</span> — Quiet, evidence‑based guidance when you need it.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 inline-flex h-3.5 w-3.5 rounded-full" style={{ background: "linear-gradient(135deg,#e5e900,#f878cd)" }} />
                      <span><span className="font-semibold">Recovery, not tracking</span> — We turn signals into simple daily actions—no noise.</span>
                    </li>
                  </ul>

                  {/* Pillar chips */}
                  <div className="mt-7 flex flex-wrap gap-2">
                    {[
                      {label:'Breath', bg:'#e5e900'},
                      {label:'Sleep', bg:'#a5a5f8'},
                      {label:'Food', bg:'#f878cd'},
                      {label:'Movement', bg:'#e5e900'},
                      {label:'Focus', bg:'#a5a5f8'},
                      {label:'Joy', bg:'#f878cd'}
                    ].map((p) => (
                      <span key={p.label} className="px-3 py-1 rounded-full text-sm font-medium text-neutral-900/90 shadow-sm" style={{ background: `${p.bg}33` }}>{p.label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Soft Comparison (no pot-shots) */}
              <div className="md:col-span-5">
                <div className="compare-card relative rounded-2xl bg-white/80 backdrop-blur p-6 md:p-8 shadow-[0_20px_40px_rgba(0,0,0,0.06)] reveal opacity-0 translate-y-4 transition-all duration-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-neutral-500 uppercase tracking-wide mb-2">Most apps</div>
                      <ul className="space-y-2 text-neutral-700">
                        <li>One or two modalities</li>
                        <li>Generic content</li>
                        <li>Tracking overload</li>
                      </ul>
                    </div>
                    <div>
                      <div className="text-neutral-900 font-semibold uppercase tracking-wide mb-2">ROOTED</div>
                      <ul className="space-y-2 text-neutral-900">
                        <li>Six‑pillar programs</li>
                        <li>Daily, adaptive actions</li>
                        <li>Human + AI support</li>
                      </ul>
                    </div>
                  </div>

                  {/* Decorative gradient divider */}
                  <div className="mt-6 h-[2px] w-full rounded-full" style={{ background: "linear-gradient(90deg,#e5e900,#a5a5f8,#f878cd)" }} />

                  <p className="mt-6 text-neutral-700">We build a holistic, adaptive plan across all six pillars—so change sticks.</p>
                </div>
              </div>
            </div>

            {/* Quotes / Trust hooks */}
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="reveal opacity-0 translate-y-4 transition-all duration-700 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur p-5 text-center shadow-sm hover:shadow-md"> 
                <p className="text-neutral-800 font-medium">“One small action a day can restore your balance.”</p>
              </div>
              <div className="reveal opacity-0 translate-y-4 transition-all duration-700 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur p-5 text-center shadow-sm hover:shadow-md"> 
                <p className="text-neutral-800 font-medium">“Your heart is telling you something. We help you listen.”</p>
              </div>
              <div className="reveal opacity-0 translate-y-4 transition-all duration-700 rounded-xl border border-neutral-200 bg-white/80 backdrop-blur p-5 text-center shadow-sm hover:shadow-md"> 
                <p className="text-neutral-800 font-medium">“Recovery, not tracking. Support, not noise.”</p>
              </div>
            </div>
          </div>

          {/* Local styles */}
          <style jsx>{`
            .diff-accent { 
              background: linear-gradient(90deg, #e5e900, #a5a5f8, #f878cd, #a5a5f8, #e5e900);
              background-size: 200% 100%;
              animation: diff-slide 12s linear infinite;
            }
            @keyframes diff-slide { 0% { background-position: 0% 50%; } 100% { background-position: 100% 50%; } }
          `}</style>
        </section>

        {/* CTA Section - update buttons here too */}
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
                <Button size="lg" className="px-8 py-3 text-base rounded-full bg-[#e0e111] text-neutral-700 hover:bg-[#d4d50f] h-14">
                  Start Free
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="px-8 py-3 text-base rounded-full h-14">
                  See How it Works
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="container-custom py-16 md:py-24 bg-neutral-50 scroll-mt-24">
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
      </main>

      {/* Waitlist UI (dialog/sheet) mounted at root */}
      <WaitlistLauncher />

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
