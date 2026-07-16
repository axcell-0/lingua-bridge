import { formatRelative } from '@/lib/formatDate';

const STATUS_STYLES = {
  active: 'bg-teal-100 text-teal-700',
  waiting: 'bg-slate-200 text-slate-600',
  ended: 'bg-slate-100 text-slate-400',
};

export default function RecentActivity({ rooms, onRejoin }) {
  if (rooms.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Recent activity</h3>
        <p className="text-sm text-slate-400">No calls yet — start one above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Recent activity</h3>
      <div className="space-y-2">
        {rooms.map((r) => (
          <div key={r._id} className="flex items-center justify-between text-sm">
            <div>
              <span className="font-mono text-slate-700">{r.code}</span>
              <span className="text-slate-400 ml-2">{formatRelative(r.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status] || STATUS_STYLES.ended}`}>
                {r.status}
              </span>
              {r.status !== 'ended' && (
                <button onClick={() => onRejoin(r.code)} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                  Rejoin
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}