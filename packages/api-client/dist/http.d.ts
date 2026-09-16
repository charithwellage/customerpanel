export interface HttpClientConfig {
    baseUrl: string;
    timeoutMs?: number;
    getAuthToken?: () => string | null | undefined;
    getCorrelationId?: () => string;
    onUnauthorized?: () => void;
    /** Optional locale resolver used for localized public and customer content. */
    getLanguage?: () => string | null | undefined;
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
    private onUnauthorized?;
    private getLanguage?;
    constructor(config: HttpClientConfig);
    getBaseUrl(): string;
    private generateCorrelationId;
    private resolveLanguage;
    request<T>(path: string, options?: RequestInit): Promise<T>;
    /** Fetches an authorized binary document without attempting JSON parsing. */
    requestBlob(path: string, options?: RequestInit): Promise<Blob>;
}
//# sourceMappingURL=http.d.ts.map