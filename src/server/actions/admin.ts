'use server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { requireAdminUser } from '@/lib/auth/admin';
import { isNextRedirectError } from '@/lib/utils/nextRedirect';
import type { OrderStatus } from './orders';
import { adminGrantCredits } from './credits';

const activeVerificationStatuses: OrderStatus[] = [
  'awaiting_contact',
  'contacted',
  'meeting_scheduled',
  'awaiting_invoice',
  'awaiting_payment',
  'in_progress',
  'pending_shipment',
  'shipped',
];

export async function listAdminQueue(opts?: { search?: string }) {
  try {
    const admin = getSupabaseAdmin();
    const term = opts?.search ? `%${opts.search}%` : null;

    const baseSelect = '*';

    const buildQuery = (withProfiles: boolean) => {
      let q = (admin.from('orders') as any)
        .select(withProfiles ? `${baseSelect}, profiles(email)` : baseSelect)
        .eq('type', 'verification_request')
        .in('status', activeVerificationStatuses)
        .order('created_at', { ascending: false });

      if (term) {
        const ors = [`product_name.ilike.${term}`];
        if (withProfiles) {
          ors.push(`profiles.email.ilike.${term}`);
        }
        q = q.or(ors.join(','));
      }
      return q;
    };

    let { data, error } = await buildQuery(true);

    if (error) {
      console.warn('[listAdminQueue] profiles join failed, retrying without profile join', error?.message || error);
      ({ data, error } = await buildQuery(false));
      if (error) throw error;

      const userIds = Array.from(new Set((data || []).map((o: any) => o.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profiles, error: profileErr } = await (admin.from('profiles') as any)
          .select('id, email')
          .in('id', userIds);

        if (!profileErr && profiles) {
          const map = new Map<string, string>();
          profiles.forEach((p: any) => map.set(p.id, p.email));
          data = (data || []).map((o: any) => ({
            ...o,
            profiles: map.has(o.user_id) ? { email: map.get(o.user_id) } : null,
          }));
        }
      }
    }

    return { success: true, orders: data || [] };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[listAdminQueue] failed', error?.message || error, error);
    return { success: false, error: 'queue_load_failed', detail: error?.message };
  }
}

// Backwards compatibility
export async function getVerificationQueue() {
  return await listAdminQueue();
}

export async function getAdminOrderWorkspace(orderId: string) {
  await requireAdminUser();
  const admin = getSupabaseAdmin();
  console.log('[getAdminOrderWorkspace] requested', orderId);

  try {
    const select = '*, profiles(email)';

    const { data: orderById, error: orderError } = await (admin.from('orders') as any)
      .select(select)
      .eq('id', orderId)
      .maybeSingle();

    console.log('[getAdminOrderWorkspace] order by id', { orderFound: !!orderById, error: orderError?.message, code: orderError?.code });

    let order = orderById;
    let detailError = orderError;

    if (!order && !orderError) {
      const { data: orderByNumber, error: orderNumberError } = await (admin.from('orders') as any)
        .select(select)
        .eq('order_number', orderId)
        .maybeSingle();
      order = orderByNumber;
      detailError = orderNumberError;
      console.log('[getAdminOrderWorkspace] order by number', { orderFound: !!orderByNumber, error: orderNumberError?.message, code: orderNumberError?.code });
    }

    if (detailError) {
      return { success: false, error: 'order_fetch_failed', detail: detailError?.message, code: detailError?.code };
    }

    if (!order) {
      return { success: false, error: 'order_not_found', detail: 'Order not found' };
    }

    const warnings: Array<{ source: string; message: string; code?: string }> = [];

    const safeQuery = async <T>(label: string, query: Promise<{ data: T | null; error: any }>, fallback: T) => {
      try {
        const { data, error } = await query;
        if (error) {
          const formatted = {
            message: (error as any)?.message || String(error),
            code: (error as any)?.code,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
            status: (error as any)?.status,
          };
          console.warn(`[getAdminOrderWorkspace] ${label} fetch failed`, formatted);
          warnings.push({ source: label, message: formatted.message || 'unknown error', code: formatted.code });
          return fallback;
        }
        return (data as T) || fallback;
      } catch (err: any) {
        if (isNextRedirectError(err)) throw err;
        const formatted = {
          message: err?.message || String(err) || 'unknown error',
          code: (err as any)?.code,
          details: (err as any)?.details,
          hint: (err as any)?.hint,
          status: (err as any)?.status,
        };
        console.warn(`[getAdminOrderWorkspace] ${label} threw`, formatted);
        warnings.push({ source: label, message: formatted.message, code: formatted.code });
        return fallback;
      }
    };

    const messages = await safeQuery('messages', (admin.from('order_messages') as any)
      .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }), []);

    const events = await safeQuery('events', (admin.from('order_events') as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }), []);

    const uploads = await safeQuery('uploads', (admin.from('order_uploads') as any)
      .select('id, order_id, file_type, file_url, kind, storage_path, note, created_at, created_by_role, visible_to_user, title')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false }), []);

    const quotes = await safeQuery('quotes', (admin.from('order_quotes') as any)
      .select('id, order_id, supplier_name, supplier_country, fob_unit_price, currency, moq, lead_time_days, packaging, notes, evidence_urls, position, status')
      .eq('order_id', orderId)
      .order('position', { ascending: true }), []);

    const costSnapshots = (events as any[]).filter((e) => e.event_type === 'cost_snapshot_saved');
    const latestCost = costSnapshots.length > 0 ? costSnapshots[costSnapshots.length - 1].metadata : null;

    const report = order.report_id
      ? await safeQuery('report', (admin.from('reports') as any)
          .select('id, product_name, category, status, created_at, baseline')
          .eq('id', order.report_id)
          .maybeSingle(), null)
      : null;

    return {
      success: true,
      workspace: {
        order,
        messages,
        events,
        uploads,
        quotes,
        cost: latestCost,
        report,
      },
      warnings,
    };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[getAdminOrderWorkspace] failed', error);
    return { success: false, error: 'order_detail_failed', detail: error.message, code: error.code };
  }
}

