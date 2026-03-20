'use client';

import { useMemo } from 'react';
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
  const stripItems = validOffers.length
    ? validOffers
    : [
        {
          id: 'fallback-offer',
          title: 'Service 4.9 out of 5 | Call us +91 98948-49778',
          description: '',
          link: '',
        },
      ];

  const loopItems = [...stripItems, ...stripItems];
  const durationSeconds = Math.max(12, Math.round((autoScrollInterval * Math.max(stripItems.length, 1)) / 1000));

  return (
    <div className="offer-marquee-wrapper">
      <div className="offer-marquee-track" style={{ animationDuration: `${durationSeconds}s` }}>
        {loopItems.map((item, index) => {
          const label = item.description ? `${item.title} - ${item.description}` : item.title;
          const key = `${item.id}-${index}`;

          return (
            <div key={key} className="offer-chip">
              <span className="offer-badge">Offer</span>
              {item.link ? (
                <Link href={item.link} className="offer-label">
                  {label}
                </Link>
              ) : (
                <span className="offer-label">{label}</span>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .offer-marquee-wrapper {
          position: relative;
          overflow: hidden;
          width: 100%;
        }

        .offer-marquee-track {
          display: flex;
          width: max-content;
          gap: 2rem;
          white-space: nowrap;
          animation-name: offer-marquee;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .offer-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 1.5rem;
        }

        .offer-badge {
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.12);
          border-radius: 9999px;
          padding: 0.15rem 0.55rem;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #fff;
          flex-shrink: 0;
        }

        .offer-label {
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          text-decoration: none;
        }

        .offer-label:hover {
          color: #ffe082;
        }

        @media (min-width: 640px) {
          .offer-label {
            font-size: 13px;
          }
        }

        @keyframes offer-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
