"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import WaitlistDialog from "./WaitlistDialog"
import WaitlistSheet from "./WaitlistSheet"

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const set = () => setIsDesktop(mq.matches)
    set()
    mq.addEventListener("change", set)
    return () => mq.removeEventListener("change", set)
  }, [])
  return isDesktop
}

export default function WaitlistLauncher() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const isDesktop = useIsDesktop()
  const [open, setOpen] = useState(false)

  const hasJoinParam = useMemo(() => params?.get("join") === "1", [params])

  // Open on mount if ?join=1
  useEffect(() => {
    if (hasJoinParam) setOpen(true)
  }, [hasJoinParam])

  // Keep URL in sync (shallow push when opening from UI)
  function openUI() {
    const next = new URL(window.location.href)
    next.searchParams.set("join", "1")
    router.push(`${pathname}?${next.searchParams.toString()}`, { scroll: false })
    setOpen(true)
  }

  function closeUI() {
    setOpen(false)
    router.back()
  }

  // Expose open method via DOM event for interop if needed
  useEffect(() => {
    function onOpen(e: Event) {
      e.preventDefault()
      openUI()
    }
    window.addEventListener("open-waitlist", onOpen)
    return () => window.removeEventListener("open-waitlist", onOpen)
  }, [])

  return (
    <>
      {isDesktop ? (
        <WaitlistDialog open={open} onOpenChange={(v) => (v ? openUI() : closeUI())} />
      ) : (
        <WaitlistSheet open={open} onOpenChange={(v) => (v ? openUI() : closeUI())} />
      )}
    </>
  )
}