export async function sendAdminOrderMessage(orderId: string, body: string, options?: { internal?: boolean }) {
  try {
    const adminUser = await requireAdminUser();
    const trimmed = (body || '').trim();
    if (!trimmed) {
      return { success: false, error: 'empty_body', detail: 'Message body is required' };
    }

    const visible = options?.internal ? false : true;

    const admin = getSupabaseAdmin();
    const { data: inserted, error: insertError } = await (admin.from('order_messages') as any)
      .insert({ order_id: orderId, body: trimmed, sender_role: 'admin', sender: 'admin', sender_id: adminUser?.id || null, visible_to_user: visible })
      .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
      .single();

    if (insertError || !inserted) {
      console.error('[sendAdminOrderMessage] insert failed', insertError);
      return { success: false, error: 'message_insert_failed', detail: insertError?.message };
    }

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'admin_message_sent',
      metadata: { message_id: inserted.id, visible_to_user: visible },
    });

    return { success: true, messageId: inserted.id, message: inserted };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[sendAdminOrderMessage] failed', error);
    return { success: false, error: 'message_insert_failed', detail: error.message };
  }
}

export async function updateOrderStatusAdmin(orderId: string, newStatus: OrderStatus) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();
    const { error } = await (admin.from('orders') as any)
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw error;

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'status_updated',
      metadata: { status: newStatus },
    });

    return { success: true };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[updateOrderStatusAdmin] failed', error);
    return { success: false, error: 'status_update_failed', detail: error.message };
  }
}

// Deprecated name maintained for compatibility
export async function adminUpdateOrderStatus(orderId: string, newStatus: OrderStatus) {
  return await updateOrderStatusAdmin(orderId, newStatus);
}

