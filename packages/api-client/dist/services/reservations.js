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
export class ReservationService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async create(request) {
        if (!this.httpClient) {
            throw new Error('ReservationService.create requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
    async getById(id) {
        if (!this.httpClient) {
            throw new Error('ReservationService.getById requires an HttpClient');
        }
        try {
            return await this.httpClient.request(`/api/v1/reservations/${encodeURIComponent(id)}`);
        }
        catch (err) {
            if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }
}
//# sourceMappingURL=reservations.js.map