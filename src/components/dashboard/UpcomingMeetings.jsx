import { useState } from 'react';
import { formatRelative } from '@/lib/formatDate';

export default function UpcomingMeetings({ rooms, onSchedule, onStart }) {
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [error, setError] = useState('');

  async function handleSchedule() {
    setError('');
    if (!when) { setError('Pick a date and time.'); return; }
    const result = await onSchedule({ title, scheduledFor: when });
    if (result?.error) { setError(result.error); return; }
    setTitle('');
    setWhen('');
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming meetings</h3>

      {rooms.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">Nothing scheduled yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {rooms.map((r) => (
            <div key={r._id} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-slate-700">{r.title || 'Untitled meeting'}</span>
                <span className="text-slate-400 ml-2">{formatRelative(r.scheduledFor)}</span>
              </div>
              <button onClick={() => onStart(r.code)} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                Start
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
        <input
          type="text"
          placeholder="Meeting title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
          />
          <button onClick={handleSchedule} className="bg-slate-900 hover:bg-black text-white rounded-lg px-4 text-sm font-medium">
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}