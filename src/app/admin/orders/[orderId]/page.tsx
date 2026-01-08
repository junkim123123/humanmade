import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { 
  getAdminOrderWorkspace, 
  updateOrderStatusAdmin, 
  addAdminOrderUpload, 
  upsertAdminQuote, 
  pushSourcingUpdate, 
  saveInternalNote, 
  publishFinalQuotes 
} from '@/server/actions/admin'
import { requireAdminUser } from '@/lib/auth/admin'
import { revalidatePath } from 'next/cache'
import { AdminMessagesPanel } from './AdminMessagesPanel'
import { ChevronDown, Clock, Target } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

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

async function handleSourcingUpdate(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const text = String(formData.get('text') || '')
  if (!orderId || !text.trim()) return
  await pushSourcingUpdate(orderId, text)
  revalidatePath(`/admin/orders/${orderId}`)
}

async function handleInternalNote(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const note = String(formData.get('note') || '')
  if (!orderId) return
  await saveInternalNote(orderId, note)
  revalidatePath(`/admin/orders/${orderId}`)
}

async function handlePublishQuotes(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  if (!orderId) return
  await publishFinalQuotes(orderId)
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
  const internalNotes = metadata.internal_notes || ''
  const uploadsUnavailable = warnings.some((w: any) => w.source === 'uploads')
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'messages', label: 'Messages' },
    { id: 'quotes', label: 'Quotes' },
  ]

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link href="/admin/queue" className="hover:text-blue-600">Queue</Link>
        <span>/</span>
        <span className="font-medium text-slate-900">Order #{order.order_number}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
            {order.status.replace('_', ' ').toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{order.product_name || report?.product_name || 'Verification request'}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm">
            <div className="text-slate-600">
              <span className="font-semibold block text-slate-400 uppercase text-[10px] tracking-wider">User</span>
              {order.profiles?.email || order.user_id}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold block text-slate-400 uppercase text-[10px] tracking-wider">Contact</span>
              {order.contact_email || order.contact_whatsapp || metadata.contact_email || metadata.contact_whatsapp || metadata.contact || '—'}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold block text-slate-400 uppercase text-[10px] tracking-wider">Quantity</span>
              {order.quantity || metadata.quantity || '—'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action={handleStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="orderId" value={orderId} />
            <button name="status" value="contacted" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">Mark Contacted</button>
            <button name="status" value="meeting_scheduled" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors">Schedule Meeting</button>
            <button name="status" value="awaiting_invoice" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors">Mark Quoted</button>
            <button name="status" value="awaiting_payment" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors">Awaiting Payment</button>
          </form>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                More Actions <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {[
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Shipped', value: 'shipped' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Close', value: 'closed' },
                { label: 'Cancel', value: 'cancelled' },
              ].map((action) => (
                <DropdownMenuItem key={action.value} className="p-0">
                  <form action={handleStatus} className="w-full">
                    <input type="hidden" name="orderId" value={orderId} />
                    <button name="status" value={action.value} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 transition-colors">
                      {action.label}
                    </button>
                  </form>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/support?category=sourcing_quotes&orderId=${orderId}`} className="w-full px-3 py-2 text-sm hover:bg-slate-100 transition-colors flex items-center gap-2 text-amber-600">
                  Request Photos
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 w-fit">
            {tabs.map((t) => (
              <Link
                key={t.id}
                href={`/admin/orders/${orderId}?tab=${t.id}`}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${tab === t.id ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Timeline Updates */}
              <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Push Live Timeline Update
                </h2>
                <form action={handleSourcingUpdate} className="flex gap-2">
                  <input type="hidden" name="orderId" value={orderId} />
                  <input name="text" placeholder="e.g. nexi sent product specs to 3 factories" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
                  <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">Push</button>
                </form>
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-2">
                  {events.filter((e: any) => e.metadata?.type === 'sourcing_update').reverse().map((e: any) => (
                    <div key={e.id} className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                      <p className="text-slate-700">{e.metadata.text}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Final Negotiated Quotes</h2>
                <form action={handlePublishQuotes}>
                  <input type="hidden" name="orderId" value={orderId} />
                  <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100">
                    Publish Final Results to User
                  </button>
                </form>
              </div>
              
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
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Sourcing Memo (Internal) */}
          <section className="bg-amber-50 border border-amber-100 p-6 rounded-xl shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Sourcing Memo (Internal)
            </h2>
            <form action={handleInternalNote} className="space-y-3">
              <input type="hidden" name="orderId" value={orderId} />
              <textarea 
                name="note" 
                defaultValue={internalNotes}
                placeholder="Factory A is too expensive, Factory B looks promising..." 
                className="w-full rounded-lg border-amber-200 bg-white/50 px-3 py-2 text-sm h-40 focus:ring-amber-500 focus:border-amber-500" 
              />
              <button className="w-full rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">Save Memo</button>
            </form>
          </section>

          <Link href="/admin/queue" className="text-sm font-semibold text-blue-600 block text-center">Back to queue</Link>
        </div>
      </div>
    </div>
  )
}
