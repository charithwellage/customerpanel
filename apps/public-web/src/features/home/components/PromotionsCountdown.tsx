'use client';

import React, { useState, useEffect } from 'react';

export interface PromotionsCountdownProps {
  title?: string;
  endDateISO?: string;
}

export const PromotionsCountdown: React.FC<PromotionsCountdownProps> = ({
  title = 'Seasonal Clearance & Shipping Promotion',
  endDateISO = '2026-08-31T23:59:59.000Z',
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTime = () => {
      const diff = new Date(endDateISO).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endDateISO]);

  return (
    <div
      role="region"
      aria-label="Promotional campaign countdown"
      style={{
        padding: '1.25rem 1.5rem',
        backgroundColor: 'var(--color-surface-dark, #171717)',
        color: 'var(--color-text-on-dark, #fafafa)',
        borderRadius: 'var(--radius-lg, 0.75rem)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        margin: '1.5rem 0',
      }}
    >
      <div>
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--color-primary, #dc2626)',
            textTransform: 'uppercase',
            fontWeight: 700,
            display: 'block',
          }}
        >
          Limited Time Offer
        </span>
        <h3
          style={{
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: '1.1rem',
            margin: '0.2rem 0 0 0',
          }}
        >
          {title}
        </h3>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds },
        ].map((unit, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-sm, 0.375rem)',
              textAlign: 'center',
              minWidth: '50px',
            }}
          >
            <span style={{ fontSize: '1.2rem', fontWeight: 800, display: 'block' }}>
              {String(unit.value).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#a3a3a3' }}>{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
