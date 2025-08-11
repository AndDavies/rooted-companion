import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, CheckCircle2, Circle, Clock } from 'lucide-react';
import { getCurrentPlan } from '@/lib/llm/planAgent';

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

// Client component for interactive elements
import dynamic from 'next/dynamic';
const PlanningActions = dynamic(() => import('./PlanningActions'), { ssr: false });

export default async function PlanningPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Get current plan
  const currentPlan: RecoveryPlan | null = await getCurrentPlan(user.id);

  // Calculate progress if plan exists
  let progress = 0;
  if (currentPlan?.recovery_plan_tasks) {
    const completedTasks = currentPlan.recovery_plan_tasks.filter(task => task.completed).length;
    progress = Math.round((completedTasks / currentPlan.recovery_plan_tasks.length) * 100);
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breathwork': return '🫁';
      case 'movement': return '🚶';
      case 'sleep': return '😴';
      case 'nutrition': return '🥗';
      case 'mindset': return '🧠';
      default: return '✨';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'breathwork': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'movement': return 'bg-green-50 text-green-700 border-green-200';
      case 'sleep': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'nutrition': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'mindset': return 'bg-pink-50 text-pink-700 border-pink-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTimeIcon = (timeSuggestion: string | null) => {
    switch (timeSuggestion) {
      case 'morning': return '☀️';
      case 'afternoon': return '🌅';
      case 'evening': return '🌙';
      case 'flexible': return '⏰';
      default: return '⏰';
    }
  };

  // Group tasks by date for multi-task daily view
  const groupTasksByDate = (tasks: RecoveryPlanTask[]) => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.date]) {
        acc[task.date] = [];
      }
      acc[task.date].push(task);
      return acc;
    }, {} as Record<string, RecoveryPlanTask[]>);
    
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, tasks]) => ({
        date,
        tasks: tasks.sort((a, b) => {
          const at = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER
          const bt = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Number.MAX_SAFE_INTEGER
          if (at !== bt) return at - bt
          return (a.time_suggestion || 'flexible').localeCompare(b.time_suggestion || 'flexible')
        })
      }));
  };



  return (
    <div className="min-h-screen bg-white px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900">Recovery Planning</h1>
          <p className="text-neutral-600">Your personalized path to wellness and recovery</p>
        </div>

        {/* Planning Toolbar */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-neutral-900">Plan generation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
              <div className="text-sm text-neutral-600">
                Times are personalized to your wake/bed window and timezone.
              </div>
              <div className="flex items-center gap-3">
                <PlanningActions isGenerateButton={true} isRegenerateButton={!!currentPlan} />
              </div>
            </div>
          </CardContent>
        </Card>

        {currentPlan ? (
          <>
            {/* Plan Overview */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-gray-900">{currentPlan.title}</CardTitle>
                    {currentPlan.description && (
                      <p className="text-gray-600 mt-2">{currentPlan.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Progress</div>
                    <div className="text-2xl font-bold text-green-600">{progress}%</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-neutral-600 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(currentPlan.start_date)} → {formatDate(currentPlan.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{groupTasksByDate(currentPlan.recovery_plan_tasks).length} days</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </CardHeader>
            </Card>

            {/* Daily Plans - Horizontal Scrollable Cards */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h2 className="text-xl font-semibold text-neutral-900">Daily Recovery Plans</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {groupTasksByDate(currentPlan.recovery_plan_tasks).map((dayPlan) => {
                  const today = new Date().toISOString().split('T')[0];
                  const isPast = dayPlan.date < today;
                  const isToday = dayPlan.date === today;
                  
                  const completedTasks = dayPlan.tasks.filter(task => task.completed).length;
                  const totalTasks = dayPlan.tasks.length;
                  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
                  
                  const dayReflection = currentPlan.recovery_plan_reflections?.find(
                    reflection => reflection.day === dayPlan.date
                  );
                  
                  return (
                    <Card 
                      key={dayPlan.date}
                      className={`
                        rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md
                        ${isToday 
                          ? 'ring-2 ring-blue-200 bg-blue-50 border-blue-200' 
                          : completedTasks === totalTasks && totalTasks > 0
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-neutral-200'
                        }
                      `}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-neutral-900">
                              🗓️ {formatDate(dayPlan.date).split(',')[0]}
                            </CardTitle>
                            <p className="text-sm text-neutral-600 mt-1">
                              {formatDate(dayPlan.date).split(',')[1]?.trim()}
                            </p>
                          </div>
                          {isToday && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              Today
                            </span>
                          )}
                        </div>
                        
                        {/* Progress Indicator */}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="text-sm text-neutral-600">
                            ✅ {completedTasks} of {totalTasks} tasks complete
                          </div>
                          {progressPercent === 100 && totalTasks > 0 && (
                            <span className="text-green-600">🎉</span>
                          )}
                        </div>
                        
                        <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Tasks List */}
                        <div className="space-y-3">
                          {dayPlan.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={`
                                border rounded-xl p-3 transition-all duration-200
                                ${task.completed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-neutral-200 hover:border-neutral-300'
                                }
                              `}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {task.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-neutral-400" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getCategoryColor(task.category || 'default')}`}>
                                      {getCategoryIcon(task.category || 'default')} {task.category || 'general'}
                                    </span>
                                    {task.time_suggestion && (
                                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                                        {task.scheduled_at
                                          ? new Date(task.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                                          : `${getTimeIcon(task.time_suggestion)} ${task.time_suggestion || 'any'}`}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium text-neutral-900 text-sm mb-1">{task.action}</h4>
                                    <p className="text-xs text-neutral-600">{task.rationale}</p>
                                  </div>
                                  
                                  {isToday && !task.completed && (
                                    <PlanningActions taskId={task.id} />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Reflection Section */}
                        {dayReflection && (
                          <div className="border-t border-neutral-200 pt-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-700">✍️ Daily Reflection</span>
                              </div>
                              <p className="text-sm text-neutral-600 italic">&ldquo;{dayReflection.prompt}&rdquo;</p>
                              
                              {isPast || isToday ? (
                                <PlanningActions 
                                  reflectionId={dayReflection.id} 
                                  currentReflection={dayReflection.reflection_text}
                                  reflectionPrompt={dayReflection.prompt}
                                />
                              ) : (
                                <p className="text-xs text-neutral-500">Available after {formatDate(dayPlan.date).split(',')[0]}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Plan Actions (secondary) */}
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Plan Management</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Generate a new plan based on your latest data and preferences
                    </p>
                  </div>
                  <PlanningActions isRegenerateButton={true} />
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* No Plan State */
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">No Recovery Plan Active</h3>
                  <p className="text-gray-600 mt-2 max-w-md mx-auto">
                    Create your first personalized recovery plan based on your biometric data and wellness goals.
                  </p>
                </div>
                <PlanningActions isGenerateButton={true} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}