export async function listAdminInbox() {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();

    const { data: messages, error: messageError } = await (admin.from('order_messages') as any)
      .select('order_id, body, sender_role, created_at, sender_id')
      .eq('sender_role', 'user')
      .order('created_at', { ascending: false })
      .limit(200);

    if (messageError) throw messageError;

    const seen = new Set<string>();
    const threads = (messages || []).filter((row: any) => {
      if (!row.order_id) return false;
      if (seen.has(row.order_id)) return false;
      seen.add(row.order_id);
      return true;
    });

    const orderIds = threads.map((t: any) => t.order_id).filter(Boolean);
    if (orderIds.length === 0) return { success: true, threads: [] };

    const { data: orders, error: ordersError } = await (admin.from('orders') as any)
      .select('id, order_number, product_name, status, type, user_id')
      .in('id', orderIds);

    if (ordersError) {
      console.warn('[listAdminInbox] order fetch failed, continuing without order details', ordersError?.message || ordersError);
    }

    const orderMap = new Map<string, any>();
    (orders || []).forEach((o: any) => orderMap.set(o.id, o));

    const userIds = Array.from(new Set((orders || []).map((o: any) => o.user_id).filter(Boolean)));
    const profileMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await (admin.from('profiles') as any)
        .select('id, email')
        .in('id', userIds);

      if (profilesError) {
        console.warn('[listAdminInbox] profile fetch failed, continuing without emails', profilesError?.message || profilesError);
      } else {
        (profiles || []).forEach((p: any) => profileMap.set(p.id, p.email));
      }
    }

    const enrichedThreads = threads.map((t: any) => {
      const order = orderMap.get(t.order_id) || null;
      const profileEmail = order && profileMap.has(order.user_id) ? profileMap.get(order.user_id) : null;
      return {
        ...t,
        orders: order ? { ...order, profiles: profileEmail ? { email: profileEmail } : null } : null,
      };
    });

    return { success: true, threads: enrichedThreads };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[listAdminInbox] failed', {
      message: error?.message || String(error),
      code: (error as any)?.code,
      details: (error as any)?.details,
      hint: (error as any)?.hint,
      stack: error?.stack,
    });
    return { success: false, error: 'inbox_load_failed', detail: error.message };
  }
}

export async function addAdminOrderUpload(orderId: string, input: { title: string; fileUrl?: string | null; description?: string | null; type?: string; visibleToUser?: boolean }) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();

    const title = (input.title || '').trim();
    if (!title) {
      return { success: false, error: 'missing_title', detail: 'Upload title is required' };
    }

    const docType = input.type || 'other';
    const visible = (input as any).visibleToUser ?? true;

    const { data: inserted, error: insertError } = await (admin.from('order_uploads') as any)
      .insert({
        order_id: orderId,
        kind: docType,
        file_type: docType,
        storage_path: input.fileUrl || title,
        file_url: input.fileUrl || title,
        note: input.description || null,
        uploader_role: 'admin',
        created_by_role: 'admin',
        visible_to_user: visible,
        title,
      })
      .select('*')
      .single();

    if (insertError || !inserted) {
      console.error('[addAdminOrderUpload] insert failed', insertError);
      return { success: false, error: 'upload_failed', detail: insertError?.message };
    }

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'upload_added',
      metadata: { upload_id: inserted.id, title, type: docType, role: 'admin' },
    });

    return { success: true, document: inserted };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[addAdminOrderUpload] failed', error);
    return { success: false, error: 'upload_failed', detail: error.message };
  }
}

export async function pushSourcingUpdate(orderId: string, updateText: string) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();
    const { error } = await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'note',
      metadata: { text: updateText, type: 'sourcing_update' },
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[pushSourcingUpdate] failed', error);
    return { success: false, error: error.message };
  }
}

export async function saveInternalNote(orderId: string, note: string) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();
    
    // Fetch current metadata
    const { data: order } = await (admin.from('orders') as any)
      .select('metadata')
      .eq('id', orderId)
      .single();
    
    const newMetadata = {
      ...(order?.metadata || {}),
      internal_notes: note
    };

    const { error } = await (admin.from('orders') as any)
      .update({ metadata: newMetadata })
      .eq('id', orderId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('[saveInternalNote] failed', error);
    return { success: false, error: error.message };
  }
}

