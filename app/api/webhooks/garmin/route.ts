import { NextRequest, NextResponse } from 'next/server'
// import { createClient } from '@/utils/supabase/server' // TODO: Implement webhook processing

export async function POST(request: NextRequest) {
  // const supabase = await createClient() // TODO: Implement webhook processing
  
  try {
    const payload = await request.json()
    
    // Process Garmin webhook data here
    // This is a simplified version - you'll want to add proper data processing
    // based on the Garmin webhook payload structure
    
    console.log('Garmin webhook received:', payload)
    
    // TODO: Implement proper webhook processing
    // - Validate webhook signature
    // - Extract user data and metrics
    // - Store in wearable_data table
    // - Trigger any necessary business logic
    
    return new NextResponse('ok', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('error', { status: 500 })
  }
} 