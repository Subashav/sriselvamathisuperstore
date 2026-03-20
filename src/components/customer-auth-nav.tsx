'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';

type MeResponse = {
  success: boolean;
  data?: {
    user?: {
      id: string;
      fullName: string | null;
      email: string | null;
      mobile: string | null;
      role: string;
    };
  };
};

type AuthUser = NonNullable<NonNullable<MeResponse['data']>['user']>;

export default function CustomerAuthNav() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<AuthUser | null>(null);

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

  const displayName = useMemo(() => {
    if (!user?.fullName) return 'Profile';
    const [first] = user.fullName.trim().split(' ');
    return first || 'Profile';
  }, [user]);

  const handleLogout = () => {
    startTransition(async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } finally {
        window.location.href = '/';
      }
    });
  };

  if (loading) {
    return <span className="text-sm font-semibold text-[#777]">Loading...</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-semibold text-[#474747] transition-colors hover:text-[#111]">
          Login
        </Link>
        <Link href="/register" className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-bold text-[#1a1a1a]">
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/profile" className="text-sm font-semibold text-[#474747] transition-colors hover:text-[#111]">
        {displayName}
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={handleLogout}
        className="rounded-full border border-[#e3e3e3] px-4 py-2 text-sm font-bold text-[#444] disabled:opacity-50"
      >
        {isPending ? '...' : 'Logout'}
      </button>
    </div>
  );
}

