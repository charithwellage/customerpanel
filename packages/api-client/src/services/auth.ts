import type {
  RegisterCustomerRequest,
  CustomerAccount,
  LoginRequest,
  LoginResponse,
  ChangePasswordRequest,
  SuccessResponse,
  PasswordResetRequest,
  PasswordResetAcceptedResponse,
  ConfirmPasswordResetRequest,
} from '../generated/schema.js';
import type { HttpClient } from '../http.js';

/**
 * Real account-lifecycle calls behind Phase 2.12's registration/sign-in
 * contract (CUST-26..29, `D02-P12-T001`'s Mock API routes). The Mock API is
 * the only authority for credentials and sessions — no method here derives
 * authorization from browser state, and no request/response type carries a
 * password, hash or salt (`packages/api-client/src/generated/schema.d.ts`
 * enforces the same at the type level).
 *
 * Base-URL convention: every path below is a full `/api/v1/...` path,
 * matching `SessionService`/`VehicleService`/`ConfigService` — the
 * public-web convention (`FRONT_END_ARCHITECTURE.md` §5, this phase's
 * CONTEXT.md §5). Registration is submitted from public-web's `/register`
 * page; the Customer application's real sign-in screen (`D02-P12-T005`)
 * must configure its own `HttpClient` with an origin-only `baseUrl` (no
 * `/api/v1` suffix) for this service specifically, the same way public-web's
 * `useSession` hook does — not the `${origin}/api/v1` base its authenticated
 * `/customer/**` services use.
 */
export class AuthService {
  constructor(private httpClient?: HttpClient) {}

  private requireClient(): HttpClient {
    if (!this.httpClient) throw new Error('AuthService requires an HttpClient');
    return this.httpClient;
  }

  public register(request: RegisterCustomerRequest): Promise<CustomerAccount> {
    return this.requireClient().request<CustomerAccount>('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  public login(request: LoginRequest): Promise<LoginResponse> {
    return this.requireClient().request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  public changePassword(request: ChangePasswordRequest): Promise<SuccessResponse> {
    return this.requireClient().request<SuccessResponse>('/api/v1/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Always resolves with the same neutral accepted response whether or not
   * the email exists (D02-ASM-007) — the caller must never infer account
   * existence from this call.
   */
  public requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetAcceptedResponse> {
    return this.requireClient().request<PasswordResetAcceptedResponse>('/api/v1/auth/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  public confirmPasswordReset(request: ConfirmPasswordResetRequest): Promise<SuccessResponse> {
    return this.requireClient().request<SuccessResponse>('/api/v1/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }
}
