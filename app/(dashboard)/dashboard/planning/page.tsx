import { createClient } from '@/utils/supabase/server';
import type { Json } from '@/types/supabase';
import { parseTaskContent } from '@/lib/tasks/contentSchema';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { getCurrentPlan } from '@/lib/llm/planAgent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import DailyTabsClient, { DayGroup } from './DailyTabsClient';

type RecoveryPlan = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  created_at: string | null;
  recovery_plan_tasks: RecoveryPlanTask[];
  recovery_plan_reflections: RecoveryPlanReflection[];
};

type RecoveryPlanTask = {
  id: string;
  date: string;
  title: string;
  rationale: string | null;
  category: string | null;
  pillar?: string | null;
  slug?: string | null;
  time_suggestion: string | null;
  scheduled_at?: string | null;
  recipe_id: string | null;
  completed: boolean | null;
  task_payload?: ({ content?: unknown } | null) | Json;
};

type RecoveryPlanReflection = {
  id: string;
  day: string;
  prompt: string;
  reflection_text: string | null;
  plan_id: string | null;
  user_id: string | null;
  created_at: string | null;
};

const PlanningActions = dynamic(() => import('./PlanningActions'), { ssr: false });

export default async function PlanningPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const currentPlan: RecoveryPlan | null = await getCurrentPlan(user.id);
  // Normalize any null content into {}
  if (currentPlan?.recovery_plan_tasks) {
    currentPlan.recovery_plan_tasks = currentPlan.recovery_plan_tasks.map(t => {
      // payload can be the normalized shape we saved during activation
      const p = (t.task_payload as Record<string, unknown> | null) ?? null
      const normalized = p && typeof p === 'object' ? p : {}
      const contentRaw = (normalized['content'] as unknown) ?? null
      const content = parseTaskContent(contentRaw) || {}
      return { ...t, task_payload: { ...normalized, content } as unknown as Json }
    }) as RecoveryPlanTask[]
  }

  // Wearable data (minimal insight): last 7 days HRV
  const { data: connection } = await supabase
    .from('wearable_connections')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  let hrvAvg: number | null = null;
  if (connection?.id) {
    const { data: biometricData } = await supabase
      .from('wearable_data')
      .select('metric_type,value,timestamp')
      .eq('connection_id', connection.id)
      .eq('metric_type', 'hrv')
      .gte('timestamp', new Date(Date.now() - 7*24*60*60*1000).toISOString())
      .order('timestamp', { ascending: false });
    if (biometricData && biometricData.length) {
      const vals = biometricData.map(b => b.value).filter(v => typeof v === 'number') as number[];
      if (vals.length) hrvAvg = Math.round((vals.reduce((a,b)=>a+b,0)/vals.length) * 10) / 10;
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group by date for tabs
  const groupTasksByDate = (tasks: RecoveryPlanTask[]) => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.date]) acc[task.date] = [];
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, RecoveryPlanTask[]>);
    return Object.entries(grouped)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: '2-digit' }),
        tasks: tasks.sort((a,b) => {
          const at = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
          const bt = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER;
          if (at !== bt) return at - bt;
          return (a.time_suggestion || 'flexible').localeCompare(b.time_suggestion || 'flexible');
        })
      })) as DayGroup[];
  };

  // Progress helpers
  let progress = 0;
  let dayGroups: DayGroup[] = [];
  let todayIndex = 0;
  if (currentPlan?.recovery_plan_tasks) {
    const completedTasks = currentPlan.recovery_plan_tasks.filter(t => t.completed).length;
    progress = Math.round((completedTasks / currentPlan.recovery_plan_tasks.length) * 100);
    dayGroups = groupTasksByDate(currentPlan.recovery_plan_tasks);
    const todayIso = new Date().toISOString().slice(0,10);
    const idx = dayGroups.findIndex(d => d.date === todayIso);
    todayIndex = idx; // -1 if not found
  }

  // Simple streak: consecutive days with all tasks complete up to today
  const streak = (() => {
    if (!dayGroups.length) return 0;
    let s = 0;
    for (let i = dayGroups.length - 1; i >= 0; i--) {
      const d = dayGroups[i];
      const done = d.tasks.length > 0 && d.tasks.every(t => !!t.completed);
      if (done) s++; else break;
    }
    return s;
  })();

  // Focus adherence (example: movement + mindset combined as "focus")
  const focusAdherence = (() => {
    if (!currentPlan?.recovery_plan_tasks?.length) return 0;
    const focusTasks = currentPlan.recovery_plan_tasks.filter(t => (t.category || '').match(/movement|mindset/i));
    if (!focusTasks.length) return 0;
    const done = focusTasks.filter(t => t.completed).length;
    return Math.round((done / focusTasks.length) * 100);
  })();

  const rings = [
    { label: 'Overall', value: Math.round(progress) },
    { label: 'Streak', value: Math.round(Math.min((streak * 100) / (dayGroups.length || 1), 100)) },
    { label: 'Focus', value: Math.round(focusAdherence) },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-neutral-50 via-sage-50/30 to-sky-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Page Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-logo font-bold text-neutral-900">
              Your Recovery Plan
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl">
              A simple space to review what&apos;s scheduled next and understand why each step matters.
            </p>
          </div>
          <Link 
            href="/how-it-works#planning" 
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Learn more</span>
          </Link>
        </div>

        {/* No Active Plan State */}
      {!currentPlan ? (
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-sage-50 to-sky-50 p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1 text-center lg:text-left space-y-6">
                  <div className="space-y-3">
                    <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 leading-tight">
                      Your Recovery Journey Starts Here
                    </h1>
                    <p className="text-lg text-neutral-600 leading-relaxed">
                      A simple space to review what's scheduled next and understand why each step matters.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <PlanningActions isGenerateButton />
                    <Button asChild variant="outline" className="border-sage-300 hover:border-sage-400 hover:bg-sage-50">
                      <Link href="/dashboard/act">Browse Plan Library</Link>
                    </Button>
                  </div>
                  
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">ℹ️</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sky-900 mb-1">Evidence-Based Recovery</p>
                        <p className="text-sm text-sky-700 leading-relaxed">
                          Recovery plans help improve HRV by up to 18% within 4 weeks — based on recent studies.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Illustration */}
                <div className="order-1 lg:order-2 flex items-center justify-center">
                  <div className="relative">
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-sage-200 via-sky-200 to-emerald-200 opacity-60"></div>
                    <div className="absolute inset-8 rounded-full bg-gradient-to-br from-sage-300 via-sky-300 to-emerald-300 opacity-80"></div>
                    <div className="absolute inset-16 rounded-full bg-gradient-to-br from-sage-400 via-sky-400 to-emerald-400 flex items-center justify-center">
                      <span className="text-4xl">🌱</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Active Plan Present State
        <div className="space-y-8">
          {/* Modern Plan Header */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-br from-sage-50 to-sky-50 px-8 py-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold text-neutral-900 leading-tight">{currentPlan.title}</h1>
                  <p className="text-lg text-neutral-600">
                    A simple space to review what's scheduled next and understand why each step matters
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm text-neutral-700 font-medium">
                      {dayGroups.length}-Day Recovery Plan
                    </span>
                    <span className="text-neutral-600">
                      Day {Math.min(todayIndex+1, dayGroups.length)} of {dayGroups.length}
                    </span>
                    <span className="text-neutral-500">
                      {formatDate(currentPlan.start_date)} – {formatDate(currentPlan.end_date)}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Progress Rings */}
                <div className="flex justify-center lg:justify-end">
                  <div className="grid grid-cols-3 gap-6">
                    {rings.map((r, idx) => {
                      const colors = [
                        { bg: 'from-emerald-400 to-emerald-600', stroke: '#10b981' }, // Overall - sage green
                        { bg: 'from-sky-400 to-sky-600', stroke: '#0ea5e9' },        // Streak - sky blue  
                        { bg: 'from-amber-400 to-amber-600', stroke: '#f59e0b' }     // Focus - warm amber
                      ];
                      return (
                        <div key={idx} className="flex flex-col items-center space-y-2">
                          <div className="relative">
                            <svg width="80" height="80" viewBox="0 0 36 36" className="-rotate-90">
                              <path 
                                d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" 
                                fill="none" 
                                stroke="#f1f5f9" 
                                strokeWidth="3" 
                              />
                              <path 
                                d="M18 2a16 16 0 1 1 0 32" 
                                fill="none" 
                                stroke={colors[idx].stroke}
                                strokeLinecap="round"
                                strokeWidth="3" 
                                strokeDasharray={`${r.value}, 100`}
                                className="transition-all duration-1000 ease-out"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-neutral-900">{r.value}%</span>
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-neutral-900">{r.label}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Day Navigation + Tasks Panel */}
          <DailyTabsClient days={dayGroups} todayIndex={todayIndex} />

          {/* Actions Row */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="flex-1 border-neutral-300 hover:border-sage-400 hover:bg-sage-50">
                View Full Schedule
              </Button>
              <PlanningActions isRegenerateButton />
              <Button asChild variant="outline" className="flex-1 border-neutral-300 hover:border-sage-400 hover:bg-sage-50">
                <Link href="/dashboard/act">Browse Plan Library</Link>
              </Button>
            </div>
          </div>

          {/* Insights Strip */}
          <div className="bg-gradient-to-r from-sage-50 to-sky-50 rounded-2xl border border-sage-200 shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sage-500 rounded-full flex items-center justify-center">
                <span className="text-lg">🌿</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-sage-900 mb-1">Recovery Insights</h3>
                <p className="text-sm text-sage-700">
                  {hrvAvg ? (
                    <>Your HRV average over the last week is <span className="font-medium">{hrvAvg}</span>. Keep the momentum!</>
                  ) : (
                    <>Connect a wearable to see personalized recovery insights alongside your plan.</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}