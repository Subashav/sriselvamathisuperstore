'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';

type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  tone: string;
  emoji: string;
  highlight: string;
};

type HeroRotatingBannerProps = {
  slides?: HeroSlide[];
  autoScrollInterval?: number;
};

const defaultSlides: HeroSlide[] = [
  {
    id: 'mega-sale',
    badge: 'LIMITED TIME',
    title: 'Mega Sale is LIVE 🔥',
    subtitle: 'Flat 40–70% OFF across 500+ products. Grab daily essentials, gadgets & more!',
    ctaLabel: 'Shop the Sale →',
    ctaHref: '/products?sort=popular',
    tone: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 50%, #ff6a00 100%)',
    emoji: '🛒',
    highlight: 'Up to 70% OFF',
  },
  {
    id: 'free-delivery',
    badge: 'FREE SHIPPING',
    title: 'Free Delivery on ₹499+ 🚚',
    subtitle: 'No delivery charges on orders above ₹499. Same-day dispatch for Tamil Nadu metros!',
    ctaLabel: 'Start Shopping →',
    ctaHref: '/products',
    tone: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
    emoji: '📦',
    highlight: 'Zero Delivery Fee',
  },
  {
    id: 'new-arrivals',
    badge: 'JUST LANDED',
    title: 'Fresh New Arrivals ✨',
    subtitle: 'Discover trending products added this week — from home decor to kitchen must-haves.',
    ctaLabel: 'Explore New →',
    ctaHref: '/products',
    tone: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #11998e 100%)',
    emoji: '🆕',
    highlight: '100+ New Items',
  },
  {
    id: 'combo-deal',
    badge: 'COMBO OFFER',
    title: 'Buy 2, Get 1 FREE 🎁',
    subtitle: 'Mix & match across categories. Stack your cart and save big — valid on 200+ products!',
    ctaLabel: 'Grab the Deal →',
    ctaHref: '/products?sort=popular',
    tone: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f093fb 100%)',
    emoji: '🎉',
    highlight: 'Buy 2 Get 1',
  },
];

export default function HeroRotatingBanner({
  slides,
  autoScrollInterval = 4000,
}: HeroRotatingBannerProps) {
  const items = useMemo(() => (slides?.length ? slides : defaultSlides), [slides]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (items.length <= 1 || isPaused) return;
    const timer = window.setInterval(goNext, autoScrollInterval);
    return () => window.clearInterval(timer);
  }, [items.length, autoScrollInterval, isPaused, goNext]);

  const active = items[activeIndex];

  return (
    <article
      className="hero-card group relative overflow-hidden rounded-2xl border border-white/20 px-6 py-7 shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-all duration-700 sm:px-8 sm:py-9"
      style={{ backgroundImage: active.tone, backgroundSize: '200% 200%' }}
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background shimmer */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'shimmer 3s ease-in-out infinite',
        }}
        aria-hidden="true"
      />

      {/* Floating decorative shapes */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-xl" aria-hidden="true" />
      <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/8 blur-lg" aria-hidden="true" />
      <div className="absolute right-20 top-4 text-5xl opacity-15 sm:text-7xl" aria-hidden="true">{active.emoji}</div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-white backdrop-blur-sm">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            {active.badge}
          </span>
          <span className="hidden rounded-full bg-black/25 px-2.5 py-0.5 text-[10px] font-bold text-white/90 backdrop-blur-sm sm:inline-flex">
            {active.highlight}
          </span>
        </div>

        <p className="mt-4 max-w-[740px] text-3xl font-black leading-[1.05] text-white drop-shadow-lg sm:text-5xl">
          {active.title}
        </p>
        {active.subtitle ? (
          <p className="mt-3 max-w-[620px] text-sm font-semibold text-white/85 sm:text-base">
            {active.subtitle}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <Link
            href={active.ctaHref}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-black text-gray-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            {active.ctaLabel}
          </Link>
          <span className="hidden text-xs font-semibold text-white/60 sm:inline">
            Ends soon — shop before it&apos;s gone!
          </span>
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white/80 opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white group-hover:opacity-100 sm:left-3 sm:p-2"
            aria-label="Previous slide"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white/80 opacity-0 backdrop-blur-sm transition-all hover:bg-black/50 hover:text-white group-hover:opacity-100 sm:right-3 sm:p-2"
            aria-label="Next slide"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dot indicators */}
      <div className="relative z-10 mt-5 flex items-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Show banner ${index + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? 'w-10 bg-white shadow-lg'
                : 'w-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
        <span className="ml-auto text-[10px] font-bold text-white/50">
          {activeIndex + 1} / {items.length}
        </span>
      </div>

      {/* Inline animation keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }
      ` }} />
    </article>
  );
}
