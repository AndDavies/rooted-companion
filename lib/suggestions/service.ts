import { generateDailySuggestion } from '@/lib/llm/suggestionAgent';
import { createClient } from '@/utils/supabase/server';

export type SuggestionDTO = {
  id: string;
  action: string;
  category: 'movement'|'breathwork'|'mindset'|'nutrition';
  rationale: string;
  evidence_note?: string | null;
  kbDocIds?: string[];
  recoveryScore: number;
  wearableUsed: boolean;
  completed: boolean;
  createdAt: string; // ISO
  suggestionDate: string; // YYYY-MM-DD UTC
  dataUsed?: 'wearable'|'onboarding'|'both'|'none';
  trend?: 'up'|'down'|'stable'|'unknown';
  focusUsed?: string | null;
  source?: 'auto'|'manual'|'api';
};

type ServiceResult =
  | { success: true; suggestion: SuggestionDTO }
  | { success: false; error: { code: string; stage: string; message: string } };

export async function getOrCreateTodaysSuggestion(opts?: { forceCreate?: boolean; source?: 'auto'|'manual'|'api' }): Promise<ServiceResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return { success: false, error: { code: 'UNAUTH', stage: 'auth', message: authErr?.message ?? 'Not signed in' } };
    }

    const todayUtc = new Date().toISOString().slice(0,10);

    // 1) Read by (user_id, suggestion_date)
    const { data: existing, error: readErr } = await supabase
      .from('suggestion_logs')
      .select('id, suggestion, recovery_score, wearable_data, completed, created_at, suggestion_date, data_used, trend, focus_used, source, evidence_note')
      .eq('user_id', user.id)
      .eq('suggestion_date', todayUtc)
      .limit(1)
      .maybeSingle();

    if (readErr) {
      return { success: false, error: { code: 'DB_ERROR', stage: 'read_today', message: readErr.message } };
    }
    if (existing && !opts?.forceCreate) {
      return { success: true, suggestion: mapRow(existing) };
    }

    // 2) Generate (conflict-safe upsert inside generator)
    const row = await generateDailySuggestion(user.id, { source: opts?.source ?? 'api' });
    return { success: true, suggestion: mapRow(row) };

  } catch (e: any) {
    return { success: false, error: { code: e?.code ?? 'UNKNOWN', stage: e?.stage ?? 'service', message: e?.message ?? 'Unexpected error' } };
  }
}

function mapRow(r: any): SuggestionDTO {
  const s = r.suggestion ?? {};
  const dataUsed = r.data_used as SuggestionDTO['dataUsed'] | undefined;
  const wearableUsed = typeof dataUsed === 'string'
    ? (dataUsed === 'wearable' || dataUsed === 'both')
    : (r.wearable_data != null);

  return {
    id: r.id,
    action: s.action ?? '',
    category: (s.category ?? 'mindset'),
    rationale: s.rationale ?? '',
    evidence_note: r.evidence_note ?? s.evidence_note ?? null,
    kbDocIds: Array.isArray(r.kb_doc_ids) ? r.kb_doc_ids : [],
    recoveryScore: Number(r.recovery_score ?? 0),
    wearableUsed,
    completed: Boolean(r.completed),
    createdAt: r.created_at ?? new Date().toISOString(),
    suggestionDate: r.suggestion_date ?? new Date().toISOString().slice(0,10),
    dataUsed,
    trend: r.trend ?? undefined,
    focusUsed: r.focus_used ?? null,
    source: r.source ?? undefined,
  };
}


