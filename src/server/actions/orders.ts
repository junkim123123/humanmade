/**
 * Server-side order actions and helpers
 */
'use server';

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Milestone keys for order execution timeline
 */
export type MilestoneKey =
  | 'quote_accepted'
  | 'pi_issued'
  | 'payment_received'
  | 'production_started'
  | 'quality_check'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered';

/**
 * Document types for orders
 */
export type DocumentType =
  | 'quote'
  | 'pi'
  | 'qc_report'
  | 'invoice'
  | 'packing_list'
  | 'bol'
  | 'other';

/**
 * Order status in execution lifecycle
 */
export type OrderStatus =
  | 'awaiting_contact'
  | 'contacted'
  | 'meeting_scheduled'
  | 'closed'
  | 'awaiting_invoice'
  | 'awaiting_payment'
  | 'in_progress'
  | 'pending_shipment'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type OrderType = 'standard' | 'verification_request';

/**
 * Payment status tracking
 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';

export type OrderMessage = {
  id: string;
  order_id: string;
  sender_id: string | null;
  sender_role: string | null;
  body: string | null;
  created_at: string | null;
  visible_to_user?: boolean | null;
};

function buildOrderNumber(prefix = 'ORD') {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${today}-${randomSuffix}`;
}

export async function computeLandedCost(params: {
  fob: number;
  packagingCost?: number;
  freight?: number;
  duty?: number;
  fees?: number;
  currency?: string;
  quantity?: number;
}) {
  const qty = typeof params.quantity === 'number' && params.quantity > 0 ? params.quantity : 1;
  const fobTotal = (params.fob || 0) * qty;
  const packaging = params.packagingCost || 0;
  const freight = params.freight ?? 500;
  const duty = params.duty ?? 0;
  const fees = params.fees ?? 0;
  const base = fobTotal + packaging + freight + duty + fees;
  return {
    currency: params.currency || 'USD',
    p10: base * 0.97,
    p50: base,
    p90: base * 1.05,
  };
}

/**
 * Create a verification_request order with manual outreach workflow.
 * - Idempotent per user + reportId while open
 * - Consumes 1 credit if available
 */
