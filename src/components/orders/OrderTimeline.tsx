import { CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';

interface OrderTimelineProps {
  milestones: any[];
  events?: any[];
  onUpdateMilestone?: (milestoneId: string, status: string) => Promise<void>;
}

const milestoneLabels: Record<string, { label: string; description: string; icon: any }> = {
  quote_accepted: { label: 'Queued', description: 'Verification request queued', icon: Clock },
  pi_issued: { label: 'Supplier outreach', description: 'We are contacting suppliers', icon: Clock },
  payment_received: { label: 'Classification check', description: 'HS and duty checks underway', icon: Clock },
  production_started: { label: 'Quotes ready', description: 'Supplier quotes prepared for you', icon: CheckCircle2 },
  ready_to_ship: { label: 'Completed', description: 'Deliverables shared in about a week', icon: CheckCircle2 },
  shipped: { label: 'Shipped', description: 'In transit', icon: Clock },
  delivered: { label: 'Delivered', description: 'Order received', icon: CheckCircle2 },
};

const defaultSteps = [
  { id: 'step-1', key: 'quote_accepted', status: 'in_progress', created_at: new Date().toISOString() },
  { id: 'step-2', key: 'pi_issued', status: 'pending', created_at: new Date().toISOString() },
  { id: 'step-3', key: 'payment_received', status: 'pending', created_at: new Date().toISOString() },
  { id: 'step-4', key: 'production_started', status: 'pending', created_at: new Date().toISOString() },
  { id: 'step-5', key: 'ready_to_ship', status: 'pending', created_at: new Date().toISOString() },
];

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function OrderTimeline({ milestones, events = [], onUpdateMilestone }: OrderTimelineProps) {
  // Use default steps if no milestones exist
  const displayMilestones = milestones.length > 0 ? milestones : defaultSteps;
  
  const sortedMilestones = [...displayMilestones].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const completedCount = displayMilestones.filter(m => m.status === 'completed').length;
  const totalCount = displayMilestones.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-slate-900">Execution Timeline</h2>
          <span className="text-sm font-semibold text-slate-600">{progress}% Complete</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sortedMilestones.map((milestone, idx) => {
          const meta = milestoneLabels[milestone.key] || { label: milestone.key, description: '' };
          const isCompleted = milestone.status === 'completed';
          const isFailed = milestone.status === 'failed';
          const isInProgress = milestone.status === 'in_progress';

          return (
            <div key={milestone.id} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isFailed
                      ? 'bg-red-500 text-white'
                      : isInProgress
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isCompleted ? '✓' : isInProgress ? '◐' : isFailed ? '✕' : idx + 1}
                </div>
                {idx < sortedMilestones.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      isCompleted ? 'bg-green-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900">{meta.label}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">{meta.description}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[milestone.status]}`}>
                    {milestone.status === 'in_progress' ? 'In Progress' : milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                  </span>
                </div>

                {milestone.scheduled_date && (
                  <p className="text-xs text-slate-500 mt-2">
                    Scheduled: {new Date(milestone.scheduled_date).toLocaleDateString()}
                  </p>
                )}

                {milestone.completed_at && (
                  <p className="text-xs text-slate-500 mt-1">
                    Completed: {new Date(milestone.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
