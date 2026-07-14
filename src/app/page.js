'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('not authenticated');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleCreate() {
    setError('');
    const res = await fetch('/api/rooms', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    router.push(`/room/${data.room.code}`);
  }

  async function handleJoin() {
    setError('');
    if (!joinCode.trim()) return;
    const res = await fetch(`/api/rooms/${joinCode.trim().toUpperCase()}/join`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    router.push(`/room/${data.room.code}`);
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">
          Lingua<span className="text-teal-600">Bridge</span>
        </h1>
        <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
          Log out
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-slate-900 rounded-2xl p-8 mb-6 text-white">
          <h2 className="text-2xl font-semibold mb-2">Connect globally, speak locally.</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-md">
            Hi {user?.name} — launch a live, translated video call in seconds.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCreate}
              className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-medium rounded-lg px-5 py-2.5 text-sm transition-colors"
            >
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
              <button
                onClick={handleJoin}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg px-4 text-sm font-medium transition-colors"
              >
                Join with code
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Real-time speech translation, powered by your own microphone and camera.
        </p>
      </div>
    </main>
  );
}