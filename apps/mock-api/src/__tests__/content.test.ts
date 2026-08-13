import { describe, it, expect, beforeEach } from 'vitest';
import type { Server } from 'node:http';
import { createStore } from '../store.js';
import { createMockApiApp } from '../server.js';
import type {
  FaqQueryResponse,
  TestimonialListResponse,
  TestimonialSubmissionResponse,
  PublicContentPage,
  OfficeListResponse,
  BranchListResponse,
  BranchContent,
} from '@carchief/domain';

async function startServer(store: ReturnType<typeof createStore>) {
  const app = createMockApiApp(store);
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = (server.address() as { port: number }).port;
  return { server, port };
}

describe('Public content, FAQ and testimonial services (PUB-17..PUB-35, D01-P07-T001)', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    await store.reset();
  });

  describe('FAQ API (/api/v1/content/faq)', () => {
    it('returns exactly 12 categories and approved FAQ items', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/faq`);
        expect(res.status).toBe(200);

        const data = (await res.json()) as FaqQueryResponse;
        expect(data.categories).toHaveLength(12);
        expect(data.categories.map((c) => c.id)).toContain('cat-buying-process');
        expect(data.categories.map((c) => c.id)).toContain('cat-payment-pricing');
        expect(data.categories.map((c) => c.id)).toContain('cat-shipping-freight');
        expect(data.categories.map((c) => c.id)).toContain('cat-vehicle-condition');
        expect(data.categories.map((c) => c.id)).toContain('cat-customs-duties');
        expect(data.categories.map((c) => c.id)).toContain('cat-documentation');
        expect(data.categories.map((c) => c.id)).toContain('cat-warranty-returns');
        expect(data.categories.map((c) => c.id)).toContain('cat-auction-services');
        expect(data.categories.map((c) => c.id)).toContain('cat-account-security');
        expect(data.categories.map((c) => c.id)).toContain('cat-insurance-coverage');
        expect(data.categories.map((c) => c.id)).toContain('cat-country-regulations');
        expect(data.categories.map((c) => c.id)).toContain('cat-customer-support');

        expect(data.items.length).toBeGreaterThan(0);
        expect(data.groundedNoAnswer).toBe(false);
        expect(data.items.every((item) => item.status === 'approved')).toBe(true);
      } finally {
        server.close();
      }
    });

    it('filters FAQs by category', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/faq?category=cat-buying-process`);
        expect(res.status).toBe(200);

        const data = (await res.json()) as FaqQueryResponse;
        expect(data.items.length).toBeGreaterThan(0);
        expect(data.items.every((item) => item.categoryId === 'cat-buying-process')).toBe(true);
      } finally {
        server.close();
      }
    });

    it('returns groundedNoAnswer: true when query has no matching FAQ answers', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/faq?q=unobtainium_spacecraft_flying_car`);
        expect(res.status).toBe(200);

        const data = (await res.json()) as FaqQueryResponse;
        expect(data.groundedNoAnswer).toBe(true);
        expect(data.matchedCount).toBe(0);
        expect(data.items).toEqual([]);
        expect(data.message).toContain('No grounded answer found matching your query');
      } finally {
        server.close();
      }
    });
  });

  describe('Testimonials API (/api/v1/content/testimonials)', () => {
    it('returns only approved testimonials on GET', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/testimonials`);
        expect(res.status).toBe(200);

        const data = (await res.json()) as TestimonialListResponse;
        expect(data.items.length).toBe(3);
        expect(data.items.every((t) => t.status === 'approved')).toBe(true);
      } finally {
        server.close();
      }
    });

    it('accepts new testimonial submission with consent and stores as pending', async () => {
      const { server, port } = await startServer(store);
      try {
        const payload = {
          authorName: 'Sarah M.',
          authorLocation: 'Nairobi, Kenya',
          vehiclePurchased: '2022 Toyota Harrier',
          rating: 5,
          content: 'Excellent experience buying through CarChief! Delivery was smooth and on time.',
          consent: true,
        };

        const postRes = await fetch(`http://127.0.0.1:${port}/api/v1/content/testimonials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(postRes.status).toBe(201);
        const subData = (await postRes.json()) as TestimonialSubmissionResponse;
        expect(subData.status).toBe('pending');
        expect(subData.id).toBeDefined();
        expect(subData.message).toContain('pending review');

        // Public GET should still return only the 3 approved items
        const getRes = await fetch(`http://127.0.0.1:${port}/api/v1/content/testimonials`);
        const getData = (await getRes.json()) as TestimonialListResponse;
        expect(getData.items.length).toBe(3);
        expect(getData.items.find((t) => t.id === subData.id)).toBeUndefined();
      } finally {
        server.close();
      }
    });

    it('rejects testimonial submission missing consent with 400', async () => {
      const { server, port } = await startServer(store);
      try {
        const payload = {
          authorName: 'No Consent User',
          authorLocation: 'Kampala',
          content: 'Great car!',
          rating: 5,
          consent: false,
        };

        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/testimonials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.status).toBe(400);
        const err = await res.json();
        expect(err.field).toBe('consent');
      } finally {
        server.close();
      }
    });

    it('rejects testimonial submission missing required fields with 400', async () => {
      const { server, port } = await startServer(store);
      try {
        const payload = {
          authorName: '',
          authorLocation: 'Kampala',
          content: 'Great car!',
          rating: 5,
          consent: true,
        };

        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/testimonials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        expect(res.status).toBe(400);
        const err = await res.json();
        expect(err.field).toBe('authorName');
      } finally {
        server.close();
      }
    });
  });

  describe('Public Content Pages API (/api/v1/content/pages)', () => {
    it('returns approved content pages list', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/pages`);
        expect(res.status).toBe(200);

        const pages = (await res.json()) as PublicContentPage[];
        expect(pages.length).toBe(10);
        expect(pages.map((p) => p.slug)).toContain('about-us');
        expect(pages.map((p) => p.slug)).toContain('how-to-buy');
        expect(pages.map((p) => p.slug)).toContain('security-bank-info');
      } finally {
        server.close();
      }
    });

    it('fetches single page by slug', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/pages/about-us`);
        expect(res.status).toBe(200);

        const page = (await res.json()) as PublicContentPage;
        expect(page.slug).toBe('about-us');
        expect(page.title).toBe('About CarChief');
        expect(page.sections).toHaveLength(2);
      } finally {
        server.close();
      }
    });

    it('returns 404 for unknown page slug', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/pages/nonexistent-page`);
        expect(res.status).toBe(404);
      } finally {
        server.close();
      }
    });
  });

  describe('Office Locations API (/api/v1/content/offices)', () => {
    it('returns approved office locations', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/offices`);
        expect(res.status).toBe(200);

        const data = (await res.json()) as OfficeListResponse;
        expect(data.total).toBe(3);
        expect(data.items.find((o) => o.city === 'Tokyo')?.isPrimary).toBe(true);
        expect(data.items.find((o) => o.city === 'Harare')).toBeDefined();
      } finally {
        server.close();
      }
    });
  });

  describe('Branch Hubs API (/api/v1/content/branches)', () => {
    it('returns approved branch hubs', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/branches`);
        expect(res.status).toBe(200);

        const data = (await res.json()) as BranchListResponse;
        expect(data.total).toBe(3);
        expect(data.items.map((b) => b.id)).toContain('harare-hub');
        expect(data.items.map((b) => b.id)).toContain('kingston-hub');
      } finally {
        server.close();
      }
    });

    it('fetches single branch by ID or code', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/branches/harare-hub`);
        expect(res.status).toBe(200);

        const branch = (await res.json()) as BranchContent;
        expect(branch.id).toBe('harare-hub');
        expect(branch.code).toBe('HRE');
        expect(branch.teamMembers.length).toBeGreaterThan(0);

        const codeRes = await fetch(`http://127.0.0.1:${port}/api/v1/content/branches/KIN`);
        expect(codeRes.status).toBe(200);
        const kinBranch = (await codeRes.json()) as BranchContent;
        expect(kinBranch.id).toBe('kingston-hub');
      } finally {
        server.close();
      }
    });

    it('returns 404 for unknown branch ID', async () => {
      const { server, port } = await startServer(store);
      try {
        const res = await fetch(`http://127.0.0.1:${port}/api/v1/content/branches/unknown-hub`);
        expect(res.status).toBe(404);
      } finally {
        server.close();
      }
    });
  });
});
