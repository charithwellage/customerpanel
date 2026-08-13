export interface HttpClientConfig {
    baseUrl: string;
    timeoutMs?: number;
    getAuthToken?: () => string | null | undefined;
    getCorrelationId?: () => string;
}
export declare class NormalizedApiError extends Error {
    readonly statusCode: number;
    readonly correlationId: string;
    readonly rawError?: unknown;
    constructor(statusCode: number, message: string, correlationId: string, rawError?: unknown);
}
export declare class HttpClient {
    private baseUrl;
    private timeoutMs;
    private getAuthToken?;
    private getCorrelationId?;
    constructor(config: HttpClientConfig);
    getBaseUrl(): string;
    private generateCorrelationId;
    request<T>(path: string, options?: RequestInit): Promise<T>;
}
//# sourceMappingURL=http.d.ts.map