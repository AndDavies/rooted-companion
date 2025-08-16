/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import PlanningActions from "./PlanningActions";
import { CheckCircle2, Circle, Wind, Zap, Moon, Apple, Brain, Heart, Sparkles, Clock, ChevronDown, ChevronRight, Info, Settings, Lightbulb, AlertTriangle, BookOpen, Play } from "lucide-react";
import { parseTaskContent } from "@/lib/tasks/contentSchema";

export type RecoveryPlanTask = {
  id: string;
  date: string;
  title: string;
  rationale: string | null;
  category: string | null;
  pillar?: string | null;
  slug?: string | null;
  time_suggestion: string | null;
  scheduled_at?: string | null;
  completed: boolean | null;
  task_payload?: { content?: unknown } | null;
  duration_minutes?: number | null;
  slot_hint?: string | null;
};

export type DayGroup = {
  date: string;
  label: string; // e.g., "Mon 10"
  tasks: RecoveryPlanTask[];
};

function getCategoryIcon(category: string) {
  switch (category) {
    case "breathwork":
    case "breath":
      return Wind;
    case "movement":
      return Zap;
    case "sleep":
      return Moon;
    case "nutrition":
    case "food":
      return Apple;
    case "mindset":
    case "focus":
      return Brain;
    case "joy":
      return Heart;
    default:
      return Sparkles;
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "breathwork":
    case "breath":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "movement":
      return "bg-sage-50 text-sage-700 border-sage-200";
    case "sleep":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "nutrition":
    case "food":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "mindset":
    case "focus":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "joy":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-neutral-50 text-neutral-700 border-neutral-200";
  }
}

function getTimeIcon(timeSuggestion: string | null) {
  switch (timeSuggestion) {
    case "morning":
      return "☀️";
    case "afternoon":
      return "🌅";
    case "evening":
      return "🌙";
    case "flexible":
    default:
      return "⏰";
  }
}

