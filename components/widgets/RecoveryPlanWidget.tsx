'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Circle, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

type TodaysTask = {
  id: string;
  date: string;
  title: string;
  rationale: string;
  category: string;
  time_suggestion: string | null;
  recipe_id: string | null;
  completed: boolean;
  recovery_plans: {
    id: string;
    title: string;
  };
} | null;

type CurrentPlan = {
  id: string;
  title: string;
  recovery_plan_tasks: Array<{
    completed: boolean;
  }>;
} | null;

export default function RecoveryPlanWidget() {
  const [todaysTask, setTodaysTask] = useState<TodaysTask>(null);
  const [todaysTasks, setTodaysTasks] = useState<Array<{ id?: string; completed?: boolean; category?: string; title?: string; rationale?: string; date?: string; scheduled_for?: string; scheduled_at?: string }>>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dayNumber, setDayNumber] = useState(0);
  const [totalDays, setTotalDays] = useState(0);

  // Fetch planning data
  const fetchPlanningData = async () => {
    try {
      const response = await fetch('/api/planning');
      if (response.ok) {
        const data = await response.json();
        setTodaysTask(data.todaysTask);
        setCurrentPlan(data.currentPlan);

        // Derive all tasks for today from currentPlan if present
        if (data.currentPlan?.recovery_plan_tasks) {
          const allTasks = data.currentPlan.recovery_plan_tasks as Array<{ id?: string; completed?: boolean; category?: string; title?: string; rationale?: string; date?: string; scheduled_for?: string; scheduled_at?: string }>;
          // naive filter: tasks where completed === false or scheduled for today if date provided
          // If API provides date per task, prefer filtering by today's date; fallback to incomplete tasks
          const todayISO = new Date().toISOString().slice(0, 10)
          const filtered = allTasks.filter((t) => {
            const d = (t.date || t.scheduled_for || t.scheduled_at || "").slice?.(0,10)
            if (d) return d === todayISO
            return t.completed === false || !t.completed
          })
          setTodaysTasks(filtered)
        }
        
        // Calculate day number and total days
        if (data.currentPlan?.recovery_plan_tasks) {
          const tasks = data.currentPlan.recovery_plan_tasks;
          setTotalDays(tasks.length);
          
          // Calculate which day we're on
          const completedTasks = tasks.filter((task: { completed: boolean }) => task.completed).length;
          setDayNumber(completedTasks + 1); // Next task to complete
        }
      }
    } catch (error) {
      console.error('Error fetching planning data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanningData();
  }, []);

  const handleMarkComplete = async () => {
    if (!todaysTask) return;
    
    setIsMarkingComplete(true);
    try {
      const response = await fetch('/api/planning', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: todaysTask.id }),
      });

      if (response.ok) {
        // Update local state
        setTodaysTask({ ...todaysTask, completed: true });
        // Refresh data to get updated progress
        setTimeout(fetchPlanningData, 1000);
      }
    } catch (error) {
      console.error('Error marking task as completed:', error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/planning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh data to show new plan
        fetchPlanningData();
      }
    } catch (error) {
      console.error('Error generating plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breathwork': return <span aria-label="breathwork" role="img">🫁</span>;
      case 'movement': return <span aria-label="movement" role="img">🚶</span>;
      case 'sleep': return <span aria-label="sleep" role="img">😴</span>;
      case 'nutrition': return <span aria-label="nutrition" role="img">🥗</span>;
      case 'mindset': return <span aria-label="mindset" role="img">🧠</span>;
      default: return <span aria-label="default" role="img">✨</span>;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Recovery Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-600" />
          Recovery Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {todaysTask ? (
          <>
            {/* Progress Indicator */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                📅 Day {dayNumber} of {totalDays}
              </span>
              <Link 
                href="/dashboard/planning"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View Full Plan
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            {/* Today's Tasks List */}
            <div className="space-y-3">
              {(todaysTasks.length ? todaysTasks : [todaysTask]).map((task, idx) => (
                <div
                  key={task.id || idx}
                  className={`border rounded-lg p-4 transition-colors ${
                    task.completed ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(task.category || '')}</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">{task.category || ''}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                        <p className="text-sm text-gray-600">{task.rationale}</p>
                      </div>
                      {!task.completed && task.id === todaysTask?.id && (
                        <Button
                          onClick={handleMarkComplete}
                          disabled={isMarkingComplete}
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isMarkingComplete ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Marking Complete...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark as Done
                            </>
                          )}
                        </Button>
                      )}
                      {task.completed && (
                        <div className="text-center py-2">
                          <span className="text-green-600 font-medium">✅ Completed! Great work today.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plan Title */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Following: <span className="font-medium">{todaysTask.recovery_plans.title}</span>
              </p>
            </div>
          </>
        ) : currentPlan ? (
          /* Plan exists but no task for today */
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">No Task for Today</h3>
              <p className="text-sm text-gray-600 mt-1">
                Your current plan doesn&apos;t have a task scheduled for today.
              </p>
            </div>
            <Link href="/dashboard/planning">
              <Button variant="outline" size="sm" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View Full Plan
              </Button>
            </Link>
          </div>
        ) : (
          /* No plan active */
          <div className="text-center space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">No Plan Active</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create a personalized recovery plan based on your latest data.
              </p>
            </div>
            <Button 
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Start a Plan
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}