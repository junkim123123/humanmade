import { listAdminQueue } from '@/server/actions/admin'
import { requireAdminUser } from '@/lib/auth/admin'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminQueuePage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; paid?: string }> }) {
  await requireAdminUser()
  const resolved = await searchParams
  const search = resolved?.q || ''
  const statusFilter = resolved?.status || 'all'
  const paidFilter = resolved?.paid || 'all'
  const result = await listAdminQueue({ search })
  const formatContact = (order: any) => {
    const meta = order?.metadata || {} as any
    return order.contact_email || order.contact_whatsapp || meta.contact_email || meta.contact_whatsapp || meta.contact || '—'
  }

  // Determine if order is paid (has clicked "Start verification" = status moved past initial)
  const isPaid = (order: any) => {
    // If status is past 'awaiting_contact', user has initiated verification (paid)
    const unpaidStatuses = ['awaiting_contact']
    return !unpaidStatuses.includes(order.status)
  }

  // Check if action required (status is awaiting_contact after user clicked "Start verification")
  const requiresAction = (order: any) => {
    // If status is 'awaiting_contact', it means user clicked "Start verification" and is waiting for admin contact
    return order.status === 'awaiting_contact'
  }

  const statusFilters = [
    { id: 'all', label: 'All', matches: (s: string) => true },
    { id: 'awaiting_contact', label: 'Awaiting contact', matches: (s: string) => s === 'awaiting_contact' },
    { id: 'contacted', label: 'Contacted', matches: (s: string) => s === 'contacted' },
    { id: 'meeting_scheduled', label: 'Meeting scheduled', matches: (s: string) => s === 'meeting_scheduled' },
    { id: 'quotes_received', label: 'Quotes received', matches: (s: string) => ['awaiting_invoice', 'awaiting_payment', 'in_progress', 'pending_shipment', 'shipped'].includes(s) },
    { id: 'closed', label: 'Closed', matches: (s: string) => s === 'closed' },
  ]

  const paidFilters = [
    { id: 'all', label: 'All', matches: (o: any) => true },
    { id: 'paid', label: 'Paid', matches: (o: any) => isPaid(o) },
    { id: 'free', label: 'Free', matches: (o: any) => !isPaid(o) },
  ]

  const activeFilter = statusFilters.find((f) => f.id === statusFilter) || statusFilters[0]
  const activePaidFilter = paidFilters.find((f) => f.id === paidFilter) || paidFilters[0]
  const filteredOrders = (result.orders || []).filter((order: any) => 
    activeFilter.matches(order.status) && activePaidFilter.matches(order)
  )
  const hasEvidence = filteredOrders.some((order: any) => !!order.report_snapshot_json?.evidence_tier)

  // Group orders by paid status
  const paidOrders = filteredOrders.filter((o: any) => isPaid(o))
  const freeOrders = filteredOrders.filter((o: any) => !isPaid(o))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ops Queue</h1>
          <p className="text-slate-600">Requests awaiting contact</p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search product or email"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-sm font-semibold text-slate-600 mr-2">Status:</span>
        {statusFilters.map((f) => {
          const url = new URLSearchParams()
          if (search) url.set('q', search)
          if (f.id !== 'all') url.set('status', f.id)
          if (paidFilter !== 'all') url.set('paid', paidFilter)
          const href = url.toString() ? `?${url.toString()}` : ''
          const active = f.id === activeFilter.id
          return (
            <Link
              key={f.id}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                active ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-semibold text-slate-600 mr-2">Payment:</span>
        {paidFilters.map((f) => {
          const url = new URLSearchParams()
          if (search) url.set('q', search)
          if (statusFilter !== 'all') url.set('status', statusFilter)
          if (f.id !== 'all') url.set('paid', f.id)
          const href = url.toString() ? `?${url.toString()}` : ''
          const active = f.id === activePaidFilter.id
          return (
            <Link
              key={f.id}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                active ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {!result.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error || 'Failed to load queue'}
        </div>
      )}

      {result.success && (
        <div className="space-y-6">
          {/* Paid Orders Section */}
          {paidOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-slate-900">Paid Requests</h3>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{paidOrders.length}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Customer</th>
                      {hasEvidence && <th className="px-4 py-3">Evidence</th>}
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paidOrders.map((order: any) => {
                      const actionRequired = requiresAction(order)
                      return (
                        <tr
                          key={order.id}
                          className={`hover:bg-slate-50 ${actionRequired ? 'bg-red-50 border-l-4 border-red-500' : ''}`}
                        >
                          <td className="px-4 py-3 text-slate-700">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{order.product_name}</div>
                            {actionRequired && (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span className="text-xs font-semibold text-red-600">Action Required</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="font-semibold text-slate-900">{(order.profiles as any)?.email || order.user_id || '—'}</div>
                            <div className="text-xs text-slate-600">{formatContact(order)}</div>
                          </td>
                          {hasEvidence && (
                            <td className="px-4 py-3 text-slate-700">{order.report_snapshot_json?.evidence_tier || '—'}</td>
                          )}
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              actionRequired
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link href={`/admin/orders/${order.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open</Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Free Orders Section */}
          {freeOrders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-slate-900">Free Requests</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{freeOrders.length}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Customer</th>
                      {hasEvidence && <th className="px-4 py-3">Evidence</th>}
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {freeOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-700">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{order.product_name}</td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-semibold text-slate-900">{(order.profiles as any)?.email || order.user_id || '—'}</div>
                          <div className="text-xs text-slate-600">{formatContact(order)}</div>
                        </td>
                        {hasEvidence && (
                          <td className="px-4 py-3 text-slate-700">{order.report_snapshot_json?.evidence_tier || '—'}</td>
                        )}
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/admin/orders/${order.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800">Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredOrders.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
              <p className="text-slate-500">No requests matching this filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
