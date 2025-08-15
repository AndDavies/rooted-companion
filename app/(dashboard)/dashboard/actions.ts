'use server';

import { createClientForActions } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/utils/supabase/admin';
import { getOrCreateTodaysSuggestion } from '@/lib/suggestions/service';

export async function getDailySuggestion({ autoGenerate = true }: { autoGenerate?: boolean } = {}) {
  const res = await getOrCreateTodaysSuggestion({ forceCreate: autoGenerate, source: 'auto' });
  return res;
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
  const res = await getOrCreateTodaysSuggestion({ forceCreate: true, source: 'manual' });
  revalidatePath('/dashboard');
  return res;
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

// Read-only plan task summary (UTC today)
export async function getTodaysPlanTaskSummary() {
  try {
    const supabase = await createClientForActions();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { success: false, error: { code: 'UNAUTH', stage: 'plan_fetch', message: 'Not signed in' } };
    }

    const todayUtc = new Date().toISOString().slice(0, 10);

    // Align with our existing plan API shapes; fall back to simple fields
    const { data, error } = await supabase
      .from('recovery_plan_tasks')
    .select('id, title, date, completed, user_id')
      .eq('user_id', user.id)
      .eq('date', todayUtc)
      .eq('completed', false)
      .order('date', { ascending: true })
      .limit(1);

    if (error) {
      return { success: false, error: { code: 'DB_ERROR', stage: 'plan_fetch', message: error.message } };
    }

    if (!data || data.length === 0) {
      return { success: true, hasTask: false, code: 'NO_PLAN_TASK' } as const;
    }

    const task = data[0] as { id: string; title: string; date: string; completed: boolean };
    return {
      success: true,
      hasTask: true,
      task: { id: task.id, title: task.title, dueDate: task.date, status: task.completed ? 'completed' : 'pending' },
    };
  } catch (e: unknown) {
    const err = e as { message?: string };
    return { success: false, error: { code: 'UNKNOWN', stage: 'plan_fetch', message: err?.message || 'Unknown error' } };
  }
}

// KB health check (lightweight)
export async function getKbHealth() {
  const supabase = await createClientForActions();
  const { error: err1 } = await supabase
    .from('wellness_kb_docs')
    .select('id', { count: 'exact', head: true });

  let rpcOk = true;
  try {
    await supabase.rpc('kb_match_documents', {
      query_embedding: Array(1536).fill(0),
      match_count: 1,
      min_score: 0.99,
    });
  } catch {
    rpcOk = false;
  }

  return {
    success: !err1 && rpcOk,
    docsCountKnown: null,
    rpcOk,
    error: err1 ? { code: 'KB_HEALTH_DB', message: err1.message } : rpcOk ? null : { code: 'KB_HEALTH_RPC', message: 'RPC call failed' },
  } as const;
}