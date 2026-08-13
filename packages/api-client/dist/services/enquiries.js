"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryService = void 0;
/**
 * Quotation enquiry submission (PUB-13, PUB-15, D01-P05-T004) plus the
 * staff-facing lead read-by-ID/list proof operations (PUB-16, D01-P06-T001).
 * Delivered in full independent of `DEC-PUB-FREIGHT-MODEL`/
 * `DEC-PUB-CITY-DELIVERY` (D01-ASM-001) — an enquiry never carries a
 * computed monetary total. `getLeadById`/`listLeads` require an
 * authenticated staff identity with the `read:leads` permission; the mock
 * enforces this server-side, not this client (`HttpClient`'s
 * `getAuthToken` hook supplies the bearer token when configured).
 */
class EnquiryService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async submit(request) {
        if (!this.httpClient) {
            throw new Error('EnquiryService.submit requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/enquiries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
    /**
     * Staff-facing lead read-by-ID (PUB-16, D01-P06-T001) — proves a
     * submitted enquiry is retrievable through the salesperson-facing
     * service boundary. Returns `null` for an unknown id (404), matching the
     * `VehicleService.getVehicleDetail` convention.
     */
    async getLeadById(id) {
        if (!this.httpClient) {
            throw new Error('EnquiryService.getLeadById requires an HttpClient');
        }
        try {
            return await this.httpClient.request(`/api/v1/enquiries/${encodeURIComponent(id)}`);
        }
        catch (err) {
            if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 404) {
                return null;
            }
            throw err;
        }
    }
    /** Staff-facing lead list proof operation (PUB-16, D01-P06-T001). */
    async listLeads() {
        if (!this.httpClient) {
            throw new Error('EnquiryService.listLeads requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/enquiries');
    }
}
exports.EnquiryService = EnquiryService;
//# sourceMappingURL=enquiries.js.map