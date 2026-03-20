'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email || undefined,
          mobile: mobile || undefined,
          password,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        setError(payload?.error?.message || 'Registration failed');
        return;
      }

      router.push('/login');
      router.refresh();
    } catch {
      setError('Unable to register right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-[#ececec] bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-black text-[#171717]">Customer Registration</h1>
        <p className="mt-1 text-sm text-[#666]">Create an account to track orders and manage profile.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#555]">Full Name</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#18a6d1]"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#555]">Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#18a6d1]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#555]">Mobile (Optional)</label>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#e3e3e3] bg-[#fafafa] px-3 py-2 text-sm outline-none focus:border-[#18a6d1]"
              placeholder="9876543210"
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
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-[#666]">
          Already have account?{' '}
          <Link href="/login" className="font-bold text-[#1768d6]">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
