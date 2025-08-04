import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  const state = generateState()

  // Store in oauth_pkce_states (expires in 10 minutes)
  await supabase.from('oauth_pkce_states').insert({
    user_id: user.id,
    state,
    code_verifier: codeVerifier,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  const params = new URLSearchParams({
    client_id: process.env.GARMIN_CLIENT_ID!,
    response_type: 'code',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations/garmin-callback`,
    state,
  })

  const redirect = `https://connect.garmin.com/oauth2Confirm?${params.toString()}`

  return NextResponse.redirect(redirect)
} 