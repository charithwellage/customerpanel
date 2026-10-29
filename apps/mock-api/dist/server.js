"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockApiApp = createMockApiApp;
const express_1 = __importDefault(require("express"));
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const domain_1 = require("@carchief/domain");
const store_js_1 = require("./store.js");
const customer_scope_js_1 = require("./auth/customer-scope.js");
function createInvoicePdf(title, html) {
    const text = `${title}\n\n${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`.slice(0, 7000)
        .replace(/([\\()])/g, '\\$1');
    const lines = text.match(/.{1,92}(?:\s|$)/g) || [title];
    const stream = [`BT /F1 10 Tf 48 760 Td 13 TL`, ...lines.map((line, index) => `${index ? 'T* ' : ''}(${line.trim()}) Tj`), 'ET'].join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let index = 0; index < objects.length; index += 1) {
        offsets.push(Buffer.byteLength(pdf));
        pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xref = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
}
function createMockApiApp(store = (0, store_js_1.createStore)()) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    // CORS middleware
    app.use((req, res, next) => {
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
    app.use((req, _res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7).trim();
            const claims = (0, domain_1.parseSessionToken)(token);
            if (claims && !(0, domain_1.isJwtExpired)(claims)) {
                req.user = claims;
            }
        }
        next();
    });
    // 1. Health check (Public)
    app.get('/healthz', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // 2. Public config (Public)
    app.get('/api/v1/config/public', async (_req, res) => {
        res.json(await store.getConfig());
    });
    // 3. Vehicle inventory with filtering, facets, pagination & sorting (Public & Customer-projected)
    app.get('/api/v1/vehicles', async (req, res) => {
        const audience = req.query.audience || (req.user?.role === 'CustomerBuyer' ? 'customer' : 'public');
        const customerTier = req.user?.role === 'CustomerBuyer'
            ? await store.getCustomerTier((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub))
            : (req.query.tier || req.user?.tier);
        const destinationCountry = req.query.destinationCountry || req.user?.country || req.user?.countryCode;
        const context = {
            audience: audience,
            customerId: req.user ? (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub) : undefined,
            customerTier,
            customerCountry: req.user?.country || req.user?.countryCode,
            destinationCountry,
        };
        res.json(await store.getVehicles(req.query, context));
    });
    // AutoPulse-compatible AI vehicle-search contract. The mock deliberately
    // does not emulate AI or MCP orchestration; it only exposes the integration
    // boundary so both frontends can implement and verify their 501 behavior.
    app.post('/api/v1/vehicles/ai-search', (req, res) => {
        const customerScopes = new Set(['customerInventory', 'customerFleet', 'customerWishlist']);
        const scope = typeof req.body?.scope === 'string' ? req.body.scope : '';
        if (customerScopes.has(scope)) {
            if (!req.user) {
                res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
                return;
            }
            if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
                res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
                return;
            }
        }
        res.status(501).json({
            statusCode: 501,
            code: 'AI_SEARCH_NOT_IMPLEMENTED',
            message: 'AI vehicle search is not implemented in the mock API.',
            correlationId: req.header('x-correlation-id') || `corr-501-${Date.now()}`,
        });
    });
    // 4. Vehicle detail lookup by ID, chassis, or slug (Public & Customer-projected)
    app.get('/api/v1/vehicles/:idOrSlug', async (req, res) => {
        const rawParam = req.params.idOrSlug;
        const idOrSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
        const audience = req.query.audience || (req.user?.role === 'CustomerBuyer' ? 'customer' : 'public');
        const customerTier = req.user?.role === 'CustomerBuyer'
            ? await store.getCustomerTier((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub))
            : (req.query.tier || req.user?.tier);
        const destinationCountry = req.query.destinationCountry || req.user?.country || req.user?.countryCode;
        const context = {
            audience: audience,
            customerId: req.user ? (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub) : undefined,
            customerTier,
            customerCountry: req.user?.country || req.user?.countryCode,
            destinationCountry,
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
    app.get('/api/v1/freight/destinations', async (_req, res) => {
        res.json(await store.getFreightDestinations());
    });
    // 3e. Freight ports catalog (Public) — D01-ASM-001
    app.get('/api/v1/freight/ports', async (_req, res) => {
        res.json(await store.getFreightPorts());
    });
    // 3f. Freight estimate lookup (Public) — D01-ASM-001: DEC-PUB-FREIGHT-MODEL
    // is OPEN, so every supported destination/port pair deterministically
    // returns the `estimate unavailable — pending confirmed rate` outcome.
    // No cubic-volume/freight formula and no computed total are implemented
    // here (RULE-09, RULE-10); that belongs to D01-P05-T002 once approved.
    app.post('/api/v1/freight/estimate', async (req, res) => {
        try {
            const estimate = await store.getFreightEstimate((req.body ?? {}));
            res.json(estimate);
        }
        catch (error) {
            if (error instanceof store_js_1.FreightRequestError) {
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
    // 3g. Authenticated quotation enquiry submission — PUB-13, PUB-15, D01-P05-T004.
    // Independent of DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001):
    // a visitor can submit an enquiry about a vehicle, a shipping destination,
    // or neither, with no computed total ever attached to it (RULE-09).
    app.post('/api/v1/enquiries', async (req, res) => {
        try {
            if (!req.user) {
                res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
                return;
            }
            const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
            const enquiry = await store.createEnquiry((req.body ?? {}), customerId);
            res.status(enquiry.duplicate ? 200 : 201).json(enquiry);
        }
        catch (error) {
            if (error instanceof store_js_1.EnquiryRequestError) {
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
    // 3h. Staff-facing lead read-by-ID/list proof operations (PUB-16,
    // D01-P06-T001) — the explicit regression fix for the POC disconnected-lead
    // defect: a submitted enquiry must be readable back through the future
    // Salesperson service boundary, not only writable from the public form.
    // Authorization runs here at the service/BFF boundary, never only in a
    // future browser UI (FRONT_END_ARCHITECTURE.md §16). Limited to the fields
    // required to verify handoff; no private/staff-only escalation fields are
    // added beyond the lead record itself.
    app.get('/api/v1/enquiries', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:leads')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        res.json(await store.listLeads());
    });
    app.get('/api/v1/enquiries/:id', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:leads')) {
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
    app.get('/api/v1/customer/inquiries', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const inquiries = await store.listCustomerPolymorphicInquiries(customerId);
        res.json(inquiries);
    });
    // 3k-stmt. Customer statement with running balance (FRD Section 3)
    app.get('/api/v1/customer/statement', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const fromDate = typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
        const toDate = typeof req.query.toDate === 'string' ? req.query.toDate : undefined;
        try {
            const statement = await store.getCustomerStatement(customerId, fromDate, toDate);
            res.json(statement);
        }
        catch (error) {
            const statusCode = error instanceof store_js_1.DatabaseRequiredError ? 503 : 500;
            res.status(statusCode).json({
                statusCode,
                message: error instanceof Error ? error.message : 'Unable to load customer statement',
                correlationId: `corr-${statusCode}-${Date.now()}`,
            });
        }
    });
    // 3l. Wishlist operations (D02-P13-T002, CUST-36/CUST-37): list, add, remove
    // wishlist items for the signed-in customer.
    app.get('/api/v1/customer/wishlist', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const wishlist = await store.listWishlist(customerId);
        res.json(wishlist);
    });
    app.post('/api/v1/customer/wishlist', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        try {
            const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
            const { vehicleSlug } = req.body ?? {};
            if (!vehicleSlug) {
                res.status(400).json({ statusCode: 400, message: 'vehicleSlug is required' });
                return;
            }
            const response = await store.toggleWishlist(customerId, vehicleSlug);
            res.status(200).json(response);
        }
        catch (error) {
            if (typeof error === 'object' && error !== null && 'statusCode' in error) {
                const err = error;
                res.status(err.statusCode).json({ statusCode: err.statusCode, message: err.message });
                return;
            }
            throw error;
        }
    });
    app.delete('/api/v1/customer/wishlist/:vehicleSlug', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        const rawParam = req.params.vehicleSlug;
        const vehicleSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
        try {
            const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
            // Idempotent: if not present, still return 200 with wishlisted: false
            const existing = await store.listWishlist(customerId);
            const item = existing.items.find((w) => w.vehicleSlug === vehicleSlug);
            if (item) {
                // Simulate removal by toggling
                const response = await store.toggleWishlist(customerId, vehicleSlug);
                res.status(200).json(response);
            }
            else {
                res.status(200).json({ wishlisted: false });
            }
        }
        catch (error) {
            throw error;
        }
    });
    // 3m. Favourites operations (D02-P13-T002, CUST-38/CUST-39/CUST-40): list,
    // create, delete favourite search criteria, and facets endpoint.
    app.get('/api/v1/customer/favourites', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const favourites = await store.listFavourites(customerId);
        res.json(favourites);
    });
    app.post('/api/v1/customer/favourites', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        try {
            const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
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
        }
        catch (error) {
            if (typeof error === 'object' && error !== null && 'statusCode' in error) {
                const err = error;
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
    app.delete('/api/v1/customer/favourites/:id', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        try {
            const rawParam = req.params.id;
            const id = Array.isArray(rawParam) ? rawParam[0] : rawParam;
            const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
            await store.deleteFavourite(customerId, id);
            res.status(204).send();
        }
        catch (error) {
            if (typeof error === 'object' && error !== null && 'statusCode' in error) {
                const err = error;
                res.status(err.statusCode).json({ statusCode: err.statusCode, message: err.message });
                return;
            }
            throw error;
        }
    });
    app.get('/api/v1/customer/favourites/facets', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        const facets = await store.getFavouriteFacets();
        res.json(facets);
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
    app.post('/api/v1/reservations', async (req, res) => {
        if (!req.user) {
            res.status(401).json({
                statusCode: 401,
                message: 'Sign in to reserve a vehicle',
                correlationId: `corr-401-${Date.now()}`,
                reason: 'unauthenticated',
            });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'create:reservation')) {
            res.status(403).json({
                statusCode: 403,
                message: 'Forbidden: this identity cannot reserve a vehicle',
                correlationId: `corr-403-${Date.now()}`,
                reason: 'forbidden',
            });
            return;
        }
        try {
            const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
            const reservation = await store.createReservation(customerId, req.user.email, (req.body ?? {}));
            res.status(201).json(reservation);
        }
        catch (error) {
            if (error instanceof store_js_1.ReservationRequestError) {
                res.status(error.statusCode).json({
                    statusCode: error.statusCode,
                    message: error.message,
                    correlationId: `corr-${error.statusCode}-${Date.now()}`,
                    ...(error.field ? { field: error.field } : {}),
                    ...(error.reason ? { reason: error.reason } : {}),
                });
                return;
            }
            console.error('Reservation request failed', error);
            res.status(500).json({
                statusCode: 500,
                message: 'Unable to create the reservation. Please try again.',
                correlationId: `corr-500-${Date.now()}`,
                reason: 'reservation_service_unavailable',
            });
        }
    });
    // Reservation read-by-id: gated to the owning customer or a staff identity
    // with `read:leads` — never a public, unauthenticated response, and never
    // another customer's reservation (no private-field leak across accounts).
    app.get('/api/v1/reservations/:id', async (req, res) => {
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
        const isOwner = reservation.customerId === (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        if (!isOwner && !(0, domain_1.hasPermission)(req.user.role, 'read:leads')) {
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
    function mintCustomerSessionToken(customerId, email, tier) {
        const token = (0, domain_1.issueSessionToken)('CustomerBuyer', customerId, email, tier);
        const claims = (0, domain_1.parseSessionToken)(token);
        return { token, claims };
    }
    app.post('/api/v1/auth/register', async (req, res) => {
        try {
            const account = await store.registerCustomerAccount(req.body ?? {}, req.header('x-mock-now') || undefined);
            res.status(201).json(account);
        }
        catch (error) {
            if (error instanceof store_js_1.AccountRequestError) {
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
    app.post('/api/v1/auth/login', async (req, res) => {
        try {
            const account = await store.authenticateCustomer(req.body ?? {});
            const { token, claims } = mintCustomerSessionToken(account.customerId, account.email, account.tier);
            if (!claims) {
                res.status(500).json({ statusCode: 500, message: 'Failed to mint session', correlationId: `corr-500-${Date.now()}` });
                return;
            }
            res.status(200).json({ token, claims });
        }
        catch (error) {
            if (error instanceof store_js_1.AuthenticationError) {
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
    app.post('/api/v1/auth/change-password', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        try {
            await store.changeCustomerPassword((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.body ?? {}, req.header('x-mock-now') || undefined);
            res.status(200).json({ success: true });
        }
        catch (error) {
            if (error instanceof store_js_1.AuthenticationError || error instanceof store_js_1.AccountRequestError) {
                res.status(error.statusCode).json({
                    statusCode: error.statusCode,
                    message: error.message,
                    correlationId: `corr-${error.statusCode}-${Date.now()}`,
                    ...(error instanceof store_js_1.AccountRequestError && error.field ? { field: error.field } : {}),
                });
                return;
            }
            throw error;
        }
    });
    // Always 202 regardless of whether the email exists — no account
    // enumeration (D02-ASM-007). The token is only ever readable through the
    // non-production-only outbox endpoint below.
    app.post('/api/v1/auth/password-reset', async (req, res) => {
        await store.requestPasswordReset(req.body ?? {}, req.header('x-mock-now') || undefined);
        res.status(202).json({ message: 'If an account exists for that email, a password reset token has been issued to the mock outbox.' });
    });
    app.post('/api/v1/auth/password-reset/confirm', async (req, res) => {
        try {
            await store.confirmPasswordReset(req.body ?? {}, req.header('x-mock-now') || undefined);
            res.status(200).json({ success: true });
        }
        catch (error) {
            if (error instanceof store_js_1.AccountRequestError) {
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
    app.get('/api/v1/auth/__outbox', async (_req, res) => {
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
    app.get('/api/v1/config/countries', async (_req, res) => {
        res.json(await store.getCountries());
    });
    // 3j. FAQ query & grounding (Public) — PUB-20, DEC-PUB-FAQ-AI
    app.get('/api/v1/content/faq', async (req, res) => {
        const category = req.query.category;
        const q = req.query.q;
        res.json(await store.getFaqs({ category, q }));
    });
    // 3k. Approved testimonials list (Public) — PUB-19
    app.get('/api/v1/content/testimonials', async (_req, res) => {
        res.json(await store.getTestimonials());
    });
    // 3l. Testimonial submission (Public) — PUB-19
    app.post('/api/v1/content/testimonials', async (req, res) => {
        try {
            const response = await store.submitTestimonial(req.body ?? {});
            res.status(201).json(response);
        }
        catch (error) {
            if (error instanceof store_js_1.TestimonialRequestError) {
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
    app.get('/api/v1/content/pages', async (_req, res) => {
        res.json(await store.getContentPages());
    });
    app.get('/api/v1/content/pages/:slug', async (req, res) => {
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
    app.get('/api/v1/content/offices', async (_req, res) => {
        res.json(await store.getOffices());
    });
    // 3o. Approved branch hubs (Public) — PUB-18
    app.get('/api/v1/content/branches', async (_req, res) => {
        res.json(await store.getBranches());
    });
    app.get('/api/v1/content/branches/:id', async (req, res) => {
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
    app.get('/api/v1/auth/me', (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        res.json(req.user);
    });
    app.get('/api/v1/customer/tier-benefits', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        res.json(await store.getCustomerTierBenefits((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.header('x-mock-now') || undefined));
    });
    app.get('/api/v1/bank-accounts', async (_req, res) => {
        const accounts = await store.getBankAccounts();
        res.json(accounts);
    });
    // 4a. Customer dashboard KPI baseline (D02-ASM-001, CUST-04, CUST-05, CUST-06)
    // Non-blocking aggregate: outstanding balance = invoiced total - approved allocations;
    // credit utilisation = outstanding balance ÷ credit limit; vehicle counts use canonical IDs + status.
    // Requires authentication as CustomerBuyer.
    app.get('/api/v1/customer/dashboard', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const dashboard = await store.getCustomerDashboard((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.user.email);
        res.json(dashboard);
    });
    // 4aa. Customer profile contract (D02-P08-T004, CUST-23/24/25).
    app.get('/api/v1/customer/profile', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        try {
            res.json(await store.getCustomerProfile((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.user.email));
        }
        catch (error) {
            res.status(404).json({ statusCode: 404, message: error instanceof Error ? error.message : 'Customer profile not found', correlationId: `corr-404-${Date.now()}` });
        }
    });
    app.put('/api/v1/customer/profile', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        try {
            res.json(await store.updateCustomerProfile((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.user.email, req.body, req.header('x-mock-now') || undefined));
        }
        catch (error) {
            const statusCode = error instanceof store_js_1.ProfileConflictError ? error.statusCode : 400;
            res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Invalid customer profile', correlationId: `corr-${statusCode}-${Date.now()}` });
        }
    });
    // Documents are returned only after both Finance release and the
    // salesperson-owned visibleToCustomer flag are true (CUST-20/CUST-21).
    app.get('/api/v1/customer/documents', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        res.json({ items: await store.listCustomerDocuments((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub)) });
    });
    app.get('/api/v1/customer/documents/:id', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const documentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const document = await store.getCustomerDocument((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), documentId);
        if (!document) {
            res.status(404).json({ statusCode: 404, message: 'Document not found', correlationId: `corr-404-${Date.now()}` });
            return;
        }
        res.json(document);
    });
    // 4d. Customer-scoped notifications (D02-P08-T001, CUST-22).
    app.get('/api/v1/customer/notifications', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        const rawStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
        const status = ['all', 'read', 'unread'].includes(rawStatus) ? rawStatus : 'all';
        const q = typeof req.query.q === 'string' ? req.query.q : undefined;
        res.json(await store.listCustomerNotifications((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), { status, q }));
    });
    app.post('/api/v1/customer/notifications/:id/read', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        const notification = await store.markCustomerNotificationRead((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.params.id);
        if (!notification)
            return void res.status(404).json({ statusCode: 404, message: 'Notification not found', correlationId: `corr-404-${Date.now()}` });
        res.json(notification);
    });
    app.post('/api/v1/customer/notifications/read-all', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        res.json(await store.markAllCustomerNotificationsRead((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub)));
    });
    app.delete('/api/v1/customer/notifications/:id', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        const success = await store.deleteCustomerNotification((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.params.id);
        if (!success)
            return void res.status(404).json({ statusCode: 404, message: 'Notification not found', correlationId: `corr-404-${Date.now()}` });
        res.json({ success: true });
    });
    // 4e. Customer vehicle transaction fleet listing and detail.
    app.get('/api/v1/customer/vehicles', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const nowISO = req.header('x-mock-now') || undefined;
        const query = { status: req.query.status, query: req.query.query, page: req.query.page ? Number(req.query.page) : undefined, limit: req.query.limit ? Number(req.query.limit) : undefined };
        res.json(await store.getCustomerVehicles(customerId, query, nowISO));
    });
    app.get('/api/v1/customer/vehicles/:id', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const idOrSlug = req.params.id;
        const vehicle = await store.getCustomerVehicleById((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), idOrSlug, req.header('x-mock-now') || undefined);
        if (!vehicle) {
            res.status(404).json({ statusCode: 404, message: `Customer vehicle '${idOrSlug}' not found or not owned by customer`, correlationId: `corr-404-${Date.now()}` });
            return;
        }
        res.json(vehicle);
    });
    // 4d. Customer invoices & proforma invoices listing (CUST-02, CUST-14, CUST-15, RULE-04, RULE-08, RULE-10)
    app.get('/api/v1/customer/invoices', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const nowISO = req.header('x-mock-now') || undefined;
        const query = {
            type: req.query.type,
            status: req.query.status,
            query: req.query.query,
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        const response = await store.getCustomerInvoices(customerId, query, nowISO);
        res.json(response);
    });
    // 4e. Customer invoice & proforma invoice detail (CUST-14, CUST-15, CUST-16, CUST-21, RULE-04, RULE-07)
    app.get('/api/v1/customer/invoices/:id', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const id = req.params.id;
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
    app.get('/api/v1/customer/invoices/:id/document', async (req, res) => {
        if (!req.user) {
            res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
            return;
        }
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        const customerId = (0, customer_scope_js_1.resolveCustomerScope)(req.user.sub);
        const id = req.params.id;
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
    app.get('/api/v1/customer/invoices/:id/document.pdf', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        const doc = await store.getCustomerInvoiceDocument((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.params.id, req.header('x-mock-now') || undefined);
        if (!doc)
            return void res.status(404).json({ statusCode: 404, message: 'Invoice document not found or not owned by customer', correlationId: `corr-404-${Date.now()}` });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.invoiceNumber.replace(/[^a-z0-9_-]/gi, '_')}.pdf"`);
        res.send(createInvoicePdf(doc.title, doc.contentHtml));
    });
    app.get('/api/v1/customer/payment-allocations', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        res.json(await store.listCustomerPaymentAllocations((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.query));
    });
    app.get('/api/v1/customer/payment-allocations/:paymentId', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        const allocation = await store.getCustomerPaymentAllocation((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.params.paymentId);
        if (!allocation)
            return void res.status(404).json({ statusCode: 404, message: 'TT payment not found or not owned by customer', correlationId: `corr-404-${Date.now()}` });
        res.json(allocation);
    });
    // 4g. Customer TT journal and proof metadata (D02-P06-T001).
    app.get('/api/v1/customer/payments', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        res.json(await store.listCustomerPayments((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub)));
    });
    app.post('/api/v1/customer/payments/:id/resubmit', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'create:payment'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: payment resubmission requires customer payment permission', correlationId: 'corr-403' });
        try {
            const payment = await store.resubmitCustomerPayment((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.params.id, req.header('x-mock-now') || undefined);
            res.json(payment);
        }
        catch (error) {
            const statusCode = error instanceof store_js_1.PaymentWorkflowError ? error.statusCode : 400;
            res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Unable to resubmit payment', correlationId: `corr-${statusCode}-${Date.now()}` });
        }
    });
    app.post('/api/v1/customer/payments', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'create:payment'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        try {
            const payment = await store.createCustomerPayment((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.body, req.header('x-mock-now') || undefined);
            res.status(201).json(payment);
        }
        catch (error) {
            res.status(400).json({ statusCode: 400, message: error instanceof Error ? error.message : 'Invalid payment submission', correlationId: `corr-400-${Date.now()}` });
        }
    });
    app.post('/api/v1/customer/card-payments', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'create:payment'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: payment permission required', correlationId: 'corr-403' });
        try {
            const payment = await store.createCustomerCardPayment((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), req.body, req.header('x-mock-now') || undefined);
            res.status(201).json(payment);
        }
        catch (error) {
            const statusCode = error instanceof store_js_1.PaymentWorkflowError ? error.statusCode : 400;
            res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Invalid card payment submission', correlationId: `corr-${statusCode}-${Date.now()}` });
        }
    });
    // 4h. Payment notification outbox. Finance records events; customers only read their own projection.
    app.get('/api/v1/customer/payment-notifications', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:customer'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
        const paymentId = typeof req.query.paymentId === 'string' ? req.query.paymentId : undefined;
        res.json(await store.listCustomerPaymentNotifications((0, customer_scope_js_1.resolveCustomerScope)(req.user.sub), paymentId));
    });
    app.post('/api/v1/finance/customer-payments/:id/notifications', async (req, res) => {
        if (!req.user)
            return void res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
        if (!(0, domain_1.hasPermission)(req.user.role, 'read:finance'))
            return void res.status(403).json({ statusCode: 403, message: 'Forbidden: finance role required', correlationId: 'corr-403' });
        try {
            const notification = await store.recordPaymentNotification(req.params.id, req.body, req.header('x-mock-now') || undefined);
            if (!notification)
                return void res.status(404).json({ statusCode: 404, message: 'Payment not found', correlationId: `corr-404-${Date.now()}` });
            res.status(201).json(notification);
        }
        catch (error) {
            const statusCode = error instanceof store_js_1.PaymentWorkflowError ? error.statusCode : 400;
            res.status(statusCode).json({ statusCode, message: error instanceof Error ? error.message : 'Invalid notification event', correlationId: `corr-${statusCode}-${Date.now()}` });
        }
    });
    // 5. Deterministic reset (Disabled in production mode for release safety)
    app.post('/api/v1/__reset', async (req, res) => {
        if (process.env.NODE_ENV === 'production') {
            res.status(403).json({
                statusCode: 403,
                message: 'Forbidden: Reset endpoint is disabled in production environment',
                correlationId: `corr-403-${Date.now()}`,
            });
            return;
        }
        // If token provided, enforce permission
        if (req.user && !(0, domain_1.hasPermission)(req.user.role, 'reset:data')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        try {
            await store.reset();
            res.json({ success: true, message: 'Data reset successfully' });
        }
        catch (error) {
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
    const openapiPath = (0, node_path_1.join)(process.cwd(), 'openapi', 'openapi.json');
    app.get('/openapi.json', (_req, res) => {
        if ((0, node_fs_1.existsSync)(openapiPath)) {
            const spec = JSON.parse((0, node_fs_1.readFileSync)(openapiPath, 'utf8'));
            res.json(spec);
        }
        else {
            res.status(404).json({ statusCode: 404, message: 'OpenAPI spec not found', correlationId: 'corr-404' });
        }
    });
    // 7. Interactive Swagger UI
    app.get('/swagger', (_req, res) => {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CarChief Mock API - Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    #swagger-ui .parameters-container input::placeholder,
    #swagger-ui .parameters-container textarea::placeholder {
      color: #6b7280;
      opacity: 1;
    }
    #swagger-ui .parameters-container input:focus::placeholder,
    #swagger-ui .parameters-container textarea:focus::placeholder {
      color: transparent;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    // x-placeholder is deliberately outside OpenAPI's example/default fields.
    // Swagger UI therefore has no value to put into the request state. This
    // observer only adds presentation metadata and never touches input.value.
    const buildPlaceholderMap = (spec) => {
      const map = new Map();
      Object.entries(spec.paths || {}).forEach(([path, pathItem]) => {
        const operation = pathItem.get;
        if (!operation) return;
        (operation.parameters || []).forEach((parameter) => {
          const source = parameter.schema || parameter;
          const placeholder = source['x-placeholder'] ?? parameter['x-placeholder'];
          if (placeholder !== undefined) {
            map.set('get ' + path + ' ' + parameter.name, String(placeholder));
          }
        });
      });
      return map;
    };

    const applySwaggerPlaceholders = (placeholderMap) => {
      document.querySelectorAll('#swagger-ui .opblock').forEach((operationBlock) => {
        const method = operationBlock.querySelector('.opblock-summary-method')?.textContent?.trim().toLowerCase();
        const path = operationBlock.querySelector('.opblock-summary-path')?.textContent?.trim();
        if (method !== 'get' || !path) return;
        operationBlock.querySelectorAll('.parameters-container tr').forEach((row) => {
          const name = row.querySelector('.parameter__name')?.textContent?.trim();
          const field = row.querySelector('input, textarea');
          if (!name || !field) return;
          const placeholder = placeholderMap.get(method + ' ' + path + ' ' + name);
          if (placeholder !== undefined) field.setAttribute('placeholder', placeholder);
        });
      });
    };

    window.onload = async () => {
      const spec = await fetch('/openapi.json').then((response) => response.json());
      const placeholderMap = buildPlaceholderMap(spec);
      SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
        onComplete: () => applySwaggerPlaceholders(placeholderMap),
      });

      const observer = new MutationObserver(() => applySwaggerPlaceholders(placeholderMap));
      observer.observe(document.getElementById('swagger-ui'), { childList: true, subtree: true });
    };
  </script>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    });
    app.use((err, _req, res, _next) => {
        console.error('Mock API route error caught:', err);
        if (!res.headersSent) {
            res.status(500).json({
                statusCode: 500,
                message: err?.message || 'Internal Server Error',
                correlationId: 'corr-500',
            });
        }
    });
    return app;
}
if (process.env.NODE_ENV !== 'test') {
    process.on('unhandledRejection', (reason) => {
        console.error('Mock API unhandledRejection caught:', reason);
    });
    const port = process.env.MOCK_API_PORT || 4000;
    const store = (0, store_js_1.createStore)();
    const app = createMockApiApp(store);
    store.ready().then(() => app.listen(port, () => {
        console.log(`CarChief Mock API listening on port ${port}`);
    })).catch((error) => { console.error('Mock API database initialization failed', error); process.exitCode = 1; });
}
//# sourceMappingURL=server.js.map