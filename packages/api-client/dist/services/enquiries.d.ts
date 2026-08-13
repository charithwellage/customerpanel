import type { EnquiryRequest, EnquiryResponse, LeadRecord, LeadListResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';
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
export declare class EnquiryService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    submit(request: EnquiryRequest): Promise<EnquiryResponse>;
    /**
     * Staff-facing lead read-by-ID (PUB-16, D01-P06-T001) — proves a
     * submitted enquiry is retrievable through the salesperson-facing
     * service boundary. Returns `null` for an unknown id (404), matching the
     * `VehicleService.getVehicleDetail` convention.
     */
    getLeadById(id: string): Promise<LeadRecord | null>;
    /** Staff-facing lead list proof operation (PUB-16, D01-P06-T001). */
    listLeads(): Promise<LeadListResponse>;
}
//# sourceMappingURL=enquiries.d.ts.map