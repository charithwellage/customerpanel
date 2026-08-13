"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
/**
 * Public branding/config lookup. Used by `D01-P06-T003` to gate the
 * account-gated Live Auction entry on an approved `liveAuctionUrl`
 * (PUB-27, D01-ASM-002) — the entry is only ever rendered when this
 * service returns a configured destination.
 */
class ConfigService {
    httpClient;
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async getPublicConfig() {
        if (!this.httpClient) {
            throw new Error('ConfigService.getPublicConfig requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/config/public');
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=config.js.map