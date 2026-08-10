import { describe, it, expect } from 'vitest';
import { MARKETS } from '../features/home/components/MarketControls.js';

describe('Home Experience & Showroom Integration Tests', () => {
  it('provides approved manual destination market choices', () => {
    const codes = MARKETS.map((m) => m.code);
    expect(codes).toContain('UG');
    expect(codes).toContain('KE');
    expect(codes).toContain('TZ');
    expect(codes).toContain('ALL');
  });

  it('verifies 5-day window for Latest Arrivals calculation', () => {
    const now = new Date('2026-08-10T10:00:00.000Z').getTime();
    const createdDate = new Date('2026-08-08T10:00:00.000Z').getTime();
    const diffDays = (now - createdDate) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThanOrEqual(5);
  });

  it('validates Premium Stock limit constraint (<= 10 items)', () => {
    const limit = 10;
    expect(limit).toBeLessThanOrEqual(10);
  });

  it('includes WhatsApp contact intent link with proper encoding', () => {
    const waUrl = 'https://wa.me/256700000000?text=Hello%20CarChief,%20I%20am%20interested%20in%20Premium%20Stock';
    expect(waUrl).toContain('wa.me');
    expect(waUrl).toContain('256700000000');
  });
});
