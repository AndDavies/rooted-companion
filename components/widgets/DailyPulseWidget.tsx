'use client';

import { useState, useEffect, useOptimistic, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Circle, Heart, Lightbulb, RefreshCw, Send } from 'lucide-react';
import { 
  getDailySuggestion, 
  markSuggestionComplete, 
  submitMoodReflection, 
  getMoodReflection,
  getTodaysPlanTaskSummary,
} from '@/app/(dashboard)/dashboard/actions';

type SuggestionData = {
  id: string;
  action: string;
  category: string;
  rationale: string;
  recoveryScore: number | null;
  completed: boolean | null;
  wearableUsed: boolean;
  createdAt: string;
} | null;

type MoodReflection = {
  mood_emoji: string | null;
  mood_text: string | null;
} | null;

const MOOD_EMOJIS = [
  { emoji: '😊', label: 'Great' },
  { emoji: '😌', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😞', label: 'Rough' }
];

const CATEGORY_COLORS = {
  movement: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  breathwork: 'bg-blue-50 text-blue-700 border-blue-200',
  mindset: 'bg-purple-50 text-purple-700 border-purple-200',
  sleep: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  nutrition: 'bg-orange-50 text-orange-700 border-orange-200'
};

const CATEGORY_ICONS = {
  movement: '🚶‍♀️',
  breathwork: '🫁',
  mindset: '🧠',
  sleep: '😴',
  nutrition: '🥗'
};

export function DailyPulseWidget() {
  const [suggestion, setSuggestion] = useState<SuggestionData>(null);
  const [moodReflection, setMoodReflection] = useState<MoodReflection>(null);
  const [loading, setLoading] = useState(true);
  // const [generating, setGenerating] = useState(false);
  const [errorState, setErrorState] = useState<null | { code: string; stage: string; message: string }>(null);
  const conflictRetriedRef = useRef(false);
  const [retrying, setRetrying] = useState(false);

  const messageForError = (code: string): string => {
    switch (code) {
      case 'OPENAI_TIMEOUT':
        return 'We paused to reset. Try again when ready.';
      case 'DB_ERROR':
        return 'We had trouble fetching your data. Please retry.';
      case 'OPENAI_TIMEOUT':
      case 'OPENAI_RATE_LIMIT':
        return 'We’re catching our breath. The service is busy—try again in a moment.';
      case 'OPENAI_ERROR':
      case 'PARSE_ERROR':
        return 'That didn’t land. Let’s try a simpler step—tap retry.';
      case 'DB_CONFLICT':
        return '';
      case 'DB_ERROR':
      case 'UNKNOWN':
      default:
        return 'Something went sideways. Tap retry, or come back in a bit.';
    }
  };
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState('');
  const [moodText, setMoodText] = useState('');
  const [submittingMood, setSubmittingMood] = useState(false);
  const [planTask, setPlanTask] = useState<{ title: string } | null>(null);
  const [hidePlanBanner, setHidePlanBanner] = useState(false);
  
  // Optimistic state for completion
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    suggestion?.completed ?? false,
    (state, newCompleted: boolean) => newCompleted
  );

  const loadSuggestion = async () => {
    try {
      setLoading(true);
      // 10s timeout wrapper
      const timeout = setTimeout(() => {
        setErrorState({ code: 'OPENAI_TIMEOUT', stage: 'suggestion_fetch', message: 'Timed out' });
      }, 10000);
      const result = await getDailySuggestion({ autoGenerate: true });
      clearTimeout(timeout);

      if (result && result.success) {
        setSuggestion(result.suggestion as any);
        setErrorState(null);
      } else if (result && !result.success && result.error) {
        if (result.error.code === 'DB_CONFLICT' && !conflictRetriedRef.current) {
          conflictRetriedRef.current = true;
          const retry = await getDailySuggestion({ autoGenerate: true } as any);
          if (retry && retry.success) {
            setSuggestion(retry.suggestion as any);
            setErrorState(null);
            return;
          }
        }
        setErrorState(result.error);
        setSuggestion(null);
      } else {
        setErrorState({ code: 'UNKNOWN', stage: 'unknown', message: 'Unknown error' });
        setSuggestion(null);
      }
      
      if (result?.success && result.suggestion?.id) {
        const reflection = await getMoodReflection(result.suggestion.id);
        setMoodReflection(reflection);
        if (reflection) {
          setSelectedMoodEmoji(reflection.mood_emoji || '');
          setMoodText(reflection.mood_text || '');
        }
      }
    } catch (error) {
      console.error('Error loading suggestion:', error);
      setErrorState({ code: 'UNKNOWN', stage: 'unknown', message: 'Request failed' });
      setSuggestion(null);
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: auto-generation occurs server-side; manual generate removed

  const handleToggleComplete = async () => {
    if (!suggestion?.id) return;
    
    try {
      setOptimisticCompleted(!optimisticCompleted);
      const result = await markSuggestionComplete(suggestion.id);
      if (result.success) {
        setSuggestion(prev => prev ? { ...prev, completed: true } : null);
      } else {
        // Revert optimistic update on error
        setOptimisticCompleted(optimisticCompleted);
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      setOptimisticCompleted(optimisticCompleted);
    }
  };

  const handleSubmitMood = async () => {
    if (!suggestion?.id || !selectedMoodEmoji) return;
    
    try {
      setSubmittingMood(true);
      const result = await submitMoodReflection(suggestion.id, selectedMoodEmoji, moodText);
      if (result.success) {
        setMoodReflection({
          mood_emoji: selectedMoodEmoji,
          mood_text: moodText
        });
      }
    } catch (error) {
      console.error('Error submitting mood:', error);
    } finally {
      setSubmittingMood(false);
    }
  };

  useEffect(() => {
    loadSuggestion();
  }, []);

  // Fetch plan banner (read-only, independent)
  useEffect(() => {
    let cancelled = false;
    const key = 'hidePlanBannerUntilRefresh';
    if (typeof window !== 'undefined') {
      const hidden = window.sessionStorage.getItem(key);
      if (hidden === 'true') {
        setHidePlanBanner(true);
        return () => { cancelled = true };
      }
    }
    (async () => {
      try {
        const res = await getTodaysPlanTaskSummary();
        if (!cancelled && res?.success && res.hasTask && res.task) {
          setPlanTask({ title: res.task.title });
        }
      } catch {}
    })();
    return () => { cancelled = true };
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-gray-600">Loading your daily pulse...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestion) {
    if (errorState) {
      return (
        <Card className="w-full">
          <CardContent className="p-8">
            <div className="space-y-4 text-center">
              <h3 className="text-lg font-medium text-neutral-900">Generation took a breather.</h3>
              <p className="text-neutral-600">{messageForError(errorState.code)}</p>
              <Button onClick={async () => { setRetrying(true); await loadSuggestion(); setRetrying(false); }} disabled={retrying} className="bg-blue-600 hover:bg-blue-700">
                {retrying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Retry'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="w-full border-dashed border-2 border-gray-200">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready for today&apos;s wellness suggestion?
              </h3>
              <p className="text-gray-600 mb-4">
                We&apos;re preparing a personalized recommendation based on your data.
              </p>
              {/* Generate button removed in Phase 2; auto-generation occurs on load */}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recoveryScore = suggestion.recoveryScore ?? 50;
  const recoveryScoreColor = recoveryScore >= 80 ? 'text-emerald-600' :
                            recoveryScore >= 60 ? 'text-blue-600' :
                            recoveryScore >= 40 ? 'text-amber-600' : 'text-red-600';

  const recoveryScoreBg = recoveryScore >= 80 ? 'bg-emerald-50' :
                         recoveryScore >= 60 ? 'bg-blue-50' :
                         recoveryScore >= 40 ? 'bg-amber-50' : 'bg-red-50';

  return (
    <Card className="w-full bg-white shadow-sm border-0 ring-1 ring-gray-100">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-red-400" />
            <span className="text-xl font-semibold text-gray-900">Today&apos;s Pulse</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${recoveryScoreBg} ${recoveryScoreColor}`}>
            Recovery: {recoveryScore}/100
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pb-6">
        {/* Plan coexistence banner */}
        {planTask && !hidePlanBanner && (
          <div className="mb-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm">
                <div className="font-medium text-blue-900">Today’s plan task</div>
                <div className="text-blue-800/80">{planTask.title}</div>
              </div>
              <div className="flex items-center gap-2">
                <a href="/dashboard" className="text-sm underline text-blue-800">Open plan</a>
                <button
                  className="text-xs opacity-70 hover:opacity-100 text-blue-900"
                  onClick={() => {
                    setHidePlanBanner(true);
                    try {
                      if (typeof window !== 'undefined') {
                        window.sessionStorage.setItem('hidePlanBannerUntilRefresh', 'true');
                      }
                    } catch {}
                  }}
                  aria-label="Hide plan reminder"
                >
                  Hide
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Suggestion Display */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[suggestion.category as keyof typeof CATEGORY_COLORS]}`}>
                <span className="mr-1">{CATEGORY_ICONS[suggestion.category as keyof typeof CATEGORY_ICONS]}</span>
                {suggestion.category}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-medium text-gray-900 text-lg leading-relaxed">
              {suggestion.action}
            </h3>
            
            <div className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">Why this helps: </span>
              {suggestion.rationale}
            </div>
            {('evidence_note' in (suggestion as unknown as { evidence_note?: string | null })) && (suggestion as any).evidence_note && (
              <div className="text-xs text-gray-500 opacity-80">
                Evidence note: {(suggestion as unknown as { evidence_note?: string | null }).evidence_note}
              </div>
            )}
          </div>

          {/* Completion Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              {suggestion.wearableUsed ? '📊 Based on your biometric data' : '🧘‍♀️ General wellness guidance'}
            </div>
            
            <Button
              onClick={handleToggleComplete}
              disabled={optimisticCompleted}
              variant={optimisticCompleted ? "secondary" : "default"}
              className={optimisticCompleted ? 
                "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default" : 
                "bg-blue-600 hover:bg-blue-700"
              }
            >
              {optimisticCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Completed ✨
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4 mr-2" />
                  Mark as Done
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mood Reflection Form - Only show if completed */}
        {optimisticCompleted && (
          <div className="border-t border-gray-100 pt-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center">
                <span className="mr-2">✨</span>
                How are you feeling after this?
              </h4>

              {/* Emoji Picker */}
              <div className="flex space-x-2">
                {MOOD_EMOJIS.map((mood) => (
                  <button
                    key={mood.emoji}
                    onClick={() => setSelectedMoodEmoji(mood.emoji)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedMoodEmoji === mood.emoji
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={mood.label}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                  </button>
                ))}
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <Input
                  placeholder="One or two words (optional): energized, calm, motivated..."
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  maxLength={50}
                />
              </div>

              {/* Submit Button */}
              {!moodReflection && selectedMoodEmoji && (
                <Button
                  onClick={handleSubmitMood}
                  disabled={submittingMood}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {submittingMood ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Save Reflection
                    </>
                  )}
                </Button>
              )}

              {/* Show saved reflection */}
              {moodReflection && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-sm text-green-800">
                    <span className="text-lg">{moodReflection.mood_emoji || '😊'}</span>
                    <span>
                      Thanks for sharing! 
                      {moodReflection.mood_text && (
                        <span className="font-medium"> Feeling {moodReflection.mood_text}</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
          Powered by ROOTED • Your wellness companion
        </div>
      </CardContent>
    </Card>
  );
}