export async function publishFinalQuotes(orderId: string) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();
    
    // Update order status
    const { error: statusError } = await (admin.from('orders') as any)
      .update({ status: 'awaiting_payment' })
      .eq('id', orderId);
    
    if (statusError) throw statusError;

    // Add a final event
    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'note',
      metadata: { text: 'Final negotiated quotes have been published.', type: 'milestone' },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[publishFinalQuotes] failed', error);
    return { success: false, error: error.message };
  }
}

export async function upsertAdminQuote(orderId: string, input: {
  position: number;
  supplier_name?: string | null;
  supplier_country?: string | null;
  fob_unit_price?: number | null;
  currency?: string | null;
  moq?: number | null;
  lead_time_days?: number | null;
  packaging?: string | null;
  notes?: string | null;
  evidence_urls?: string[] | null;
}) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();
    const pos = Math.max(1, Math.min(3, Number(input.position) || 1));

    const payload = {
      order_id: orderId,
      position: pos,
      supplier_name: input.supplier_name || null,
      supplier_country: input.supplier_country || null,
      fob_unit_price: input.fob_unit_price ?? null,
      currency: input.currency || 'USD',
      moq: input.moq ?? null,
      lead_time_days: input.lead_time_days ?? null,
      packaging: input.packaging || null,
      notes: input.notes || null,
      evidence_urls: input.evidence_urls || null,
      status: (input.supplier_name || input.fob_unit_price) ? 'received' : 'pending',
    } as any;

    const { data, error } = await (admin.from('order_quotes') as any)
      .upsert(payload, { onConflict: 'order_id,position' })
      .select('*')
      .single();

    let saved = data;

    if (error || !data) {
      console.warn('[upsertAdminQuote] upsert failed, retrying via delete+insert', error);
      await (admin.from('order_quotes') as any)
        .delete()
        .eq('order_id', orderId)
        .eq('position', pos);

      const { data: inserted, error: insertErr } = await (admin.from('order_quotes') as any)
        .insert(payload)
        .select('*')
        .single();

      if (insertErr || !inserted) {
        console.error('[upsertAdminQuote] failed', insertErr || error);
        return { success: false, error: 'quote_save_failed', detail: insertErr?.message || error?.message };
      }
      saved = inserted;
    }

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'quote_updated',
      metadata: { quote_id: (saved as any).id, position: pos },
    });

    return { success: true, quote: saved };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[upsertAdminQuote] unexpected', error);
    return { success: false, error: 'quote_save_failed', detail: error?.message };
  }
}

export async function saveAdminCostSnapshot(orderId: string, input: {
  materials?: number | null;
  packaging?: number | null;
  logistics?: number | null;
  other?: number | null;
  currency?: string | null;
  fee_rate?: number | null;
}) {
  try {
    await requireAdminUser();
    const admin = getSupabaseAdmin();

    const currency = input.currency || 'USD';
    const materials = Number(input.materials) || 0;
    const packaging = Number(input.packaging) || 0;
    const logistics = Number(input.logistics) || 0;
    const other = Number(input.other) || 0;
    const feeRate = input.fee_rate != null ? Number(input.fee_rate) : 0.1;

    const subtotal = materials + packaging + logistics + other;
    const fee = subtotal * feeRate;
    const total = subtotal + fee;

    const snapshot = { currency, materials, packaging, logistics, other, fee_rate: feeRate, subtotal, fee, total };

    const { error } = await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'cost_snapshot_saved',
      metadata: snapshot,
    });

    if (error) throw error;

    return { success: true, snapshot };
  } catch (error: any) {
    if (isNextRedirectError(error)) throw error;
    console.error('[saveAdminCostSnapshot] failed', error);
    return { success: false, error: 'cost_save_failed', detail: error?.message };
  }
}
