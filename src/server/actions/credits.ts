
"use server";

import { createClient } from "@/utils/supabase/server";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'range not found' for new users
    console.error("[getMyCredits] Error fetching credits:", error);
    return { success: false, error: error.message };
  }

  return { success: true, balance: data?.balance || 0 };
}

export async function getMyCreditTransactions(): Promise<{ success: boolean; transactions?: CreditTransaction[]; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getMyCreditTransactions] Error fetching transactions:", error);
    return { success: false, error: error.message };
  }

  return { success: true, transactions: data || [] };
}

export async function adminGrantCredits(
  userId: string,
  amount: number,
  description?: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('grant_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_description: description
  });

  if (error) {
    console.error("[adminGrantCredits] RPC Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, newBalance: data };
}

export async function adminGetAllUserCredits(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credits")
    .select("user_id, balance, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[adminGetAllUserCredits] Error:", error);
    return { success: false, error: error.message };
  }
  return { success: true, users: data };
}
