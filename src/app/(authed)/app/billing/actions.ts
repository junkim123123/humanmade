import { getMyCredits, getMyCreditTransactions } from "@/server/actions/credits";

export async function fetchMyCredits() {
  return await getMyCredits();
}

export async function fetchMyCreditTransactions() {
  return await getMyCreditTransactions();
}
