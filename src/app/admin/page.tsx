import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Users, FileText, CheckSquare, ShoppingCart, Inbox, UploadCloud, MessageSquare } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

const queueStatuses = ['awaiting_contact', 'contacted', 'meeting_scheduled']

type QueueItem = {
  id: string;
  productName: string;
  email: string;
  status?: string;
  quotesCount: number;
  updatedAt?: string;
};

async function getStats() {
  const supabase = getSupabaseAdmin()
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const lastDay = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  type CountResult = { count: number | null; error: any };
  const countOrZero = async (promise: PromiseLike<CountResult>) => {
    const { count, error } = await promise
    if (error) throw error
    return count || 0
  }

  const safeCountOrZero = async (promise: PromiseLike<CountResult>) => {
    try {
      return await countOrZero(promise)
    } catch (err: any) {
      if (err?.message?.includes('relation') || err?.message?.includes('does not exist')) {
        return 0
      }
      throw err
    }
  }

  const [
    users,
    reports,
    verificationRequests,
    inQueue,
    orders,
    quotesToday,
    activeConversations,
    uploadsCollected,
  ] = await Promise.all([
    countOrZero(supabase.from('profiles').select('*', { count: 'exact', head: true })),
    countOrZero(supabase.from('reports').select('*', { count: 'exact', head: true })),
    countOrZero(
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'verification_request')
    ),
    countOrZero(
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'verification_request')
        .in('status', queueStatuses)
    ),
    countOrZero(supabase.from('orders').select('*', { count: 'exact', head: true })),
    countOrZero(
      supabase
        .from('order_quotes')
        .select('*', { count: 'exact', head: true })
        .gte('received_at', todayStart.toISOString())
    ),
    safeCountOrZero(
      supabase
        .from('order_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastDay.toISOString())
    ),
    safeCountOrZero(
      supabase
        .from('order_uploads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastWeek.toISOString())
    ),
  ])

  return {
    users,
    reports,
    verificationRequests,
    inQueue,
    orders,
    quotesToday,
    activeConversations,
    uploadsCollected,
  }
}

async function getQueuePreview() {
  type QueueItem = {
    id: string;
    productName: string;
    email: string;
    status: string;
    quotesCount: number;
    updatedAt: string;
  };
  const supabase = getSupabaseAdmin()
  const { data, error } = await (supabase.from('orders') as any)
    .select('id, product_name, status, updated_at, created_at, report_id, user_id, profiles(email), reports(product_name), order_quotes(count)')
    .eq('type', 'verification_request')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[admin dashboard] queue preview failed', error)
    return []
  }

  return (data || []).map((row: any) => {
    const quotesCount = Array.isArray(row.order_quotes) && row.order_quotes[0]?.count ? row.order_quotes[0].count : 0
    return {
      id: row.id,
      productName: row.product_name || row.reports?.product_name || '—',
      email: row.profiles?.email || row.user_id,
      status: row.status,
      quotesCount,
      updatedAt: row.updated_at || row.created_at,
    }
  })
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: number
  icon: ComponentType<SVGProps<SVGSVGElement>>
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </Card>
  )
}

export default async function AdminDashboard() {
  // TEMP: Allow bypassing role check but still require authentication
  const FORCE_ALLOW_ADMIN = true
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signin?next=/admin')
  }
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const email = user.email ?? 'unknown'
  console.log('[AdminGuard]', {
    userId: user.id,
    email,
    profileRole: profile?.role ?? 'none',
    profileError: profileError?.message ?? null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  })
  const hardcodedAdmins = ['k.myungjun@wustl.edu']
  const isHardcodedAdmin = hardcodedAdmins.includes((user.email ?? '').toLowerCase())
  if (!FORCE_ALLOW_ADMIN && (profileError || (profile?.role !== 'admin' && !isHardcodedAdmin))) {
    redirect('/app')
  }

  const stats = await getStats()
  const queue: QueueItem[] = await getQueuePreview()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Overview of NexSupply platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Verification requests" value={stats.verificationRequests} icon={CheckSquare} />
        <StatCard title="In queue now" value={stats.inQueue} icon={Inbox} />
        <StatCard title="Orders total" value={stats.orders} icon={ShoppingCart} />
        <StatCard title="Quotes received today" value={stats.quotesToday} icon={FileText} />
        <StatCard title="Active conversations" value={stats.activeConversations} icon={MessageSquare} />
        <StatCard title="Uploads collected" value={stats.uploadsCollected} icon={UploadCloud} />
        <StatCard title="Total Users" value={stats.users} icon={Users} />
        <StatCard title="Total Reports" value={stats.reports} icon={FileText} />
      </div>

      <div className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Queue preview</h2>
        {queue.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
            Create a report and click <span className="font-semibold">Start verification</span> to generate your first queue item.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Quotes</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{item.productName}</td>
                    <td className="px-4 py-3 text-slate-700">{item.email}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{item.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.quotesCount}</td>
                    <td className="px-4 py-3 text-slate-600">{
                      item.updatedAt
                        ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(item.updatedAt))
                        : 'Date TBD'
                    }</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
