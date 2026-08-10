import React from 'react';

export interface MarketControlsProps {
  selectedMarket: string;
  onMarketChange: (market: string) => void;
}

export const MARKETS = [
  { code: 'UG', label: 'Uganda (Mombasa Port)', flag: '🇺🇬' },
  { code: 'KE', label: 'Kenya (Mombasa Port)', flag: '🇰🇪' },
  { code: 'TZ', label: 'Tanzania (Dar es Salaam Port)', flag: '🇹🇿' },
  { code: 'ALL', label: 'Global / All Ports', flag: '🌐' },
];

export const MarketControls: React.FC<MarketControlsProps> = ({ selectedMarket, onMarketChange }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '0.75rem 1rem',
        backgroundColor: 'var(--color-surface, #ffffff)',
        borderRadius: 'var(--radius-md, 0.5rem)',
        border: '1px solid var(--color-border, #e5e5e5)',
      }}
    >
      <label
        htmlFor="market-select"
        style={{
          fontSize: 'var(--font-size-xs, 0.75rem)',
          fontWeight: 700,
          fontFamily: 'var(--font-mono, monospace)',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary, #525252)',
        }}
      >
        Destination Market:
      </label>
      <select
        id="market-select"
        value={selectedMarket}
        onChange={(e) => onMarketChange(e.target.value)}
        style={{
          minHeight: 'var(--min-touch-target, 44px)',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-sm, 0.375rem)',
          border: '1px solid var(--color-border, #e5e5e5)',
          backgroundColor: 'var(--color-background, #fafafa)',
          color: 'var(--color-text-primary, #171717)',
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {MARKETS.map((m) => (
          <option key={m.code} value={m.code}>
            {m.flag} {m.label}
          </option>
        ))}
      </select>
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary, #525252)',
          fontStyle: 'italic',
        }}
      >
        (Manual market selection active)
      </span>
    </div>
  );
};
