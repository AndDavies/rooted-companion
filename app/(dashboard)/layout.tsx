import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import DashboardNav from '@/components/ui/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  
  if (error || !data?.user) {
    redirect('/login')
  }

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  )
}