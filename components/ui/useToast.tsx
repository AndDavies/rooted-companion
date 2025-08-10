"use client"
import { createContext, ReactNode, useContext, useMemo, useState } from 'react'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

type ToastContextValue = {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const value = useMemo<ToastContextValue>(() => ({
    toasts,
    toast: (t) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, ...t }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
      }, 4000)
    },
    dismiss: (id) => setToasts((prev) => prev.filter((x) => x.id !== id)),
  }), [toasts])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'rounded-md border px-4 py-3 shadow-md min-w-[260px] max-w-[360px] bg-white',
              t.variant === 'destructive' ? 'border-red-300' : t.variant === 'success' ? 'border-emerald-300' : 'border-neutral-200',
            ].join(' ')}
          >
            {t.title && <div className="font-medium mb-1">{t.title}</div>}
            {t.description && <div className="text-sm text-neutral-600">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}


