import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, buildFreightEstimate, FreightRequestError } from '../store.js';
import { calculateFreightEstimate } from '@carchief/domain';

// D01-P05-T002 (Branch B): `DEC-PUB-FREIGHT-MODEL` and `DEC-PUB-CITY-DELIVERY`
// are OPEN, so this suite exercises the calculation-sequence structural path
// at the mock-api boundary: the store's seeded destination/port/rate catalog
// is passed through to `@carchief/domain`'s `calculateFreightEstimate`, and
// every supported destination returns the deterministic
// `estimate_unavailable_pending_rate` outcome with no monetary total field —
// distinct from `apps/mock-api/src/__tests__/freight.test.ts`, which covers
// the HTTP contract (D01-P05-T001). This suite covers the calculation
// sequence itself: that it is a real no-op passthrough (not a stub) reached
// via validation and rate-lookup, and that it is wired identically whether
// called through the store's `buildFreightEstimate` wrapper or the domain
// function directly. No cubic-volume/freight/city-delivery/insurance/
// discount formula is asserted here (RULE-09, RULE-10). See
// tasks/delivery_01/REQUIREMENT_GAPS_AND_ASSUMPTIONS.md row D01-ASM-001.

describe('Freight calculation sequence — mock-api boundary (PUB-12, D01-ASM-001)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  it('the store wrapper delegates to the domain calculation sequence and returns the same result', async () => {
    const destinations = await store.getFreightDestinations();
    const ports = await store.getFreightPorts();

    const viaStoreWrapper = buildFreightEstimate(destinations, ports, [], { destinationCode: 'UG', portCode: 'MBA' });
    const viaDomainDirect = calculateFreightEstimate(
      destinations,
      ports,
      [],
      { destinationCode: 'UG', portCode: 'MBA' },
      '2026-08-10T10:00:00.000Z'
    );

    expect(viaStoreWrapper).toEqual(viaDomainDirect);
  });

  it('the calculation sequence returns the unavailable outcome for every catalog destination/port pair served by the store', async () => {
    const destinations = await store.getFreightDestinations();
    const ports = await store.getFreightPorts();

    for (const destination of destinations) {
      for (const port of ports) {
        const estimate = await store.getFreightEstimate({ destinationCode: destination.code, portCode: port.code });
        expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
        expect(['active', 'stale', 'no_rate']).toContain(estimate.rateStatus);
        // RULE-09: no computed monetary total field, on any destination.
        expect(estimate).not.toHaveProperty('total');
        expect(estimate).not.toHaveProperty('totalUsd');
        expect(estimate).not.toHaveProperty('freightCost');
        expect(estimate).not.toHaveProperty('cityDeliveryFee');
        expect(estimate).not.toHaveProperty('insuranceFee');
        expect(estimate).not.toHaveProperty('discount');
      }
    }
  });

  it('the calculation sequence accepts requested dimensions structurally without deriving a cubic volume or total from them', async () => {
    const estimate = await store.getFreightEstimate({
      destinationCode: 'UG',
      portCode: 'MBA',
      dimensions: { lengthMm: 4500, widthMm: 1800, heightMm: 1500 },
    });
    expect(estimate.outcome).toBe('estimate_unavailable_pending_rate');
    expect(estimate).not.toHaveProperty('cubicVolume');
    expect(estimate).not.toHaveProperty('total');
  });

  it('invalid dimensions are rejected before the calculation sequence reaches the unavailable-outcome path', async () => {
    await expect(
      store.getFreightEstimate({
        destinationCode: 'UG',
        portCode: 'MBA',
        dimensions: { lengthMm: 0, widthMm: 1800, heightMm: 1500 },
      })
    ).rejects.toBeInstanceOf(FreightRequestError);
    await expect(
      store.getFreightEstimate({
        destinationCode: 'UG',
        portCode: 'MBA',
        dimensions: { lengthMm: 0, widthMm: 1800, heightMm: 1500 },
      })
    ).rejects.toMatchObject({ statusCode: 400, field: 'dimensions.lengthMm' });
  });

  it('an unsupported destination is rejected before the calculation sequence reaches the unavailable-outcome path', async () => {
    await expect(store.getFreightEstimate({ destinationCode: 'ZZ', portCode: 'MBA' })).rejects.toMatchObject({
      statusCode: 400,
      field: 'destinationCode',
    });
  });

  it('an unsupported port is rejected the same way, distinct from a supported pair with no rate record', async () => {
    await expect(store.getFreightEstimate({ destinationCode: 'UG', portCode: 'ZZZ' })).rejects.toMatchObject({
      statusCode: 400,
      field: 'portCode',
    });

    // Contrast: RW is a supported destination with no rate record supplied —
    // that reaches the unavailable outcome (200), never a 400.
    const noRateEstimate = await store.getFreightEstimate({ destinationCode: 'RW', portCode: 'MBA' });
    expect(noRateEstimate.outcome).toBe('estimate_unavailable_pending_rate');
    expect(noRateEstimate.rateStatus).toBe('no_rate');
  });
});
