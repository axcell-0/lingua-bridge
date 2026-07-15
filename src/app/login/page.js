'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'verify'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
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
        setMode('verify');
        setInfo(`We sent a code to ${form.email}.`);
        setLoading(false);
        return;
      }

      router.push('/');
    } catch (err) {
      setError('Network error. Is the server running?');
    }
    setLoading(false);
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        setLoading(false);
        return;
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      if (loginRes.ok) {
        router.push('/');
        return;
      }
      setMode('login');
      setInfo('Email verified — please log in.');
    } catch (err) {
      setError('Network error.');
    }
    setLoading(false);
  }

  async function handleResend() {
    setError('');
    setInfo('');
    try {
      await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      setInfo('A new code has been sent.');
    } catch (err) {
      setError('Network error.');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 shadow-sm rounded-2xl p-7">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">
          Lingua<span className="text-teal-600">Bridge</span>
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          {mode === 'login' && 'Log in to your account'}
          {mode === 'signup' && 'Create a new account'}
          {mode === 'verify' && 'Enter your verification code'}
        </p>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
        {info && !error && <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-3 py-2 mb-4">{info}</div>}

        {mode === 'verify' ? (
          <form onSubmit={handleVerify} className="space-y-3">
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
            <button type="button" onClick={handleResend} className="text-sm text-slate-500 hover:text-slate-700 w-full text-center">
              Resend code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input type="text" placeholder="Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500" required />
            )}
            <input type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500" required />
            <input type="password" placeholder="Password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500" required minLength={8} />
            <button type="submit" disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg py-2.5 text-sm font-medium">
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </form>
        )}

        {mode !== 'verify' && (
          <>
            <div className="flex items-center gap-2 my-4">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-400">or</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>
            <div className="space-y-2">
              <a href="/api/auth/google" className="flex items-center justify-center w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Continue with Google
              </a>
              <a href="/api/auth/github" className="flex items-center justify-center w-full border border-slate-200 rounded-lg py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                Continue with GitHub
              </a>
            </div>
          </>
        )}

        {mode !== 'verify' && (
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
            className="text-sm text-slate-500 mt-4 hover:text-slate-700">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        )}
      </div>
    </main>
  );
}