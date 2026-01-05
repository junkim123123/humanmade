'use client';

import { useState } from 'react';
import { Folder, ChevronDown, MessageSquare, FileText } from 'lucide-react';
import Link from 'next/link';

// This interface needs to be defined or imported if it's not in the same file.
// Assuming it's passed in props from the page component where it is defined.
interface Report {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  potential_savings?: string; 
}

interface UserWithReports {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  reports: Report[];
}


export default function UserFolderList({ users }: { users: UserWithReports[] }) {
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
          {/* 폴더 헤더 */}
          <div 
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setOpenUserId(openUserId === user.id ? null : user.id)}
          >
            <div className="flex items-center space-x-3">
              <Folder className="text-blue-500" size={20} />
              <div>
                <p className="font-semibold">{user.email}</p>
                <p className="text-xs text-gray-500">{user.reports.length} Reports analyzed</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 채팅 연동 버튼: 특정 유저와의 대화방으로 바로 이동 */}
              <Link href={`/admin/messaging?user=${user.id}`}>
                <button className="flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors">
                  <MessageSquare size={14} />
                  <span>Start Chat</span>
                </button>
              </Link>
              <ChevronDown className={`transition-transform ${openUserId === user.id ? 'rotate-180' : ''}`} size={18} />
            </div>
          </div>

          {/* 폴더 내부 (리포트 리스트) */}
          {openUserId === user.id && (
            <div className="bg-gray-50 p-4 border-t divide-y">
              {user.reports.length > 0 ? (
                user.reports.map((report) => (
                  <div key={report.id} className="py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <FileText size={14} className="text-gray-400" />
                      <span className="text-sm">{report.product_name}</span>
                      <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                        {report.status}
                      </span>
                    </div>
                    
                    {/* 개별 리포트 기반 맞춤형 채팅 제안 (Nudge) */}
                    <Link href={`/admin/messaging?user=${user.id}&ref=${report.id}`}>
                      <button className="text-[11px] text-gray-500 hover:text-blue-600 underline">
                        Nudge about this
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 py-2">No reports yet.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
