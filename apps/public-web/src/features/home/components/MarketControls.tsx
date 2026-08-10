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
    <div className="market-controls">
      <label htmlFor="market-select" className="market-controls-label">
        Destination Market:
      </label>
      <select
        id="market-select"
        value={selectedMarket}
        onChange={(e) => onMarketChange(e.target.value)}
        className="market-controls-select"
      >
        {MARKETS.map((m) => (
          <option key={m.code} value={m.code}>
            {m.flag} {m.label}
          </option>
        ))}
      </select>
      <span className="market-controls-note">(Manual market selection active)</span>
    </div>
  );
};
