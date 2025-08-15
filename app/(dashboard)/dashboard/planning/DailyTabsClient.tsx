"use client";

import React from "react";
import PlanningActions from "./PlanningActions";
import { CheckCircle2, Circle } from "lucide-react";
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
      return "🫁";
    case "movement":
      return "🚶";
    case "sleep":
      return "😴";
    case "nutrition":
      return "🥗";
    case "mindset":
      return "🧠";
    default:
      return "✨";
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "breathwork":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "movement":
      return "bg-green-50 text-green-700 border-green-200";
    case "sleep":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "nutrition":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "mindset":
      return "bg-pink-50 text-pink-700 border-pink-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
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
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {days.map((d, idx) => {
          const isToday = hasToday && idx === todayIndex;
          const isActive = idx === active;
          return (
            <button
              key={d.date}
              onClick={() => setActive(idx)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600"
                  : isToday
                  ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              {isToday ? "Today" : d.label}
            </button>
          );
        })}
      </div>

      {/* Panel header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            {hasToday && active === todayIndex ? "Today’s Activities" : `${activeDay?.label} Activities`}
          </h2>
          <p className="text-sm text-neutral-600">
            {completedTasks} of {totalTasks} complete • {completedMinutes}/{scheduledMinutes} min
          </p>
        </div>
        {/* Daily progress ring */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <svg width="64" height="64" viewBox="0 0 36 36" className="-rotate-90">
              <path d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <path d="M18 2a16 16 0 1 1 0 32" fill="none" stroke="#2563eb" strokeLinecap="round"
                strokeWidth="4" strokeDasharray={`${pct}, 100`} />
            </svg>
            <div className="mt-1 text-sm font-medium text-neutral-900">{pct}%</div>
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {activeDay?.tasks.map((task) => (
          <div
            key={task.id}
            className={`border rounded-lg p-3 transition-all duration-200 ${
              task.completed
                ? "bg-green-50 border-green-200"
                : "bg-white border-neutral-200 hover:border-neutral-300"
            }`}
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
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-lg border ${getCategoryColor(
                      task.category || "general"
                    )}`}
                  >
                    {getCategoryIcon(task.category || "general")} {task.category || "general"}
                  </span>
                  {task.time_suggestion && (
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-lg">
                      {task.scheduled_at
                        ? new Date(task.scheduled_at).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : `${getTimeIcon(task.time_suggestion)} ${task.time_suggestion || "any"}`}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 text-sm mb-1">{task.title}</h4>
                  {task.rationale ? (
                    <p className="text-xs text-neutral-600">{task.rationale.length > 140 ? `${task.rationale.slice(0, 137)}...` : task.rationale}</p>
                  ) : null}
                </div>

                {/* Content collapsibles */}
                {(() => {
                  const content = parseTaskContent((task.task_payload as { content?: unknown } | undefined)?.content) || {}
                  const blocks: React.ReactNode[] = []
                  const hasWhy = (task.rationale && task.rationale.length > 0) || (content.description && content.description.length > 0)
                  if (hasWhy) {
                    blocks.push(
                      <details key="why" className="mt-1">
                        <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Why</summary>
                        <div className="mt-1 text-xs text-neutral-600 space-y-1">
                          {task.rationale ? <p>{task.rationale}</p> : null}
                          {content.description ? <p>{content.description}</p> : null}
                        </div>
                      </details>
                    )
                  }
                  if (Array.isArray(content.how_to) && content.how_to.length) {
                    blocks.push(
                      <details key="howto" className="mt-1">
                        <summary className="text-xs font-medium text-neutral-800 cursor-pointer">How to</summary>
                        <ol className="mt-1 list-decimal list-inside text-xs text-neutral-700 space-y-1">
                          {content.how_to.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                      </details>
                    )
                  }
                  if (Array.isArray(content.cues) && content.cues.length) {
                    blocks.push(
                      <details key="cues" className="mt-1">
                        <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Cues</summary>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {content.cues.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded-full border">
                              {c}
                            </span>
                          ))}
                        </div>
                      </details>
                    )
                  }
                  if (Array.isArray(content.modifications) && content.modifications.length) {
                    blocks.push(
                      <details key="mods" className="mt-1">
                        <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Modifications</summary>
                        <ul className="mt-1 list-disc list-inside text-xs text-neutral-700 space-y-1">
                          {content.modifications.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </details>
                    )
                  }
                  if (Array.isArray(content.common_mistakes) && content.common_mistakes.length) {
                    blocks.push(
                      <details key="mistakes" className="mt-1">
                        <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Common mistakes</summary>
                        <ul className="mt-1 list-disc list-inside text-xs text-neutral-700 space-y-1">
                          {content.common_mistakes.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </details>
                    )
                  }
                  if (Array.isArray(content.media) && content.media.length) {
                    blocks.push(
                      <details key="media" className="mt-1">
                        <summary className="text-xs font-medium text-neutral-800 cursor-pointer">Media</summary>
                        <div className="mt-1 space-y-2">
                          {content.media.map((m, i) => (
                            <div key={i} className="space-y-1">
                              {m.type === 'video' ? (
                                <video controls playsInline className="w-full rounded border">
                                  <source src={m.url} />
                                </video>
                              ) : (
                                <audio controls className="w-full">
                                  <source src={m.url} />
                                </audio>
                              )}
                              {m.caption ? <div className="text-[11px] text-neutral-500">{m.caption}</div> : null}
                            </div>
                          ))}
                        </div>
                      </details>
                    )
                  }
                  return <div className="space-y-1">{blocks}</div>
                })()}

                {/* Only allow marking complete on Today */}
                {!task.completed && hasToday && active === todayIndex && <PlanningActions taskId={task.id} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Done section */}
      {completedTasks > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-neutral-700 cursor-pointer">
            Done ({completedTasks})
          </summary>
          <div className="mt-3 space-y-2">
              {activeDay?.tasks
              .filter((t) => t.completed)
              .map((t) => (
                <div key={`done-${t.id}`} className="text-sm text-neutral-600">
                  {t.title}
                </div>
              ))}
          </div>
        </details>
      )}
    </div>
  );
}
