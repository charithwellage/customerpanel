import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { issueSessionToken } from '@carchief/domain';
import { createMockApiApp } from '../server.js';

describe('POST /api/v1/vehicles/ai-search', () => {
  const app = createMockApiApp();

  it('returns the structured not-implemented response for public inventory', async () => {
    const response = await request(app).post('/api/v1/vehicles/ai-search').send({ query: 'hybrid SUV', scope: 'publicInventory' });
    expect(response.status).toBe(501);
    expect(response.body).toMatchObject({ statusCode: 501, code: 'AI_SEARCH_NOT_IMPLEMENTED' });
  });

  it('requires authentication before rejecting a customer scope as unimplemented', async () => {
    const anonymous = await request(app).post('/api/v1/vehicles/ai-search').send({ query: 'my Toyota', scope: 'customerFleet' });
    expect(anonymous.status).toBe(401);

    const token = issueSessionToken('CustomerBuyer', 'cust-1', 'customer@carchief.com');
    const authenticated = await request(app)
      .post('/api/v1/vehicles/ai-search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'my Toyota', scope: 'customerFleet' });
    expect(authenticated.status).toBe(501);
    expect(authenticated.body.code).toBe('AI_SEARCH_NOT_IMPLEMENTED');
  });
});
