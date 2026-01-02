'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

/**
 * Request invoice for an order
 * Creates invoice record, generates payment link, sends email, updates order status
 */
export async function requestInvoice(orderId: string): Promise<{
  success: boolean;
  invoiceId?: string;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Fetch order and verify ownership
    const { data: order, error: orderError } = await (supabase
      .from('orders') as any)
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'awaiting_invoice') {
      return { success: false, error: 'Order is not awaiting invoice' };
    }

    const admin = getSupabaseAdmin();

    // Check if invoice already exists
    const { data: existingInvoice } = await (admin
      .from('invoices') as any)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (existingInvoice) {
      return { success: false, error: 'Invoice already exists' };
    }

    // Generate payment link (mock for now - would integrate Stripe)
    const paymentLink = `https://pay.nexsupply.com/invoice/${orderId}`;

    // Create invoice
    const { data: invoice, error: invoiceError } = await (admin
      .from('invoices') as any)
      .insert({
        order_id: orderId,
        user_id: user.id,
        amount: order.total_amount,
        currency: order.currency,
        status: 'pending',
        payment_link: paymentLink,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('[Invoice] Creation failed:', invoiceError);
      return { success: false, error: 'Failed to create invoice' };
    }

    // Update order status
    const { error: updateError } = await (admin
      .from('orders') as any)
      .update({ status: 'awaiting_payment' })
      .eq('id', orderId);

    if (updateError) {
      console.error('[Invoice] Order update failed:', updateError);
    }

    // TODO: Send email with payment link
    // For now, log it
    console.log('[Invoice] Payment link generated:', paymentLink);

    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    console.error('[Invoice] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Mark invoice as paid (admin/dev hook)
 * Updates invoice, order status, and seeds milestones
 */
export async function markInvoicePaid(invoiceId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const admin = getSupabaseAdmin();

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await (admin
      .from('invoices') as any)
      .select('*, orders!inner(*)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Invoice not found' };
    }

    if (invoice.status === 'paid') {
      return { success: false, error: 'Invoice already paid' };
    }

    const orderId = invoice.order_id;
    const order = invoice.orders;

    // Update invoice to paid
    const { error: updateInvoiceError } = await (admin
      .from('invoices') as any)
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (updateInvoiceError) {
      console.error('[Invoice] Update failed:', updateInvoiceError);
      return { success: false, error: 'Failed to mark invoice as paid' };
    }

    // Update order to in_progress
    const { error: updateOrderError } = await (admin
      .from('orders') as any)
      .update({ status: 'in_progress', payment_status: 'paid' })
      .eq('id', orderId);

    if (updateOrderError) {
      console.error('[Invoice] Order update failed:', updateOrderError);
    }

    // Seed default milestones if not already exists
    const { data: existingMilestones } = await (admin
      .from('order_milestones') as any)
      .select('id')
      .eq('order_id', orderId)
      .limit(1);

    if (!existingMilestones || existingMilestones.length === 0) {
      const leadTimeDays = 30; // Default
      const defaultMilestones = [
        { key: 'quote_accepted', scheduled_date: new Date() },
        { key: 'pi_issued', scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
        { key: 'payment_received', scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
        { key: 'production_started', scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
        { key: 'quality_check', scheduled_date: new Date(Date.now() + (leadTimeDays - 5) * 24 * 60 * 60 * 1000) },
        { key: 'ready_to_ship', scheduled_date: new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000) },
        { key: 'shipped', scheduled_date: new Date(Date.now() + leadTimeDays * 24 * 60 * 60 * 1000) },
        { key: 'delivered', scheduled_date: new Date(Date.now() + (leadTimeDays + 14) * 24 * 60 * 60 * 1000) },
      ];

      const milestonesToInsert = defaultMilestones.map(m => ({
        order_id: orderId,
        key: m.key,
        status: m.key === 'quote_accepted' || m.key === 'pi_issued' || m.key === 'payment_received' ? 'completed' : 'pending',
        scheduled_date: m.scheduled_date.toISOString().split('T')[0],
        completed_at: m.key === 'payment_received' ? new Date().toISOString() : null,
      }));

      await (admin
        .from('order_milestones') as any)
        .insert(milestonesToInsert);
    }

    return { success: true };
  } catch (error) {
    console.error('[Invoice] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Get invoice for order
 */
export async function getOrderInvoice(orderId: string): Promise<{
  invoice?: any;
  error?: string;
}> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { data: invoice, error } = await (supabase
      .from('invoices') as any)
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[Invoice] Fetch failed:', error);
      return { error: 'Failed to fetch invoice' };
    }

    return { invoice: invoice || null };
  } catch (error) {
    console.error('[Invoice] Unexpected error:', error);
    return { error: 'Unexpected error occurred' };
  }
}
