import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { toUserLocalDate } from "@/lib/db/dates";
import { tryAcquireUserDayLock, releaseUserDayLock } from "@/lib/db/locks";
import { buildSpec, decideDataUsed, SuggestionSpec, Trend, Focus } from "@/lib/suggestions/spec";
import { computeProgression, HistoryPoint } from "@/lib/suggestions/progression";

// Types
export type SuggestionPayload = {
  action: string;
  category: 'movement' | 'breathwork' | 'mindset' | 'nutrition';
  rationale: string;
  evidence_note?: string;
  recoveryScore: number;
  wearableUsed: boolean;
};

type BiometricData = {
  hrv_rmssd?: number;
  heart_rate_resting?: number;
  sleep_total?: number;
  stress_avg?: number;
  dataPoints: number;
  timeRange: string;
};

// Helper function to calculate recovery score based on biometric data
function calculateRecoveryScore(data: BiometricData): number {
  if (data.dataPoints === 0) return 50; // Default score when no data

  let score = 50; // Start with baseline
  
  // HRV contribution (30% weight) - higher is better
  if (data.hrv_rmssd !== undefined) {
    // Typical ranges: Poor: <20, Good: 20-50, Excellent: >50
    if (data.hrv_rmssd > 50) score += 15;
    else if (data.hrv_rmssd > 30) score += 8;
    else if (data.hrv_rmssd > 20) score += 3;
    else score -= 10;
  }

  // Resting Heart Rate contribution (25% weight) - lower is generally better
  if (data.heart_rate_resting !== undefined) {
    // Typical ranges: Excellent: <60, Good: 60-70, Average: 70-80, Poor: >80
    if (data.heart_rate_resting < 60) score += 12;
    else if (data.heart_rate_resting < 70) score += 6;
    else if (data.heart_rate_resting < 80) score += 2;
    else score -= 8;
  }

  // Sleep contribution (30% weight) - more is generally better (6-9 hours optimal)
  if (data.sleep_total !== undefined) {
    const sleepHours = data.sleep_total / 3600; // Convert seconds to hours
    if (sleepHours >= 7 && sleepHours <= 9) score += 15;
    else if (sleepHours >= 6 && sleepHours <= 10) score += 8;
    else if (sleepHours >= 5 && sleepHours <= 11) score += 3;
    else score -= 10;
  }

  // Stress contribution (15% weight) - lower is better
  if (data.stress_avg !== undefined) {
    // Assuming stress scale 0-100, lower is better
    if (data.stress_avg < 20) score += 8;
    else if (data.stress_avg < 40) score += 4;
    else if (data.stress_avg < 60) score += 1;
    else score -= 5;
  }

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper function to load recent biometric data
async function loadRecentBiometricData(userId: string): Promise<BiometricData> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // Query wearable data through the connection relationship
    const { data: wearableData, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        metric_type,
        value,
        timestamp,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .in('metric_type', ['hrv_rmssd', 'heart_rate_resting', 'sleep_total', 'stress_avg'])
      .gte('timestamp', fortyEightHoursAgo.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error loading biometric data:', error);
      return { dataPoints: 0, timeRange: '48h' };
    }

    if (!wearableData || wearableData.length === 0) {
      return { dataPoints: 0, timeRange: '48h' };
    }

    // Group data by metric type and get the most recent values
    const metricData: Record<string, number[]> = {};

    wearableData.forEach((row) => {
      if (!metricData[row.metric_type]) {
        metricData[row.metric_type] = [];
      }
      metricData[row.metric_type].push(Number(row.value));
    });

    // Calculate averages for each metric
    const result: BiometricData = {
      dataPoints: wearableData.length,
      timeRange: '48h'
    };

    // Calculate averages for each metric using all available 48h data

    Object.entries(metricData).forEach(([metricType, values]) => {
      if (values.length > 0) {
        // For sleep, use the latest value rather than average
        if (metricType === 'sleep_total') {
          result.sleep_total = values[0];
        } else if (metricType === 'hrv_rmssd') {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          result.hrv_rmssd = avg;
        } else if (metricType === 'heart_rate_resting') {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          result.heart_rate_resting = avg;
        } else if (metricType === 'stress_avg') {
          const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
          result.stress_avg = avg;
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error in loadRecentBiometricData:', error);
    return { dataPoints: 0, timeRange: '48h' };
  }
}

// Spec-based fallback synthesis
function synthesizeFromSpec(spec: SuggestionSpec, recoveryScore: number): SuggestionPayload {
  const theme = spec.theme;
  const minutes = spec.durationMin;
  const intensity = spec.intensity;

  let action = "Take 10 minutes for calm breathing";
  let rationale = "Gentle breath focus supports your nervous system and recovery.";
  let evidence_note = "Long exhale supports vagal tone";
  const category: SuggestionPayload['category'] = theme;

  if (theme === 'breathwork') {
    action = `Spend ${minutes} minutes on extended-exhale breathing (inhale 4, exhale 6–8).`;
    rationale = intensity === 'downregulate'
      ? "Longer exhales bias the parasympathetic system to reduce arousal and help you settle."
      : "Breath pacing steadies heart rate variability and supports recovery.";
    evidence_note = "Long exhale supports vagal tone";
  } else if (theme === 'movement') {
    action = `Take a ${minutes}-minute easy walk at conversational pace.`;
    rationale = "Light aerobic movement increases circulation without adding stress, aiding recovery.";
    evidence_note = "Light aerobic work aids recovery";
  } else if (theme === 'mindset') {
    action = `Do a ${minutes}-minute guided body scan or soft-focus meditation.`;
    rationale = "Brief attentional rest reduces cognitive load and stress reactivity.";
    evidence_note = "Brief focus reduces cognitive load";
  } else if (theme === 'nutrition') {
    action = `Prepare a simple snack with protein and fiber (e.g., yogurt + berries) within ${minutes} minutes.`;
    rationale = "Protein and fiber help stabilize energy and support recovery.";
    evidence_note = "Protein+fiber stabilize energy";
  }

  return {
    action,
    category,
    rationale,
    evidence_note,
    recoveryScore,
    wearableUsed: false,
  };
}

// Helper function to get HRV trend (optional enhancement)
async function getHRVTrend(userId: string, days: number = 7): Promise<string> {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        value,
        timestamp,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .eq('metric_type', 'hrv_rmssd')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true })
      .limit(days);

    if (error || !data || data.length < 2) {
      return 'stable';
    }

    const values = data.map(d => Number(d.value));
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (changePercent > 10) return 'improving';
    if (changePercent < -10) return 'declining';
    return 'stable';
  } catch (error) {
    console.error('Error getting HRV trend:', error);
    return 'stable';
  }
}

// Main function to generate daily suggestion
export async function generateDailySuggestion(
  userId: string,
  meta?: { source?: 'auto' | 'manual' | 'api'; tz?: string }
): Promise<{
  id: string;
  suggestion: { action: string; category: SuggestionPayload['category']; rationale: string };
  recovery_score: number;
  created_at: string;
  data_used: 'wearable' | 'onboarding' | 'both' | 'none';
  trend: Trend;
  focus_used: Focus | null;
  source: 'auto' | 'manual' | 'api';
  evidence_note: string | null;
  suggestion_date: string;
}> {
  try {
    const source = meta?.source ?? 'manual';
    const tz = meta?.tz ?? 'Europe/Lisbon';

    // Load onboarding (preferred_focus)
    const preferred_focus = await loadPreferredFocus(userId);

    // Load recent biometric data
    const biometricData = await loadRecentBiometricData(userId);
    const hasWearable = biometricData.dataPoints > 0;

    // Calculate recovery score
    const recoveryScore = calculateRecoveryScore(biometricData);

    // Trend mapping
    let trend: Trend = 'unknown';
    if (hasWearable) {
      const rawTrend = await getHRVTrend(userId);
      trend = rawTrend === 'improving' ? 'up' : rawTrend === 'declining' ? 'down' : 'stable';
    }

    const history = await (async (): Promise<HistoryPoint[]> => {
      const todayUtc = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabaseAdmin
        .from('suggestion_logs')
        .select('id, completed, created_at')
        .eq('user_id', userId)
        .neq('suggestion_date', todayUtc)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data) return [];

      type Row = { id: string; completed: boolean | null; created_at: string | null };
      const rows = data as Row[];
      const ids = rows.map((r) => r.id);
      if (ids.length === 0) return rows.map((r) => ({ completed: Boolean(r.completed) }));

      const { data: moods } = await supabaseAdmin
        .from('mood_reflections')
        .select('suggestion_id, mood_emoji')
        .in('suggestion_id', ids);

      const idToMood: Record<string, string | null> = {};
      (moods as { suggestion_id: string | null; mood_emoji: string | null }[] | null || []).forEach((m) => {
        if (m && m.suggestion_id) {
          idToMood[m.suggestion_id] = m.mood_emoji ?? null;
        }
      });

      const mapEmoji = (emoji: string | null | undefined): HistoryPoint['mood'] => {
        if (!emoji) return null;
        if (emoji.includes('😔') || emoji.includes('😞')) return 'sad';
        if (emoji.includes('😐')) return 'neutral';
        if (emoji.includes('😊') || emoji.includes('🙂')) return 'smile';
        if (emoji.includes('😄') || emoji.includes('😌')) return 'grin';
        return null;
      };

      return rows.map((r) => ({
        completed: Boolean(r.completed),
        mood: mapEmoji(idToMood[r.id]),
      }));
    })();
    const { progression } = computeProgression(history);

    // Data used
    const hasOnboarding = Boolean(preferred_focus);
    const data_used = decideDataUsed(hasWearable, hasOnboarding);

    // Suggestion date (user-local)
    const ymd = toUserLocalDate(new Date(), tz);

    // Try to acquire per-user-day lock (best-effort)
    const locked = await tryAcquireUserDayLock(userId, ymd);

    // Build Spec
    const spec = buildSpec(preferred_focus, trend, progression);

    // LLM setup
    const model = new ChatOpenAI({
      modelName: "gpt-4.1-mini",
      temperature: 0.7,
      maxTokens: 500,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // System prompt requiring strict JSON with evidence_note
    const systemPrompt = `You are ROOTED, a soft-spoken, evidence-based wellness coach.
Output STRICT JSON with keys: action, category, rationale, evidence_note.
- evidence_note: ≤ 12 words, concise physiological or behavioral mechanism.
- No URLs, no citations, no markdown—plain text only.
- category must be one of: movement | breathwork | mindset | nutrition.
Rules:
- Adhere to the provided SPEC exactly.
- If trend is "down": prefer downregulating actions and language.
- Keep within 5–20 minutes; avoid equipment; no medical claims.
- When user has a stated preferred focus (from onboarding), the category MUST match that focus. Use wearable data to tailor duration, intensity, and rationale, but do not change category.`;

    // Step 7: Create user message with biometric context
    const biometricSummary = [] as string[];
    if (biometricData.hrv_rmssd !== undefined) {
      biometricSummary.push(`HRV: ${biometricData.hrv_rmssd.toFixed(1)}ms (trend: ${trend})`);
    }
    if (biometricData.heart_rate_resting !== undefined) {
      biometricSummary.push(`Resting HR: ${biometricData.heart_rate_resting.toFixed(0)} bpm`);
    }
    if (biometricData.sleep_total !== undefined) {
      const sleepHours = (biometricData.sleep_total / 3600).toFixed(1);
      biometricSummary.push(`Sleep: ${sleepHours} hours`);
    }
    if (biometricData.stress_avg !== undefined) {
      biometricSummary.push(`Stress level: ${biometricData.stress_avg.toFixed(0)}/100`);
    }

    // Build retrieval query and attempt KB retrieval (graceful on failure)
    const compactSummary = [
      `trend: ${trend}`,
      biometricData.sleep_total ? `sleep~${(biometricData.sleep_total/3600).toFixed(1)}h` : null,
      biometricData.stress_avg ? `stress~${biometricData.stress_avg.toFixed(0)}/100` : null,
    ].filter(Boolean).join('; ');

    let snippetsBlock = '';
    const kbDocIds: string[] = [];
    try {
      const { retrieveEvidenceSnippets } = await import('@/lib/kb/retriever');
      const queryText = `theme:${spec.theme}; intensity:${spec.intensity}; minutes:${spec.durationMin}; focus:${preferred_focus ?? 'none'}; ${compactSummary}`;
      const hits = await retrieveEvidenceSnippets(queryText, 2);
      if (hits && hits.length > 0) {
        const lines = hits.slice(0,2).map((h, idx) => {
          const trimmed = (h.content || '').slice(0, 200).replace(/\s+/g, ' ').trim();
          kbDocIds.push(`${h.doc_id}#${h.chunk_id}`);
          return `${idx+1}) ${h.title ?? 'Evidence'}: "${trimmed}"`;
        });
        snippetsBlock = `\n\nEVIDENCE SNIPPETS (use to ground rationale & evidence_note):\n${lines.join('\n')}`;
      }
    } catch {
      // On any KB error, continue without snippets
    }

    // Additional guidance when preferred focus exists
    const guidanceBlock = (preferred_focus)
      ? `\n\nONBOARDING PRIORITY:\n- Category MUST equal user's preferred focus: ${preferred_focus}.\n- Propose associative, aligned practices (science-backed and/or appropriate contemplative).\n- Use wearable data (if present) to adjust intensity/duration/rationale—not category.\n- Keep approachable, clear, kind; ensure it advances the preferred focus today.`
      : '';

    const userMessage = `SPEC: ${JSON.stringify(spec)}
Recovery score: ${recoveryScore}/100
Biometric window: ${biometricData.timeRange} ${hasWearable ? '(present)' : '(none)'}
Preferred focus: ${preferred_focus ?? 'none'}
Recent biometrics:\n${biometricSummary.join('\n')}${snippetsBlock}
${guidanceBlock}
Return ONLY JSON, no prose.`;

    // Step 8: Generate suggestion using LangChain
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage)
    ];

    const response = await model.invoke(messages);
    const responseText = String(response.content ?? '');

    let suggestionData: Record<string, unknown> | null = null;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      suggestionData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      suggestionData = null;
    }

    let suggestion: SuggestionPayload;
    if (suggestionData && typeof suggestionData === 'object') {
      const rawCategory = String((suggestionData as { category?: string }).category ?? '').toLowerCase();
      const allowed = ['movement', 'breathwork', 'mindset', 'nutrition'] as const;
      const isAllowed = (val: string): val is SuggestionPayload['category'] =>
        (allowed as readonly string[]).includes(val);
      // Enforce preferred focus category when present
      const category: SuggestionPayload['category'] = preferred_focus
        ? preferred_focus
        : (isAllowed(rawCategory) ? rawCategory : spec.theme);
      suggestion = {
        action: String(suggestionData.action ?? '').trim() || 'Take 5 deep breaths and stretch gently',
        category,
        rationale:
          String((suggestionData as { rationale?: string }).rationale ?? '').trim() ||
          `Based on your recovery score of ${recoveryScore}/100, this will help support your wellness today.`,
        evidence_note: (suggestionData as { evidence_note?: string | null | undefined }).evidence_note ? String((suggestionData as { evidence_note?: string | null | undefined }).evidence_note) : undefined,
        recoveryScore,
        wearableUsed: hasWearable,
      };
    } else {
      suggestion = synthesizeFromSpec(spec, recoveryScore);
      suggestion.wearableUsed = hasWearable;
    }

    // Evidence note normalization (≤12 words, no URLs/markdown)
    const sanitizeEvidence = (note: string | undefined | null): string => {
      const trimmed = (note || '').trim();
      if (!trimmed) return defaultEvidenceNoteFor(spec);
      if (/https?:\/\//i.test(trimmed) || /www\./i.test(trimmed) || /\[|\]|\*/.test(trimmed)) {
        return defaultEvidenceNoteFor(spec);
      }
      const words = trimmed.split(/\s+/).filter(Boolean);
      if (words.length > 12) return defaultEvidenceNoteFor(spec);
      return trimmed;
    };
    suggestion.evidence_note = sanitizeEvidence(suggestion.evidence_note);

    // Insert into suggestion_logs with conflict protection (DO NOTHING on conflict)
    const insertValues = {
        user_id: userId,
        recovery_score: recoveryScore,
        wearable_data: hasWearable ? biometricData : null,
        suggestion: {
          action: suggestion.action,
          category: suggestion.category,
          rationale: suggestion.rationale,
        },
        completed: false,
        source,
        data_used,
        trend,
        focus_used: preferred_focus ?? null,
        evidence_note: suggestion.evidence_note ?? null,
        kb_doc_ids: kbDocIds,
        suggestion_date: ymd,
      };
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('suggestion_logs')
      .insert(insertValues, { count: 'exact' })
      .select('id, created_at, suggestion, recovery_score, data_used, trend, focus_used, source, evidence_note, suggestion_date, kb_doc_ids')
      .maybeSingle();

    if (locked) await releaseUserDayLock(userId, ymd);

    // If insert returned no row (due to conflict DO NOTHING) or any error, fetch existing row
    if (insertError || !inserted) {
      const existing = await getTodaysSuggestion(userId, ymd);
      if (existing) return existing;
      if (insertError) throw insertError;
      throw new Error('Insert returned no row and existing not found');
    }

    return inserted as {
      id: string;
      suggestion: { action: string; category: SuggestionPayload['category']; rationale: string };
      recovery_score: number;
      created_at: string;
      data_used: 'wearable' | 'onboarding' | 'both' | 'none';
      trend: Trend;
      focus_used: Focus | null;
      source: 'auto' | 'manual' | 'api';
      evidence_note: string | null;
      suggestion_date: string;
      kb_doc_ids?: string[];
    };

  } catch (error: unknown) {
    console.error('Error in generateDailySuggestion:', error);
    // Last-resort: try to fetch today if unique constraint hit elsewhere
    try {
      const ymd = toUserLocalDate(new Date());
      const row = await getTodaysSuggestion(userId, ymd);
      if (row) return row;
    } catch {}
    throw error;
  }
}

