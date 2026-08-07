import express, { Request, Response, Express } from 'express';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function createMockApiApp(): Express {
  const app: Express = express();
  app.use(express.json());

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

  // 1. Health check
  app.get('/healthz', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 2. Public config
  app.get('/api/v1/config/public', (_req: Request, res: Response) => {
    res.json(currentConfig);
  });

  // 3. Vehicles summary
  app.get('/api/v1/vehicles', (_req: Request, res: Response) => {
    res.json(currentVehicles);
  });

  // 4. Deterministic reset
  app.post('/api/v1/__reset', (_req: Request, res: Response) => {
    currentConfig = { ...initialConfig };
    currentVehicles = [...initialVehicles];
    res.json({ success: true, message: 'Data reset successfully' });
  });

  // 5. OpenAPI JSON spec
  const openapiPath = join(process.cwd(), 'openapi', 'openapi.json');
  app.get('/openapi.json', (_req: Request, res: Response) => {
    if (existsSync(openapiPath)) {
      const spec = JSON.parse(readFileSync(openapiPath, 'utf8'));
      res.json(spec);
    } else {
      res.status(404).json({ statusCode: 404, message: 'OpenAPI spec not found', correlationId: 'corr-404' });
    }
  });

  // 6. Interactive Swagger UI
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
