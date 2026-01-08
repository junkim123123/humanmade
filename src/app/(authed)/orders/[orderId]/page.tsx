import { getOrderDetail, sendOrderMessage, addOrderUpload } from '@/server/actions/orders'
import { revalidatePath } from 'next/cache'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

async function handleUserMessage(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const body = String(formData.get('body') || '')
  if (!orderId || !body.trim()) return
  await sendOrderMessage(orderId, body, 'user')
  revalidatePath(`/app/orders/${orderId}`)
}

async function handleUserUpload(formData: FormData) {
  'use server'
  const orderId = String(formData.get('orderId') || '')
  const title = String(formData.get('title') || '')
  const fileUrl = String(formData.get('fileUrl') || '')
  const description = String(formData.get('description') || '') || null
  const type = String(formData.get('type') || '')
  if (!orderId || !title.trim()) return
  await addOrderUpload(orderId, { title, fileUrl, description, type })
  revalidatePath(`/app/orders/${orderId}`)
}

export default async function UserOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const result = await getOrderDetail(orderId)
  if (!result.success || !result.order) {
    return <div className="p-6 text-slate-700">Order not found.</div>
  }

  const { order, messages = [], uploads = [] } = result

  return (
    <div className="space-y-6 p-4">
      <div>
        <div className="text-sm text-slate-500">Order #{order.order_number}</div>
        <h1 className="text-2xl font-bold text-slate-900">{order.product_name}</h1>
        <p className="text-slate-600">Status: {order.status}</p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
        <div className="space-y-3">
          {messages.length === 0 && <div className="text-sm text-slate-600">No messages yet.</div>}
          {messages.map((m: any) => (
            <div key={m.id} className={`rounded-lg border px-3 py-2 ${m.sender_role === 'admin' ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-800">{m.sender_role === 'admin' ? 'NexSupply' : 'You'}</span>
                <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
              </div>
              <div className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
        </div>
        <form action={handleUserMessage} className="flex items-start gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <textarea name="body" className="flex-1 rounded-lg border px-3 py-2 text-sm" placeholder="Send a message" />
          <button className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Send</button>
        </form>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Uploads</h2>
        <p className="text-xs text-slate-600">Allowed: label, barcode, package photos.</p>
        <form action={handleUserUpload} className="flex flex-col gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <div className="flex gap-2">
            <input name="title" placeholder="Title" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <input name="fileUrl" placeholder="File URL" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <select name="type" className="rounded-lg border px-3 py-2 text-sm">
              <option value="label">Label</option>
              <option value="barcode">Barcode</option>
              <option value="package">Package</option>
            </select>
            <input name="description" placeholder="Notes" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
          </div>
          <button className="self-start rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">Upload</button>
        </form>
        <div className="divide-y divide-slate-200 border border-slate-100 rounded-lg">
          {uploads.length === 0 && <div className="p-3 text-sm text-slate-600">No uploads yet.</div>}
          {uploads.map((u: any) => (
            <div key={u.id} className="p-3 text-sm flex justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-900">{u.file_type || u.kind}</div>
                <div className="text-slate-600">{u.file_url || u.storage_path}</div>
                <div className="text-slate-500 text-xs">{u.note || '—'}</div>
              </div>
              <div className="text-xs text-slate-500">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
