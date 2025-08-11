"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type WaitlistFormProps = {
  onSuccess?: () => void
  requireConsent?: boolean
}

export function WaitlistForm({ onSuccess, requireConsent = false }: WaitlistFormProps) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)
  const honeypotRef = useRef<HTMLInputElement | null>(null)

  const emailValid = useMemo(() => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), [email])
  const canSubmit = useMemo(() => {
    if (!emailValid) return false
    if (requireConsent && !consent) return false
    return true
  }, [emailValid, requireConsent, consent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!canSubmit) return
    setSubmitting(true)

    try {
      const company = honeypotRef.current?.value || ""
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined, consent, company }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (res.ok && data.ok) {
        setSuccess(true)
        onSuccess?.()
      } else {
        setError(data.error || "Something went wrong")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white/80 backdrop-blur p-4 sm:p-5 text-center">
        <div className="font-medium text-neutral-900">You’re on the list—check your email to confirm.</div>
        <div className="mt-1 text-sm text-neutral-600">If it’s not there, check spam/promotions.</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
      <div className="grid gap-2">
        <label htmlFor="wl-email" className="sr-only">Email</label>
        <Input
          id="wl-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-invalid={!emailValid}
          aria-describedby="wl-email-help"
          className="h-11 rounded-lg"
        />
        {!emailValid && email.length > 0 && (
          <p id="wl-email-help" className="text-sm text-red-600">Please enter a valid email.</p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor="wl-name" className="sr-only">Name</label>
        <Input
          id="wl-name"
          type="text"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 80))}
          className="h-11 rounded-lg"
        />
      </div>

      {/* Honeypot */}
      <input ref={honeypotRef} type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" />

      {requireConsent && (
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          I agree to receive occasional emails.
        </label>
      )}

      {error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center sm:justify-start gap-3">
        <Button
          type="submit"
          disabled={!canSubmit || submitting}
          className="rounded-full px-6 py-2.5 sm:px-8 sm:py-3 text-base bg-[#e0e111] text-neutral-800 hover:bg-[#d4d50f] disabled:opacity-60"
        >
          {submitting ? "Joining…" : "Join Waitlist"}
        </Button>
      </div>
    </form>
  )
}

export default WaitlistForm


