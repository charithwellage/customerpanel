/**
 * Public branding/config lookup. Used by `D01-P06-T003` to gate the
 * account-gated Live Auction entry on an approved `liveAuctionUrl`
 * (PUB-27, D01-ASM-002) — the entry is only ever rendered when this
 * service returns a configured destination.
 */
export class ConfigService {
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
    async getBankAccounts() {
        if (!this.httpClient) {
            throw new Error('ConfigService.getBankAccounts requires an HttpClient');
        }
        return this.httpClient.request('/api/v1/bank-accounts');
    }
}
//# sourceMappingURL=config.js.map