export async function createVerificationRequest(options: {
  reportId: string;
  contactWhatsapp?: string;
  currentUser?: { id: string; email?: string | null };
}): Promise<{ success: boolean; orderId?: string; error?: string; consumedCredit?: boolean }> {
  try {
    const supabase = createClient();
    const user = options.currentUser
      ? { id: options.currentUser.id, email: options.currentUser.email || null }
      : (await supabase.auth.getUser()).data.user;

    if (!user) {
      return { success: false, error: 'unauthorized' };
    }

    if (!options.reportId) {
      return { success: false, error: 'missing_reportId' };
    }

    const admin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

    const activeStatuses: OrderStatus[] = [
      'awaiting_contact',
      'contacted',
      'meeting_scheduled',
      'awaiting_invoice',
      'awaiting_payment',
      'in_progress',
      'pending_shipment',
      'shipped',
    ];

    // Idempotent per user+report for open verification requests
    // Fetch report snapshot for context
    const { data: report, error: reportError } = await (admin
      .from('reports') as any)
      .select('*')
      .eq('id', options.reportId)
      .eq('user_id', user.id)
      .single();

    if (reportError || !report) {
      return { success: false, error: 'report_not_found_or_not_accessible' };
    }

    const productName = (report as any)?.product_name?.trim() || 'Unknown product';

    const { data: existing } = await (admin.from('orders') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('report_id', options.reportId)
      .eq('type', 'verification_request')
      .in('status', activeStatuses)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await (admin.from('leads') as any)
        .upsert({
          order_id: existing.id,
          user_id: user.id,
          product_name: productName,
          source: 'verification_request',
          status: 'new',
        }, { onConflict: 'order_id' });

      await ensurePartnerWorkflowSeeds(admin, existing.id, productName, user.id);

      return { success: true, orderId: existing.id };
    }

    // Credits: consume 1 if available
    let consumedCredit = false;
    const { data: creditRow, error: creditError } = await (admin
      .from('user_credits') as any)
      .select('credits_balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creditError) {
      console.error('[createVerificationRequest] credits fetch failed', creditError);
    }

    if (creditRow && typeof creditRow.credits_balance === 'number' && creditRow.credits_balance > 0) {
      // Use RPC to consume credit and log transaction in one go
      const { data: newBalance, error: consumeError } = await admin.rpc("add_user_credits", {
        p_user_id: user.id,
        p_amount: -1,
        p_type: 'verification_used',
        p_description: `Verification started for report: ${options.reportId}`
      });

      if (consumeError) {
        console.error('[createVerificationRequest] consume credit failed', consumeError);
      } else {
        consumedCredit = true;
      }
    }

    const orderNumber = buildOrderNumber('VRF');
    const { data: order, error: orderError } = await (admin.from('orders') as any)
      .insert({
        order_number: orderNumber,
        user_id: user.id,
        report_id: report.id,
        product_name: productName,
        status: 'awaiting_contact',
        type: 'verification_request',
      })
      .select('id')
      .single();

    if (orderError || !order) {
      const duplicate = (orderError?.message || '').includes('duplicate key value violates unique constraint');
      if (duplicate) {
        const { data: existingOnConflict } = await (admin.from('orders') as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('report_id', report.id)
          .eq('type', 'verification_request')
          .in('status', activeStatuses)
          .limit(1)
          .maybeSingle();

        if (existingOnConflict?.id) {
          return { success: true, orderId: existingOnConflict.id, consumedCredit };
        }

        console.error('[createVerificationRequest] duplicate constraint hit but no existing order found');
      }

      console.error('[createVerificationRequest] order insert failed', orderError);
      return { success: false, error: 'order_create_failed' };
    }

    // Event log
    const events = [{ order_id: order.id, event_type: 'created', metadata: { consumedCredit } }];
    const { error: eventError } = await (admin.from('order_events') as any).insert(events);
    if (eventError) {
      console.error('[createVerificationRequest] event insert failed', eventError);
    }

    // --- [nexi Welcome Message] ---
    const welcomeMessage = `Hi! I'm **nexi**, your dedicated sourcing lead. I've started the deep verification for your **${productName}**.

📍 **What happens over the next 7 days:**
1. **Direct Outreach:** I will contact the top 3-5 candidates from your report plus our private network.
2. **Real-time Negotiation:** I'll be verifying their current production capacity and negotiating for your target price.
3. **The Final Selection:** Note that the best factory might be different from the initial report based on my live consultations.

I'll post daily updates here in the timeline. Any specific quality requirements I should mention?`;

    await (admin.from('order_messages') as any).insert({
      order_id: order.id,
      body: welcomeMessage,
      sender_role: 'admin',
      sender: 'nexi',
      visible_to_user: true,
    });
    // ------------------------------

    // Seed a lead record for the verification request queue
    const leadPayload = {
      order_id: order.id,
      user_id: user.id,
      product_name: productName,
      source: 'verification_request',
      status: 'new',
    };

    const { error: leadError } =     await (admin.from('leads') as any)
      .upsert(leadPayload, { onConflict: 'order_id' });

    if (leadError) {
      console.error('[createVerificationRequest] lead upsert failed', leadError);
    }

    // Update report signals to reflect verification status
    const currentSignals = report.signals || {};
    await (admin.from('reports') as any)
      .update({
        signals: {
          ...currentSignals,
          verificationStatus: 'requested',
          verificationOrderId: order.id,
        }
      })
      .eq('id', report.id);

    await ensurePartnerWorkflowSeeds(admin, order.id, productName, user.id);

    return { success: true, orderId: order.id, consumedCredit };
  } catch (error) {
    console.error('[createVerificationRequest] unexpected', error);
    return { success: false, error: 'unexpected_error' };
  }
}

async function ensurePartnerWorkflowSeeds(admin: any, orderId: string, productName: string, userId: string) {
  try {
    const { data: existingAssignment } = await (admin.from('order_partner_assignments') as any)
      .select('id')
      .eq('order_id', orderId)
      .limit(1)
      .maybeSingle();
    if (!existingAssignment?.id) {
      await (admin.from('order_partner_assignments') as any).insert({ order_id: orderId, region: 'CN', status: 'assigned' });
    }

    const { data: existingRfq } = await (admin.from('order_rfqs') as any)
      .select('id')
      .eq('order_id', orderId)
      .limit(1)
      .maybeSingle();
    if (!existingRfq?.id) {
      await (admin.from('order_rfqs') as any).insert({ order_id: orderId, region: 'CN', spec_snapshot: { product_name: productName }, status: 'draft' });
    }

    const { data: existingCost } = await (admin.from('order_cost_models') as any)
      .select('id')
      .eq('order_id', orderId)
      .limit(1)
      .maybeSingle();
    if (!existingCost?.id) {
      await (admin.from('order_cost_models') as any).insert({ order_id: orderId, inputs: { region: 'CN' }, outputs: {} });
    }

    await (admin.from('leads') as any)
      .upsert({ order_id: orderId, user_id: userId, product_name: productName, source: 'verification_request', status: 'new' }, { onConflict: 'order_id' });

    await (admin.from('order_events') as any).insert({ order_id: orderId, event_type: 'verification_requested', metadata: { product_name: productName } });
  } catch (err) {
    console.error('[ensurePartnerWorkflowSeeds] non-fatal', err);
  }
}

/**
 * Send a message on an order. Enforces ownership before inserting.
 */
export async function sendOrderMessage(
  orderId: string,
  body: string,
  senderRole: 'user' | 'admin' = 'user'
): Promise<{ success: boolean; messageId?: string; message?: OrderMessage; error?: string; detail?: string }>
{
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'unauthorized', detail: 'Sign in required' };
    }

    const trimmed = (body || '').trim();
    if (!trimmed) {
      return { success: false, error: 'empty_body', detail: 'Message body is required' };
    }

    const admin = getSupabaseAdmin();

    const { data: order } = await (admin.from('orders') as any)
      .select('id, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!order) {
      return { success: false, error: 'not_found_or_forbidden', detail: 'Order not found for user' };
    }

    const payload = {
      order_id: orderId,
      body: trimmed,
      sender_role: senderRole,
      sender: senderRole,
      sender_id: user.id || null,
      visible_to_user: true,
    } as any;

    const { data: inserted, error: insertError } = await (admin.from('order_messages') as any)
      .insert(payload)
      .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
      .single();

    if (insertError || !inserted) {
      console.error('[sendOrderMessage] insert failed', insertError);
      return { success: false, error: 'message_insert_failed', detail: insertError?.message };
    }

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: senderRole === 'user' ? 'user_message_sent' : 'admin_message_sent',
      metadata: { message_id: inserted.id, sender_role: senderRole },
    });

    return { success: true, messageId: inserted.id, message: inserted as OrderMessage };
  } catch (error) {
    console.error('[sendOrderMessage] unexpected', error);
    return { success: false, error: 'message_insert_failed', detail: (error as Error)?.message };
  }
}

