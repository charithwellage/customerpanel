import express, { Request, Response, NextFunction, Express } from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseDemoJwtToken, JwtClaims, hasPermission } from '@carchief/domain';
import type { FreightEstimateRequest, EnquiryRequest } from '@carchief/domain';
import { createStore, type DemoStore, FreightRequestError, EnquiryRequestError } from './store.js';

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
      const claims = parseDemoJwtToken(token);
      if (claims) {
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

  // 3a. Vehicles summary (Public)
  app.get('/api/v1/vehicles', async (req: Request, res: Response) => {
    res.json(await store.getVehicles(req.query as Record<string, string>));
  });

  // 3b. Vehicle search with facets, pagination & sorting (Public)
  app.get('/api/v1/vehicles/search', async (req: Request, res: Response) => {
    res.json(await store.searchVehicles(req.query as Record<string, string>));
  });

  // 3c. Vehicle detail lookup by ID, chassis, or slug (Public)
  app.get('/api/v1/vehicles/:idOrSlug', async (req: Request, res: Response) => {
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
  app.post('/api/v1/enquiries', async (req: Request, res: Response) => {
    try {
      const enquiry = await store.createEnquiry((req.body ?? {}) as EnquiryRequest);
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

  // 4. Auth identity inspection endpoint
  app.get('/api/v1/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ statusCode: 401, message: 'Unauthenticated', correlationId: 'corr-401' });
      return;
    }
    res.json(req.user);
  });

  // 5. Deterministic reset
  app.post('/api/v1/__reset', async (req: AuthenticatedRequest, res: Response) => {
    // If token provided, enforce permission
    if (req.user && !hasPermission(req.user.role, 'reset:data')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }

    await store.reset();
    res.json({ success: true, message: 'Data reset successfully' });
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
