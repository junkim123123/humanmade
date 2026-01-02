
'use server';

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
  return { success: true, balance: 0 };
}

export async function getMyCreditTransactions(): Promise<{ success: boolean; transactions?: CreditTransaction[]; error?: string }> {
  return { success: true, transactions: [] };
}

export async function adminGrantCredits(
  userId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  return { success: true, newBalance: 0 };
}

export async function adminGetAllUserCredits(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  return { success: true, users: [] };
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
