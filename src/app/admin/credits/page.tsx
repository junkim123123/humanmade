import AdminCreditsClient from "./AdminCreditsClient";
import { adminGetAllUserCredits } from "@/server/actions/credits";

export default async function AdminCreditsPage() {
  const res = await adminGetAllUserCredits();
  const users = res.success ? res.users || [] : [];
  return <AdminCreditsClient users={users} />;
}