export default function DailyTabsClient({
  days,
  todayIndex,
}: {
  days: DayGroup[];
  todayIndex: number; // -1 means there is no today in this plan
}) {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    setActive(0);
  }, [days]);

  const activeDay = days[active];
  const completedTasks = activeDay?.tasks.filter((t) => t.completed).length ?? 0;
  const totalTasks = activeDay?.tasks.length ?? 0;
  const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const scheduledMinutes = (activeDay?.tasks || []).reduce((sum, t) => sum + (t.duration_minutes ?? 0), 0);
  const completedMinutes = (activeDay?.tasks || []).reduce((sum, t) => sum + ((t.completed ? (t.duration_minutes ?? 0) : 0)), 0);

  const hasToday = todayIndex >= 0 && todayIndex < days.length;

  return (
    <div className="space-y-8">
      {/* Modern Day Navigation */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">Daily Schedule</h2>
          <div className="text-sm text-neutral-500">
            {completedTasks} of {totalTasks} complete
          </div>
        </div>
        
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {days.map((d, idx) => {
            const isToday = hasToday && idx === todayIndex;
            const isActive = idx === active;
            const dayTasks = d.tasks;
            const dayCompleted = dayTasks.filter(t => t.completed).length;
            const dayTotal = dayTasks.length;
            const completionRate = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;
            
            return (
              <button
                key={d.date}
                onClick={() => setActive(idx)}
                className={`relative flex flex-col items-center px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 min-w-[80px] ${
                  isActive
                    ? "bg-sage-500 text-white shadow-lg transform scale-105"
                    : isToday
                    ? "bg-sage-50 text-sage-700 border-2 border-sage-200 hover:bg-sage-100"
                    : "bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <div className="font-semibold">
                  {isToday ? "Today" : d.label}
                </div>
                <div className={`text-xs mt-1 ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
                  {dayCompleted}/{dayTotal}
                </div>
                {completionRate > 0 && (
                  <div className={`absolute bottom-0 left-0 h-1 rounded-full transition-all duration-300 ${
                    isActive ? 'bg-white/30' : 'bg-sage-300'
                  }`} style={{ width: `${completionRate}%` }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Activities Section */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {hasToday && active === todayIndex ? "Today's Activities" : `${activeDay?.label} Activities`}
              </h2>
              <p className="text-sm text-neutral-600 mt-1">
                {completedMinutes}/{scheduledMinutes} minutes • {completedTasks} of {totalTasks} complete
              </p>
            </div>
            {/* Compact progress ring */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg width="56" height="56" viewBox="0 0 36 36" className="-rotate-90">
                  <path d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                  <path d="M18 2a16 16 0 1 1 0 32" fill="none" stroke="#059669" strokeLinecap="round"
                    strokeWidth="3" strokeDasharray={`${pct}, 100`} className="transition-all duration-500" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-neutral-900">{pct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Activity Cards */}
        <div className="p-6 space-y-4">
          {activeDay?.tasks.map((task) => {
            const IconComponent = getCategoryIcon(task.category || "general");
            const content = parseTaskContent((task.task_payload as { content?: unknown } | undefined)?.content) || {};
            
            return (
              <div
                key={task.id}
                className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
                  task.completed
                    ? "bg-sage-50 border-sage-200 shadow-sm"
                    : "bg-white border-neutral-200 hover:border-sage-200"
                }`}
              >
                {/* Completion Status Indicator */}
                <div className={`absolute top-4 right-4 ${task.completed ? 'text-sage-600' : 'text-neutral-400'}`}>
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </div>

                <div className="p-6">
                  {/* Task Header */}
                  <div className="flex items-start gap-4 mb-4">
                    {/* Pillar Icon & Tag */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${getCategoryColor(task.category || "general")}`}>
                      <IconComponent className="w-4 h-4" />
                      <span className="capitalize">{task.pillar || task.category || "general"}</span>
                    </div>
                    
                    {/* Time & Duration Badges */}
                    <div className="flex items-center gap-2 ml-auto">
                      {task.duration_minutes && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full">
                          <Clock className="w-3 h-3" />
                          {task.duration_minutes}min
                        </span>
                      )}
                      {task.time_suggestion && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full">
                          {task.scheduled_at
                            ? new Date(task.scheduled_at).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : `${task.time_suggestion}`}
                        </span>
                      )}
                      {content.effort_rpe && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full">
                          RPE {content.effort_rpe}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task Title & Description */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">{task.title}</h3>
                    {task.rationale && (
                      <div className="bg-sky-50 border-l-4 border-sky-200 p-3 rounded-r-lg">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-sky-900 mb-1">Why this matters</p>
                            <p className="text-sm text-sky-700">{task.rationale}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Player (if available) */}
                  {Array.isArray(content.media) && content.media.length > 0 && (
                    <div className="mb-4">
                      {content.media.map((m, i) => (
                        <div key={i} className="relative bg-neutral-900 rounded-xl overflow-hidden">
                          {m.type === 'video' ? (
                            <>
                              <video 
                                controls 
                                playsInline 
                                className="w-full h-48 object-cover"
                                poster="/images/video-thumbnail-placeholder.jpg"
                              >
                                <source src={m.url} />
                              </video>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                  <Play className="w-8 h-8 text-white" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <audio controls className="w-full">
                              <source src={m.url} />
                            </audio>
                          )}
                          {m.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                              <p className="text-sm text-white">{m.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collapsible Content Sections */}
                  <div className="space-y-3">
                    {/* How To Section */}
                    {Array.isArray(content.how_to) && content.how_to.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-medium text-neutral-800 cursor-pointer hover:text-sage-700 transition-colors">
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          <BookOpen className="w-4 h-4" />
                          How to
                        </summary>
                        <div className="mt-3 ml-6 bg-neutral-50 rounded-lg p-4">
                          <ol className="list-decimal list-inside text-sm text-neutral-700 space-y-2">
                            {content.how_to.map((step, i) => (
                              <li key={i} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      </details>
                    )}

                    {/* Cues Section */}
                    {Array.isArray(content.cues) && content.cues.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-medium text-neutral-800 cursor-pointer hover:text-sage-700 transition-colors">
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          <Lightbulb className="w-4 h-4" />
                          Cues
                        </summary>
                        <div className="mt-3 ml-6">
                          <div className="flex flex-wrap gap-2">
                            {content.cues.map((cue, i) => (
                              <span key={i} className="inline-flex items-center px-3 py-1 text-sm bg-sage-100 text-sage-800 rounded-full border border-sage-200">
                                {cue}
                              </span>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Modifications Section */}
                    {Array.isArray(content.modifications) && content.modifications.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-medium text-neutral-800 cursor-pointer hover:text-sage-700 transition-colors">
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          <Settings className="w-4 h-4" />
                          Modifications
                        </summary>
                        <div className="mt-3 ml-6 bg-neutral-50 rounded-lg p-4">
                          <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
                            {content.modifications.map((mod, i) => (
                              <li key={i} className="leading-relaxed">{mod}</li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}

                    {/* Common Mistakes Section */}
                    {Array.isArray(content.common_mistakes) && content.common_mistakes.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-medium text-neutral-800 cursor-pointer hover:text-amber-700 transition-colors">
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          <AlertTriangle className="w-4 h-4" />
                          Common Mistakes
                        </summary>
                        <div className="mt-3 ml-6 bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
                            {content.common_mistakes.map((mistake, i) => (
                              <li key={i} className="leading-relaxed">{mistake}</li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    )}

                    {/* Alternatives Section */}
                    {Array.isArray(content.alternatives) && content.alternatives.length > 0 && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-medium text-neutral-800 cursor-pointer hover:text-sage-700 transition-colors">
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          <Sparkles className="w-4 h-4" />
                          Alternatives
                        </summary>
                        <div className="mt-3 ml-6 bg-neutral-50 rounded-lg p-4">
                          <div className="space-y-2">
                            {content.alternatives.map((alt, i) => (
                              <div key={i} className="text-sm text-neutral-700">
                                <span className="font-medium">{alt.slug}</span>
                                {alt.note && <span className="text-neutral-600"> - {alt.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Evidence Section */}
                    {content.description && (
                      <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-medium text-neutral-800 cursor-pointer hover:text-sky-700 transition-colors">
                          <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                          <BookOpen className="w-4 h-4" />
                          Evidence
                        </summary>
                        <div className="mt-3 ml-6 bg-sky-50 rounded-lg p-4 border border-sky-200">
                          <p className="text-sm text-sky-800 leading-relaxed">{content.description}</p>
                        </div>
                      </details>
                    )}
                  </div>

                  {/* Action Button */}
                  {!task.completed && hasToday && active === todayIndex && (
                    <div className="mt-6 pt-4 border-t border-neutral-200">
                      <PlanningActions taskId={task.id} />
                    </div>
                  )}
                  
                  {/* Completion Celebration */}
                  {task.completed && (
                    <div className="mt-6 pt-4 border-t border-sage-200">
                      <div className="bg-sage-100 rounded-lg p-4 text-center">
                        <CheckCircle2 className="w-6 h-6 text-sage-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-sage-800">
                          You've just completed your {task.title} — your body thanks you!
                        </p>
                        <div className="flex items-center justify-center gap-4 mt-3">
                          <button className="text-sm text-sage-700 hover:text-sage-800 font-medium">
                            Review Day 2 →
                          </button>
                          <button className="text-sm text-sage-700 hover:text-sage-800 font-medium">
                            Add reflection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Completed Tasks Summary */}
        {completedTasks > 0 && (
          <div className="px-6 pb-6">
            <details className="group">
              <summary className="flex items-center gap-2 text-sm font-medium text-neutral-700 cursor-pointer hover:text-sage-700 transition-colors">
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
                <CheckCircle2 className="w-4 h-4 text-sage-600" />
                Completed ({completedTasks})
              </summary>
              <div className="mt-3 ml-6 space-y-2">
                {activeDay?.tasks
                  .filter((t) => t.completed)
                  .map((t) => (
                    <div key={`done-${t.id}`} className="flex items-center gap-2 text-sm text-neutral-600">
                      <CheckCircle2 className="w-4 h-4 text-sage-500" />
                      <span>{t.title}</span>
                    </div>
                  ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
