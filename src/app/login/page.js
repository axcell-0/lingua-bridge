'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import WelcomePanel from '@/components/auth/WelcomePanel';
import CredentialsForm from '@/components/auth/CredentialsForm';
import VerifyForm from '@/components/auth/VerifyForm';
import OAuthButtons from '@/components/auth/OAuthButtons';

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
    <main className="min-h-screen flex bg-slate-50">
      <WelcomePanel />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="md:hidden text-center mb-6">
            <span className="text-xl font-semibold text-slate-900">
              Lingua<span className="text-teal-600">Bridge</span>
            </span>
          </div>

          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-7">
            <h2 className="text-xl font-semibold text-slate-900 mb-1">
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'verify' && 'Check your email'}
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              {mode === 'login' && 'Log in to start a call'}
              {mode === 'signup' && 'Takes less than a minute'}
              {mode === 'verify' && 'Enter your verification code'}
            </p>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
            {info && !error && <div className="bg-teal-50 border border-teal-200 text-teal-700 text-sm rounded-lg px-3 py-2 mb-4">{info}</div>}

            {mode === 'verify' ? (
              <VerifyForm code={code} setCode={setCode} loading={loading} onSubmit={handleVerify} onResend={handleResend} />
            ) : (
              <>
                <CredentialsForm mode={mode} form={form} setForm={setForm} loading={loading} onSubmit={handleSubmit} />
                <div className="flex items-center gap-2 my-4">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-xs text-slate-400">or</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>
                <OAuthButtons />
                <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setInfo(''); }}
                  className="text-sm text-slate-500 mt-4 hover:text-slate-700 w-full text-center">
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}