'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MeResponse = {
  success: boolean;
  data?: {
    user?: {
      fullName: string | null;
      email: string | null;
      mobile: string | null;
      role: string;
      createdAt: string;
    };
  };
};

type ProfileUser = NonNullable<NonNullable<MeResponse['data']>['user']>;

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<ProfileUser | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          setUser(null);
          return;
        }

        const payload = (await res.json()) as MeResponse;
        setUser(payload.data?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  if (loading) {
    return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">Loading profile...</main>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-[#ececec] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-black text-[#171717]">Customer Profile</h1>
          <p className="mt-2 text-sm text-[#666]">Please login to view your profile.</p>
          <Link href="/login?redirect=/profile" className="mt-4 inline-flex rounded-lg bg-[#111] px-4 py-2 text-sm font-bold text-white">
            Go to Login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-[#ececec] bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-[#171717]">Customer Profile</h1>
        <p className="mt-1 text-sm text-[#666]">Your account details and identity info.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <article className="rounded-xl bg-[#fafafa] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666]">Name</p>
            <p className="mt-1 text-sm font-semibold text-[#171717]">{user.fullName ?? 'N/A'}</p>
          </article>
          <article className="rounded-xl bg-[#fafafa] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666]">Role</p>
            <p className="mt-1 text-sm font-semibold text-[#171717]">{user.role}</p>
          </article>
          <article className="rounded-xl bg-[#fafafa] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666]">Email</p>
            <p className="mt-1 text-sm font-semibold text-[#171717]">{user.email ?? 'N/A'}</p>
          </article>
          <article className="rounded-xl bg-[#fafafa] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#666]">Mobile</p>
            <p className="mt-1 text-sm font-semibold text-[#171717]">{user.mobile ?? 'N/A'}</p>
          </article>
        </div>

        <div className="mt-6 flex gap-2">
          <Link href="/orders" className="rounded-lg border border-[#e4e4e4] px-4 py-2 text-sm font-bold text-[#444]">
            My Orders
          </Link>
          <Link href="/products" className="rounded-lg border border-[#e4e4e4] px-4 py-2 text-sm font-bold text-[#444]">
            Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}
