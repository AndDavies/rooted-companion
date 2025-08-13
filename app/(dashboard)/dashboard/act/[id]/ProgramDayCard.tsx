'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Clock, Target, Zap, Heart, Brain, Moon, Utensils, Dumbbell } from 'lucide-react'

type TaskRow = { 
  slug: string; 
  title: string; 
  description: string | null;
  pillar: 'breath' | 'sleep' | 'food' | 'movement' | 'focus' | 'joy';
  duration_min: number | null;
  duration_max: number | null;
  intensity_tags: string[] | null;
}

type ProgramDay = {
  day: number;
  items: Array<{
    task_ref: string;
    slot_hint?: string;
    default_duration?: number;
  }>;
}

interface ProgramDayCardProps {
  day: ProgramDay;
  taskDetails: Record<string, TaskRow>;
  dayNumber: number;
}

export function ProgramDayCard({ day, taskDetails, dayNumber }: ProgramDayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getPillarIcon = (pillar: string) => {
    switch (pillar) {
      case 'breath': return <Zap className="w-4 h-4" />;
      case 'sleep': return <Moon className="w-4 h-4" />;
      case 'food': return <Utensils className="w-4 h-4" />;
      case 'movement': return <Dumbbell className="w-4 h-4" />;
      case 'focus': return <Brain className="w-4 h-4" />;
      case 'joy': return <Heart className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  }

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'breath': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'sleep': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'food': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'movement': return 'bg-green-50 text-green-700 border-green-200';
      case 'focus': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'joy': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  const getTimeIcon = (slotHint: string | undefined) => {
    if (!slotHint) return <Clock className="w-4 h-4" />;
    
    const hint = slotHint.toLowerCase()
    if (hint.includes('morning') || hint.includes('wake')) return <Clock className="w-4 h-4" />;
    if (hint.includes('afternoon') || hint.includes('midday')) return <Clock className="w-4 h-4" />;
    if (hint.includes('evening') || hint.includes('bed')) return <Clock className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  }

  const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return '15m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  const totalTasks = day.items?.length || 0
  const estimatedDuration = day.items?.reduce((sum, item) => 
    sum + (item.default_duration || taskDetails[item.task_ref]?.duration_min || 15), 0
  ) || 0

  return (
    <Card className="border-neutral-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader 
        className="pb-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
              <span className="text-lg font-bold text-blue-600">{dayNumber}</span>
            </div>
            <div>
              <CardTitle className="text-lg text-neutral-900">
                Day {dayNumber}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-neutral-600 mt-1">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(estimatedDuration)}
                </span>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-neutral-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {day.items?.map((item, index) => {
              const task = taskDetails[item.task_ref];
              const duration = item.default_duration || task?.duration_min || 15;
              
              return (
                <div
                  key={`${dayNumber}-${index}`}
                  className="border rounded-lg p-4 transition-all duration-200 hover:border-neutral-300 bg-white"
                >
                  <div className="flex items-start gap-4">
                    {/* Task Icon and Pillar */}
                    <div className="flex flex-col items-center gap-2">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getPillarColor(task?.pillar || 'default')}`}>
                        {getPillarIcon(task?.pillar || 'default')}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getPillarColor(task?.pillar || 'default')}`}>
                        {task?.pillar ? task.pillar.charAt(0).toUpperCase() + task.pillar.slice(1) : 'General'}
                      </span>
                    </div>

                    {/* Task Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h4 className="font-medium text-neutral-900 text-base mb-1">
                          {task?.title || item.task_ref}
                        </h4>
                        {task?.description && (
                          <p className="text-sm text-neutral-600">{task.description}</p>
                        )}
                      </div>

                      {/* Task Metadata */}
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Duration */}
                        <span className="flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                          <Clock className="w-3 h-3" />
                          {formatDuration(duration)}
                        </span>

                        {/* Time Slot */}
                        {item.slot_hint && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                            {getTimeIcon(item.slot_hint)}
                            {item.slot_hint}
                          </span>
                        )}

                        {/* Intensity Tags */}
                        {task?.intensity_tags && task.intensity_tags.length > 0 && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg border border-amber-200">
                            {task.intensity_tags[0]}
                          </span>
                        )}

                        {/* Duration Range */}
                        {task?.duration_min && task?.duration_max && task.duration_min !== task.duration_max && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg">
                            {task.duration_min}-{task.duration_max}m
                          </span>
                        )}
                      </div>

                      {/* Task Slug (for reference) */}
                      <div className="text-xs text-neutral-500 font-mono bg-neutral-50 px-2 py-1 rounded border">
                        {item.task_ref}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
