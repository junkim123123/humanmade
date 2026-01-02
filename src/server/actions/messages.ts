'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { requireAdminUser } from '@/lib/auth/admin'
import { sendOrderMessage } from './orders'
import { cookies } from 'next/headers'

export async function getOrderMessages(orderId: string, opts?: { asAdmin?: boolean }) {
  try {
    if (!orderId) return { success: false, error: 'Missing orderId' }

    if (opts?.asAdmin) {
      await requireAdminUser()
      const admin = getSupabaseAdmin()
      const { data, error } = await (admin.from('order_messages') as any)
        .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return { success: true, messages: data || [] }
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data, error } = await (supabase.from('order_messages') as any)
      .select('id, order_id, sender_id, sender_role, sender, body, created_at, visible_to_user')
      .eq('order_id', orderId)
      .eq('visible_to_user', true)
      .order('created_at', { ascending: true })
    if (error) throw error
    return { success: true, messages: data || [] }
  } catch (error: any) {
    console.error('[getOrderMessages] failed', error)
    return { success: false, error: error.message || 'Failed to load messages' }
  }
}

export async function sendUserMessage(orderId: string, body: string) {
  return await sendOrderMessage(orderId, body, 'user')
}

export async function sendAdminMessage(orderId: string, body: string) {
  try {
    const adminUser = await requireAdminUser()
    const admin = getSupabaseAdmin()
    if (!body?.trim()) return { success: false, error: 'Message is empty' }

    const { data, error } = await (admin.from('order_messages') as any)
      .insert({ order_id: orderId, sender_role: 'admin', sender: 'admin', sender_id: adminUser?.id || null, body, visible_to_user: true })
      .select()
      .single()
    if (error) throw error

    await (admin.from('order_events') as any).insert({ order_id: orderId, event_type: 'message_sent', metadata: { from: 'admin' } })

    return { success: true, message: data }
  } catch (error: any) {
    console.error('[sendAdminMessage] failed', error)
    return { success: false, error: error.message || 'Failed to send message' }
  }
}
