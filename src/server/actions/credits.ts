'use server';

import { createClient } from '@/utils/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: 'monthly_grant' | 'admin_grant' | 'verification_used' | 'refund' | 'adjustment';
  description: string | null;
  created_at: string;
}

export async function getMyCredits(): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const admin = getSupabaseAdmin();
    const { data, error } = await (admin.from('user_credits') as any)
      .select('credits_balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('[getMyCredits] fetch failed', error);
      return { success: false, error: 'Failed to fetch credits' };
    }

    return { success: true, balance: data?.credits_balance ?? 0 };
  } catch (error) {
    console.error('[getMyCredits] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function getMyCreditTransactions(): Promise<{ success: boolean; transactions?: CreditTransaction[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const admin = getSupabaseAdmin();
    const { data, error } = await (admin.from('credit_transactions') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[getMyCreditTransactions] fetch failed', error);
      return { success: false, error: 'Failed to fetch transactions' };
    }

    return { success: true, transactions: data || [] };
  } catch (error) {
    console.error('[getMyCreditTransactions] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}

export async function adminGrantCredits(
  userId: string, 
  amount: number, 
  description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    if (!userId || amount === 0) return { success: false, error: 'Invalid input' };
    
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    
    const admin = getSupabaseAdmin();
    const params: Record<string, any> = {
      p_user_id: userId,
      p_amount: amount,
      p_type: 'admin_grant',
      p_description: description || `Admin granted ${amount} credits`,
      p_created_by: adminUser?.id || null,
    };
    const { data, error } = await admin.rpc('add_user_credits', params);

    if (error) {
      console.error('[adminGrantCredits] update failed', error);
      return { success: false, error: 'Failed to grant credits' };
    }

    return { success: true, newBalance: data };
  } catch (error) {
    console.error('[adminGrantCredits] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}

// Get all users with their credit balances (for admin)
export async function adminGetAllUserCredits(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  try {
    const admin = getSupabaseAdmin();
    // Get all users with credits
    const { data: credits, error: creditsError } = await (admin.from('user_credits') as any)
      .select('user_id, credits_balance, updated_at');

    if (creditsError) {
      console.error('[adminGetAllUserCredits] credits fetch failed', creditsError);
      return { success: false, error: 'Failed to fetch credits' };
    }

    // Get user emails from auth.users
    const userIds = (credits || []).map((c: any) => c.user_id);
    const { data: { users: authUsers }, error: usersError } = await admin.auth.admin.listUsers();
    // Merge emails into credits
    const users = (credits || []).map((c: any) => {
      const authUser = (authUsers || []).find((u: any) => u.id === c.user_id);
      return {
        user_id: c.user_id,
        credits_balance: c.credits_balance,
        updated_at: c.updated_at,
        email: authUser?.email || '',
      };
    });
    return { success: true, users };
  } catch (error) {
    console.error('[adminGetAllUserCredits] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}

    if (usersError) {
      console.error('[adminGetAllUserCredits] users fetch failed', usersError);
    }

    // Merge data
    const userMap = new Map((authUsers || []).map(u => [u.id, u]));
    const mergedUsers = (credits || []).map((c: any) => ({
      user_id: c.user_id,
      email: userMap.get(c.user_id)?.email || 'Unknown',
      credits_balance: c.credits_balance,
      updated_at: c.updated_at
    }));

    // Also add users with no credits row yet
    const existingUserIds = new Set((credits || []).map((c: any) => c.user_id));
    for (const authUser of (authUsers || [])) {
      if (!existingUserIds.has(authUser.id)) {
        mergedUsers.push({
          user_id: authUser.id,
          email: authUser.email || 'Unknown',
          credits_balance: 0,
          updated_at: null
        });
      }
    }

    return { success: true, users: mergedUsers };
  } catch (error) {
    console.error('[adminGetAllUserCredits] unexpected', error);
    return { success: false, error: 'Unexpected error' };
  }
}
