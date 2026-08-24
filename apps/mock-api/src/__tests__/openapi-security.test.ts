import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const openapi = JSON.parse(
  readFileSync(new URL('../../../../openapi/openapi.json', import.meta.url), 'utf8'),
) as {
  tags: Array<{ name: string }>;
  paths: Record<string, Record<string, { tags?: string[]; security?: Array<Record<string, string[]>> }>>;
  components: { securitySchemes: Record<string, { type: string; scheme: string; bearerFormat?: string }> };
};

const methods = new Set(['get', 'post', 'put', 'patch', 'delete']);

describe('OpenAPI public/customer security classification', () => {
  it('declares the three Swagger groups and one canonical bearer scheme', () => {
    expect(openapi.tags.map((tag) => tag.name)).toEqual([
      'Public APIs',
      'Customer APIs',
      'Internal/Development APIs',
    ]);
    expect(openapi.components.securitySchemes).toEqual({
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Customer or staff JWT returned by the authentication endpoint.',
      },
    });
  });

  it('classifies every operation exactly once and uses the canonical security name', () => {
    for (const operations of Object.values(openapi.paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        if (!methods.has(method)) continue;
        expect(operation.tags).toHaveLength(1);
        expect(['Public APIs', 'Customer APIs', 'Internal/Development APIs']).toContain(operation.tags?.[0]);
        expect(operation.security).toBeDefined();
        expect(JSON.stringify(operation.security)).not.toContain('bearerAuth');

        if (operation.tags?.[0] === 'Public APIs') {
          expect(operation.security).toEqual([]);
        }
        if (operation.tags?.[0] === 'Customer APIs') {
          expect(operation.security).toEqual([{ BearerAuth: [] }]);
        }
      }
    }
  });

  it('keeps registered customer operations and removed operations accurate', () => {
    expect(openapi.paths['/api/v1/customer/statement']?.get?.tags).toEqual(['Customer APIs']);
    expect(openapi.paths['/api/v1/customer/notifications/{id}']?.delete?.tags).toEqual(['Customer APIs']);
    expect(openapi.paths['/api/v1/customer/payments/{id}']).toBeUndefined();
    expect(openapi.paths['/api/v1/vehicles/{idOrSlug}/inquiry-count']).toBeUndefined();
  });
});
