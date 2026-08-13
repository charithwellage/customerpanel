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
    <div role="region" aria-label="Promotional campaign countdown" className="promotions-countdown">
      <div>
        <span className="home-section-eyebrow">Limited Time Offer</span>
        <h3 className="promotions-countdown-title">{title}</h3>
      </div>

      <div className="promotions-countdown-timer">
        {[
          { label: 'Days', value: timeLeft.days },
          { label: 'Hours', value: timeLeft.hours },
          { label: 'Mins', value: timeLeft.minutes },
          { label: 'Secs', value: timeLeft.seconds },
        ].map((unit, idx) => (
          <div key={idx} className="promotions-countdown-unit">
            <span className="promotions-countdown-val">{String(unit.value).padStart(2, '0')}</span>
            <span className="promotions-countdown-label">{unit.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
