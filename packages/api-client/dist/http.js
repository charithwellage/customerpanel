"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = exports.NormalizedApiError = void 0;
class NormalizedApiError extends Error {
    statusCode;
    correlationId;
    rawError;
    constructor(statusCode, message, correlationId, rawError) {
        super(message);
        this.name = 'NormalizedApiError';
        this.statusCode = statusCode;
        this.correlationId = correlationId;
        this.rawError = rawError;
    }
}
exports.NormalizedApiError = NormalizedApiError;
class HttpClient {
    baseUrl;
    timeoutMs;
    getAuthToken;
    getCorrelationId;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.timeoutMs = config.timeoutMs || 10000;
        this.getAuthToken = config.getAuthToken;
        this.getCorrelationId = config.getCorrelationId;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
    generateCorrelationId() {
        return this.getCorrelationId ? this.getCorrelationId() : `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    async request(path, options = {}) {
        const correlationId = this.generateCorrelationId();
        const headers = new Headers(options.headers || {});
        headers.set('X-Correlation-ID', correlationId);
        headers.set('Accept', 'application/json');
        const token = this.getAuthToken ? this.getAuthToken() : null;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                let parsedError = null;
                try {
                    parsedError = await response.json();
                    if (parsedError && typeof parsedError === 'object' && 'message' in parsedError) {
                        errorMessage = String(parsedError.message);
                    }
                }
                catch {
                    // ignore non-json error payloads
                }
                throw new NormalizedApiError(response.status, errorMessage, correlationId, parsedError);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return (await response.json());
            }
            return {};
        }
        catch (err) {
            clearTimeout(timeoutId);
            if (err instanceof NormalizedApiError) {
                throw err;
            }
            if (err && typeof err === 'object' && 'name' in err && err.name === 'AbortError') {
                throw new NormalizedApiError(504, 'Request timed out', correlationId, err);
            }
            throw new NormalizedApiError(500, err instanceof Error ? err.message : 'Network error occurred', correlationId, err);
        }
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=http.js.map