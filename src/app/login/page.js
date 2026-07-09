'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        // Signup only creates the account — log in right after for a smooth flow
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        if (!loginRes.ok) {
          setError('Account created — please log in.');
          setMode('login');
          setLoading(false);
          return;
        }
      }

      router.push('/');
    } catch (err) {
      setError('Network error. Is the server running?');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100 px-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-1">Lingua Bridge</h1>
        <p className="text-gray-400 text-sm mb-6">
          {mode === 'login' ? 'Log in to your account' : 'Create a new account'}
        </p>

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-md px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-md py-2 text-sm font-medium"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
          className="text-sm text-gray-400 mt-4 hover:text-gray-200"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </main>
  );
}