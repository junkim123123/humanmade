import { adminGetAllUserCredits, adminGrantCredits } from "@/server/actions/credits";

export async function getAllUserCredits() {
  return await adminGetAllUserCredits();
}

export async function grantCredits(userId: string, credits: number, description: string) {
  return await adminGrantCredits(userId, credits, description);
}
