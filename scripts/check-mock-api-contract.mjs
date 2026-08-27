import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const serverSource = readFileSync(resolve(root, 'apps/mock-api/src/server.ts'), 'utf8');
const openApi = JSON.parse(readFileSync(resolve(root, 'openapi/openapi.json'), 'utf8'));

const undocumentedOperationalRoutes = new Set([
  'GET /healthz',
  'GET /openapi.json',
  'GET /swagger',
]);

const expressRoutes = [...serverSource.matchAll(/app\.(get|post|put|patch|delete)\(\s*'([^']+)'/g)]
  .map(([, method, route]) => `${method.toUpperCase()} ${route}`);

const documentedOperations = new Set(
  Object.entries(openApi.paths).flatMap(([path, operations]) =>
    Object.keys(operations)
      .filter((method) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
      .map((method) => `${method.toUpperCase()} ${path}`),
  ),
);

const normalizeRoute = (route) => route.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
const missing = expressRoutes
  .filter((operation) => !undocumentedOperationalRoutes.has(operation))
  .filter((operation) => {
    const [method, route] = operation.split(' ');
    return !documentedOperations.has(`${method} ${normalizeRoute(route)}`);
  });

if (missing.length) {
  throw new Error(`Mock API routes missing from OpenAPI:\n${missing.join('\n')}`);
}

console.log(`Mock API contract audit passed: ${expressRoutes.length} registered routes are documented or explicitly operational.`);
