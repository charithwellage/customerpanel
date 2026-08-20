import express, { Request, Response, NextFunction, Express } from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseSessionToken, issueSessionToken as mintDomainSessionToken, JwtClaims, hasPermission, isJwtExpired } from '@carchief/domain';
import type { FreightEstimateRequest, EnquiryRequest, ReservationRequest } from '@carchief/domain';
import {
  createStore,
  type DemoStore,
  FreightRequestError,
  EnquiryRequestError,
  ReservationRequestError,
  TestimonialRequestError,
  PaymentWorkflowError,
  ProfileConflictError,
  AccountRequestError,
  AuthenticationError,
} from './store.js';
import { resolveCustomerScope } from './auth/customer-scope.js';

export interface AuthenticatedRequest extends Request {
  user?: JwtClaims;
}

export function createMockApiApp(store: DemoStore = createStore()): Express {
  const app: Express = express();
  app.use(express.json());

  // CORS middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Correlation-ID');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Auth parsing middleware
  app.use((req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const claims = parseSessionToken(token);
      if (claims && !isJwtExpired(claims)) {
        req.user = claims;
      }
    }
    next();
  });

  // 1. Health check (Public)
  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Public config (Public)
  app.get('/api/v1/config/public', async (_req: Request, res: Response) => {
    res.json(await store.getConfig());
  });

  // 3a. Vehicles summary (Public & Customer-projected)
  app.get('/api/v1/vehicles', async (req: AuthenticatedRequest, res: Response) => {
    const audience = (req.query.audience as string) || (req.user?.role === 'CustomerBuyer' ? 'customer' : 'public');
    const customerTier = (req.query.tier as any) || req.user?.tier;
    const context = {
      audience: audience as 'public' | 'customer' | 'salesperson',
      customerId: req.user?.sub,
      customerTier,
    };
    res.json(await store.getVehicles(req.query as Record<string, string>, context));
  });

  // 3b. Vehicle search with facets, pagination & sorting (Public & Customer-projected)
  app.get('/api/v1/vehicles/search', async (req: AuthenticatedRequest, res: Response) => {
    const audience = (req.query.audience as string) || (req.user?.role === 'CustomerBuyer' ? 'customer' : 'public');
    const customerTier = (req.query.tier as any) || req.user?.tier;
    const context = {
      audience: audience as 'public' | 'customer' | 'salesperson',
      customerId: req.user?.sub,
      customerTier,
    };
    res.json(await store.searchVehicles(req.query as Record<string, string>, context));
  });

  // 3c. Vehicle detail lookup by ID, chassis, or slug (Public & Customer-projected)
  app.get('/api/v1/vehicles/:idOrSlug', async (req: AuthenticatedRequest, res: Response) => {
    const rawParam = req.params.idOrSlug;
    const idOrSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    const audience = (req.query.audience as string) || (req.user?.role === 'CustomerBuyer' ? 'customer' : 'public');
    const customerTier = (req.query.tier as any) || req.user?.tier;
    const context = {
      audience: audience as 'public' | 'customer' | 'salesperson',
      customerId: req.user?.sub,
      customerTier,
    };
    const detail = await store.getVehicleDetail(idOrSlug, context);
    if (!detail) {
      res.status(404).json({
        statusCode: 404,
        message: `Vehicle '${idOrSlug}' not found`,
        correlationId: `corr-404-${Date.now()}`,
      });
      return;
    }
    res.json(detail);
  });

  // 3d. Freight destinations catalog (Public) — D01-ASM-001
  app.get('/api/v1/freight/destinations', async (_req: Request, res: Response) => {
    res.json(await store.getFreightDestinations());
  });

  // 3e. Freight ports catalog (Public) — D01-ASM-001
  app.get('/api/v1/freight/ports', async (_req: Request, res: Response) => {
    res.json(await store.getFreightPorts());
  });

  // 3f. Freight estimate lookup (Public) — D01-ASM-001: DEC-PUB-FREIGHT-MODEL
  // is OPEN, so every supported destination/port pair deterministically
  // returns the `estimate unavailable — pending confirmed rate` outcome.
  // No cubic-volume/freight formula and no computed total are implemented
  // here (RULE-09, RULE-10); that belongs to D01-P05-T002 once approved.
  app.post('/api/v1/freight/estimate', async (req: Request, res: Response) => {
    try {
      const estimate = await store.getFreightEstimate((req.body ?? {}) as FreightEstimateRequest);
      res.json(estimate);
    } catch (error) {
      if (error instanceof FreightRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error.field ? { field: error.field } : {}),
        });
        return;
      }
      throw error;
    }
  });

  // 3g. Quotation enquiry submission (Public) — PUB-13, PUB-15, D01-P05-T004.
  // Independent of DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001):
  // a visitor can submit an enquiry about a vehicle, a shipping destination,
  // or neither, with no computed total ever attached to it (RULE-09).
  app.post('/api/v1/enquiries', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = req.user ? resolveCustomerScope(req.user.sub) : undefined;
      const enquiry = await store.createEnquiry((req.body ?? {}) as EnquiryRequest, customerId);
      res.status(enquiry.duplicate ? 200 : 201).json(enquiry);
    } catch (error) {
      if (error instanceof EnquiryRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error.field ? { field: error.field } : {}),
        });
        return;
      }
      throw error;
    }
  });

  // 3h. Staff-facing lead read-by-ID/list proof operations (PUB-16,
  // D01-P06-T001) — the explicit regression fix for the POC disconnected-lead
  // defect: a submitted enquiry must be readable back through the future
  // Salesperson service boundary, not only writable from the public form.
  // Authorization runs here at the service/BFF boundary, never only in a
  // future browser UI (FRONT_END_ARCHITECTURE.md §16). Limited to the fields
  // required to verify handoff; no private/staff-only escalation fields are
  // added beyond the lead record itself.
  app.get('/api/v1/enquiries', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:leads')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    res.json(await store.listLeads());
  });

  app.get('/api/v1/enquiries/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:leads')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const rawParam = req.params.id;
    const id = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    const lead = await store.getLeadById(id);
    if (!lead) {
      res.status(404).json({ statusCode: 404, message: `Enquiry '${id}' not found`, correlationId: `corr-404-${Date.now()}` });
      return;
    }
    res.json(lead);
  });

  // 3j. Customer inquiry list (D02-P13-T001, CUST-34, FRD Section 6): returns
  // signed-in customer's inquiries (Stock, WhatsApp, Auction, General).
  app.get('/api/v1/customer/inquiries', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const inquiries = await store.listCustomerPolymorphicInquiries(customerId);
    res.json(inquiries);
  });

  // 3k-stmt. Customer statement with running balance (FRD Section 3)
  app.get('/api/v1/customer/statement', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const fromDate = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const toDate = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;
    const statement = await store.getCustomerStatement(customerId, fromDate, toDate);
    res.json(statement);
  });

  // 3k-dc. Customer debit, credit, refund transactions (FRD Section 5.9-5.14)
  app.get('/api/v1/customer/debit-credit', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const dcRecords = await store.getCustomerDebitCreditRefunds(customerId);
    res.json(dcRecords);
  });

  // 3k-pa. Customer paired / linked accounts (FRD Section 1)
  app.get('/api/v1/customer/paired-accounts', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const accounts = await store.getCustomerPairedAccounts(customerId);
    res.json({ items: accounts });
  });

  // 3l. Wishlist operations (D02-P13-T002, CUST-36/CUST-37): list, add, remove
  // wishlist items for the signed-in customer.
  app.get('/api/v1/customer/wishlist', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const wishlist = await store.listWishlist(customerId);
    res.json(wishlist);
  });

  app.post('/api/v1/customer/wishlist', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    try {
      const customerId = resolveCustomerScope(req.user.sub);
      const { vehicleSlug } = req.body ?? {};
      if (!vehicleSlug) {
        res.status(400).json({ statusCode: 400, message: 'vehicleSlug is required' });
        return;
      }
      const response = await store.toggleWishlist(customerId, vehicleSlug);
      res.status(200).json(response);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        const err = error as { statusCode: number; message: string };
        res.status(err.statusCode).json({ statusCode: err.statusCode, message: err.message });
        return;
      }
      throw error;
    }
  });

  app.delete('/api/v1/customer/wishlist/:vehicleSlug', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const rawParam = req.params.vehicleSlug;
    const vehicleSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    try {
      const customerId = resolveCustomerScope(req.user.sub);
      // Idempotent: if not present, still return 200 with wishlisted: false
      const existing = await store.listWishlist(customerId);
      const item = existing.items.find((w) => w.vehicleSlug === vehicleSlug);
      if (item) {
        // Simulate removal by toggling
        const response = await store.toggleWishlist(customerId, vehicleSlug);
        res.status(200).json(response);
      } else {
        res.status(200).json({ wishlisted: false });
      }
    } catch (error) {
      throw error;
    }
  });

  // 3m. Favourites operations (D02-P13-T002, CUST-38/CUST-39/CUST-40): list,
  // create, delete favourite search criteria, and facets endpoint.
  app.get('/api/v1/customer/favourites', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const favourites = await store.listFavourites(customerId);
    res.json(favourites);
  });

  app.post('/api/v1/customer/favourites', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    try {
      const customerId = resolveCustomerScope(req.user.sub);
      const { name, criteria } = req.body ?? {};
      if (!name) {
        res.status(400).json({ statusCode: 400, message: 'name is required' });
        return;
      }
      if (!criteria) {
        res.status(400).json({ statusCode: 400, message: 'criteria is required' });
        return;
      }
      const favourite = await store.createFavourite(customerId, name, criteria, req.header('x-mock-now') || undefined);
      res.status(201).json(favourite);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        const err = error as { statusCode: number; message: string; reason?: string };
        res.status(err.statusCode).json({
          statusCode: err.statusCode,
          message: err.message,
          ...(err.reason ? { reason: err.reason } : {}),
        });
        return;
      }
      throw error;
    }
  });

  app.delete('/api/v1/customer/favourites/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    try {
      const rawParam = req.params.id;
      const id = Array.isArray(rawParam) ? rawParam[0] : rawParam;
      const customerId = resolveCustomerScope(req.user.sub);
      await store.deleteFavourite(customerId, id);
      res.status(204).send();
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'statusCode' in error) {
        const err = error as { statusCode: number; message: string };
        res.status(err.statusCode).json({ statusCode: err.statusCode, message: err.message });
        return;
      }
      throw error;
    }
  });

  app.get('/api/v1/customer/favourites/facets', async (req: Request, res: Response) => {
    const facets = await store.getFavouriteFacets();
    res.json(facets);
  });

  // 3k. Vehicle inquiry aggregate (D02-P13-T001, CUST-35): returns the count
  // of distinct people who have requested a quote for a given vehicle.
  app.get('/api/v1/vehicles/:idOrSlug/inquiry-count', async (req: Request, res: Response) => {
    const rawParam = req.params.idOrSlug;
    const idOrSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    const vehicle = await store.getVehicleDetail(idOrSlug);
    if (!vehicle) {
      res.status(404).json({ statusCode: 404, message: `Vehicle '${idOrSlug}' not found`, correlationId: `corr-404-${Date.now()}` });
      return;
    }
    const aggregate = await store.getVehicleInquiryAggregate(idOrSlug);
    res.json(aggregate);
  });

  // 3i-r. Transactional reservation eligibility and hold (PUB-23, RULE-05,
  // RULE-08, RULE-10, D01-P06-T004). Authorization, eligibility (vehicle
  // availability, conflict/duplicate, the anti-abuse limit) and the atomic
  // 48-hour hold all run here at the service/BFF boundary, never only in a
  // future browser UI (FRONT_END_ARCHITECTURE.md §16). Only an authenticated
  // identity carrying `create:reservation` (a registered `CustomerBuyer`) may
  // reserve — a public visitor is told what to do next (PUB-23) by the
  // account-entry UI (D01-P06-T003/T005), not by this route silently
  // failing.
  app.post('/api/v1/reservations', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({
        statusCode: 401,
        message: 'Sign in to reserve a vehicle',
        correlationId: `corr-401-${Date.now()}`,
        reason: 'unauthenticated',
      });
      return;
    }
    if (!hasPermission(req.user.role, 'create:reservation')) {
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: this identity cannot reserve a vehicle',
        correlationId: `corr-403-${Date.now()}`,
        reason: 'forbidden',
      });
      return;
    }
    try {
      const customerId = resolveCustomerScope(req.user.sub);
      const reservation = await store.createReservation(customerId, req.user.email, (req.body ?? {}) as ReservationRequest);
      res.status(201).json(reservation);
    } catch (error) {
      if (error instanceof ReservationRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error.field ? { field: error.field } : {}),
          ...(error.reason ? { reason: error.reason } : {}),
        });
        return;
      }
      throw error;
    }
  });

  // Reservation read-by-id: gated to the owning customer or a staff identity
  // with `read:leads` — never a public, unauthenticated response, and never
  // another customer's reservation (no private-field leak across accounts).
  app.get('/api/v1/reservations/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    const rawParam = req.params.id;
    const id = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    const reservation = await store.getReservationById(id);
    if (!reservation) {
      res.status(404).json({ statusCode: 404, message: `Reservation '${id}' not found`, correlationId: `corr-404-${Date.now()}` });
      return;
    }
    const isOwner = reservation.customerId === resolveCustomerScope(req.user.sub);
    if (!isOwner && !hasPermission(req.user.role, 'read:leads')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    res.json(reservation);
  });

  // 3i. Customer self-registration, sign-in, change-password and
  // password-reset contract (CUST-26..30, D02-ASM-005/006/007). The Mock API
  // is the only authority for credentials and sessions; no route accepts a
  // client-supplied customer id, and no response ever carries a password,
  // hash or salt. `mintCustomerSessionToken` reuses `@carchief/domain`'s
  // `issueSessionToken` primitive internally — it stays an internal detail,
  // never a claim of a production identity provider
  // (DEC-CUST-IDENTITY-RECOVERY is unchanged).
  function mintCustomerSessionToken(customerId: string, email: string) {
    const token = mintDomainSessionToken('CustomerBuyer', customerId, email);
    const claims = parseSessionToken(token);
    return { token, claims };
  }

  app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
    try {
      const account = await store.registerCustomerAccount(req.body ?? {}, req.header('x-mock-now') || undefined);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof AccountRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error.field ? { field: error.field } : {}),
        });
        return;
      }
      throw error;
    }
  });

  app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
    try {
      const account = await store.authenticateCustomer(req.body ?? {});
      const { token, claims } = mintCustomerSessionToken(account.customerId, account.email);
      if (!claims) {
        res.status(500).json({ statusCode: 500, message: 'Failed to mint session', correlationId: `corr-500-${Date.now()}` });
        return;
      }
      res.status(200).json({ token, claims });
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
        });
        return;
      }
      throw error;
    }
  });

  app.post('/api/v1/auth/change-password', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    try {
      await store.changeCustomerPassword(resolveCustomerScope(req.user.sub), req.body ?? {}, req.header('x-mock-now') || undefined);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AccountRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error instanceof AccountRequestError && error.field ? { field: error.field } : {}),
        });
        return;
      }
      throw error;
    }
  });

  // Always 202 regardless of whether the email exists — no account
  // enumeration (D02-ASM-007). The token is only ever readable through the
  // non-production-only outbox endpoint below.
  app.post('/api/v1/auth/password-reset', async (req: Request, res: Response) => {
    await store.requestPasswordReset(req.body ?? {}, req.header('x-mock-now') || undefined);
    res.status(202).json({ message: 'If an account exists for that email, a password reset token has been issued to the mock outbox.' });
  });

  app.post('/api/v1/auth/password-reset/confirm', async (req: Request, res: Response) => {
    try {
      await store.confirmPasswordReset(req.body ?? {}, req.header('x-mock-now') || undefined);
      res.status(200).json({ success: true });
    } catch (error) {
      if (error instanceof AccountRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error.field ? { field: error.field } : {}),
        });
        return;
      }
      throw error;
    }
  });

  // Non-production only, mirroring the POST /api/v1/__reset guard shape —
  // lets a test or local caller read the deterministic mock outbox without
  // a real email/SMS provider (D02-ASM-007).
  app.get('/api/v1/auth/__outbox', async (_req: Request, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: outbox endpoint is disabled in production environment',
        correlationId: `corr-403-${Date.now()}`,
      });
      return;
    }
    res.json({ items: await store.listPasswordResetOutbox() });
  });

  // Country, ISO code and E.164 dial-code catalog backing registration's
  // country selector (CUST-26).
  app.get('/api/v1/config/countries', async (_req: Request, res: Response) => {
    res.json(await store.getCountries());
  });

  // 3j. FAQ query & grounding (Public) — PUB-20, DEC-PUB-FAQ-AI
  app.get('/api/v1/content/faq', async (req: Request, res: Response) => {
    const category = req.query.category as string | undefined;
    const q = req.query.q as string | undefined;
    res.json(await store.getFaqs({ category, q }));
  });

  // 3k. Approved testimonials list (Public) — PUB-19
  app.get('/api/v1/content/testimonials', async (_req: Request, res: Response) => {
    res.json(await store.getTestimonials());
  });

  // 3l. Testimonial submission (Public) — PUB-19
  app.post('/api/v1/content/testimonials', async (req: Request, res: Response) => {
    try {
      const response = await store.submitTestimonial(req.body ?? {});
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof TestimonialRequestError) {
        res.status(error.statusCode).json({
          statusCode: error.statusCode,
          message: error.message,
          correlationId: `corr-${error.statusCode}-${Date.now()}`,
          ...(error.field ? { field: error.field } : {}),
        });
        return;
      }
      throw error;
    }
  });

  // 3m. Approved public content pages (Public) — PUB-17
  app.get('/api/v1/content/pages', async (_req: Request, res: Response) => {
    res.json(await store.getContentPages());
  });

  app.get('/api/v1/content/pages/:slug', async (req: Request, res: Response) => {
    const rawParam = req.params.slug;
    const slug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    const page = await store.getContentPageBySlug(slug);
    if (!page) {
      res.status(404).json({
        statusCode: 404,
        message: `Content page '${slug}' not found`,
        correlationId: `corr-404-${Date.now()}`,
      });
      return;
    }
    res.json(page);
  });

  // 3n. Approved office locations (Public) — PUB-18
  app.get('/api/v1/content/offices', async (_req: Request, res: Response) => {
    res.json(await store.getOffices());
  });

  // 3o. Approved branch hubs (Public) — PUB-18
  app.get('/api/v1/content/branches', async (_req: Request, res: Response) => {
    res.json(await store.getBranches());
  });

  app.get('/api/v1/content/branches/:id', async (req: Request, res: Response) => {
    const rawParam = req.params.id;
    const id = Array.isArray(rawParam) ? rawParam[0] : rawParam;
    const branch = await store.getBranchById(id);
    if (!branch) {
      res.status(404).json({
        statusCode: 404,
        message: `Branch hub '${id}' not found`,
        correlationId: `corr-404-${Date.now()}`,
      });
      return;
    }
    res.json(branch);
  });


  // 4. Auth identity inspection endpoint
  app.get('/api/v1/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    res.json(req.user);
  });

  app.get('/api/v1/bank-accounts', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated access to bank accounts is not allowed', correlationId: 'corr-401' });
      return;
    }
    const accounts = await store.getBankAccounts();
    res.json(accounts);
  });

  // 4a. Customer dashboard KPI baseline (D02-ASM-001, CUST-04, CUST-05, CUST-06)
  // Non-blocking aggregate: outstanding balance = invoiced total - approved allocations;
  // credit utilisation = outstanding balance ÷ credit limit; vehicle counts use canonical IDs + status.
  // Requires authentication as CustomerBuyer.
  app.get('/api/v1/customer/dashboard', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const dashboard = await store.getCustomerDashboard(resolveCustomerScope(req.user.sub), req.user.email);
    res.json(dashboard);
  });

  // 4aa. Customer profile contract (D02-P08-T004, CUST-23/24/25).
  app.get('/api/v1/customer/profile', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    try {
      res.json(await store.getCustomerProfile(resolveCustomerScope(req.user.sub), req.user.email));
    } catch (error) {
      res.status(404).json({ statusCode: 404, message: error instanceof Error ? error.message : 'Customer profile not found', correlationId: `corr-404-${Date.now()}` });
    }
  });

  app.put('/api/v1/customer/profile', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    try {
      res.json(await store.updateCustomerProfile(resolveCustomerScope(req.user.sub), req.user.email, req.body, req.header('x-mock-now') || undefined));
    } catch (error) {
      const statusCode = error instanceof ProfileConflictError ? error.statusCode : 400;
      res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Invalid customer profile', correlationId: `corr-${statusCode}-${Date.now()}` });
    }
  });

  // 4b. Customer shipment timeline projection (D02-P07-T001, CUST-11).
  // The server scopes records to the authenticated customer and exposes only
  // the approved operational stages; carrier/ERP internals are not exposed.
  app.get('/api/v1/customer/shipments', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    res.json({ items: await store.listCustomerShipments(resolveCustomerScope(req.user.sub)) });
  });

  app.get('/api/v1/customer/shipments/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const shipmentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const shipment = await store.getCustomerShipment(resolveCustomerScope(req.user.sub), shipmentId);
    if (!shipment) {
      res.status(404).json({ statusCode: 404, message: 'Shipment not found', correlationId: `corr-404-${Date.now()}` });
      return;
    }
    res.json(shipment);
  });

  // Documents are returned only after both Finance release and the
  // salesperson-owned visibleToCustomer flag are true (CUST-20/CUST-21).
  app.get('/api/v1/customer/documents', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    res.json({ items: await store.listCustomerDocuments(resolveCustomerScope(req.user.sub)) });
  });

  app.get('/api/v1/customer/documents/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const documentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const document = await store.getCustomerDocument(resolveCustomerScope(req.user.sub), documentId);
    if (!document) {
      res.status(404).json({ statusCode: 404, message: 'Document not found', correlationId: `corr-404-${Date.now()}` });
      return;
    }
    res.json(document);
  });

  // 4d. Customer-scoped notifications (D02-P08-T001, CUST-22).
  app.get('/api/v1/customer/notifications', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    const rawStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
    const status = ['all', 'read', 'unread'].includes(rawStatus) ? rawStatus as 'all' | 'read' | 'unread' : 'all';
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    res.json(await store.listCustomerNotifications(resolveCustomerScope(req.user.sub), { status, q }));
  });

  app.get('/api/v1/customer/notifications/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    const notification = await store.getCustomerNotification(resolveCustomerScope(req.user.sub), req.params.id as string);
    if (!notification) return void res.status(404).json({ statusCode: 404, message: 'Notification not found', correlationId: `corr-404-${Date.now()}` });
    res.json(notification);
  });

  app.post('/api/v1/customer/notifications/:id/read', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    const notification = await store.markCustomerNotificationRead(resolveCustomerScope(req.user.sub), req.params.id as string);
    if (!notification) return void res.status(404).json({ statusCode: 404, message: 'Notification not found', correlationId: `corr-404-${Date.now()}` });
    res.json(notification);
  });

  app.post('/api/v1/customer/notifications/read-all', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    res.json(await store.markAllCustomerNotificationsRead(resolveCustomerScope(req.user.sub)));
  });

  app.delete('/api/v1/customer/notifications/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    const success = await store.deleteCustomerNotification(resolveCustomerScope(req.user.sub), req.params.id as string);
    if (!success) return void res.status(404).json({ statusCode: 404, message: 'Notification not found', correlationId: `corr-404-${Date.now()}` });
    res.json({ success: true });
  });

  // 4e. Customer vehicle transaction fleet listing and detail.
  app.get('/api/v1/customer/vehicles', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const nowISO = req.header('x-mock-now') || undefined;
    const query = { status: req.query.status as string | undefined, query: req.query.query as string | undefined, page: req.query.page ? Number(req.query.page) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined };
    res.json(await store.getCustomerVehicles(customerId, query, nowISO));
  });

  app.get('/api/v1/customer/vehicles/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const idOrSlug = req.params.id as string;
    const vehicle = await store.getCustomerVehicleById(resolveCustomerScope(req.user.sub), idOrSlug, req.header('x-mock-now') || undefined);
    if (!vehicle) {
      res.status(404).json({ statusCode: 404, message: `Customer vehicle '${idOrSlug}' not found or not owned by customer`, correlationId: `corr-404-${Date.now()}` });
      return;
    }
    res.json(vehicle);
  });

  // 4d. Customer invoices & proforma invoices listing (CUST-02, CUST-14, CUST-15, RULE-04, RULE-08, RULE-10)
  app.get('/api/v1/customer/invoices', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const nowISO = req.header('x-mock-now') || undefined;
    const query = {
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      query: req.query.query as string | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const response = await store.getCustomerInvoices(customerId, query, nowISO);
    res.json(response);
  });

  // 4e. Customer invoice & proforma invoice detail (CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-07)
  app.get('/api/v1/customer/invoices/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const id = req.params.id as string;
    const nowISO = req.header('x-mock-now') || undefined;
    const invoice = await store.getCustomerInvoiceById(customerId, id, nowISO);
    if (!invoice) {
      res.status(404).json({
        statusCode: 404,
        message: `Customer invoice '${id}' not found or not owned by customer`,
        correlationId: `corr-404-${Date.now()}`,
      });
      return;
    }
    res.json(invoice);
  });

  // 4f. Customer invoice printable / downloadable document projection (CUST-16, RULE-04)
  app.get('/api/v1/customer/invoices/:id/document', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    if (!hasPermission(req.user.role, 'read:customer')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }
    const customerId = resolveCustomerScope(req.user.sub);
    const id = req.params.id as string;
    const nowISO = req.header('x-mock-now') || undefined;
    const doc = await store.getCustomerInvoiceDocument(customerId, id, nowISO);
    if (!doc) {
      res.status(404).json({
        statusCode: 404,
        message: `Customer invoice document '${id}' not found or not owned by customer`,
        correlationId: `corr-404-${Date.now()}`,
      });
      return;
    }
    res.json(doc);
  });

  // 4g. Customer TT journal and proof metadata (D02-P06-T001).
  app.get('/api/v1/customer/payments', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    res.json(await store.listCustomerPayments(resolveCustomerScope(req.user.sub)));
  });

  app.get('/api/v1/customer/payments/:id', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    const payment = await store.getCustomerPayment(resolveCustomerScope(req.user.sub), req.params.id as string);
    if (!payment) return void res.status(404).json({ statusCode: 404, message: 'Payment not found or not owned by customer', correlationId: `corr-404-${Date.now()}` });
    res.json(payment);
  });

  app.post('/api/v1/customer/payments/:id/resubmit', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'create:payment')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: payment resubmission requires customer payment permission', correlationId: 'corr-403' });
    try {
      const payment = await store.resubmitCustomerPayment(resolveCustomerScope(req.user.sub), req.params.id as string, req.header('x-mock-now') || undefined);
      res.json(payment);
    } catch (error) {
      const statusCode = error instanceof PaymentWorkflowError ? error.statusCode : 400;
      res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Unable to resubmit payment', correlationId: `corr-${statusCode}-${Date.now()}` });
    }
  });

  app.post('/api/v1/customer/payments', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'create:payment')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    try {
      const payment = await store.createCustomerPayment(resolveCustomerScope(req.user.sub), req.body, req.header('x-mock-now') || undefined);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ statusCode: 400, message: error instanceof Error ? error.message : 'Invalid payment submission', correlationId: `corr-400-${Date.now()}` });
    }
  });

  // 4h. Payment notification outbox. Finance records events; customers only read their own projection.
  app.get('/api/v1/customer/payment-notifications', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:customer')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
    const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId : undefined;
    res.json(await store.listCustomerPaymentNotifications(resolveCustomerScope(req.user.sub), paymentId));
  });

  app.post('/api/v1/finance/customer-payments/:id/notifications', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
    if (!hasPermission(req.user.role, 'read:finance')) return void res.status(403).json({ statusCode: 403, message: 'Forbidden: finance role required', correlationId: 'corr-403' });
    try {
      const notification = await store.recordPaymentNotification(req.params.id as string, req.body, req.header('x-mock-now') || undefined);
      if (!notification) return void res.status(404).json({ statusCode: 404, message: 'Payment not found', correlationId: `corr-404-${Date.now()}` });
      res.status(201).json(notification);
    } catch (error) {
      const statusCode = error instanceof PaymentWorkflowError ? error.statusCode : 400;
      res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Invalid notification event', correlationId: `corr-${statusCode}-${Date.now()}` });
    }
  });

  // 5. Deterministic reset (Disabled in production mode for release safety)
  app.post('/api/v1/__reset', async (req: AuthenticatedRequest, res: Response) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        statusCode: 403,
        message: 'Forbidden: Reset endpoint is disabled in production environment',
        correlationId: `corr-403-${Date.now()}`,
      });
      return;
    }

    // If token provided, enforce permission
    if (req.user && !hasPermission(req.user.role, 'reset:data')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }

    try {
      await store.reset();
      res.json({ success: true, message: 'Data reset successfully' });
    } catch (error) {
      // Concurrent `__reset` calls against PostgresStore can race (two
      // overlapping DELETE+INSERT transactions producing a duplicate-key
      // violation); without this catch the rejection was unhandled and
      // crashed the whole Node process (Node >=15 terminates on an
      // unhandled promise rejection), taking down every other in-flight
      // request. Surface it as a normal 500 instead — the caller (or the
      // next `__reset`) can retry.
      res.status(500).json({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Reset failed',
        correlationId: `corr-500-${Date.now()}`,
      });
    }
  });

  // 6. OpenAPI JSON spec
  const openapiPath = join(process.cwd(), 'openapi', 'openapi.json');
  app.get('/openapi.json', (_req: Request, res: Response) => {
    if (existsSync(openapiPath)) {
      const spec = JSON.parse(readFileSync(openapiPath, 'utf8'));
      res.json(spec);
    } else {
      res.status(404).json({ statusCode: 404, message: 'OpenAPI spec not found', correlationId: 'corr-404' });
    }
  });

  // 7. Interactive Swagger UI
  app.get('/swagger', (_req: Request, res: Response) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CarChief Mock API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.MOCK_API_PORT || 4000;
  const store = createStore();
  const app = createMockApiApp(store);
  store.ready().then(() => app.listen(port, () => {
    console.log(`CarChief Mock API listening on port ${port}`);
  })).catch((error) => { console.error('Mock API database initialization failed', error); process.exitCode = 1; });
}
