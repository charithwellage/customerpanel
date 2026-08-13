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
            const token = authHeader.substring(7);
            const claims = (0, domain_1.parseDemoJwtToken)(token);
            if (claims) {
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
    // 3a. Vehicles summary (Public)
    app.get('/api/v1/vehicles', async (req, res) => {
        res.json(await store.getVehicles(req.query));
    });
    // 3b. Vehicle search with facets, pagination & sorting (Public)
    app.get('/api/v1/vehicles/search', async (req, res) => {
        res.json(await store.searchVehicles(req.query));
    });
    // 3c. Vehicle detail lookup by ID, chassis, or slug (Public)
    app.get('/api/v1/vehicles/:idOrSlug', async (req, res) => {
        const rawParam = req.params.idOrSlug;
        const idOrSlug = Array.isArray(rawParam) ? rawParam[0] : rawParam;
        const detail = await store.getVehicleDetail(idOrSlug);
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
    // 3g. Quotation enquiry submission (Public) — PUB-13, PUB-15, D01-P05-T004.
    // Independent of DEC-PUB-FREIGHT-MODEL/DEC-PUB-CITY-DELIVERY (D01-ASM-001):
    // a visitor can submit an enquiry about a vehicle, a shipping destination,
    // or neither, with no computed total ever attached to it (RULE-09).
    app.post('/api/v1/enquiries', async (req, res) => {
        try {
            const enquiry = await store.createEnquiry((req.body ?? {}));
            res.status(enquiry.duplicate ? 200 : 201).json(enquiry);
        }
        catch (error) {
            if (error instanceof store_js_1.EnquiryRequestError) {
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
    // 3i-r. Transactional reservation eligibility and hold (PUB-23, RULE-05,
    // RULE-08, RULE-10, D01-P06-T004). Authorization, eligibility (vehicle
    // availability, conflict/duplicate, the anti-abuse limit) and the atomic
    // 48-hour hold all run here at the service/BFF boundary, never only in a
    // future browser UI (FRONT_END_ARCHITECTURE.md §16). Only an authenticated
    // identity carrying `create:reservation` (a demo `CustomerBuyer`) may
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
            const reservation = await store.createReservation(req.user.sub, req.user.email, (req.body ?? {}));
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
            throw error;
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
        const isOwner = reservation.customerId === req.user.sub;
        if (!isOwner && !(0, domain_1.hasPermission)(req.user.role, 'read:leads')) {
            res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
            return;
        }
        res.json(reservation);
    });
    // 3i. Stand-in demo customer session (PUB-22, DEC-PUB-AUTH-BOUNDARY,
    // D01-P06-T003). Always mints a CustomerBuyer identity — a public visitor
    // can never self-elevate to a staff role through this endpoint. Never a
    // production identity; the response's `nonProduction: true` lets the
    // browser render an honest demo-mode label rather than inferring one
    // (RULE-10).
    app.post('/api/v1/auth/demo-session', (_req, res) => {
        const token = (0, domain_1.createDemoJwtToken)('CustomerBuyer');
        const claims = (0, domain_1.parseDemoJwtToken)(token);
        if (!claims) {
            res.status(500).json({ statusCode: 500, message: 'Failed to mint demo session', correlationId: `corr-500-${Date.now()}` });
            return;
        }
        res.status(201).json({ token, claims, nonProduction: true });
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
    // 5. Deterministic reset (Disabled in production mode for release safety)
    app.post('/api/v1/__reset', async (req, res) => {
        if (process.env.NODE_ENV === 'production' && process.env.ENABLE_MOCK_RESET !== 'true') {
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
        await store.reset();
        res.json({ success: true, message: 'Data reset successfully' });
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
    const store = (0, store_js_1.createStore)();
    const app = createMockApiApp(store);
    store.ready().then(() => app.listen(port, () => {
        console.log(`CarChief Mock API listening on port ${port}`);
    })).catch((error) => { console.error('Mock API database initialization failed', error); process.exitCode = 1; });
}
//# sourceMappingURL=server.js.map