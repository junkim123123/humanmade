import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { getAdminOrderWorkspace, updateOrderStatusAdmin, addAdminOrderUpload, upsertAdminQuote } from '@/server/actions/admin'
import { requireAdminUser } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'
import { AdminMessagesPanel } from './AdminMessagesPanel'

export const dynamic = 'force-dynamic'

async function handleStatus(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const status = String(formData.get('status') || '') as any
  if (!orderId || !status) return
  await updateOrderStatusAdmin(orderId, status)
  revalidatePath(`/admin/orders/${orderId}`)
}

async function handleAdminUpload(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const title = String(formData.get('title') || '')
  const fileUrl = String(formData.get('fileUrl') || '')
  const description = String(formData.get('description') || '') || null
  const type = String(formData.get('type') || '') || undefined
  const visible = formData.get('visible_to_user') === 'on'
  if (!orderId || !title.trim()) return
  await addAdminOrderUpload(orderId, { title, fileUrl, description, type, visibleToUser: visible })
  revalidatePath(`/admin/orders/${orderId}`)
}

export default async function AdminOrderWorkspace({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requireAdminUser()
  const { orderId } = await params
  const resolvedSearch = await searchParams || {}
  const allowedTabs = ['overview', 'messages', 'quotes']
  const tab = allowedTabs.includes((resolvedSearch?.tab || '') as string) ? (resolvedSearch?.tab as string) : 'overview'
  const detail = await getAdminOrderWorkspace(orderId)

  if (!detail.success || !detail.workspace) {
    return (
      <div className="p-6 space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Workspace failed to load</h1>
        <p className="text-slate-600">Order ID: {orderId}</p>
        <p className="text-sm text-slate-700">Please refresh or try again in a moment.</p>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/queue" className="font-semibold text-blue-600">Back to queue</Link>
        </div>
      </div>
    )
  }

  const workspace = detail.workspace as any
  const { order, messages, uploads, events, report, quotes, cost } = workspace
  const warnings = (detail as any)?.warnings || []
  const metadata = (order as any)?.metadata || {}
  const uploadsUnavailable = warnings.some((w: any) => w.source === 'uploads')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'messages', label: 'Messages' },
    { id: 'quotes', label: 'Quotes' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/admin/orders/${orderId}?tab=${t.id}`}
            className={`px-3 py-2 text-sm font-semibold rounded-md ${tab === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="font-semibold">Some data could not be loaded</div>
          <ul className="list-disc pl-5 space-y-1">
            {Array.from(new Set(warnings.map((w: any) => w.source || 'data'))).map((source, idx) => (
              <li key={idx}>
                {source === 'uploads' ? 'Uploads unavailable right now.' : 'Some details are temporarily unavailable.'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">Order #{order.order_number}</div>
              <h1 className="text-3xl font-bold text-slate-900">{order.product_name || report?.product_name || 'Verification request'}</h1>
              <p className="text-slate-600 mt-2">Status: <span className="font-semibold">{order.status}</span></p>
              <p className="text-slate-600">User: {order.profiles?.email || order.user_id}</p>
              <p className="text-slate-600">Contact: {order.contact_email || order.contact_whatsapp || metadata.contact_email || metadata.contact_whatsapp || metadata.contact || '—'}</p>
              <p className="text-slate-600">Quantity: {order.quantity || metadata.quantity || '—'}</p>
            </div>
            <div className="sticky top-4 flex flex-col gap-2">
              <form action={handleStatus} className="flex gap-2">
                <input type="hidden" name="orderId" value={orderId} />
                <button name="status" value="contacted" className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Mark contacted</button>
                <button name="status" value="meeting_scheduled" className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Schedule meeting</button>
              </form>
              <Link href={`/support?category=sourcing_quotes&orderId=${orderId}`} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white text-center">Request photos</Link>
              <details className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <summary className="cursor-pointer font-semibold text-slate-900">More actions</summary>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { label: 'Mark quoted', value: 'awaiting_invoice' },
                    { label: 'Awaiting payment', value: 'awaiting_payment' },
                    { label: 'Close', value: 'closed' },
                  ].map((action) => (
                    <form key={action.value} action={handleStatus}>
                      <input type="hidden" name="orderId" value={orderId} />
                      <button name="status" value={action.value} className="rounded border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300">
                        {action.label}
                      </button>
                    </form>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Uploads collected</p>
              <p className="text-3xl font-bold text-slate-900">{uploads.length}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Quotes received</p>
              <p className="text-3xl font-bold text-slate-900">{(quotes || []).filter((q: any) => q.supplier_name || q.fob_unit_price).length} / 3</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Cost updated</p>
              <p className="text-3xl font-bold text-slate-900">{cost ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Uploads checklist</h2>
                <p className="text-sm text-slate-600">Track supporting documents from the customer.</p>
              </div>
            </div>
            {uploadsUnavailable && <p className="text-sm text-amber-700">Uploads unavailable right now.</p>}
            <div className="space-y-2">
              {uploads.length === 0 && <p className="text-sm text-slate-600">No uploads yet.</p>}
              {uploads.map((u: any) => (
                <div key={u.id} className="flex items-start justify-between gap-3 rounded border border-slate-100 bg-slate-50 px-3 py-2">
                  <div>
                    <div className="font-semibold text-slate-900">{u.title || u.file_type || u.kind}</div>
                    <div className="text-xs text-slate-600">{u.file_url || u.storage_path}</div>
                    <div className="text-xs text-slate-500">{u.note || '—'}</div>
                    {!u.visible_to_user && <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 text-xs">Internal</span>}
                  </div>
                  <div className="text-xs text-slate-500 text-right">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</div>
                </div>
              ))}
            </div>
            <form action={handleAdminUpload} className="flex flex-col gap-2">
              <input type="hidden" name="orderId" value={orderId} />
              <div className="flex flex-col md:flex-row gap-2">
                <input name="title" placeholder="Title" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
                <input name="fileUrl" placeholder="File URL" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div className="flex flex-col md:flex-row gap-2">
                <input name="type" placeholder="Type (quote, pi, qc_report, other)" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
                <input name="description" placeholder="Description" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
                <label className="flex items-center gap-1 text-sm text-slate-600">
                  <input type="checkbox" name="visible_to_user" className="h-4 w-4" defaultChecked /> Visible to user
                </label>
              </div>
              <button className="self-start rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Add upload</button>
            </form>
          </section>

          <details className="rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-lg font-semibold text-slate-900">Activity</summary>
            <div className="mt-3 divide-y divide-slate-200 border border-slate-100 rounded-lg">
              {events.length === 0 && <div className="p-3 text-sm text-slate-600">No events yet.</div>}
              {events.map((e: any) => (
                <div key={e.id} className="p-3 text-sm flex justify-between gap-4">
                  <div>
                    <div className="font-semibold text-slate-900">{e.event_type}</div>
                    <div className="text-slate-600 text-xs">{JSON.stringify(e.metadata) || '—'}</div>
                  </div>
                  <div className="text-xs text-slate-500">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {tab === 'messages' && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
          </div>
          <AdminMessagesPanel orderId={orderId} initialMessages={messages} />
        </section>
      )}

      {tab === 'quotes' && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Supplier quotes</h2>
          {cost && (
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Latest cost snapshot</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-xs">
                <div>Materials: {cost.currency} {cost.materials}</div>
                <div>Packaging: {cost.currency} {cost.packaging}</div>
                <div>Logistics: {cost.currency} {cost.logistics}</div>
                <div>Other: {cost.currency} {cost.other}</div>
                <div>Fee: {cost.currency} {cost.fee}</div>
                <div>Total: {cost.currency} {cost.total}</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map((slot) => {
              const quote = (quotes || []).find((q: any) => q.position === slot) || {} as any
              async function saveQuote(formData: FormData) {
                'use server'
                const supplier_name = String(formData.get('supplier_name') || '')
                const supplier_country = String(formData.get('supplier_country') || '')
                const fob_unit_price = formData.get('fob_unit_price') ? Number(formData.get('fob_unit_price')) : null
                const currency = String(formData.get('currency') || 'USD')
                const moq = formData.get('moq') ? Number(formData.get('moq')) : null
                const lead_time_days = formData.get('lead_time_days') ? Number(formData.get('lead_time_days')) : null
                const packaging = String(formData.get('packaging') || '')
                const notes = String(formData.get('notes') || '')
                const evidence = String(formData.get('evidence_urls') || '')
                const evidence_urls = evidence ? evidence.split(',').map((s) => s.trim()).filter(Boolean) : null
                await upsertAdminQuote(orderId, { position: slot, supplier_name, supplier_country, fob_unit_price, currency, moq, lead_time_days, packaging, notes, evidence_urls })
                revalidatePath(`/admin/orders/${orderId}`)
              }
              return (
                <form key={slot} action={saveQuote} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">Quote {slot}</div>
                    {(quote.supplier_name || quote.fob_unit_price) && <span className="text-xs rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Received</span>}
                  </div>
                  <input name="supplier_name" defaultValue={quote.supplier_name || ''} placeholder="Supplier name" className="w-full rounded border px-2 py-1 text-sm" />
                  <input name="supplier_country" defaultValue={quote.supplier_country || ''} placeholder="Country" className="w-full rounded border px-2 py-1 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input name="fob_unit_price" type="number" step="0.01" defaultValue={quote.fob_unit_price ?? ''} placeholder="FOB unit price" className="w-full rounded border px-2 py-1 text-sm" />
                    <input name="currency" defaultValue={quote.currency || 'USD'} placeholder="Currency" className="w-full rounded border px-2 py-1 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input name="moq" type="number" defaultValue={quote.moq ?? ''} placeholder="MOQ" className="w-full rounded border px-2 py-1 text-sm" />
                    <input name="lead_time_days" type="number" defaultValue={quote.lead_time_days ?? ''} placeholder="Lead time (days)" className="w-full rounded border px-2 py-1 text-sm" />
                  </div>
                  <input name="packaging" defaultValue={quote.packaging || ''} placeholder="Packaging" className="w-full rounded border px-2 py-1 text-sm" />
                  <textarea name="notes" defaultValue={quote.notes || ''} placeholder="Notes" className="w-full rounded border px-2 py-1 text-sm" rows={2} />
                  <input name="evidence_urls" defaultValue={(quote.evidence_urls || []).join(', ')} placeholder="Evidence URLs (comma separated)" className="w-full rounded border px-2 py-1 text-sm" />
                  <button className="w-full rounded bg-blue-600 text-white text-sm font-semibold py-2">Save quote</button>
                </form>
              )
            })}
          </div>
        </section>
      )}

      <Link href="/admin/queue" className="text-sm font-semibold text-blue-600">Back to queue</Link>
    </div>
  )
}
