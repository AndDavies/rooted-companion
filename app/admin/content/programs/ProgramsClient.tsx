"use client"
import { useState } from 'react'
import { TemplateImportModal, TemplateJsonModal, TemplatePreview } from './ProgramModalsClient'

export type ProgramTplRow = {
  id: string
  name: string
  version: number
  description: string | null
  audience_tags: string[] | null
  updated_at: string | null
}

export default function ProgramsClient({ templates }: { templates: ProgramTplRow[] }) {
  const [openCreate, setOpenCreate] = useState(false)
  const [openImport, setOpenImport] = useState(false)
  const [editTpl, setEditTpl] = useState<ProgramTplRow | null>(null)
  const refresh = () => window.location.reload()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Program Templates</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-neutral-900 text-white" onClick={() => setOpenCreate(true)}>Create Template</button>
          <button className="px-3 py-2 rounded border" onClick={() => setOpenImport(true)}>Bulk Import JSON</button>
        </div>
      </div>
      <table className="w-full text-sm border rounded overflow-hidden">
        <thead className="bg-neutral-50">
          <tr>
            <th className="text-left p-2 border-b">Name</th>
            <th className="text-left p-2 border-b">Version</th>
            <th className="text-left p-2 border-b">Updated</th>
            <th className="text-left p-2 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-b last:border-0">
              <td className="p-2">{t.name}</td>
              <td className="p-2 font-mono">{t.version}</td>
              <td className="p-2">{t.updated_at ? new Date(t.updated_at).toLocaleString() : ''}</td>
              <td className="p-2 space-x-2">
                <details className="inline">
                  <summary className="px-2 py-1 rounded border inline-block cursor-pointer">Preview</summary>
                  <div className="mt-2"><TemplatePreview name={t.name} version={t.version} /></div>
                </details>
                <button className="px-2 py-1 rounded border" onClick={() => setEditTpl({ ...t, version: (t.version ?? 0) + 1 })}>Clone as New Version</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <TemplateJsonModal open={openCreate || !!editTpl} onClose={() => { setOpenCreate(false); setEditTpl(null) }} initial={editTpl ? { name: editTpl.name, version: editTpl.version, description: editTpl.description ?? undefined, audience_tags: editTpl.audience_tags ?? undefined, days: [] } : undefined} onSaved={refresh} />
      <TemplateImportModal open={openImport} onClose={() => setOpenImport(false)} onImported={refresh} />
    </div>
  )
}


