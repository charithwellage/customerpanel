import type { FreightDestination, FreightPort, FreightEstimateRequest, FreightEstimateResponse } from '@carchief/domain';
import type { HttpClient } from '../http.js';
/**
 * Destination/port/rate lookup only (D01-ASM-001). `estimate()` always
 * returns the deterministic `estimate_unavailable_pending_rate` outcome
 * while `DEC-PUB-FREIGHT-MODEL` is OPEN — no formula and no computed total
 * are implemented here.
 */
export declare class FreightService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    getDestinations(): Promise<FreightDestination[]>;
    getPorts(): Promise<FreightPort[]>;
    estimate(request: FreightEstimateRequest): Promise<FreightEstimateResponse>;
}
//# sourceMappingURL=freight.d.ts.map