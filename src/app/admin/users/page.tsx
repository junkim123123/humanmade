// src/app/admin/users/page.tsx

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import UserFolderList from '@/components/admin/UserFolderList';

// Data structure definitions
interface Report {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  // Sourcing optimization data (for chat)
  potential_savings?: string; 
}

interface UserWithReports {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  reports: Report[]; // Join results
}

export default async function AdminUsersPage() {
  const supabase = getSupabaseAdmin();
  // Fetch profiles with reports via JOIN (Performance optimization)
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select(`
      *,
      reports (
        id,
        product_name,
        status,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return <div>Failed to load data: {error.message}</div>;

  // Field mapping (full_name -> name) and type safety
  const users: UserWithReports[] = (profiles || []).map((p: any) => ({
    id: p.id,
    email: p.email,
    name: p.full_name || null,
    role: p.role || 'user',
    created_at: p.created_at,
    reports: p.reports || []
  }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        User Intelligence Pool
      </h1>
      <p className="text-slate-600 mb-6">
        Monitor user activity and manage reports.
      </p>
      {/* User Folder UI Component */}
      <UserFolderList users={users} />
    </div>
  );
}