/**
 * Create order from a verified quote
 * - Validates quote belongs to signed-in user
 * - Creates order in draft status
 * - Seeds default milestones
 * - Returns orderId for redirect
 */
export async function createOrderFromQuote(
  quoteId: string,
  quantity: number,
  destinationCountry: string,
  incoterm: 'FOB' | 'CIF' | 'DDP' = 'FOB'
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // MVP: disable until the flow is reintroduced with minimal schema usage
  return { success: false, error: 'feature_not_enabled' };
}

/**
 * Fetch all orders for current user with pagination and status filtering
 */
export async function getUserOrders(options?: {
  statuses?: OrderStatus[];
  limit?: number;
  offset?: number;
}): Promise<{ success: boolean; orders?: any[]; total?: number; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    let query = (supabase
      .from('orders') as any)
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (options?.statuses && options.statuses.length > 0) {
      // Use 'in' filter for multiple statuses
      query = query.in('status', options.statuses);
    }

    const { data: orders, count, error } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[Orders] Fetch failed:', error);
      return { success: false, error: 'Failed to fetch orders' };
    }

    return { success: true, orders, total: count || 0 };
  } catch (error) {
    console.error('[Orders] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Fetch single order with milestones and documents
 */
export async function getOrderDetail(
  orderId: string
): Promise<{ 
  success: boolean; 
  order?: any; 
  milestones?: any[]; 
  documents?: any[]; 
  events?: any[]; 
  messages?: any[]; 
  quotes?: any[]; 
  cost?: any; 
  rfq?: any; 
  assignment?: any; 
  uploads?: any[]; 
  report?: any;
  error?: string 
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    // Fetch milestones
    const { data: milestones, error: milestonesError } = await (supabase
      .from('order_milestones') as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (milestonesError) {
      console.error('[Orders] Failed to fetch milestones:', milestonesError);
    }

    // Fetch documents
    const { data: documents, error: documentsError } = await (supabase
      .from('order_documents') as any)
      .select('*')
      .eq('order_id', orderId)
      .order('uploaded_at', { ascending: false });

    if (documentsError) {
      console.error('[Orders] Failed to fetch documents:', documentsError);
    }

    const { data: events } = await (supabase.from('order_events') as any)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    // Fetch messages and verification workflow artifacts with admin client after ownership check
    const admin = getSupabaseAdmin();
    let messages: any[] = [];
    let quotes: any[] = [];
    let cost: any = null;
    let rfq: any = null;
    let assignment: any = null;
    let uploads: any[] = [];
    
    const [msgRes, quoteRes, costRes, rfqRes, assignmentRes, uploadRes, reportRes] = await Promise.all([
      (admin.from('order_messages') as any)
        .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
        .eq('order_id', orderId)
        .eq('visible_to_user', true)
        .order('created_at', { ascending: true }),
      (admin.from('order_quotes') as any)
        .select('id, order_id, supplier_name, supplier_country, fob_unit_price, currency, moq, lead_time_days, packaging, notes, evidence_urls, received_at, position, status')
        .eq('order_id', orderId)
        .order('position', { ascending: true }),
      (admin.from('order_cost_models') as any)
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle(),
      (admin.from('order_rfqs') as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .maybeSingle(),
      (admin.from('order_partner_assignments') as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .maybeSingle(),
      (admin.from('order_uploads') as any)
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false }),
      order.report_id 
        ? (admin.from('reports') as any).select('*').eq('id', order.report_id).single()
        : Promise.resolve({ data: null })
    ]);

    messages = msgRes.data || [];
    quotes = quoteRes.data || [];
    cost = costRes.data || null;
    rfq = rfqRes.data || null;
    assignment = assignmentRes.data || null;
    uploads = uploadRes.data || [];
    const reportData = reportRes.data || null;

    return {
      success: true,
      order: {
        ...order,
        milestones: milestones || [],
        documents: documents || [],
        events: events || [],
        messages: messages || [],
        quotes,
        cost,
        rfq,
        assignment,
        uploads,
        report: reportData,
      },
      milestones: milestones || [],
      documents: documents || [],
      events: events || [],
      messages: messages || [],
      quotes,
      cost,
      rfq,
      assignment,
      uploads,
      report: reportData,
    };
  } catch (error) {
    console.error('[Orders] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership
    const { data: order } = await (supabase
      .from('orders') as any)
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return { success: false, error: 'Order not found or access denied' };
    }

    const { error } = await (supabase
      .from('orders') as any)
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      console.error('[Orders] Status update failed:', error);
      return { success: false, error: 'Failed to update status' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Orders] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  milestoneId: string,
  orderId: string,
  newStatus: 'pending' | 'in_progress' | 'completed' | 'failed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify ownership via order
    const { data: order } = await (supabase
      .from('orders') as any)
      .select('user_id')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== user.id) {
      return { success: false, error: 'Access denied' };
    }

    const updateData: any = { status: newStatus };
    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await (supabase
      .from('order_milestones') as any)
      .update(updateData)
      .eq('id', milestoneId)
      .eq('order_id', orderId);

    if (error) {
      console.error('[Orders] Milestone update failed:', error);
      return { success: false, error: 'Failed to update milestone' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Orders] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Update contact info or notes for an order (user-owned)
 */
export async function updateOrderContact(
  orderId: string,
  updates: {
    contactWhatsapp?: string | null;
    contactEmail?: string | null;
    quantity?: number | null;
    destinationCountry?: string | null;
    notes?: string | null;
  }
): Promise<{ success: boolean; error?: string; detail?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: order } = await (supabase.from('orders') as any)
      .select('id, user_id, metadata')
      .eq('id', orderId)
      .single();

    if (!order || order.user_id !== user.id) return { success: false, error: 'Order not found' };

    const updatePayload: Record<string, any> = {};

    if (updates.contactWhatsapp !== undefined) {
      updatePayload.contact_whatsapp = updates.contactWhatsapp || null;
    }

    if (updates.contactEmail !== undefined) {
      updatePayload.contact_email = updates.contactEmail || null;
    }

    if (updates.quantity !== undefined) {
      updatePayload.quantity = updates.quantity ?? null;
    }

    if (updates.destinationCountry !== undefined) {
      updatePayload.destination_country = updates.destinationCountry || null;
    }

    if (updates.notes !== undefined) {
      updatePayload.notes = updates.notes ?? null;
    }

    if (Object.keys(updatePayload).length === 0) {
      return { success: true };
    }

    const { error } = await (supabase.from('orders') as any)
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.error('[updateOrderContact] failed', error);
      return { success: false, error: 'Failed to update contact', detail: error.message };
    }

    await (supabase.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'contact_updated',
      metadata: {
        contact_whatsapp: updates.contactWhatsapp ?? null,
        contact_email: updates.contactEmail ?? null,
        quantity: updates.quantity ?? null,
        destination_country: updates.destinationCountry ?? null,
        notes: updates.notes ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('[updateOrderContact] unexpected', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Add an upload/document to an order for the signed-in user.
 * Uses admin client for insertion after ownership verification to avoid RLS friction.
 */
export async function addOrderUpload(
  orderId: string,
  input: { title: string; fileUrl?: string | null; description?: string | null; type?: string }
): Promise<{ success: boolean; document?: any; error?: string; detail?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'unauthorized', detail: 'Sign in required' };
    }

    const admin = getSupabaseAdmin();

    const { data: order } = await (admin.from('orders') as any)
      .select('id, user_id')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!order) {
      return { success: false, error: 'not_found_or_forbidden', detail: 'Order not found for user' };
    }

    const title = (input.title || '').trim();
    if (!title) {
      return { success: false, error: 'missing_title', detail: 'Upload title is required' };
    }

    const allowedTypes = ['label', 'barcode', 'package'];
    const docType = allowedTypes.includes(input.type || '') ? input.type! : 'other';
    if (docType === 'other') {
      return { success: false, error: 'invalid_type', detail: 'Only label, barcode, or package uploads are allowed.' };
    }

    const insertPayload = {
      order_id: orderId,
      kind: docType,
      file_type: docType,
      storage_path: input.fileUrl || title,
      file_url: input.fileUrl || title,
      created_by_role: 'user',
      uploader_role: 'user',
      note: input.description || null,
    };

    const { data: inserted, error: insertError } = await (admin.from('order_uploads') as any)
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError || !inserted) {
      console.error('[addOrderUpload] insert failed', insertError);
      return { success: false, error: 'upload_failed', detail: insertError?.message };
    }

    await (admin.from('order_events') as any).insert({
      order_id: orderId,
      event_type: 'upload_added',
      metadata: { upload_id: inserted.id, title, type: docType },
    });

    return { success: true, document: inserted };
  } catch (error) {
    console.error('[addOrderUpload] unexpected', error);
    return { success: false, error: 'upload_failed', detail: (error as Error)?.message };
  }
}

/**
 * Helper: Calculate estimated delivery date based on lead time and destination
 */
function calculateEstimatedDelivery(leadTimeDays: number, destination: string): Date {
  // Add 2 weeks for shipping from Asia
  const shippingDays = destination === 'US' ? 14 : 21;
  const totalDays = leadTimeDays + shippingDays;
  const date = new Date();
  date.setDate(date.getDate() + totalDays);
  return date;
}

/**
 * Fetch quotes for a verification request (up to 3)
 */
export async function getVerificationQuotes(
  verificationId: string
): Promise<{ success?: boolean; quotes?: any[]; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: quotes, error } = await (supabase
      .from('quotes') as any)
      .select('*')
      .eq('verification_id', verificationId)
      .eq('user_id', user.id)
      .order('position', { ascending: true })
      .limit(3);

    if (error) {
      console.error('[Orders] Failed to fetch quotes:', error);
      return { error: 'Failed to fetch quotes' };
    }

    return { quotes: quotes || [] };
  } catch (error) {
    console.error('[Orders] Unexpected error:', error);
    return { error: 'Unexpected error occurred' };
  }
}
