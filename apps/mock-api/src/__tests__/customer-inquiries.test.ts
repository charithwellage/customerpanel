import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type { CustomerInquiryListResponse, VehicleInquiryAggregate } from '@carchief/domain';
import { issueSessionToken } from '@carchief/domain';

const VALID_VEHICLE_SLUG = '2021-toyota-corolla-axio-veh-1';
const ANOTHER_VEHICLE_SLUG = 'veh-other';

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Customer inquiry list and vehicle inquiry aggregate (D02-P13-T001, CUST-34, CUST-35)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  describe('DemoStore.listCustomerInquiries', () => {
    it('returns an empty list for a customer with no inquiries', async () => {
      const result = await store.listCustomerInquiries('cust-no-inquiries');
      expect(result.items).toHaveLength(0);
    });

    it('returns one row per distinct vehicle for a customer with multiple inquiries', async () => {
      await store.createEnquiry(
        {
          name: 'Customer',
          consent: true,
          email: 'customer@example.com',
          phone: '+256700111111',
          message: 'Quote 1.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );
      await store.createEnquiry(
        {
          name: 'Customer',
          consent: true,
          email: 'customer@example.com',
          phone: '+256700111111',
          message: 'Quote 2.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );

      const result = await store.listCustomerInquiries('cust-alice');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].vehicleSlug).toBe(VALID_VEHICLE_SLUG);
    });

    it('includes the inquirer count in each row', async () => {
      await store.createEnquiry(
        {
          name: 'Customer A',
          consent: true,
          email: 'a@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );
      await store.createEnquiry(
        {
          name: 'Customer B',
          consent: true,
          email: 'b@example.com',
          phone: '+256700222222',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-bob'
      );
      await store.createEnquiry({
        name: 'Anonymous',
        consent: true,
        email: 'anon@example.com',
        phone: '+256700333333',
        message: 'Quote.',
        vehicleSlug: VALID_VEHICLE_SLUG,
        enquiryType: 'price-request',
      });

      const result = await store.listCustomerInquiries('cust-alice');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].inquirerCount).toBe(3);
    });

    it("enforces customer isolation (customer A never sees customer B's inquiries)", async () => {
      await store.createEnquiry(
        {
          name: 'Customer A',
          consent: true,
          email: 'a@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );
      await store.createEnquiry(
        {
          name: 'Customer B',
          consent: true,
          email: 'b@example.com',
          phone: '+256700222222',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-bob'
      );

      const aliceResult = await store.listCustomerInquiries('cust-alice');
      const bobResult = await store.listCustomerInquiries('cust-bob');

      expect(aliceResult.items).toHaveLength(1);
      expect(bobResult.items).toHaveLength(1);
      expect(aliceResult.items[0].vehicleSlug).toBe(bobResult.items[0].vehicleSlug);
      expect(aliceResult.items[0].inquirerCount).toBe(2);
    });

    it('survives a reset operation', async () => {
      await store.createEnquiry(
        {
          name: 'Customer',
          consent: true,
          email: 'customer@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );

      let result = await store.listCustomerInquiries('cust-alice');
      expect(result.items).toHaveLength(1);

      await store.reset();

      result = await store.listCustomerInquiries('cust-alice');
      expect(result.items).toHaveLength(0);
    });
  });

  describe('DemoStore.getVehicleInquiryAggregate', () => {
    it('returns 0 for a vehicle with no quote requests', async () => {
      const result = await store.getVehicleInquiryAggregate(VALID_VEHICLE_SLUG);
      expect(result.inquirerCount).toBe(0);
    });

    it('returns the correct count with mixed authenticated and anonymous submitters', async () => {
      await store.createEnquiry(
        {
          name: 'Customer A',
          consent: true,
          email: 'a@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );
      await store.createEnquiry(
        {
          name: 'Customer B',
          consent: true,
          email: 'b@example.com',
          phone: '+256700222222',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-bob'
      );
      await store.createEnquiry({
        name: 'Anonymous',
        consent: true,
        email: 'anon@example.com',
        phone: '+256700333333',
        message: 'Quote.',
        vehicleSlug: VALID_VEHICLE_SLUG,
        enquiryType: 'price-request',
      });

      const result = await store.getVehicleInquiryAggregate(VALID_VEHICLE_SLUG);
      expect(result.inquirerCount).toBe(3);
    });

    it('counts only price-request enquiries, ignoring other types', async () => {
      await store.createEnquiry(
        {
          name: 'Customer',
          consent: true,
          email: 'customer@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );
      await store.createEnquiry({
        name: 'General Inquiry',
        consent: true,
        email: 'other@example.com',
        phone: '+256700222222',
        message: 'General question.',
        vehicleSlug: VALID_VEHICLE_SLUG,
        enquiryType: 'vehicle',
      });

      const result = await store.getVehicleInquiryAggregate(VALID_VEHICLE_SLUG);
      expect(result.inquirerCount).toBe(1);
    });

    it('survives a reset operation', async () => {
      await store.createEnquiry(
        {
          name: 'Customer',
          consent: true,
          email: 'customer@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        'cust-alice'
      );

      let result = await store.getVehicleInquiryAggregate(VALID_VEHICLE_SLUG);
      expect(result.inquirerCount).toBe(1);

      await store.reset();

      result = await store.getVehicleInquiryAggregate(VALID_VEHICLE_SLUG);
      expect(result.inquirerCount).toBe(0);
    });
  });

  describe('HTTP contract via Express app', () => {
    it('debug: verify enquiry was created with customerId', async () => {
      const customerSub = 'debug@example.com';
      const result = await store.createEnquiry(
        {
          name: 'Customer',
          consent: true,
          email: 'customer@example.com',
          phone: '+256700111111',
          message: 'Quote.',
          vehicleSlug: VALID_VEHICLE_SLUG,
          enquiryType: 'price-request',
        },
        customerSub
      );
      expect(result.customerId).toBe(customerSub);

      const listResult = await store.listCustomerInquiries(customerSub);
      expect(listResult.items).toHaveLength(1);
    });

    it('serves GET /api/v1/customer/inquiries 401 when unauthenticated', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/customer/inquiries`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(401);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });


    it('serves GET /api/v1/vehicles/{idOrSlug}/inquiry-count returning the aggregate', async () => {
      const { server, port } = await startServer(store);
      try {
        await store.createEnquiry(
          {
            name: 'Customer A',
            consent: true,
            email: 'a@example.com',
            phone: '+256700111111',
            message: 'Quote.',
            vehicleSlug: VALID_VEHICLE_SLUG,
            enquiryType: 'price-request',
          },
          'cust-alice'
        );
        await store.createEnquiry(
          {
            name: 'Customer B',
            consent: true,
            email: 'b@example.com',
            phone: '+256700222222',
            message: 'Quote.',
            vehicleSlug: VALID_VEHICLE_SLUG,
            enquiryType: 'price-request',
          },
          'cust-bob'
        );

        const res = await fetch(`http://localhost:${port}/api/v1/vehicles/${VALID_VEHICLE_SLUG}/inquiry-count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(200);
        const data = (await res.json()) as VehicleInquiryAggregate;
        expect(data.inquirerCount).toBe(2);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });

    it('serves GET /api/v1/vehicles/{idOrSlug}/inquiry-count 404 for an unknown vehicle', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://localhost:${port}/api/v1/vehicles/not-a-vehicle/inquiry-count`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        expect(res.status).toBe(404);
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  });
});
