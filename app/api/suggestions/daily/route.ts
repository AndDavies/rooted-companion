import { NextResponse } from 'next/server';
import { generateDailySuggestion } from '@/lib/llm/suggestionAgent';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate the daily suggestion
    const suggestion = await generateDailySuggestion(user.id);
    
    return NextResponse.json({ 
      suggestion,
      message: 'Daily suggestion generated successfully',
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating daily suggestion:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate suggestion',
        message: 'An error occurred while generating your daily wellness suggestion. Please try again later.'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the most recent suggestion for this user
    const { data: recentSuggestion, error: fetchError } = await supabase
      .from('suggestion_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !recentSuggestion) {
      // No recent suggestion found, generate a new one
      const suggestion = await generateDailySuggestion(user.id);
      return NextResponse.json({ 
        suggestion,
        isNew: true,
        message: 'New daily suggestion generated'
      }, { status: 200 });
    }
    
    // Check if the suggestion is from today
    const suggestionDate = new Date(recentSuggestion.created_at);
    const today = new Date();
    const isToday = suggestionDate.toDateString() === today.toDateString();
    
    if (isToday) {
      // Return existing suggestion from today
      const suggestion = {
        action: recentSuggestion.suggestion.action,
        category: recentSuggestion.suggestion.category,
        rationale: recentSuggestion.suggestion.rationale,
        recoveryScore: recentSuggestion.recovery_score,
        wearableUsed: recentSuggestion.wearable_data !== null
      };
      
      return NextResponse.json({ 
        suggestion,
        isNew: false,
        completed: recentSuggestion.completed,
        message: 'Retrieved today\'s suggestion'
      }, { status: 200 });
    } else {
      // Generate new suggestion for today
      const suggestion = await generateDailySuggestion(user.id);
      return NextResponse.json({ 
        suggestion,
        isNew: true,
        message: 'New daily suggestion generated for today'
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching/generating daily suggestion:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch suggestion',
        message: 'An error occurred while fetching your daily suggestion. Please try again later.'
      }, 
      { status: 500 }
    );
  }
}