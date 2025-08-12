"use client"
import { useState } from 'react'
import { TemplateImportModal, TemplateJsonModal } from './ProgramModalsClient'
import { ProgramBuilderModal } from './ProgramBuilderModal'
import { useEffect } from 'react'

export type ProgramTplRow = {
  id: string
  name: string
  version: number
  description: string | null
  audience_tags: string[] | null
  updated_at: string | null
  day_count?: number
}

export default function ProgramsClient({ templates }: { templates: ProgramTplRow[] }) {
  const [openCreate, setOpenCreate] = useState(false)
  const [openBuilder, setOpenBuilder] = useState(false)
  const [openImport, setOpenImport] = useState(false)
  const [editTpl, setEditTpl] = useState<ProgramTplRow | null>(null)
  const [rows, setRows] = useState<ProgramTplRow[]>(templates)
  // const [loading, setLoading] = useState(false)
  const [drawer, setDrawer] = useState<{ open: boolean; name?: string; version?: number }>(() => ({ open: false }))
  const refresh = () => window.location.reload()

  useEffect(() => { setRows(templates) }, [templates])

  // Optional: fetch enriched list with day counts
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        // setLoading(true)
        const r = await fetch('/api/admin/program-templates/list-with-days')
        const body = await r.json().catch(() => ({})) as { data?: ProgramTplRow[] }
        if (mounted && r.ok && Array.isArray(body.data)) setRows(body.data)
      } catch { /* ignore */ }
      finally { /* setLoading(false) */ }
    })()
    return () => { mounted = false }
  }, [])

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Program Templates</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded bg-neutral-900 text-white" onClick={() => setOpenBuilder(true)}>Create Template</button>
          <button className="px-3 py-2 rounded border" onClick={() => setOpenCreate(true)}>Create via JSON</button>
          <button className="px-3 py-2 rounded border" onClick={() => setOpenImport(true)}>Bulk Import JSON</button>
        </div>
      </div>
      <table className="w-full text-sm border rounded overflow-hidden table-fixed">
        <thead className="bg-neutral-50">
          <tr>
            <th className="text-left p-2 border-b w-[38%]">Name</th>
            <th className="text-left p-2 border-b w-[10%]">Version</th>
            <th className="text-left p-2 border-b w-[12%]">Days</th>
            <th className="text-left p-2 border-b w-[18%]">Updated</th>
            <th className="text-left p-2 border-b w-[22%]">Actions</th>
          </tr>
        </thead>
        <tbody>
          {(rows.length ? rows : templates).map((t) => (
            <tr key={t.id} className="border-b last:border-0">
              <td className="p-2">{t.name}</td>
              <td className="p-2 font-mono">{t.version}</td>
              <td className="p-2">{typeof t.day_count === 'number' ? t.day_count : '-'}</td>
              <td className="p-2">{t.updated_at ? new Date(t.updated_at).toLocaleString() : ''}</td>
              <td className="p-2">
                <div className="flex items-center gap-2">
                  <button
                    className="px-3 py-1.5 rounded-full border text-sm whitespace-nowrap hover:bg-neutral-50"
                    onClick={() => setDrawer({ open: true, name: t.name, version: t.version })}
                  >
                    Load Preview
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-full border text-sm whitespace-nowrap hover:bg-neutral-50"
                    onClick={() => setEditTpl({ ...t, version: (t.version ?? 0) + 1 })}
                  >
                    Clone as New Version
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ProgramBuilderModal open={openBuilder} onClose={() => setOpenBuilder(false)} onSaved={refresh} />
      <TemplateJsonModal open={openCreate || !!editTpl} onClose={() => { setOpenCreate(false); setEditTpl(null) }} initial={editTpl ? { name: editTpl.name, version: editTpl.version, description: editTpl.description ?? undefined, audience_tags: editTpl.audience_tags ?? undefined, days: [] } : undefined} onSaved={refresh} />
      <TemplateImportModal open={openImport} onClose={() => setOpenImport(false)} onImported={refresh} />

      {/* Right Drawer for Preview */}
      {drawer.open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawer({ open: false })} />
          <div className="absolute top-0 right-0 h-full w-[520px] max-w-[95vw] bg-white shadow-xl border-l animate-[slideIn_.25s_ease-out_forwards]">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm text-neutral-500">Preview</div>
                <div className="text-lg font-semibold">{drawer.name} <span className="text-neutral-500">v{drawer.version}</span></div>
              </div>
              <button className="px-2 py-1 rounded border" onClick={() => setDrawer({ open: false })}>Close</button>
            </div>
            <div className="p-4 overflow-auto h-[calc(100%-64px)]">
              {/* Reuse existing preview API endpoint */}
              {drawer.name && drawer.version ? (
                <PreviewBody name={drawer.name} version={drawer.version} />
              ) : null}
            </div>
          </div>
          {/* keyframes */}
          <style jsx>{`
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0.6; }
              to { transform: translateX(0%); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

function PreviewBody({ name, version }: { name: string; version: number }) {
  const [data, setData] = useState<unknown[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        const r = await fetch(`/api/admin/program-templates/preview?name=${encodeURIComponent(name)}&version=${version}`)
        const body = await r.json().catch(() => ({}))
        if (mounted && r.ok) setData((body?.data as unknown[]) ?? [])
        else if (mounted && !r.ok) setError(String(body?.error ?? 'Failed to load'))
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [name, version])

  if (loading) return <div className="text-sm text-neutral-600">Loading…</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>
  if (!data || data.length === 0) return <div className="text-sm text-neutral-500">No preview data.</div>

  return (
    <div className="space-y-3">
      {(data as { template_id?: string; day_number?: string | number; items?: { slot_hint: string; task_ref: string; default_duration?: number }[] }[]).map((row) => (
        <div key={`${row.template_id}-${row.day_number}`} className="border rounded p-2">
          <div className="font-medium">Day {row.day_number}</div>
          <ul className="list-disc pl-6 text-sm">
            {(row.items ?? []).map((it, idx) => (
              <li key={`${row.template_id}-${row.day_number}-${idx}`}>
                <span className="font-mono">{it.slot_hint}</span> – <span className="font-mono">{it.task_ref}</span>{it.default_duration ? ` (${it.default_duration}m)` : ''}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}


