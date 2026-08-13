import { describe, it, expect } from 'vitest';
import {
  calculateFreightEstimate,
  resolveFreightRateStatus,
  validateFreightEstimateRequest,
  FreightRequestError,
} from '../freight.js';
import type { FreightDestination, FreightPort, FreightRateRecord } from '../index.js';

// D01-P05-T002 (Branch B): `DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY`
// are OPEN. This suite exercises the calculation-sequence entry point,
// `calculateFreightEstimate`, at the pure domain layer. It asserts the
// deterministic `estimate_unavailable_pending_rate` outcome for every
// supported destination, that no monetary total field is ever populated, and
// that invalid dimensions / unsupported destinations remain distinguishable
// (a thrown, field-associated `FreightRequestError`) from the honest
// unavailable-rule state. No cubic-volume/freight/city-delivery/insurance/
// discount formula is asserted here (RULE-09, RULE-10) — see
// tasks/delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md row D01-ASM-001.

const destinations: FreightDestination[] = [
  { code: 'UG', name: 'Uganda', country: 'Uganda' },
  { code: 'RW', name: 'Rwanda', country: 'Rwanda' },
];
const ports: FreightPort[] = [{ code: 'MBA', name: 'Mombasa', country: 'Kenya' }];
const NOW = '2026-08-10T10:00:00.000Z';

