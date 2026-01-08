
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
    .from("user_credits")
    .select("credits_balance")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // Ignore 'range not found' for new users
    console.error("[getMyCredits] Error fetching credits:", error);
    return { success: false, error: error.message };
  }

  return { success: true, balance: data?.credits_balance || 0 };
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
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  try {
    // 1. Get current balance or create credits record if it doesn't exist
    const { data: existingCredits, error: fetchError } = await supabase
      .from("user_credits")
      .select("credits_balance")
      .eq("user_id", userId)
      .single();

    let currentBalance = 0;
    
    if (fetchError && fetchError.code === 'PGRST116') {
      // Credits record doesn't exist, create it
      const { error: insertError } = await supabase
        .from("user_credits")
        .insert({
          user_id: userId,
          credits_balance: 0,
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("[adminGrantCredits] Error creating credits record:", insertError);
        return { success: false, error: insertError.message };
      }
      currentBalance = 0;
    } else if (fetchError) {
      console.error("[adminGrantCredits] Error fetching credits:", fetchError);
      return { success: false, error: fetchError.message };
    } else {
      currentBalance = existingCredits?.credits_balance || 0;
    }

    // 2. Calculate new balance
    const newBalance = currentBalance + amount;

    // 3. Insert transaction record
    const { error: transactionError } = await supabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        amount: amount,
        balance_after: newBalance,
        type: 'admin_grant',
        description: description || null,
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error("[adminGrantCredits] Error inserting transaction:", transactionError);
      return { success: false, error: transactionError.message };
    }

    // 4. Update credits balance
    const { error: updateError } = await supabase
      .from("user_credits")
      .update({
        credits_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("[adminGrantCredits] Error updating credits:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, newBalance };
  } catch (error) {
    console.error("[adminGrantCredits] Unexpected error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function adminGetAllUserCredits(): Promise<{ success: boolean; users?: any[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_credits")
    .select("user_id, credits_balance, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[adminGetAllUserCredits] Error:", error);
    return { success: false, error: error.message };
  }
  return { success: true, users: data };
}
