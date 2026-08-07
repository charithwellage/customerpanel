export interface HttpClientConfig {
  baseUrl: string;
  token?: string;
}

export class HttpClient {
  private baseUrl: string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }
}
