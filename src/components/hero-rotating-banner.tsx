'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  tone: string;
};

type HeroRotatingBannerProps = {
  slides?: HeroSlide[];
  autoScrollInterval?: number;
};

const defaultSlides: HeroSlide[] = [
  {
    id: 'gift',
    title: 'Your perfect gift is waiting here',
    subtitle: 'Fresh picks added every day for your family.',
    ctaLabel: 'View Products',
    ctaHref: '/products',
    tone: 'linear-gradient(118deg,#1b1b1b 0%,#2a2a2a 22%,#f97316 23%,#fdba74 58%,#ffedd5 100%)',
  },
  {
    id: 'daily',
    title: 'Daily deals, smarter shopping',
    subtitle: 'Save more with trending offers and value bundles.',
    ctaLabel: 'Shop Deals',
    ctaHref: '/products?sort=popular',
    tone: 'linear-gradient(118deg,#171717 0%,#242424 20%,#ea580c 21%,#fb923c 56%,#fed7aa 100%)',
  },
  {
    id: 'new',
    title: 'New arrivals you will actually use',
    subtitle: 'From groceries to home essentials in one place.',
    ctaLabel: 'Explore New',
    ctaHref: '/products',
    tone: 'linear-gradient(118deg,#141414 0%,#252525 24%,#f97316 25%,#fb923c 55%,#ffedd5 100%)',
  },
];

export default function HeroRotatingBanner({
  slides,
  autoScrollInterval = 4500,
}: HeroRotatingBannerProps) {
  const items = useMemo(() => (slides?.length ? slides : defaultSlides), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, autoScrollInterval);

    return () => window.clearInterval(timer);
  }, [items.length, autoScrollInterval]);

  const active = items[activeIndex];

  return (
    <article
      className="hero-card relative overflow-hidden rounded-2xl border border-[#fb923c] px-6 py-7 shadow-[0_10px_30px_rgba(0,0,0,0.12)] transition-all duration-700"
      style={{ backgroundImage: active.tone }}
      aria-live="polite"
    >
      <p className="inline-flex rounded-full border border-white/70 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white">
        TODAY'S OFFERS
      </p>

      <p className="mt-3 max-w-[740px] text-4xl font-black leading-[1.05] text-white sm:text-5xl">
        {active.title}
      </p>
      {active.subtitle ? <p className="mt-3 max-w-[620px] text-sm font-semibold text-white/85 sm:text-base">{active.subtitle}</p> : null}

      <Link href={active.ctaHref} className="mt-6 inline-flex rounded-xl bg-[#111] px-6 py-2 text-sm font-black text-white shadow-sm">
        {active.ctaLabel}
      </Link>

      <div className="mt-4 flex items-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show banner ${index + 1}`}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </article>
  );
}

