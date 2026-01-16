import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const AdminConsultationsPage = async () => {
  const supabase = getSupabaseAdmin();
  
  const { data: requests, error } = await supabase
    .from('consultation_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.message.includes('relation "consultation_requests" does not exist')) {
       return (
         <div className="p-8">
           <h1 className="text-3xl font-bold text-slate-900 mb-2">Offline Consultations</h1>
           <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
             <p className="text-amber-800 font-semibold">Database table missing</p>
             <p className="text-amber-700 text-sm mt-1">
               The 'consultation_requests' table does not exist in your database yet. 
               Please run the migration '20260115_add_consultation_requests.sql'.
             </p>
           </div>
         </div>
       );
    }
    return <div className="p-8 text-red-600">Failed to load data: {error.message}</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Offline Consultations
          </h1>
          <p className="text-slate-600">
            View and manage consultation requests from landing pages.
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
          Total: {requests?.length || 0}
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-bold text-slate-900">Contact Info</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">Source</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">Status</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-900">Submitted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <p className="text-lg font-medium text-slate-400">No consultation requests yet</p>
                      <p className="text-sm mt-1">Submissions from the Zoom Booking Section will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests?.map((req: any) => (
                  <tr key={req.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{req.contact_info}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs">{req.source}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge 
                        variant={req.status === 'new' ? 'default' : 'outline'}
                        className={req.status === 'new' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                      >
                        {req.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                      {format(new Date(req.created_at), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdminConsultationsPage;
