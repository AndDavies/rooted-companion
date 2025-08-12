import Link from 'next/link'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 py-4">
          <Link href="/admin/content" className="font-semibold">Admin</Link>
          <Link href="/admin/content/tasks">Tasks</Link>
          <Link href="/admin/content/programs">Programs</Link>
        </nav>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  )
}


