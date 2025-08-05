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
    // In a real app, you'd handle this more gracefully
    console.error('Login error:', error.message)
    redirect('/login?error=Invalid credentials')
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClientForActions()
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ 
    email, 
    password 
  })

  if (error) {
    console.error('Signup error:', error.message)
    redirect('/login?error=Failed to create account')
  }

  redirect('/dashboard')
}