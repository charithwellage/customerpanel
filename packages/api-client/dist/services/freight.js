"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreightService = void 0;
/**
 * Destination/port/rate lookup only (D01-ASM-001). `estimate()` always
 * returns the deterministic `estimate_unavailable_pending_rate` outcome
 * while `DEC-PUB-FREIGHT-MODEL` is OPEN — no formula and no computed total
 * are implemented here.
 */
class FreightService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async getDestinations() {
        if (!this.httpClient) {
            return [];
        }
        return this.httpClient.request('/api/v1/freight/destinations');
    }
    async getPorts() {
        if (!this.httpClient) {
            return [];
        }
        return this.httpClient.request('/api/v1/freight/ports');
    }
    async estimate(request) {
        if (!this.httpClient) {
            throw new Error('FreightService.estimate requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/freight/estimate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
}
exports.FreightService = FreightService;
//# sourceMappingURL=freight.js.map