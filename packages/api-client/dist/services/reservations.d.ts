import type { ReservationRequest, ReservationResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';
/**
 * Transactional reservation eligibility and hold (PUB-23, RULE-05, RULE-08,
 * RULE-10, D01-P06-T004). `create` requires an authenticated demo customer —
 * the mock enforces this server-side, not this client (`HttpClient`'s
 * `getAuthToken` hook supplies the bearer token when configured); an
 * unauthorized/ineligible attempt surfaces as a `NormalizedApiError` the
 * caller can distinguish by `statusCode` (401/403/404/409) and the mock's
 * `reason` field on its error payload (`unauthenticated`, `forbidden`,
 * `vehicle_not_found`, `vehicle_unavailable`, `conflict`, `duplicate`,
 * `limit_exceeded`) — this service never re-interprets or hides that
 * distinction. `getById` mirrors `EnquiryService.getLeadById`'s
 * null-on-404 convention.
 */
export declare class ReservationService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    create(request: ReservationRequest): Promise<ReservationResponse>;
    getById(id: string): Promise<ReservationResponse | null>;
}
//# sourceMappingURL=reservations.d.ts.map