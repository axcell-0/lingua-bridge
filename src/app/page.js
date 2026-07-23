'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/dashboard/Avatar';
import StartCallCard from '@/components/dashboard/StartCallCard';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingMeetings from '@/components/dashboard/UpcomingMeetings';
import { CiLogin } from 'react-icons/ci';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const { user } = await meRes.json();
      setUser(user);

      const roomsRes = await fetch('/api/rooms/mine');
      if (roomsRes.ok) {
        const { rooms } = await roomsRes.json();
        setRooms(rooms);
      }
      setLoading(false);
    }
    load();
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

  async function handleSchedule({ title, scheduledFor }) {
    const res = await fetch('/api/rooms/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, scheduledFor }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    setRooms((prev) => [data.room, ...prev]);
    return {};
  }

  function handleStartOrRejoin(code) {
    router.push(`/room/${code}`);
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

  const now = new Date();
  const upcoming = rooms.filter((r) => r.status === 'scheduled' && new Date(r.scheduledFor) > now);
  const recent = rooms.filter((r) => r.status !== 'scheduled');

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">
          Lingua<span className="text-teal-600">Bridge</span>
        </h1>
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} />
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
            <CiLogin size={24} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <StartCallCard
          userName={user?.name}
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          onCreate={handleCreate}
          onJoin={handleJoin}
          error={error}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <RecentActivity rooms={recent} onRejoin={handleStartOrRejoin} />
          <UpcomingMeetings rooms={upcoming} onSchedule={handleSchedule} onStart={handleStartOrRejoin} />
        </div>
      </div>
    </main>
  );
}