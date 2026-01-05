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
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      reports (
        id,
        product_name,
        status,
        created_at
      )
    `)
    .order('created_at', { ascending: false })
    .returns<UserWithReports[]>();

  if (error) return <div>데이터 로드 실패: {error.message}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Intelligence Pool</h1>
      {/* 유저별 폴더 UI 컴포넌트 */}
      <UserFolderList users={users} />
    </div>
  );
}
