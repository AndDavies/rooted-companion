import { createClient } from '@/utils/supabase/server';
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
  action: string;
  rationale: string | null;
  category: string | null;
  time_suggestion: string | null;
  scheduled_at?: string | null;
  recipe_id: string | null;
  completed: boolean | null;
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
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-logo font-bold text-neutral-900">Your Recovery Plan</h1>
          <p className="text-lg text-neutral-600 max-w-2xl">A simple space to review what&apos;s scheduled next and understand why each step matters.</p>
        </div>
        <Link href="/how-it-works#planning" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Learn more</span>
        </Link>
      </div>

      {/* No Active Plan State */}
      {!currentPlan ? (
        <div className="space-y-8">
          {/* Hero */}
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="order-2 md:order-1 text-center md:text-left space-y-3">
              <h2 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900">Your Recovery Journey Starts Here</h2>
              <p className="text-neutral-600">Choose a guided plan or pick one from our library.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <PlanningActions isGenerateButton />
                <Button asChild variant="outline">
                  <Link href="/dashboard/act">Browse Plan Library</Link>
                </Button>
              </div>
              <div className="mt-3 text-sm italic text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                <span className="mr-2">ℹ️</span>
                Recovery plans help improve HRV by up to 18% within 4 weeks — based on recent studies.
              </div>
            </div>
            {/* Illustration placeholder */}
            <div className="order-1 md:order-2 flex items-center justify-center">
              <div className="h-40 w-40 md:h-56 md:w-56 rounded-full bg-gradient-to-br from-green-100 to-blue-100" aria-hidden />
            </div>
          </div>
        </div>
      ) : (
        // Active Plan Present State
        <div className="space-y-8">
          {/* Overview */}
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <CardTitle className="text-2xl text-neutral-900">{currentPlan.title}</CardTitle>
                  <div className="text-sm text-neutral-600 mt-1">
                    {`${dayGroups.length}-Day Recovery Plan (${formatDate(currentPlan.start_date)} – ${formatDate(currentPlan.end_date)})`}
                  </div>
                  <div className="text-sm text-neutral-500">Day {Math.min(todayIndex+1, dayGroups.length)} of {dayGroups.length}</div>
                </div>
                {/* Progress Rings */}
                <div className="grid grid-cols-3 gap-4">
                  {rings.map((r,idx)=> (
                    <div key={idx} className="flex flex-col items-center">
                      <svg width="64" height="64" viewBox="0 0 36 36" className="-rotate-90">
                        <path d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                        <path d="M18 2a16 16 0 1 1 0 32" fill="none" stroke="#16a34a" strokeLinecap="round"
                          strokeWidth="4" strokeDasharray={`${r.value}, 100`} />
                      </svg>
                      <div className="mt-1 text-sm font-medium text-neutral-900">{r.value}%</div>
                      <div className="text-xs text-neutral-600">{r.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Day Navigation + Tasks Panel */}
          <DailyTabsClient days={dayGroups} todayIndex={todayIndex} />

          {/* Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline">View Full Schedule</Button>
            <PlanningActions isRegenerateButton />
            <Button asChild variant="outline">
              <Link href="/dashboard/act">Browse Plan Library</Link>
            </Button>
          </div>

          {/* Insights Strip */}
          <Card className="bg-neutral-50 border-neutral-200">
            <CardContent className="py-4 text-sm text-neutral-700 flex items-center gap-2">
              <span>🌿</span>
              {hrvAvg ? (
                <span>Your HRV average over the last week is {hrvAvg}. Keep the momentum!</span>
              ) : (
                <span>Connect a wearable to see recovery insights alongside your plan.</span>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}