describe('calculateFreightEstimate — calculation sequence (PUB-12, D01-ASM-001)', () => {
  describe('estimate unavailable — pending confirmed rate, for every supported destination', () => {
    it('returns the unavailable outcome with an active-rate lookup context and no monetary total', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2026-06-01T00:00:00.000Z' },
      ];
      const estimate = calculateFreightEstimate(destinations, ports, records, { destinationCode: 'UG', portCode: 'MBA' }, NOW);

      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('active');
      expect(estimate.currency).toBe('USD');
      expect(estimate.message).toMatch(/unavailable/i);
      // RULE-09: no fabricated/computed monetary total may ever be present.
      expect(estimate).not.toHaveProperty('total');
      expect(estimate).not.toHaveProperty('totalUsd');
      expect(estimate).not.toHaveProperty('amount');
      expect(estimate).not.toHaveProperty('freightCost');
      expect(estimate).not.toHaveProperty('cityDeliveryFee');
      expect(estimate).not.toHaveProperty('insuranceFee');
      expect(estimate).not.toHaveProperty('discount');
      // The rate record's amount must never leak into the response, in any field.
      expect(JSON.stringify(estimate)).not.toContain('950');
    });

    it('returns the unavailable outcome for a supported destination with no rate record supplied yet', () => {
      const estimate = calculateFreightEstimate(destinations, ports, [], { destinationCode: 'RW', portCode: 'MBA' }, NOW);
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('no_rate');
      expect(estimate.currency).toBeUndefined();
      expect(estimate).not.toHaveProperty('total');
    });

    it('returns the unavailable outcome for a stale (expired) rate record', () => {
      const records: FreightRateRecord[] = [
        {
          destinationCode: 'UG',
          portCode: 'MBA',
          currency: 'USD',
          amount: 400,
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2026-01-01T00:00:00.000Z',
        },
      ];
      const estimate = calculateFreightEstimate(destinations, ports, records, { destinationCode: 'UG', portCode: 'MBA' }, NOW);
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate.rateStatus).toBe('stale');
      expect(estimate).not.toHaveProperty('total');
    });

    it('is deterministic across every supported destination/port combination, regardless of rate status', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2026-06-01T00:00:00.000Z' },
      ];
      for (const destination of destinations) {
        for (const port of ports) {
          const estimate = calculateFreightEstimate(
            destinations,
            ports,
            records,
            { destinationCode: destination.code, portCode: port.code },
            NOW
          );
          expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
          expect(['active', 'stale', 'no_rate']).toContain(estimate.rateStatus);
          expect(estimate).not.toHaveProperty('total');
        }
      }
    });

    it('accepts valid positive dimensions without ever deriving a total from them', () => {
      const estimate = calculateFreightEstimate(
        destinations,
        ports,
        [],
        { destinationCode: 'UG', portCode: 'MBA', dimensions: { lengthMm: 4500, widthMm: 1800, heightMm: 1500 } },
        NOW
      );
      expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
      expect(estimate).not.toHaveProperty('total');
      expect(estimate).not.toHaveProperty('cubicVolume');
    });
  });

  describe('invalid dimensions are distinguishable from the unavailable-rule state', () => {
    it('rejects a zero dimension with a field-associated FreightRequestError, not the unavailable outcome', () => {
      expect(() =>
        calculateFreightEstimate(
          destinations,
          ports,
          [],
          { destinationCode: 'UG', portCode: 'MBA', dimensions: { lengthMm: 0, widthMm: 1800, heightMm: 1500 } },
          NOW
        )
      ).toThrow(FreightRequestError);

      try {
        calculateFreightEstimate(
          destinations,
          ports,
          [],
          { destinationCode: 'UG', portCode: 'MBA', dimensions: { lengthMm: 0, widthMm: 1800, heightMm: 1500 } },
          NOW
        );
        expect.unreachable('expected FreightRequestError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FreightRequestError);
        expect((error as FreightRequestError).statusCode).toBe(400);
        expect((error as FreightRequestError).field).toBe('dimensions.lengthMm');
      }
    });

    it('rejects a negative dimension', () => {
      expect(() =>
        calculateFreightEstimate(
          destinations,
          ports,
          [],
          { destinationCode: 'UG', portCode: 'MBA', dimensions: { lengthMm: 4500, widthMm: -10, heightMm: 1500 } },
          NOW
        )
      ).toThrow(FreightRequestError);
    });

    it('rejects a non-finite dimension', () => {
      expect(() =>
        calculateFreightEstimate(
          destinations,
          ports,
          [],
          { destinationCode: 'UG', portCode: 'MBA', dimensions: { lengthMm: Number.NaN, widthMm: 1800, heightMm: 1500 } },
          NOW
        )
      ).toThrow(FreightRequestError);
    });
  });

  describe('unsupported destinations/ports are distinguishable from the unavailable-rule state', () => {
    it('rejects an unknown destination code with a 400 field-associated error, not a 200 unavailable outcome', () => {
      try {
        calculateFreightEstimate(destinations, ports, [], { destinationCode: 'ZZ', portCode: 'MBA' }, NOW);
        expect.unreachable('expected FreightRequestError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FreightRequestError);
        expect((error as FreightRequestError).statusCode).toBe(400);
        expect((error as FreightRequestError).field).toBe('destinationCode');
      }
    });

    it('rejects an unknown port code', () => {
      try {
        calculateFreightEstimate(destinations, ports, [], { destinationCode: 'UG', portCode: 'ZZZ' }, NOW);
        expect.unreachable('expected FreightRequestError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FreightRequestError);
        expect((error as FreightRequestError).field).toBe('portCode');
      }
    });

    it('rejects a missing destinationCode before catalog membership is even checked', () => {
      try {
        validateFreightEstimateRequest(destinations, ports, { destinationCode: '', portCode: 'MBA' });
        expect.unreachable('expected FreightRequestError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FreightRequestError);
        expect((error as FreightRequestError).field).toBe('destinationCode');
      }
    });
  });

  describe('resolveFreightRateStatus (rate lookup fixtures)', () => {
    it('an open-ended effective rate resolves to active', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2026-06-01T00:00:00.000Z' },
      ];
      const result = resolveFreightRateStatus(records, 'UG', 'MBA', NOW);
      expect(result.status).toBe('active');
      expect(result.record?.amount).toBe(950);
    });

    it('no matching record resolves to no_rate', () => {
      const result = resolveFreightRateStatus([], 'UG', 'MBA', NOW);
      expect(result.status).toBe('no_rate');
      expect(result.record).toBeUndefined();
    });

    it('a record whose effectiveTo has passed resolves to stale', () => {
      const records: FreightRateRecord[] = [
        {
          destinationCode: 'UG',
          portCode: 'MBA',
          currency: 'USD',
          amount: 400,
          effectiveFrom: '2025-01-01T00:00:00.000Z',
          effectiveTo: '2026-01-01T00:00:00.000Z',
        },
      ];
      const result = resolveFreightRateStatus(records, 'UG', 'MBA', NOW);
      expect(result.status).toBe('stale');
    });

    it('a future-dated rate that has not started yet resolves to no_rate', () => {
      const records: FreightRateRecord[] = [
        { destinationCode: 'UG', portCode: 'MBA', currency: 'USD', amount: 950, effectiveFrom: '2027-01-01T00:00:00.000Z' },
      ];
      const result = resolveFreightRateStatus(records, 'UG', 'MBA', NOW);
      expect(result.status).toBe('no_rate');
    });
  });
});
