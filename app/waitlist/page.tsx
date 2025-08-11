"use client"

import Link from "next/link"
import { useState } from "react"
import { WaitlistForm } from "@/components/waitlist/WaitlistForm"
import { Button } from "@/components/ui/button"

export default function WaitlistPage() {
  const [done, setDone] = useState(false)
  return (
    <main className="min-h-[70svh] bg-white">
      <div className="container-custom py-16 md:py-24">
        <div className="mx-auto max-w-lg rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur p-6 shadow-sm">
          <h1 className="font-logo text-3xl font-bold text-neutral-900 text-center">Join Waitlist</h1>
          <p className="mt-2 text-center text-neutral-600">Be first to know when ROOTED Companion opens.</p>
          <div className="mt-6">
            <WaitlistForm onSuccess={() => setDone(true)} />
          </div>
          {done && (
            <div className="mt-6 flex justify-center">
              <Link href="/">
                <Button className="rounded-full px-6 bg-[#e0e111] text-neutral-800 hover:bg-[#d4d50f]">Back to home</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}


