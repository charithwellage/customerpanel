import express, { Request, Response, NextFunction, Express } from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseDemoJwtToken, JwtClaims, hasPermission } from '@carchief/domain';

export interface AuthenticatedRequest extends Request {
  user?: JwtClaims;
}

export function createMockApiApp(): Express {
  const app: Express = express();
  app.use(express.json());

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

  // Initial seed state
  const initialConfig = {
    siteName: 'CarChief',
    currency: 'USD',
    contactPhone: '+256 700 000 000',
  };

  const initialVehicles = [
    {
      id: 'veh-1',
      chassisNumber: 'NZE141-1234567',
      make: 'Toyota',
      model: 'Corolla Axio',
      year: 2021,
      priceUsd: 8500,
      status: 'Available',
    },
    {
      id: 'veh-2',
      chassisNumber: 'KDH201-7654321',
      make: 'Toyota',
      model: 'HiAce Van',
      year: 2020,
      priceUsd: 14200,
      status: 'ReservedWithPI',
    },
  ];

  let currentConfig = { ...initialConfig };
  let currentVehicles = [...initialVehicles];

  // 1. Health check (Public)
  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Public config (Public)
  app.get('/api/v1/config/public', (_req: Request, res: Response) => {
    res.json(currentConfig);
  });

  // 3. Vehicles summary (Public)
  app.get('/api/v1/vehicles', (_req: Request, res: Response) => {
    res.json(currentVehicles);
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
  app.post('/api/v1/__reset', (req: AuthenticatedRequest, res: Response) => {
    // If token provided, enforce permission
    if (req.user && !hasPermission(req.user.role, 'reset:data')) {
      res.status(403).json({ statusCode: 403, message: 'Forbidden: insufficient role permissions', correlationId: 'corr-403' });
      return;
    }

    currentConfig = { ...initialConfig };
    currentVehicles = [...initialVehicles];
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
  const app = createMockApiApp();
  app.listen(port, () => {
    console.log(`CarChief Mock API listening on port ${port}`);
  });
}
