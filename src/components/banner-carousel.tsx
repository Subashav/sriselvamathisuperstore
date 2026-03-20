'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export interface BannerItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  bgColor: string;
  textColor: string;
  link?: string;
}

interface BannerCarouselProps {
  banners: BannerItem[];
  autoScrollInterval?: number;
}

export default function BannerCarousel({ banners, autoScrollInterval = 5000 }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [banners.length, autoScrollInterval]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[#ececec]">
      {/* Banner Carousel */}
      <div
        className="relative flex transition-transform duration-500 ease-in-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {banners.map((banner, index) => (
          <Link
            key={banner.id}
            href={banner.link || '#'}
            className="min-w-full"
            style={{ backgroundColor: banner.bgColor }}
          >
            <div className="flex items-center justify-between px-6 py-8 sm:px-8">
              <div className="flex-1" style={{ color: banner.textColor }}>
                <h2 className="text-2xl font-black leading-[1.05] sm:text-4xl">{banner.title}</h2>
                {banner.description && (
                  <p className="mt-2 max-w-md text-sm font-medium opacity-90 sm:text-base">{banner.description}</p>
                )}
              </div>
              {banner.imageUrl && (
                <div className="relative min-h-32 min-w-32 flex-shrink-0 overflow-hidden sm:min-h-40 sm:min-w-40">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white bg-opacity-70 p-2 transition hover:bg-opacity-100 sm:left-4"
            aria-label="Previous banner"
          >
            <svg className="h-5 w-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white bg-opacity-70 p-2 transition hover:bg-opacity-100 sm:right-4"
            aria-label="Next banner"
          >
            <svg className="h-5 w-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white bg-opacity-50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
