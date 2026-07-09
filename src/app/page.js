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
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Hi, {user?.name}</h1>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-200">
            Log out
          </button>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-md py-2 text-sm font-medium mb-4"
        >
          Create meeting
        </button>

        <div className="text-center text-xs text-gray-500 mb-4">or</div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Room code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm uppercase"
          />
          <button
            onClick={handleJoin}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md px-4 text-sm"
          >
            Join
          </button>
        </div>
      </div>
    </main>
  );
}