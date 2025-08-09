'use server'

import { createClientForActions } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClientForActions()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  })

  if (error) {
    console.error('Login error:', error.message)
    // Handle unverified email with a message-based check (no 'any' casts)
    if (/email/i.test(error.message) && /confirm/i.test(error.message)) {
      redirect('/login?error=Please verify your email before logging in.')
    }
    redirect('/login?error=Invalid credentials')
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClientForActions()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const full_name = (formData.get('name') as string) || null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''

  const { error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: { 
      data: { full_name },
      emailRedirectTo: siteUrl ? `${siteUrl}/login?notice=${encodeURIComponent('Email verified. Please sign in.')}` : undefined
    }
  })

  if (error) {
    console.error('Signup error:', error.message)
    // Handle duplicate email gracefully without 'any'
    if (/already/i.test(error.message)) {
      redirect(`/login?error=${encodeURIComponent('An account with that email already exists. Please sign in.')}`)
    }
    redirect(`/signup?error=${encodeURIComponent('Failed to create account')}`)
  }

  // Email confirmation is required; inform user to check email
  redirect(`/login?notice=${encodeURIComponent('Check your email to verify your account.')}`)
}