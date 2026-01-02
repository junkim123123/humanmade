'use server';

import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  notify_quotes_ready: boolean;
  notify_order_updates: boolean;
  notify_monthly_credits: boolean;
  notify_marketing: boolean;
  role?: string | null;
}

export async function getMyProfile(): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[getMyProfile] fetch failed', error);
      return { success: false, error: 'Failed to fetch profile' };
    }

    return { success: true, profile: data as UserProfile };
  } catch (error) {
    console.error('[getMyProfile] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function updateProfile(updates: Partial<Omit<UserProfile, 'id' | 'email'>>): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const admin = getSupabaseAdmin();
    const { error } = await admin
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('[updateProfile] update failed', error);
      return { success: false, error: 'Failed to update profile' };
    }

    revalidatePath('/app/account');
    return { success: true };
  } catch (error) {
    console.error('[updateProfile] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function updateNotificationSettings(settings: {
  notify_quotes_ready?: boolean;
  notify_order_updates?: boolean;
  notify_monthly_credits?: boolean;
  notify_marketing?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  return updateProfile(settings);
}
