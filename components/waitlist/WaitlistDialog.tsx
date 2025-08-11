"use client"

import { useEffect, useRef } from "react"
import { WaitlistForm } from "./WaitlistForm"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaitlistDialog({ open, onOpenChange }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false)
    }
    if (open) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
      // Focus trap: focus first field
      const input = dialogRef.current?.querySelector<HTMLInputElement>("#wl-email")
      input?.focus()
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div aria-modal className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="waitlist-title"
        className="relative z-[61] w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)]"
      >
        <div className="mb-4">
          <h2 id="waitlist-title" className="font-logo text-2xl font-bold text-neutral-900">Join Waitlist</h2>
        </div>
        <WaitlistForm onSuccess={() => {}} />
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 rounded-full px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
          aria-label="Close"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default WaitlistDialog


