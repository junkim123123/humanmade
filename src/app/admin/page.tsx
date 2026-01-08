import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { FileText, CheckSquare, Inbox, MessageSquare, DollarSign, TrendingUp } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import { requireAdminUser } from '@/lib/auth/admin'

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
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

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

async function getRevenueStats() {
  const supabase = getSupabaseAdmin()
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  try {
    // Get verification fees ($45 per verification request order)
    const { data: verificationOrders } = await supabase
      .from('orders')
      .select('id, created_at, metadata')
      .eq('type', 'verification_request')
      .gte('created_at', lastMonth.toISOString())
      .in('status', ['awaiting_payment', 'in_progress', 'pending_shipment', 'shipped'])

    const verificationFees = (verificationOrders?.length || 0) * 45

    // Get execution commissions (7% of FOB - simplified: count orders that moved past verification)
    const { data: executionOrders } = await supabase
      .from('orders')
      .select('id, created_at, metadata')
      .eq('type', 'execution')
      .gte('created_at', lastMonth.toISOString())

    // Estimate: Assume average order value of $5000, 7% commission = $350
    // This is a simplified calculation - you'd want to track actual FOB values
    const estimatedCommissionPerOrder = 350
    const executionCommissions = (executionOrders?.length || 0) * estimatedCommissionPerOrder

    return {
      verificationFees,
      executionCommissions,
      totalRevenue: verificationFees + executionCommissions,
    }
  } catch (error) {
    console.error('[getRevenueStats] failed', error)
    return {
      verificationFees: 0,
      executionCommissions: 0,
      totalRevenue: 0,
    }
  }
}

async function getLeadHeatmap() {
  const supabase = getSupabaseAdmin()
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  try {
    const { data: reports } = await supabase
      .from('reports')
      .select('product_name, report_snapshot_json')
      .gte('created_at', lastMonth.toISOString())
      .limit(1000)

    // Extract categories from product names or report data
    // Common categories: Confectionery, Toys, Snacks, Electronics, Apparel, etc.
    const categoryKeywords: Record<string, string[]> = {
      'Confectionery': ['candy', 'chocolate', 'marshmallow', 'gum', 'sweet', 'confectionery', 'sugar'],
      'Toys': ['toy', 'doll', 'game', 'puzzle', 'figure', 'action', 'plush', 'stuffed'],
      'Snacks': ['snack', 'chip', 'cracker', 'pretzel', 'nuts', 'trail mix'],
      'Electronics': ['electronic', 'cable', 'charger', 'battery', 'usb', 'led', 'light'],
      'Apparel': ['shirt', 'pants', 'dress', 'jacket', 'cloth', 'wear', 'apparel'],
      'Other': [],
    }

    const categoryCounts: Record<string, number> = {
      'Confectionery': 0,
      'Toys': 0,
      'Snacks': 0,
      'Electronics': 0,
      'Apparel': 0,
      'Other': 0,
    }

    reports?.forEach((report: any) => {
      const productName = (report.product_name || '').toLowerCase()
      let categorized = false

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (category === 'Other') continue
        if (keywords.some(keyword => productName.includes(keyword))) {
          categoryCounts[category]++
          categorized = true
          break
        }
      }

      if (!categorized) {
        categoryCounts['Other']++
      }
    })

    // Sort by count descending
    const sorted = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .filter(item => item.count > 0)

    return sorted
  } catch (error) {
    console.error('[getLeadHeatmap] failed', error)
    return []
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
  await requireAdminUser()

  const stats = await getStats()
  const revenueStats = await getRevenueStats()
  const leadHeatmap = await getLeadHeatmap()

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Operational overview and key metrics</p>
      </div>

      {/* Revenue Snapshot */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-blue-50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-white/50">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Revenue Snapshot (Last 30 Days)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600 mb-1">Verification Fees</p>
            <p className="text-2xl font-bold text-slate-900">${revenueStats.verificationFees.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">$45 per verification request</p>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <p className="text-sm font-medium text-slate-600 mb-1">Execution Commissions</p>
            <p className="text-2xl font-bold text-slate-900">${revenueStats.executionCommissions.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">7% of FOB (estimated)</p>
          </div>
          <div className="bg-white/70 rounded-lg p-4 border-2 border-emerald-200">
            <p className="text-sm font-medium text-slate-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-700">${revenueStats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Lead Heatmap */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-50">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Lead Heatmap</h2>
          <p className="text-sm text-slate-500">Products searched most (Last 30 Days)</p>
        </div>
        {leadHeatmap.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No search data available yet</p>
        ) : (
          <div className="space-y-3">
            {leadHeatmap.map(({ category, count }) => {
              const maxCount = leadHeatmap[0]?.count || 1
              const percentage = (count / maxCount) * 100
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-900">{category}</span>
                    <span className="text-slate-600 font-semibold">{count} searches</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Verification requests" value={stats.verificationRequests} icon={CheckSquare} />
        <StatCard title="In queue now" value={stats.inQueue} icon={Inbox} />
        <StatCard title="Quotes today" value={stats.quotesToday} icon={FileText} />
        <StatCard title="Active conversations" value={stats.activeConversations} icon={MessageSquare} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/queue"
          className="rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-blue-400 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-2">Money Queue (Paid)</h3>
          <p className="text-sm text-slate-600">Manage verification requests that require action</p>
          <p className="text-xs text-blue-600 mt-2 font-semibold">View Queue →</p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-xl border-2 border-slate-200 bg-white p-6 hover:border-blue-400 hover:shadow-md transition-all"
        >
          <h3 className="text-lg font-bold text-slate-900 mb-2">User Mgmt</h3>
          <p className="text-sm text-slate-600">Monitor user activity and manage reports</p>
          <p className="text-xs text-blue-600 mt-2 font-semibold">View Users →</p>
        </Link>
      </div>
    </div>
  )
}
