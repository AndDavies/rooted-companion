"use client"
import { useMemo, useState } from 'react'
import { z, ZodTypeAny } from 'zod'

type JsonEditorProps<T extends ZodTypeAny> = {
  schema: T
  value?: unknown
  onChange?: (val: z.infer<T>) => void
  rows?: number
  placeholder?: string
}

export function JsonEditor<T extends ZodTypeAny>({ schema, value, onChange, rows = 14, placeholder }: JsonEditorProps<T>) {
  const [text, setText] = useState<string>(() => value ? JSON.stringify(value, null, 2) : '')
  const [error, setError] = useState<string | null>(null)

  const handleChange = (val: string) => {
    setText(val)
    try {
      const parsed = JSON.parse(val)
      const res = schema.safeParse(parsed)
      if (!res.success) {
        setError(res.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '))
      } else {
        setError(null)
        onChange?.(res.data)
      }
    } catch {
      setError('Invalid JSON')
    }
  }

  const lineCount = useMemo(() => text.split('\n').length, [text])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span>Lines: {lineCount}</span>
      </div>
      <textarea
        className="w-full font-mono text-sm border rounded-md p-3 min-h-[200px]"
        rows={rows}
        placeholder={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
    </div>
  )
}


