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
      <DashboardNav user={data.user} />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  )
}