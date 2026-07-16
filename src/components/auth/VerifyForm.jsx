export default function VerifyForm({ code, setCode, loading, onSubmit, onResend }) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="6-digit code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
        required
      />
      <button type="submit" disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium">
        {loading ? 'Verifying…' : 'Verify'}
      </button>
      <button type="button" onClick={onResend} className="text-sm text-slate-500 hover:text-slate-700 w-full text-center">
        Resend code
      </button>
    </form>
  );
}