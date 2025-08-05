import { NextRequest, NextResponse } from 'next/server';
import { markSuggestionCompleted } from '@/lib/llm/suggestionAgent';
import { createClientForActions } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    const { suggestionId } = body;
    
    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' }, 
        { status: 400 }
      );
    }
    
    // Verify that the suggestion belongs to the current user
    const { data: suggestion, error: fetchError } = await supabase
      .from('suggestion_logs')
      .select('user_id, completed')
      .eq('id', suggestionId)
      .single();
    
    if (fetchError || !suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' }, 
        { status: 404 }
      );
    }
    
    if (suggestion.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this suggestion' }, 
        { status: 403 }
      );
    }
    
    if (suggestion.completed) {
      return NextResponse.json(
        { 
          message: 'Suggestion already marked as completed',
          completed: true 
        }, 
        { status: 200 }
      );
    }
    
    // Mark the suggestion as completed
    await markSuggestionCompleted(suggestionId);
    
    return NextResponse.json(
      { 
        message: 'Suggestion marked as completed successfully',
        completed: true,
        suggestionId 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking suggestion as completed:', error);
    return NextResponse.json(
      { 
        error: 'Failed to mark suggestion as completed',
        message: 'An error occurred while updating your suggestion. Please try again later.'
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get the current user from Supabase auth
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get completion stats for the user
    const { data: stats, error: statsError } = await supabase
      .from('suggestion_logs')
      .select('completed, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30); // Last 30 suggestions
    
    if (statsError) {
      console.error('Error fetching completion stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch completion stats' }, 
        { status: 500 }
      );
    }
    
    const totalSuggestions = stats?.length || 0;
    const completedSuggestions = stats?.filter(s => s.completed).length || 0;
    const completionRate = totalSuggestions > 0 ? (completedSuggestions / totalSuggestions) * 100 : 0;
    
    // Calculate streak (consecutive days with completed suggestions)
    let currentStreak = 0;
    if (stats && stats.length > 0) {
      for (const suggestion of stats) {
        if (suggestion.completed) {
          currentStreak++;
        } else {
          break;
        }
      }
    }
    
    return NextResponse.json({
      stats: {
        totalSuggestions,
        completedSuggestions,
        completionRate: Math.round(completionRate),
        currentStreak
      },
      message: 'Completion stats retrieved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching completion stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch completion stats',
        message: 'An error occurred while fetching your completion statistics.'
      }, 
      { status: 500 }
    );
  }
}