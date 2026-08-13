import type { DemoSessionResponse, JwtClaims } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Stand-in demo session service (DEC-PUB-AUTH-BOUNDARY, PUB-22,
 * D01-P06-T003). `startDemoSession` never accepts a role argument — the
 * public entry point can only ever mint the `CustomerBuyer` stand-in
 * identity, server-authoritatively (RULE-10, CODE_REVIEW_RULES #6).
 * `getCurrentSession` mirrors `VehicleService.getVehicleDetail`'s
 * null-on-absence convention: `null` for an unauthenticated/invalid bearer
 * token (401), any other failure still throws.
 */
export class SessionService {
  constructor(private httpClient?: HttpClient) {}

  public async startDemoSession(): Promise<DemoSessionResponse> {
    if (!this.httpClient) {
      throw new Error('SessionService.startDemoSession requires an HttpClient');
    }
    return this.httpClient.request<DemoSessionResponse>('/api/v1/auth/demo-session', { method: 'POST' });
  }

  public async getCurrentSession(): Promise<JwtClaims | null> {
    if (!this.httpClient) {
      throw new Error('SessionService.getCurrentSession requires an HttpClient');
    }
    try {
      return await this.httpClient.request<JwtClaims>('/api/v1/auth/me');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 401) {
        return null;
      }
      throw err;
    }
  }
}
