import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { formatDistance } from 'date-fns'
import Link from 'next/link'
import type { Report } from '@/types/database'

type ReportWithProfile = Report & { profiles?: { email: string } }

async function getReports(): Promise<ReportWithProfile[]> {
  const supabase = getSupabaseAdmin()
  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      profiles!reports_user_id_fkey(email)
    `)
    .order('created_at', { ascending: false })
    .limit(1000)

  return (reports as ReportWithProfile[]) || []
}

// Deduplicate reports by user email and product name
function deduplicateReports(reports: ReportWithProfile[]): ReportWithProfile[] {
  const seen = new Map<string, ReportWithProfile>()
  
  for (const report of reports) {
    const email = (report.profiles as any)?.email || report.user_id || 'unknown'
    const productName = (report.product_name || '').toLowerCase().trim()
    const key = `${email}::${productName}`
    
    if (!seen.has(key)) {
      // First occurrence - keep the most recent one
      seen.set(key, report)
    } else {
      // Duplicate found - keep the one with the latest created_at
      const existing = seen.get(key)!
      const existingDate = new Date(existing.created_at)
      const currentDate = new Date(report.created_at)
      
      if (currentDate > existingDate) {
        seen.set(key, report)
      }
    }
  }
  
  return Array.from(seen.values())
}

export default async function ReportsPage() {
  const allReports = await getReports()
  const reports = deduplicateReports(allReports)

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
            <p className="text-slate-600 mt-2">
              Product analysis reports (deduplicated by user & product)
              {allReports.length !== reports.length && (
                <span className="ml-2 text-xs text-blue-600 font-semibold">
                  ({allReports.length} total, {reports.length} unique)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {report.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {(report.profiles as any)?.email || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      (report as any).status === 'completed' ? 'bg-green-100 text-green-800' :
                      (report as any).status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      (report as any).status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {(report as any).status || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {formatDistance(new Date(report.created_at), new Date(), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link 
                      href={`/reports/${report.id}/v2`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No reports found
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
