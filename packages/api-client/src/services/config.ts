import type { PublicConfig } from '@carchief/domain';
import type { HttpClient } from '../http.js';

/**
 * Public branding/config lookup. Used by `D01-P06-T003` to gate the
 * account-gated Live Auction entry on an approved `liveAuctionUrl`
 * (PUB-27, D01-ASM-002) — the entry is only ever rendered when this
 * service returns a configured destination.
 */
export class ConfigService {
  constructor(private httpClient?: HttpClient) {}

  public async getPublicConfig(): Promise<PublicConfig> {
    if (!this.httpClient) {
      throw new Error('ConfigService.getPublicConfig requires an HttpClient');
    }
    return this.httpClient.request<PublicConfig>('/api/v1/config/public');
  }
}
