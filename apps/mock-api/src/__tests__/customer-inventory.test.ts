import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import {
  issueSessionToken,
  calculateTierPricing,
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
    // Keep this HTTP contract suite deterministic and self-contained. The
    // Compose-backed PostgreSQL boundary is covered by the runtime acceptance
    // checks; this suite should not depend on a host-exposed database port.
    store = createStore('');
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
    it('keeps the customer-visible inventory set aligned with public All Stock while projecting customer fields', async () => {
      const publicResult = await store.getVehicles({ audience: 'public', page: 1, limit: 100 });
      const customerResult = await store.getVehicles({ audience: 'customer', page: 1, limit: 100 });

      expect(customerResult.items.map((vehicle) => vehicle.id)).toEqual(publicResult.items.map((vehicle) => vehicle.id));
      expect(customerResult.items.some((vehicle) => vehicle.status === 'Draft')).toBe(false);
      expect(customerResult.items.every((vehicle) => vehicle.reservationEligibility)).toBe(true);
      expect(customerResult.items.find((vehicle) => vehicle.id === 'veh-1')?.tierPricing?.tier).toBe('Standard');
    });

    it('calculates tier discounts correctly for all four tiers via domain helper', () => {
      const priceUsd = 10000;
      expect(calculateTierPricing(priceUsd, 'Platinum', 15)).toEqual({
        tier: 'Platinum',
        tierDiscountPercent: 15,
        tierPriceUsd: 8500,
        originalPriceUsd: 10000,
      });

      expect(calculateTierPricing(priceUsd, 'Gold', 10)).toEqual({
        tier: 'Gold',
        tierDiscountPercent: 10,
        tierPriceUsd: 9000,
        originalPriceUsd: 10000,
      });

      expect(calculateTierPricing(priceUsd, 'Silver', 5)).toEqual({
        tier: 'Silver',
        tierDiscountPercent: 5,
        tierPriceUsd: 9500,
        originalPriceUsd: 10000,
      });

      expect(calculateTierPricing(priceUsd, 'Standard', 0)).toEqual({
        tier: 'Standard',
        tierDiscountPercent: 0,
        tierPriceUsd: 10000,
        originalPriceUsd: 10000,
      });
    });

    it('projects customer tier pricing on /api/v1/vehicles when authenticated with Platinum token', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-platinum-345', 'sofia.almeida@example.com', 'Platinum');
      const res = await fetch(`${baseUrl}/api/v1/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const list = ((await res.json()) as { items: VehicleDomainSummary[] }).items;

      const veh1 = list.find((v) => v.id === 'veh-1');
      expect(veh1).toBeDefined();
      expect(veh1?.priceUsd).toBe(8500);
      expect(veh1?.tierPricing).toBeDefined();
      expect(veh1?.tierPricing?.tier).toBe('Platinum');
      expect(veh1?.tierPricing?.tierDiscountPercent).toBe(15);
      expect(veh1?.tierPricing?.tierPriceUsd).toBe(Math.round(8500 * 0.85)); // 7225
      expect(veh1?.tierPricing?.originalPriceUsd).toBe(8500);
    });

    it('projects customer tier pricing on /api/v1/vehicles with query param tier=Gold', async () => {
      const res = await fetch(`${baseUrl}/api/v1/vehicles?tier=Gold&audience=customer`);
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
      const token = issueSessionToken('CustomerBuyer', 'cust-silver-789', 'daniel.mwangi@example.com', 'Silver');
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

    it('returns database-backed tier benefits and reservation quota for each seeded account', async () => {
      const expected = [
        ['cust-123', 'Standard', 0, 1],
        ['cust-silver-789', 'Silver', 5, 2],
        ['cust-gold-012', 'Gold', 10, 3],
        ['cust-platinum-345', 'Platinum', 15, 5],
      ] as const;
      for (const [customerId, tier, discountPercent, maxActiveReservations] of expected) {
        const token = issueSessionToken('CustomerBuyer', customerId, `${customerId}@example.com`, tier);
        const res = await fetch(`${baseUrl}/api/v1/customer/tier-benefits`, { headers: { Authorization: `Bearer ${token}` } });
        expect(res.status).toBe(200);
        await expect(res.json()).resolves.toMatchObject({ tier, discountPercent, maxActiveReservations, activeReservations: 0, remainingReservations: maxActiveReservations });
      }
    });

    it('does not allow an authenticated customer query parameter to override the database tier', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-silver-789', 'daniel.mwangi@example.com', 'Silver');
      const res = await fetch(`${baseUrl}/api/v1/vehicles?tier=Platinum`, { headers: { Authorization: `Bearer ${token}` } });
      const data = (await res.json()) as { items: VehicleDomainSummary[] };
      expect(data.items.find((vehicle) => vehicle.id === 'veh-1')?.tierPricing).toMatchObject({ tier: 'Silver', tierDiscountPercent: 5 });
    });

    it('rejects anonymous access to tier benefits', async () => {
      const res = await fetch(`${baseUrl}/api/v1/customer/tier-benefits`);
      expect(res.status).toBe(401);
    });
  });

  describe('2. Reservation Eligibility and 48-Hour Second-Customer Conflict (RULE-05, RULE-08, RULE-10)', () => {
    it('returns eligible: true for unheld, priced, available vehicles', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
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
      const token = issueSessionToken('CustomerBuyer', 'cust-second-buyer', 'buyer2@example.com');
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
      const token = issueSessionToken('CustomerBuyer', 'user-other-456', 'amina.njeri@example.com');
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
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
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

    it('keeps invoiced vehicles visible but blocks another customer from reserving or enquiring', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const detailRes = await fetch(`${baseUrl}/api/v1/vehicles/veh-inv-1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(detailRes.status).toBe(200);
      const detail = (await detailRes.json()) as VehicleDetail;
      expect(detail.status).toBe('Invoiced');
      expect(detail.statusLabel).toBe('Purchased Vehicle');
      expect(detail.statusLabelPlural).toBe('Purchased Vehicles');
      expect(detail.reservationEligibility).toEqual({ eligible: false, reason: 'not_reservable' });
      expect(detail.inquiryEligibility).toEqual({ eligible: false, reason: 'allocated_to_another_customer' });
      expect(detail).not.toHaveProperty('customerId');

      const enquiryRes = await fetch(`${baseUrl}/api/v1/enquiries`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Please provide more information.',
          consent: true,
          vehicleSlug: detail.slug,
        }),
      });
      expect(enquiryRes.status).toBe(409);
      await expect(enquiryRes.json()).resolves.toMatchObject({ reason: 'allocated_to_another_customer' });

      const ownerToken = issueSessionToken('CustomerBuyer', 'cust-123', 'prabodha@carchief.com');
      const ownerDetailRes = await fetch(`${baseUrl}/api/v1/vehicles/veh-inv-1`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      const ownerDetail = (await ownerDetailRes.json()) as VehicleDetail;
      expect(ownerDetail.inquiryEligibility).toEqual({ eligible: true });
    });
  });

  describe('3. Price Readiness & Price on Request (CUST-09)', () => {
    it('returns price_on_request reason for vehicles without a fixed price', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
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
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles?searchQuery=Civic`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items.some((v: VehicleDomainSummary) => v.id === 'veh-draft')).toBe(false);
      expect(data.total).toBe(0);
    });

    it('returns 404 if customer tries to look up a Draft vehicle directly', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
      const res = await fetch(`${baseUrl}/api/v1/vehicles/veh-draft`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res.status).toBe(404);
    });

    it('never leaks internalNotes or staffOwnerId in vehicle summary or detail projections', async () => {
      const token = issueSessionToken('CustomerBuyer', 'cust-user-1', 'u1@example.com');
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
