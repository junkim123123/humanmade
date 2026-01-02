'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

/**
 * Get or create verification request for a report
 */
export async function getOrCreateVerification(reportId: string): Promise<{
  verification?: any;
  quotes?: any[];
  error?: string;
}> {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    // Check if verification already exists
    const { data: existing } = await (supabase
      .from('verification_requests') as any)
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Fetch quotes
      const { data: quotes } = await (supabase
        .from('quotes') as any)
        .select('*')
        .eq('verification_id', existing.id)
        .order('position', { ascending: true });

      return { verification: existing, quotes: quotes || [] };
    }

    // Create new verification
    const admin = getSupabaseAdmin();
    const { data: newVerification, error: createError } = await (admin
      .from('verification_requests') as any)
      .insert({
        report_id: reportId,
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (createError) {
      console.error('[Verification] Create failed:', createError);
      return { error: 'Failed to create verification' };
    }

    return { verification: newVerification, quotes: [] };
  } catch (error) {
    console.error('[Verification] Unexpected error:', error);
    return { error: 'Unexpected error occurred' };
  }
}

/**
 * Start verification process (mock - sets to in_progress)
 */
export async function startVerification(verificationId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await (supabase
      .from('verification_requests') as any)
      .update({ status: 'in_progress' })
      .eq('id', verificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Verification] Update failed:', error);
      return { success: false, error: 'Failed to start verification' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Verification] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Create mock quotes for verification (dev/admin helper)
 */
export async function createMockQuotes(
  verificationId: string,
  reportId: string,
  productName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient(cookies());
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const admin = getSupabaseAdmin();

    // Create 3 mock quotes
    const quotes = [
      {
        verification_id: verificationId,
        report_id: reportId,
        user_id: user.id,
        supplier_id: 'MOCK_SUPP_001',
        supplier_name: 'Golden Dragon Manufacturing',
        product_name: productName,
        unit_price: 12.50,
        currency: 'USD',
        moq: 500,
        lead_time_days: 30,
        incoterm: 'FOB',
        origin_country: 'CN',
        status: 'accepted',
        verified_at: new Date().toISOString(),
        expiration_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        position: 1,
      },
      {
        verification_id: verificationId,
        report_id: reportId,
        user_id: user.id,
        supplier_id: 'MOCK_SUPP_002',
        supplier_name: 'Pacific Trade Solutions',
        product_name: productName,
        unit_price: 11.80,
        currency: 'USD',
        moq: 1000,
        lead_time_days: 25,
        incoterm: 'FOB',
        origin_country: 'CN',
        status: 'accepted',
        verified_at: new Date().toISOString(),
        expiration_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        position: 2,
      },
      {
        verification_id: verificationId,
        report_id: reportId,
        user_id: user.id,
        supplier_id: 'MOCK_SUPP_003',
        supplier_name: 'Asia Direct Factory',
        product_name: productName,
        unit_price: 13.20,
        currency: 'USD',
        moq: 300,
        lead_time_days: 35,
        incoterm: 'CIF',
        origin_country: 'CN',
        status: 'accepted',
        verified_at: new Date().toISOString(),
        expiration_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        position: 3,
      },
    ];

    const { error } = await (admin
      .from('quotes') as any)
      .insert(quotes);

    if (error) {
      console.error('[Verification] Quote creation failed:', error);
      return { success: false, error: 'Failed to create quotes' };
    }

    // Update verification to completed
    await (admin
      .from('verification_requests') as any)
      .update({ status: 'completed' })
      .eq('id', verificationId);

    return { success: true };
  } catch (error) {
    console.error('[Verification] Unexpected error:', error);
    return { success: false, error: 'Unexpected error occurred' };
  }
}

/**
 * Check if quote is expired
 */
export function isQuoteExpired(quote: any): boolean {
  if (!quote.expiration_at) return false;
  return new Date(quote.expiration_at) < new Date();
}

/**
 * Get active (non-expired) quotes
 */
export function getActiveQuotes(quotes: any[]): any[] {
  return quotes.filter(q => !isQuoteExpired(q) && q.status === 'accepted');
}
