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
};

type RecoveryPlanTask = {
  id: string;
  date: string;
  action: string;
  rationale: string | null;
  category: string | null;
  completed: boolean | null;
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

  const isTaskDate = (task: RecoveryPlanTask) => {
    const today = new Date().toISOString().split('T')[0];
    const taskDate = task.date;
    const isPast = taskDate < today;
    const isToday = taskDate === today;
    const isFuture = taskDate > today;
    
    return { isPast, isToday, isFuture };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Recovery Planning</h1>
          <p className="text-gray-600">Your personalized path to wellness and recovery</p>
        </div>

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
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(currentPlan.start_date)} → {formatDate(currentPlan.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{currentPlan.recovery_plan_tasks.length} days</span>
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

            {/* Daily Tasks */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Daily Recovery Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPlan.recovery_plan_tasks
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((task) => {
                    const { isPast, isToday } = isTaskDate(task);
                    
                    return (
                      <div
                        key={task.id}
                        className={`
                          border rounded-lg p-4 transition-all duration-200
                          ${task.completed 
                            ? 'bg-green-50 border-green-200' 
                            : isToday 
                              ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-200' 
                              : isPast 
                                ? 'bg-gray-50 border-gray-200' 
                                : 'bg-white border-gray-200'
                          }
                          ${isToday ? 'shadow-md' : 'shadow-sm'}
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className={`w-5 h-5 ${isToday ? 'text-blue-600' : 'text-gray-400'}`} />
                            )}
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(task.date)}
                                </span>
                                {isToday && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    Today
                                  </span>
                                )}
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getCategoryColor(task.category || 'default')}`}>
                                  {getCategoryIcon(task.category || 'default')} {task.category || 'general'}
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">{task.action}</h4>
                              <p className="text-sm text-gray-600">{task.rationale}</p>
                            </div>
                            
                            {isToday && !task.completed && (
                              <PlanningActions taskId={task.id} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>

            {/* Plan Actions */}
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