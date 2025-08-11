"use client"

import { useEffect, useRef } from "react"
import { WaitlistForm } from "./WaitlistForm"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WaitlistSheet({ open, onOpenChange }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      const input = rootRef.current?.querySelector<HTMLInputElement>("#wl-email")
      input?.focus()
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div ref={rootRef} className="fixed inset-0 z-[60] bg-white pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="sticky top-0 z-[61] flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-white">
        <div className="font-logo text-lg font-semibold text-neutral-900">Join Waitlist</div>
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-full px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
          aria-label="Close"
        >
          Close
        </button>
      </div>
      <div className="px-4 py-4 overflow-y-auto h-[calc(100%-56px)]">
        <WaitlistForm onSuccess={() => {}} />
      </div>
    </div>
  )
}

export default WaitlistSheet


