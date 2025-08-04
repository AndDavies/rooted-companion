import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard/settings/integrations?error=missing_params', request.url))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Retrieve PKCE entry
  const { data: pkceRows, error: pkceErr } = await supabase
    .from('oauth_pkce_states')
    .select('*')
    .eq('state', state)
    .single()

  if (pkceErr || !pkceRows) {
    return NextResponse.redirect(new URL('/dashboard/settings/integrations?error=invalid_state', request.url))
  }

  const codeVerifier = pkceRows.code_verifier as string

  // Exchange code for tokens
  const tokenResp = await fetch('https://connectapi.garmin.com/di-oauth2-service/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GARMIN_CLIENT_ID!,
      client_secret: process.env.GARMIN_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations/garmin-callback`,
    }),
  })

  if (!tokenResp.ok) {
    return NextResponse.redirect(new URL('/dashboard/settings/integrations?error=token', request.url))
  }

  const tokenJson = await tokenResp.json()
  const {
    access_token,
    refresh_token,
    expires_in,
    refresh_token_expires_in,
    scope,
  } = tokenJson as {
    access_token: string
    refresh_token: string
    expires_in: number
    refresh_token_expires_in?: number
    scope?: string
  }

  // Get Garmin UserId
  const userResp = await fetch('https://apis.garmin.com/wellness-api/rest/user/id', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  if (!userResp.ok) {
    return NextResponse.redirect(new URL('/dashboard/settings/integrations?error=user', request.url))
  }
  const { userId } = await userResp.json() as { userId: string }

  // Upsert wearable connection
  await supabase
    .from('wearable_connections')
    .upsert({
      user_id: user.id,
      wearable_type: 'garmin',
      wearable_user_id: userId,
      access_token,
      refresh_token,
      access_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      refresh_token_expires_at: refresh_token_expires_in
        ? new Date(Date.now() + refresh_token_expires_in * 1000).toISOString()
        : null,
      scopes: scope ? (scope as string).split(' ') : null,
    })

  // Delete pkce row
  await supabase.from('oauth_pkce_states').delete().eq('state', state)

  return NextResponse.redirect(new URL('/dashboard/settings/integrations', request.url))
} 