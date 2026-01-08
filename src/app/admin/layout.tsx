import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'
import { requireAdminUser } from '@/lib/auth/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dev-only bypass to allow admin routes locally
  const forceAdminDev = process.env.NODE_ENV === 'development'
  const admin = forceAdminDev ? true : await requireAdminUser()

  if (!admin) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
