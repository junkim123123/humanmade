// src/app/admin/users/page.tsx

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import UserFolderList from '@/components/admin/UserFolderList';

// 데이터 구조 정의
interface Report {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  // 소싱 최적화 데이터 (채팅 시 활용)
  potential_savings?: string; 
}

interface UserWithReports {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  reports: Report[]; // Join 결과물
}

export default async function AdminUsersPage() {
  const supabase = getSupabaseAdmin();
  // JOIN 쿼리로 한 번에 가져오기 (성능 최적화)
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

  if (error) return <div>데이터 로드 실패: {error.message}</div>;

  // 필드명 변환 (full_name -> name)
  const users: UserWithReports[] = (profiles || []).map(p => ({
    ...p,
    name: p.full_name
  }));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        User Intelligence Pool
      </h1>
      <p className="text-slate-600 mb-6">
        Monitor user activity and manage reports.
      </p>
      {/* 유저별 폴더 UI 컴포넌트 */}
      <UserFolderList users={users} />
    </div>
  );
}
