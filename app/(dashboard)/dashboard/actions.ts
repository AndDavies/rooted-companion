'use server';

import { createClientForActions } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/utils/supabase/admin';

export async function getDailySuggestion() {
  try {
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/login');
    }

    // Query directly from server (better than API call from server action)
    const { data: recentSuggestion, error: fetchError } = await supabaseAdmin
      .from('suggestion_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching suggestion:', fetchError);
      return null;
    }

    // Check if suggestion is from today
    if (recentSuggestion && recentSuggestion.created_at) {
      const suggestionDate = new Date(recentSuggestion.created_at);
      const today = new Date();
      const isToday = suggestionDate.toDateString() === today.toDateString();

      if (isToday && recentSuggestion.suggestion) {
        const suggestion = recentSuggestion.suggestion as {
          action: string;
          category: string;
          rationale: string;
        };
        return {
          id: recentSuggestion.id,
          action: suggestion.action,
          category: suggestion.category,
          rationale: suggestion.rationale,
          recoveryScore: recentSuggestion.recovery_score,
          completed: recentSuggestion.completed,
          wearableUsed: recentSuggestion.wearable_data !== null,
          createdAt: recentSuggestion.created_at
        };
      }
    }

    // If no suggestion for today, we'll need to generate one
    // For now, return null and the component will handle generating one
    return null;
  } catch (error) {
    console.error('Error getting daily suggestion:', error);
    return null;
  }
}

export async function markSuggestionComplete(suggestionId: string) {
  try {
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/login');
    }

    // Verify that the suggestion belongs to the current user
    const { data: suggestion, error: fetchError } = await supabaseAdmin
      .from('suggestion_logs')
      .select('user_id, completed')
      .eq('id', suggestionId)
      .single();

    if (fetchError || !suggestion) {
      throw new Error('Suggestion not found');
    }

    if (suggestion.user_id !== user.id) {
      throw new Error('Unauthorized to modify this suggestion');
    }

    if (suggestion.completed) {
      return { success: true, message: 'Already completed' };
    }

    // Mark as completed
    const { error: updateError } = await supabaseAdmin
      .from('suggestion_logs')
      .update({ completed: true })
      .eq('id', suggestionId);

    if (updateError) {
      throw new Error('Failed to update suggestion');
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Suggestion marked as completed' };
  } catch (error) {
    console.error('Error marking suggestion complete:', error);
    return { success: false, message: 'Failed to mark suggestion as complete' };
  }
}

export async function submitMoodReflection(suggestionId: string, moodEmoji: string, moodText: string) {
  try {
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/login');
    }

    // Verify that the suggestion belongs to the current user
    const { data: suggestion, error: fetchError } = await supabaseAdmin
      .from('suggestion_logs')
      .select('user_id')
      .eq('id', suggestionId)
      .single();

    if (fetchError || !suggestion) {
      throw new Error('Suggestion not found');
    }

    if (suggestion.user_id !== user.id) {
      throw new Error('Unauthorized to submit reflection for this suggestion');
    }

    // Check if reflection already exists
    const { data: existingReflection } = await supabaseAdmin
      .from('mood_reflections')
      .select('id')
      .eq('suggestion_id', suggestionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingReflection) {
      // Update existing reflection
      const { error: updateError } = await supabaseAdmin
        .from('mood_reflections')
        .update({
          mood_emoji: moodEmoji,
          mood_text: moodText
        })
        .eq('id', existingReflection.id);

      if (updateError) {
        throw new Error('Failed to update mood reflection');
      }
    } else {
      // Insert new reflection
      const { error: insertError } = await supabaseAdmin
        .from('mood_reflections')
        .insert({
          user_id: user.id,
          suggestion_id: suggestionId,
          mood_emoji: moodEmoji,
          mood_text: moodText
        });

      if (insertError) {
        throw new Error('Failed to insert mood reflection');
      }
    }

    revalidatePath('/dashboard');
    return { success: true, message: 'Mood reflection submitted successfully' };
  } catch (error) {
    console.error('Error submitting mood reflection:', error);
    return { success: false, message: 'Failed to submit mood reflection' };
  }
}

export async function generateNewSuggestion() {
  try {
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/login');
    }

    // Import and call the suggestion agent
    const { generateDailySuggestion } = await import('@/lib/llm/suggestionAgent');
    const suggestion = await generateDailySuggestion(user.id);

    // Get the suggestion ID from the database (it should have been inserted by the agent)
    const { data: newSuggestion } = await supabaseAdmin
      .from('suggestion_logs')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    revalidatePath('/dashboard');
    
    return {
      success: true,
      suggestion: {
        id: newSuggestion?.id || null,
        ...suggestion
      }
    };
  } catch (error) {
    console.error('Error generating new suggestion:', error);
    return { success: false, message: 'Failed to generate new suggestion' };
  }
}

export async function getMoodReflection(suggestionId: string) {
  try {
    const supabase = await createClientForActions();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      redirect('/login');
    }

    const { data: reflection, error: fetchError } = await supabaseAdmin
      .from('mood_reflections')
      .select('mood_emoji, mood_text')
      .eq('suggestion_id', suggestionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching mood reflection:', fetchError);
      return null;
    }

    return reflection;
  } catch (error) {
    console.error('Error getting mood reflection:', error);
    return null;
  }
}