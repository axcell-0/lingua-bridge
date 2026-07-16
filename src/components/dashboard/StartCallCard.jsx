export default function StartCallCard({ userName, joinCode, setJoinCode, onCreate, onJoin, error }) {
  return (
    <div className="bg-slate-900 rounded-2xl p-8 text-white">
      <h2 className="text-2xl font-semibold mb-2">Connect globally, speak locally.</h2>
      <p className="text-slate-300 text-sm mb-6 max-w-md">
        Hi {userName} — launch a live, translated video call in seconds.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={onCreate} className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium rounded-lg px-5 py-2.5 text-sm transition-colors">
          Start instant meeting
        </button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm uppercase placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
          />
          <button onClick={onJoin} className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 text-sm font-medium transition-colors">
            Join with code
          </button>
        </div>
      </div>
    </div>
  );
}