'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const redirectTo = '/profile';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setError(payload?.error?.message || 'Login failed');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Unable to login right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#171717]">Customer Login</h1>
        <p className="mt-1 text-sm text-[#666]">Login with your email or mobile number.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#555]">Email or Mobile</label>
            <input
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#18a6d1]"
              placeholder="you@example.com or 9876543210"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#555]">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#18a6d1]"
              placeholder="Minimum 8 characters"
            />
          </div>

          {error ? <p className="text-xs font-semibold text-[#d43e3e]">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-sm text-[#666]">
          New customer?{' '}
          <Link href="/register" className="font-bold text-[#1768d6]">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
