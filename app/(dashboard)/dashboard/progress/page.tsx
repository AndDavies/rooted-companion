import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format, subDays, startOfDay } from 'date-fns'
import { Heart, Calendar, Smile } from 'lucide-react'
import { DailyCheckInChart, BiometricTrendChart } from './ProgressCharts'
import type { DailyCheckInData, BiometricData } from './ProgressCharts'



// Helper function to get last 7 days
function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    days.push({
      date: format(startOfDay(date), 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      displayDate: format(date, 'MMM d')
    })
  }
  return days
}

// Helper function to calculate current streak
function getStreak(data: DailyCheckInData[]): number {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].completed) streak++;
    else break;
  }
  return streak;
}



export default async function ProgressPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/login')
  }

  const user = data.user
  const last7Days = getLast7Days()

  // Query mood reflections and suggestion logs for the last 7 days
  const { data: moodData } = await supabase
    .from('mood_reflections')
    .select(`
      created_at,
      mood_emoji,
      mood_text,
      suggestion_id,
      suggestion_logs!inner(completed, created_at)
    `)
    .eq('user_id', user.id)
    .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
    .order('created_at', { ascending: false })

  // Query suggestion logs directly for completion data (in case no mood reflection exists)
  const { data: suggestionData } = await supabase
    .from('suggestion_logs')
    .select('created_at, completed')
    .eq('user_id', user.id)
    .gte('created_at', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
    .order('created_at', { ascending: false })

  // Query recovery plan tasks for completion data
  const { data: planTaskData } = await supabase
    .from('recovery_plan_tasks')
    .select('date, completed, action, category')
    .eq('user_id', user.id)
    .gte('date', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
    .order('date', { ascending: false })

  // Get wearable connection for user
  const { data: connection } = await supabase
    .from('wearable_connections')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Query biometric data for the last 7 days (including optional metrics)
  const { data: biometricData } = connection ? await supabase
    .from('wearable_data')
    .select('metric_type, value, timestamp')
    .eq('connection_id', connection.id)
    .in('metric_type', ['hrv', 'hrv_rmssd', 'rhr', 'sleep_score', 'stress_score'])
    .gte('timestamp', format(subDays(new Date(), 7), 'yyyy-MM-dd'))
    .order('timestamp', { ascending: true }) : { data: null }

  // Process daily check-in and completion data
  const moodCompletionData: DailyCheckInData[] = last7Days.map(day => {
    // Find mood reflection for this day
    const dayMood = moodData?.find(mood => {
      const moodDate = format(new Date(mood.created_at!), 'yyyy-MM-dd')
      return moodDate === day.date
    })

    // Check for completion from multiple sources: mood data, suggestions, or plan tasks
    let completed = false
    let source: 'plan' | 'suggestion' | null = null

    // First check mood-linked suggestions
    if (dayMood?.suggestion_logs && Array.isArray(dayMood.suggestion_logs) && dayMood.suggestion_logs.length > 0) {
      completed = dayMood.suggestion_logs[0].completed || false
      source = completed ? 'suggestion' : null
    }

    // If not completed, check direct suggestion logs
    if (!completed) {
      const daySuggestion = suggestionData?.find(suggestion => {
        const suggestionDate = format(new Date(suggestion.created_at!), 'yyyy-MM-dd')
        return suggestionDate === day.date
      })
      if (daySuggestion?.completed) {
        completed = true
        source = 'suggestion'
      }
    }

    // If still not completed, check recovery plan tasks
    if (!completed) {
      const dayPlanTask = planTaskData?.find(task => {
        return task.date === day.date
      })
      if (dayPlanTask?.completed) {
        completed = true
        source = 'plan'
      }
    }

    return {
      date: day.date,
      dayName: day.dayName,
      mood_emoji: dayMood?.mood_emoji || null,
      mood_text: dayMood?.mood_text || null,
      completed,
      source,
      displayDate: day.displayDate
    }
  })

  // Process biometric data with proper normalization
  const biometricChartData: BiometricData[] = last7Days.map(day => {
    const dayBiometrics = biometricData?.filter(metric => {
      const metricDate = format(new Date(metric.timestamp), 'yyyy-MM-dd')
      return metricDate === day.date
    })

    // Get HRV (try both 'hrv' and 'hrv_rmssd'), normalize to 1 decimal
    const hrvMetric = dayBiometrics?.find(m => m.metric_type === 'hrv' || m.metric_type === 'hrv_rmssd')
    const hrvValue = hrvMetric ? Math.round(hrvMetric.value * 10) / 10 : null

    // Get RHR, normalize to whole number
    const rhrMetric = dayBiometrics?.find(m => m.metric_type === 'rhr')
    const rhrValue = rhrMetric ? Math.round(rhrMetric.value) : null

    // Get optional metrics
    const stressScore = dayBiometrics?.find(m => m.metric_type === 'stress_score')?.value || null
    const sleepScore = dayBiometrics?.find(m => m.metric_type === 'sleep_score')?.value || null

    return {
      date: day.date,
      hrv: hrvValue,
      rhr: rhrValue,
      stress_score: stressScore,
      sleep_score: sleepScore,
      displayDate: day.displayDate
    }
  })

  // Calculate recovery trends and insights
  const hrvTrend = biometricChartData.filter(d => d.hrv !== null)
  const rhrTrend = biometricChartData.filter(d => d.rhr !== null)
  
  const recoveryReadinessImproving = hrvTrend.length >= 2 && 
    (hrvTrend[hrvTrend.length - 1].hrv! > hrvTrend[0].hrv!)
  
  const completedCount = moodCompletionData.filter(d => d.completed).length
  const currentStreak = getStreak(moodCompletionData)
  
  // Calculate weekly insights with proper rounding
  const completionPercentage = Math.round((completedCount / 7) * 100)
  const latestRecoveryReadiness = hrvTrend.length > 0 ? hrvTrend[hrvTrend.length - 1].hrv! : null
  const avgRecoveryReadiness = hrvTrend.length > 0 ? 
    Math.round((hrvTrend.reduce((sum, d) => sum + d.hrv!, 0) / hrvTrend.length) * 10) / 10 : null
  const avgRestingPulse = rhrTrend.length > 0 ? 
    Math.round(rhrTrend.reduce((sum, d) => sum + d.rhr!, 0) / rhrTrend.length) : null

  return (
    <div className="min-h-screen bg-white px-4 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-logo font-bold text-neutral-900 mb-2">
          Progress & Analytics
        </h1>
        <p className="text-neutral-600">
          Track your wellness journey over the past 7 days with mood trends and biometric insights.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-neutral-900">{completedCount}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-1">Days Completed</p>
          </CardContent>
        </Card>
        
        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <span className="text-2xl font-bold text-neutral-900">{currentStreak}</span>
            </div>
            <p className="text-sm text-neutral-600 mt-1">Current Streak</p>
            <p className="text-xs text-neutral-500 mt-1">Showing up daily builds recovery momentum</p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-neutral-900">
                {latestRecoveryReadiness ? `${latestRecoveryReadiness}` : '--'}
              </span>
            </div>
            <p className="text-sm text-neutral-600 mt-1" title="Based on Heart Rate Variability — a higher number suggests better nervous system recovery">
              Recovery Readiness
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-neutral-900">
                {moodCompletionData.filter(d => d.mood_emoji).length}
              </span>
            </div>
            <p className="text-sm text-neutral-600 mt-1">Mood Entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Recovery Insight */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            🌱 Your Weekly Recovery Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{completedCount}/7</div>
                <div className="text-green-600">Days Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">{currentStreak}</div>
                <div className="text-green-600">Current Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">
                  {avgRecoveryReadiness ? `${avgRecoveryReadiness}` : '--'}
                </div>
                <div className="text-green-600">Avg Recovery</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800">
                  {avgRestingPulse ? `${avgRestingPulse}` : '--'}
                </div>
                <div className="text-green-600">Avg Resting Pulse</div>
              </div>
            </div>
            <div className="pt-3 border-t border-green-200">
              <p className="text-green-700 text-sm leading-relaxed">
                You completed <strong>{completedCount}/7 days</strong> this week ({completionPercentage}%).
                {latestRecoveryReadiness && (
                  <span> Your current recovery readiness is <strong>{latestRecoveryReadiness}</strong>, 
                  {recoveryReadinessImproving ? ' trending upward' : ' staying steady'}.</span>
                )}
                {avgRestingPulse && (
                  <span> Your resting pulse averaged <strong>{avgRestingPulse} bpm</strong> this week.</span>
                )}
                {' '}
                {recoveryReadinessImproving ? (
                  <span>Your nervous system recovery looks strong this week. Keep anchoring your sleep and breathwork habits! 🎉</span>
                ) : latestRecoveryReadiness ? (
                  <span>Your nervous system recovery looks steady this week. Keep anchoring your sleep and breathwork habits.</span>
                ) : currentStreak >= 3 ? (
                  <span>You&apos;re on a <strong>{currentStreak}-day streak</strong> — keep going! 🎉</span>
                ) : (
                  <span>Every step counts on your wellness journey. Tomorrow is a new opportunity to care for yourself. 💙</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Sections */}
      <div className="space-y-10">
        {/* Daily Check-In Progress Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Daily Check-In Progress</h2>
            <p className="text-sm text-neutral-600">Each bar shows whether you completed your daily recovery action and submitted a mood check-in.</p>
          </div>
          <DailyCheckInChart data={moodCompletionData} />
        </div>

        {/* Recovery Trends Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Reflect: Your Biometric Recovery Signals</h2>
            <p className="text-sm text-neutral-600">We use wearable data to help you understand how well your body is recovering.</p>
          </div>
          <BiometricTrendChart data={biometricChartData} isImproving={recoveryReadinessImproving} />
        </div>
      </div>

      {/* Weekly Summary */}
      {(completedCount > 0 || moodCompletionData.some(d => d.mood_emoji)) && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">🌿 Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700">
              This week you showed up <strong>{completedCount}/7 days</strong>.
              {currentStreak >= 3 && (
                <span> You&apos;re on a <strong>{currentStreak}-day streak</strong> — that kind of consistency matters!</span>
              )}
              {moodCompletionData.filter(d => d.mood_emoji).length > 0 && (
                <span> You&apos;ve been tracking your mood consistently, which shows great self-awareness.</span>
              )}
              {recoveryReadinessImproving && (
                <span> Your recovery trends are improving — keep anchoring your routine with the practices that feel good.</span>
              )}
              {completedCount >= 5 ? (
                <span> You&apos;re building fantastic momentum! 🎉</span>
              ) : currentStreak >= 2 ? (
                <span> You&apos;re building good momentum. Keep going! 💪</span>
              ) : (
                <span> Every step counts on your wellness journey. Tomorrow is a new opportunity to care for yourself. 💙</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next Step CTA */}
      {completedCount >= 2 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Want to keep your momentum?
            </h3>
            <p className="text-blue-700 text-sm mb-4">
              Generate a fresh recovery plan based on your recent progress and biometric trends.
            </p>
            <form action="/api/planning" method="post">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Regenerate My Recovery Plan
              </button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {completedCount === 0 && !moodCompletionData.some(d => d.mood_emoji) && !biometricChartData.some(d => d.hrv !== null || d.rhr !== null) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-medium text-blue-900 mb-3">
              No recovery data yet — make sure your wearable is synced
            </h3>
            <p className="text-blue-700 max-w-md mb-6">
              Complete your daily recovery actions and connect your wearable device to see your biometric trends and progress here.
            </p>
            <p className="text-sm text-blue-600">
              Come back tomorrow to see your trends! 🌱
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}