import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { formatDistance } from 'date-fns'
import type { Profile } from '@/types/database'

type ProfileWithLastProduct = Profile & {
  lastReport?: {
    product_name: string
    created_at: string
  }
}

async function getUsers(): Promise<ProfileWithLastProduct[]> {
  const supabase = getSupabaseAdmin()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (!users || users.length === 0) {
    return []
  }

  // Get the latest report for each user
  const userIds = users.map(u => u.id)
  const { data: latestReports } = await supabase
    .from('reports')
    .select('user_id, product_name, created_at')
    .in('user_id', userIds)
    .order('created_at', { ascending: false })

  // Create a map of user_id -> latest report
  const reportMap = new Map<string, { product_name: string; created_at: string }>()
  if (latestReports) {
    for (const report of latestReports) {
      if (!reportMap.has(report.user_id)) {
        reportMap.set(report.user_id, {
          product_name: report.product_name || '—',
          created_at: report.created_at,
        })
      }
    }
  }

  // Attach last report to each user
  return users.map(user => ({
    ...user,
    lastReport: reportMap.get(user.id),
  })) as ProfileWithLastProduct[]
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-600 mt-2">Manage user accounts and permissions</p>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Last Analyzed Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {user.full_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {user.lastReport ? (
                      <div>
                        <div className="font-medium text-slate-900">{user.lastReport.product_name}</div>
                        <div className="text-xs text-slate-500">
                          {formatDistance(new Date(user.lastReport.created_at), new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">No reports yet</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {formatDistance(new Date(user.created_at), new Date(), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No users found
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
