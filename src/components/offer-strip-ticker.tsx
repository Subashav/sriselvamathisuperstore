'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type OfferStripItem = {
  id: string;
  title: string;
  description?: string;
  link?: string;
};

type OfferStripTickerProps = {
  offers: OfferStripItem[];
  autoScrollInterval?: number;
};

export default function OfferStripTicker({ offers, autoScrollInterval = 5000 }: OfferStripTickerProps) {
  const validOffers = useMemo(() => offers.filter((offer) => offer.title.trim().length > 0), [offers]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (validOffers.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % validOffers.length);
    }, autoScrollInterval);

    return () => clearInterval(timer);
  }, [autoScrollInterval, validOffers.length]);

  if (!validOffers.length) {
    return (
      <p className="truncate text-center text-[11px] font-semibold text-white sm:text-xs">
        Service 4.9 out of 5 | Call us +91 98948-49778
      </p>
    );
  }

  const current = validOffers[activeIndex];
  const label = current.description ? `${current.title} - ${current.description}` : current.title;

  return (
    <div className="flex min-w-0 items-center justify-center gap-3">
      <span className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        Offer
      </span>
      {current.link ? (
        <Link
          href={current.link}
          className="truncate text-center text-[11px] font-semibold text-white transition hover:text-[#ffe082] sm:text-xs"
        >
          {label}
        </Link>
      ) : (
        <p className="truncate text-center text-[11px] font-semibold text-white sm:text-xs">{label}</p>
      )}
    </div>
  );
}
