'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'
import { Smile, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// Types for our data
export type DailyCheckInData = {
  date: string
  dayName: string
  mood_emoji: string | null
  mood_text: string | null
  completed: boolean
  source: 'plan' | 'suggestion' | null
  displayDate: string
}

export type BiometricData = {
  date: string
  hrv: number | null
  rhr: number | null
  stress_score: number | null
  sleep_score: number | null
  displayDate: string
}

// Helper function to get completion color
function getCompletionColor(completed: boolean) {
  return completed ? '#10b981' : '#ef4444' // green : red
}

// Custom tooltip for daily check-in chart
function CheckInTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DailyCheckInData }> }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
        <p className="font-medium">{data.displayDate}</p>
        <p className="text-sm text-neutral-600">
          Mood: {data.mood_emoji || '😐'} {data.mood_text && `(${data.mood_text})`}
        </p>
        <p className="text-sm text-neutral-600">
          Status: {data.completed ? '✓ Completed' : '✕ Not completed'}
        </p>
        {data.source && (
          <p className="text-xs text-neutral-500 mt-1">
            Source: {data.source === 'plan' ? 'Plan Task' : 'Daily Pulse'}
          </p>
        )}
      </div>
    )
  }
  return null
}

// Custom tooltip for biometric chart
function BiometricTooltip({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ dataKey: string; value: number | null; color: string }>; 
  label?: string 
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.dataKey === 'hrv' ? 'Recovery Readiness' : 'Resting Pulse'}: {entry.value !== null ? entry.value : 'No data'}
            {entry.dataKey === 'hrv' ? '' : ' bpm'}
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface DailyCheckInChartProps {
  data: DailyCheckInData[]
}

export function DailyCheckInChart({ data }: DailyCheckInChartProps) {
  return (
    <Card className="border-neutral-200">
      <CardContent className="pt-6">
        {data.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="dayName" stroke="#6b7280" fontSize={12} />
                <YAxis hide />
                <Tooltip content={<CheckInTooltip />} />
                <Bar dataKey="completed" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCompletionColor(entry.completed)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 py-2 border-t border-neutral-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-neutral-600">✅ Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-neutral-600">✕ Not completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">😊</span>
                <span className="text-neutral-600">Mood logged</span>
              </div>
            </div>
            
            {/* Mood Emojis Display */}
            <div className="flex justify-between items-center pt-2">
              {data.map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-lg mb-1">
                    {day.mood_emoji || '😐'}
                  </div>
                  <div className="text-xs text-neutral-500">{day.dayName}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Smile className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No check-in data yet</h3>
            <p className="text-sm text-neutral-600 max-w-sm">
              Start completing your recovery actions and mood check-ins to see your progress trends.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface BiometricTrendChartProps {
  data: BiometricData[]
  isImproving: boolean
}

export function BiometricTrendChart({ data, isImproving }: BiometricTrendChartProps) {
  return (
    <Card className="border-neutral-200">
      <CardContent className="pt-6">
        {data.some(d => d.hrv !== null || d.rhr !== null) ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="displayDate" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<BiometricTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="hrv" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                  name="Recovery Readiness"
                />
                <Line 
                  type="monotone" 
                  dataKey="rhr" 
                  stroke="#6b7280" 
                  strokeWidth={2}
                  dot={{ fill: '#6b7280', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                  name="Resting Pulse"
                />
              </LineChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 py-2 border-t border-neutral-100 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-neutral-600">Recovery Readiness</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-neutral-500 rounded"></div>
                <span className="text-neutral-600">Resting Pulse (bpm)</span>
              </div>
            </div>
            
            {/* Trend Caption */}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                {isImproving 
                  ? "🎉 Your recovery readiness is trending upward — great recovery!" 
                  : "💙 Keep focusing on recovery practices to support your nervous system."}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Heart className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No recovery data yet</h3>
            <p className="text-sm text-neutral-600 max-w-sm">
              Connect your wearable device to see your recovery readiness and biometric trends.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}