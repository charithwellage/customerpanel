import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import {
  createDemoJwtToken,
  calculateTierPricing,
  TIER_DISCOUNTS,
  type CustomerTier,
  type VehicleDomainSummary,
  type VehicleDetail,
} from '@carchief/domain';

// D02-P03-T001: Customer inventory projection, tier pricing and reservation eligibility contract tests
// Requirements: CUST-02, CUST-05, CUST-09, RULE-05, RULE-06, RULE-08, RULE-10

describe('Customer Inventory Projection & Tier Pricing Contract (D02-P03-T001)', () => {
  let store: ReturnType<typeof createStore>;
  let server: Server | undefined;
  let baseUrl: string;

  beforeEach(async () => {
    store = createStore();
    await store.reset();

    const app = createMockApiApp(store);
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const port = (server.address() as { port: number }).port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  describe('1. Customer Tier Pricing (CUST-05, RULE-06)', () => {
    it('calculates tier discounts correctly for all four tiers via domain helper', () => {
      const priceUsd = 10000;
      expect(calculateTierPricing(priceUsd, 'Platinum')).toEqual({
        tier: 'Platinum',
        tierDiscountPercent: 15,
        tierPriceUsd: 8500,
        originalPriceUsd: 10000,
      });

      expect(calculateTierPricing(priceUsd, 'Gold')).toEqual({
        tier: 'Gold',
        tierDiscountPercent: 10,
        tierPriceUsd: 9000,
        originalPriceUsd: 10000,
      });

      expect(calculateTierPricing(priceUsd, 'Silver')).toEqual({
        tier: 'Silver',
        tierDiscountPercent: 5,
        tierPriceUsd: 9500,
        originalPriceUsd: 10000,
      });

      expect(calculateTierPricing(priceUsd, 'Standard')).toEqual({
        tier: 'Standard',
        tierDiscountPercent: 0,
        tierPriceUsd: 10000,
        originalPriceUsd: 10000,
      });
    });

    it('projects customer tier pricing on /api/v1/vehicles when authenticated with Platinum token', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-plat-1', 'plat@example.com', 'Platinum');
      const res = await fetch(`${baseUrl}/api/v1/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const list = (await res.json()) as VehicleDomainSummary[];

      const veh1 = list.find((v) => v.id === 'veh-1');
      expect(veh1).toBeDefined();
      expect(veh1?.priceUsd).toBe(8500);
      expect(veh1?.tierPricing).toBeDefined();
      expect(veh1?.tierPricing?.tier).toBe('Platinum');
      expect(veh1?.tierPricing?.tierDiscountPercent).toBe(15);
      expect(veh1?.tierPricing?.tierPriceUsd).toBe(Math.round(8500 * 0.85)); // 7225
      expect(veh1?.tierPricing?.originalPriceUsd).toBe(8500);
    });

    it('projects customer tier pricing on /api/v1/vehicles/search with query param tier=Gold', async () => {
      const res = await fetch(`${baseUrl}/api/v1/vehicles/search?tier=Gold&audience=customer`);
      expect(res.status).toBe(200);
      const data = await res.json();
      const veh1 = data.items.find((v: VehicleDomainSummary) => v.id === 'veh-1');
      expect(veh1).toBeDefined();
      expect(veh1.tierPricing).toEqual({
        tier: 'Gold',
        tierDiscountPercent: 10,
        tierPriceUsd: 7650,
        originalPriceUsd: 8500,
      });
    });

    it('projects customer tier pricing on /api/v1/vehicles/:idOrSlug detail lookup', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-silv-1', 'silv@example.com', 'Silver');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const detail = (await res.json()) as VehicleDetail;
      expect(detail.id).toBe('veh-1');
      expect(detail.tierPricing).toEqual({
        tier: 'Silver',
        tierDiscountPercent: 5,
        tierPriceUsd: 8075,
        originalPriceUsd: 8500,
      });
    });
  });

  describe('2. Reservation Eligibility and 48-Hour Second-Customer Conflict (RULE-05, RULE-08, RULE-10)', () => {
    it('returns eligible: true for unheld, priced, available vehicles', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const detail = (await res.json()) as VehicleDetail;
      expect(detail.reservationEligibility).toEqual({
        eligible: true,
      });
    });

    it('returns eligible: false with reason: "reserved_by_other" when another customer holds active reservation', async () => {
      // veh-2 is seeded with an active 48-hour reservation hold by user-other-456
      const token = createDemoJwtToken('CustomerBuyer', 'cust-second-buyer', 'buyer2@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-2`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const detail = (await res.json()) as VehicleDetail;
      expect(detail.id).toBe('veh-2');
      expect(detail.reservationEligibility).toBeDefined();
      expect(detail.reservationEligibility?.eligible).toBe(false);
      expect(detail.reservationEligibility?.reason).toBe('reserved_by_other');
      expect(detail.reservationEligibility?.isOwnHold).toBe(false);
      expect(detail.reservationEligibility?.holdExpiresAt).toBe('2026-08-11T10:00:00.000Z');
      expect(detail.nowOnSale).toBe(false);
      expect(detail.active).toBe(true);
    });

    it('returns eligible: false with reason: "already_reserved_by_you" when the holder herself views the vehicle', async () => {
      // veh-2 is seeded with hold owned by user-other-456
      const token = createDemoJwtToken('CustomerBuyer', 'user-other-456', 'other@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-2`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const detail = (await res.json()) as VehicleDetail;
      expect(detail.id).toBe('veh-2');
      expect(detail.reservationEligibility).toBeDefined();
      expect(detail.reservationEligibility?.eligible).toBe(false);
      expect(detail.reservationEligibility?.reason).toBe('already_reserved_by_you');
      expect(detail.reservationEligibility?.isOwnHold).toBe(true);
      expect(detail.reservationEligibility?.holdExpiresAt).toBe('2026-08-11T10:00:00.000Z');
    });

    it('deterministically returns to Now On Sale / eligible: true after reservation hold expires (RULE-05)', async () => {
      // veh-3 had a reservation that expired on 2026-08-08 (relative to 2026-08-10 reference date)
      const token = createDemoJwtToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-3`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const detail = (await res.json()) as VehicleDetail;
      expect(detail.id).toBe('veh-3');
      expect(detail.nowOnSale).toBe(true);
      expect(detail.reservationEligibility).toEqual({
        eligible: true,
      });
    });
  });

  describe('3. Price Readiness & Price on Request (CUST-09)', () => {
    it('returns price_on_request reason for vehicles without a fixed price', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-4`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const detail = (await res.json()) as VehicleDetail;
      expect(detail.id).toBe('veh-4');
      expect(detail.priceState).toBe('request_price');
      expect(detail.requestPrice).toBe(true);
      expect(detail.reservationEligibility).toEqual({
        eligible: false,
        reason: 'price_on_request',
      });
    });
  });

  describe('4. Privacy, Field Isolation and Draft Exclusions (CUST-02)', () => {
    it('never returns Draft vehicles in customer inventory queries', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/search?searchQuery=Civic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items.some((v: VehicleDomainSummary) => v.id === 'veh-draft')).toBe(false);
      expect(data.total).toBe(0);
    });

    it('returns 404 if customer tries to look up a Draft vehicle directly', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });

    it('never leaks internalNotes or staffOwnerId in vehicle summary or detail projections', async () => {
      const token = createDemoJwtToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const resList = await fetch(`${baseUrl}/api/v1/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = (await resList.json()) as any[];
      const veh1Summary = list.find((v) => v.id === 'veh-1');
      expect(veh1Summary).toBeDefined();
      expect(veh1Summary.internalNotes).toBeUndefined();
      expect(veh1Summary.staffOwnerId).toBeUndefined();

      const resDetail = await fetch(`${baseUrl}/api/v1/vehicles/veh-1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const detail = (await resDetail.json()) as any;
      expect(detail.internalNotes).toBeUndefined();
      expect(detail.staffOwnerId).toBeUndefined();
    });
  });
});
