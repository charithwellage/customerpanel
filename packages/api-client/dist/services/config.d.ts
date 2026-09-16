import type { PublicConfig, BankAccount } from '@carchief/domain';
import type { HttpClient } from '../http.js';
/**
 * Public branding/config lookup. Used by `D01-P06-T003` to gate the
 * account-gated Live Auction entry on an approved `liveAuctionUrl`
 * (PUB-27, D01-ASM-002) — the entry is only ever rendered when this
 * service returns a configured destination.
 */
export declare class ConfigService {
    private httpClient?;
    constructor(httpClient?: HttpClient | undefined);
    getPublicConfig(): Promise<PublicConfig>;
    getBankAccounts(): Promise<BankAccount[]>;
}
//# sourceMappingURL=config.d.ts.map