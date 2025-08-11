import { NextResponse } from "next/server"

type RateEntry = { count: number; ts: number }

const RATE_WINDOW_MS = 5 * 60 * 1000
const RATE_MAX = 5
const rateBucket = new Map<string, RateEntry>()

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

async function addSubscriberToMailerLite(
  email: string,
  name: string | undefined,
  groupId: string,
  apiKey: string
) {
  const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      fields: name ? { name } : undefined,
      groups: [groupId],
    }),
  })

  if (res.ok) return { ok: true as const }

  // Handle already exists but may not be in the group
  if (res.status === 409 || res.status === 422) {
    // Try to find the subscriber by email and ensure group assignment
    try {
      const lookup = await fetch(
        `https://connect.mailerlite.com/api/subscribers?filter[email]=${encodeURIComponent(email)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      )

      if (lookup.ok) {
        const data = (await lookup.json()) as { data?: Array<{ id: string }> }
        const id = data?.data?.[0]?.id
        if (id) {
          // Attempt to add subscriber to the target group (best-effort)
          const addToGroup = await fetch(
            `https://connect.mailerlite.com/api/subscribers/${id}/groups`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ groups: [groupId] }),
            }
          )
          // Regardless of this call outcome, treat as success for UX
          if (addToGroup.ok || addToGroup.status >= 400) {
            return { ok: true as const }
          }
        }
      }
    } catch {
      // Ignore and treat as success
    }
    return { ok: true as const }
  }

  const errText = await res.text()
  return { ok: false as const, error: errText || "MailerLite error" }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { ok: false, error: "Invalid content type" },
        { status: 400 }
      )
    }

    const body = (await req.json()) as {
      email?: string
      name?: string
      consent?: boolean
      utm?: Record<string, string>
      company?: string // honeypot
    }

    const { email, name, company } = body || {}

    // Honeypot check
    if (company && company.trim() !== "") {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { ok: false, error: "Invalid email" },
        { status: 400 }
      )
    }

    // Basic IP rate limit
    const ipHeader = req.headers.get("x-forwarded-for") || ""
    const ip = ipHeader.split(",")[0]?.trim() || "unknown"
    const now = Date.now()
    const entry = rateBucket.get(ip) || { count: 0, ts: now }
    if (now - entry.ts > RATE_WINDOW_MS) {
      entry.count = 0
      entry.ts = now
    }
    entry.count += 1
    rateBucket.set(ip, entry)
    if (entry.count > RATE_MAX) {
      return NextResponse.json(
        { ok: false, error: "Too many requests" },
        { status: 429 }
      )
    }

    const apiKey = process.env.MAILERLITE_API_KEY
    const groupId = process.env.MAILERLITE_GROUP_ID
    if (!apiKey || !groupId) {
      return NextResponse.json(
        { ok: false, error: "Server not configured" },
        { status: 500 }
      )
    }

    const result = await addSubscriberToMailerLite(email, name, groupId, apiKey)
    if (result.ok) return NextResponse.json({ ok: true })

    // Invalid email or other ML error
    return NextResponse.json(
      { ok: false, error: result.error || "MailerLite error" },
      { status: 400 }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}


