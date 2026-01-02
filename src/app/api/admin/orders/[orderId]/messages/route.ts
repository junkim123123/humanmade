import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

async function ensureAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: 'Not authenticated' }

  const { data: adminRow, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError || !adminRow) return { ok: false, status: 401, error: 'Not authorized' }
  return { ok: true, user }
}

function extractOrderId({
  params,
  url,
  payload,
}: {
  params?: { orderId?: string }
  url: URL
  payload?: any
}) {
  const pathname = url.pathname
  let orderId = params?.orderId

  if (!orderId) {
    const match = pathname.match(/\/api\/admin\/orders\/([^/]+)\/messages/)
    if (match && match[1]) orderId = match[1]
  }

  if (!orderId && payload) {
    orderId = payload.orderId ?? payload.order_id ?? payload.order ?? undefined
  }

  if (!orderId) {
    orderId = url.searchParams.get('orderId') ?? url.searchParams.get('order_id') ?? undefined
  }

  return { orderId, pathname }
}

import type { NextRequest, RouteContext } from 'next/server';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/admin/orders/[orderId]/messages'>) {
  const { orderId } = await ctx.params;
  const url = new URL(req.url)
  const { pathname } = extractOrderId({ params: { orderId }, url })

  if (!orderId) {
    const queryKeys = Array.from(url.searchParams.keys())
    return NextResponse.json({ error: 'missing_orderId', detail: { pathname, paramsPresent: !!params, queryKeys } }, { status: 400 })
  }

  const auth = await ensureAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = getSupabaseAdmin()
  const { data, error } = await (admin.from('order_messages') as any)
    .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'message_list_failed', detail: error.message, code: error.code }, { status: 500 })

  return NextResponse.json({ success: true, messages: data || [] })
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/admin/orders/[orderId]/messages'>) {
  const { orderId } = await ctx.params;
  try {
    const url = new URL(req.url)
    const raw = await req.text()

    let payload: any = {}
    if (raw) {
      try {
        payload = JSON.parse(raw)
      } catch (e) {
        console.log('[admin messages] invalid json', raw.slice(0, 200))
        return NextResponse.json({ error: 'bad_request', detail: 'invalid_json', rawPreview: raw.slice(0, 200) }, { status: 400 })
      }
    }

    const { pathname } = extractOrderId({ params: { orderId }, url, payload })

    if (!orderId) {
      const bodyKeys = Object.keys(payload || {})
      const queryKeys = Array.from(url.searchParams.keys())
      return NextResponse.json({ error: 'missing_orderId', detail: { pathname, paramsPresent: !!params, bodyKeys, queryKeys } }, { status: 400 })
    }

    if (!raw) {
      console.log('[admin messages] empty raw body')
      return NextResponse.json({ error: 'bad_request', detail: 'empty_body', receivedLength: 0 }, { status: 400 })
    }

    const receivedKeys = Object.keys(payload || {})
    const rawBody = payload.body ?? payload.message ?? payload.text ?? payload.content
    const internalFlag = payload.internal ?? payload.isInternal ?? payload.internalNote
    const trimmed = (rawBody || '').trim()

    if (!trimmed) {
      console.log('[admin messages] empty body after trim', { receivedKeys })
      return NextResponse.json({ error: 'empty_message', detail: 'body is required', receivedKeys }, { status: 400 })
    }

    const auth = await ensureAdmin()
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const admin = getSupabaseAdmin()
    const sender_role = internalFlag ? 'internal' : 'admin'
    const { data, error } = await (admin.from('order_messages') as any)
      .insert({
        order_id: orderId,
        body: trimmed,
        sender_role,
        sender: sender_role,
        sender_id: auth.user?.id || null,
        visible_to_user: internalFlag ? false : true,
      })
      .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
      .single()

    if (error || !data) {
      return NextResponse.json({
        error: 'message_insert_failed',
        detail: {
          message: error?.message,
          code: (error as any)?.code,
          details: (error as any)?.details,
          hint: (error as any)?.hint,
          status: (error as any)?.status,
        },
        rawReceived: { orderId, body: trimmed, internal: !!internalFlag },
      }, { status: 500 })
    }

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: internalFlag ? 'admin_note_added' : 'admin_message_sent',
      metadata: { message_id: data.id, visible_to_user: !internalFlag },
    })

    return NextResponse.json({ success: true, message: data })
  } catch (err: any) {
    return NextResponse.json({ error: 'message_insert_failed', detail: err?.message || 'Failed to send message' }, { status: 500 })
  }
}