// Additional helper functions for future use

export async function getLatestBiometrics(userId: string, metricType: string): Promise<number | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wearable_data')
      .select(`
        value,
        wearable_connections!inner(user_id)
      `)
      .eq('wearable_connections.user_id', userId)
      .eq('metric_type', metricType)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return Number(data.value);
  } catch (error) {
    console.error(`Error getting latest ${metricType}:`, error);
    return null;
  }
}

export async function markSuggestionCompleted(suggestionId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('suggestion_logs')
      .update({ completed: true })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error marking suggestion as completed:', error);
    }
  } catch (error) {
    console.error('Error in markSuggestionCompleted:', error);
  }
}

// Load preferred_focus from onboarding
async function loadPreferredFocus(userId: string): Promise<Focus | null> {
  try {
    const { data } = await supabaseAdmin
      .from('user_onboarding')
      .select('preferred_focus')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const v = (data?.preferred_focus as string | null) ?? null;
    return normalizeFocus(v);
  } catch {
    return null;
  }
}

function normalizeFocus(v?: string | null): Focus | null {
  if (!v) return null;
  const m = v.toLowerCase();
  if (['move', 'movement', 'training', 'exercise'].includes(m)) return 'movement';
  if (['breath', 'breathwork', 'breathing'].includes(m)) return 'breathwork';
  if (['mind', 'mindset', 'meditation'].includes(m)) return 'mindset';
  if (['food', 'nutrition', 'diet'].includes(m)) return 'nutrition';
  return null;
}

function defaultEvidenceNoteFor(spec: SuggestionSpec): string {
  if (spec.intensity === 'downregulate') return 'Long exhale supports vagal tone';
  if (spec.theme === 'movement') return 'Light aerobic work aids recovery';
  if (spec.theme === 'mindset') return 'Brief focus reduces cognitive load';
  if (spec.theme === 'nutrition') return 'Protein+fiber stabilize energy';
  return 'Gentle practice supports recovery';
}

async function getTodaysSuggestion(userId: string, ymd: string) {
  const { data, error } = await supabaseAdmin
    .from('suggestion_logs')
    .select('id, created_at, suggestion, recovery_score, data_used, trend, focus_used, source, evidence_note, suggestion_date')
    .eq('user_id', userId)
    .eq('suggestion_date', ymd)
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data as {
    id: string;
    created_at: string;
    suggestion: { action: string; category: SuggestionPayload['category']; rationale: string };
    recovery_score: number;
    data_used: 'wearable' | 'onboarding' | 'both' | 'none';
    trend: Trend;
    focus_used: Focus | null;
    source: 'auto' | 'manual' | 'api';
    evidence_note: string | null;
    suggestion_date: string;
  } | null;
}