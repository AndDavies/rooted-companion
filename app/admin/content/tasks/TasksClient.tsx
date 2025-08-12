"use client"
import { useState } from 'react'
import { TaskCreateEditModal, TaskImportModal } from './TaskModalsClient'
import { SeedButtonClient } from './SeedButtonClient'

export type TaskMin = {
  id: string | null
  pillar: 'breath' | 'sleep' | 'food' | 'movement' | 'focus' | 'joy' | null
  slug: string | null
  title: string | null
  duration_min: number | null
  duration_max: number | null
  intensity_tags: string[] | null
  contraindications?: string[] | null
  evidence_refs?: string[] | null
  zeitgeber_tags?: string[] | null
  default_circadian_slots?: string[] | null
  version: number | null
  description?: string | null
}

export default function TasksClient({ tasks }: { tasks: TaskMin[] }) {
  const [openCreate, setOpenCreate] = useState(false)
  const [openImport, setOpenImport] = useState(false)
  const [editTask, setEditTask] = useState<Partial<TaskMin> | null>(null)

  const refresh = () => window.location.reload()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Task Library</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-neutral-900 text-white" onClick={() => setOpenCreate(true)}>Create Task</button>
          <button className="px-3 py-2 rounded border" onClick={() => setOpenImport(true)}>Bulk Import JSON</button>
          <SeedButtonClient />
        </div>
      </div>
      <table className="w-full text-sm border rounded overflow-hidden table-fixed">
        <thead className="bg-neutral-50">
          <tr>
            <th className="text-left p-2 border-b w-[10%]">Pillar</th>
            <th className="text-left p-2 border-b w-[20%]">Slug</th>
            <th className="text-left p-2 border-b w-[28%]">Title</th>
            <th className="text-left p-2 border-b w-[10%]">Dur</th>
            <th className="text-left p-2 border-b w-[20%]">Tags</th>
            <th className="text-left p-2 border-b w-[6%]">Ver</th>
            <th className="text-left p-2 border-b w-[6%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id ?? t.slug ?? Math.random()} className="border-b last:border-0">
              <td className="p-2 capitalize">{t.pillar ?? ''}</td>
              <td className="p-2 font-mono">{t.slug ?? ''}</td>
              <td className="p-2">{t.title ?? ''}</td>
              <td className="p-2">{t.duration_min ?? ''}{t.duration_max ? `-${t.duration_max}` : ''}</td>
              <td className="p-2">{(t.intensity_tags ?? []).join(', ')}</td>
              <td className="p-2">{t.version ?? ''}</td>
              <td className="p-2">
                <button className="px-2 py-1 rounded border" onClick={() => setEditTask({
                  pillar: t.pillar ?? undefined,
                  slug: t.slug ?? undefined,
                  title: t.title ?? undefined,
                  description: t.description ?? undefined,
                  duration_min: t.duration_min ?? undefined,
                  duration_max: t.duration_max ?? undefined,
                  intensity_tags: t.intensity_tags ?? undefined,
                  contraindications: t.contraindications ?? undefined,
                  evidence_refs: t.evidence_refs ?? undefined,
                  zeitgeber_tags: t.zeitgeber_tags ?? undefined,
                  default_circadian_slots: t.default_circadian_slots ?? undefined,
                  version: t.version ?? undefined,
                })}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <TaskCreateEditModal open={openCreate || !!editTask} onClose={() => { setOpenCreate(false); setEditTask(null) }} initial={editTask ? {
        pillar: editTask.pillar ?? undefined,
        slug: editTask.slug ?? undefined,
        title: editTask.title ?? undefined,
        description: editTask.description ?? undefined,
        duration_min: editTask.duration_min ?? undefined,
        duration_max: editTask.duration_max ?? undefined,
        intensity_tags: editTask.intensity_tags ?? undefined,
        contraindications: editTask.contraindications ?? undefined,
        evidence_refs: editTask.evidence_refs ?? undefined,
        zeitgeber_tags: editTask.zeitgeber_tags ?? undefined,
        default_circadian_slots: editTask.default_circadian_slots ?? undefined,
        version: editTask.version ?? undefined,
      } : undefined} onSaved={refresh} />
      <TaskImportModal open={openImport} onClose={() => setOpenImport(false)} onImported={refresh} />
    </div>
  )
}


