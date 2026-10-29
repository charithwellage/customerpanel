export class NormalizedApiError extends Error {
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
export class HttpClient {
    baseUrl;
    timeoutMs;
    getAuthToken;
    getCorrelationId;
    onUnauthorized;
    getLanguage;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/$/, '');
        this.timeoutMs = config.timeoutMs || 10000;
        this.getAuthToken = config.getAuthToken;
        this.getCorrelationId = config.getCorrelationId;
        this.onUnauthorized = config.onUnauthorized;
        this.getLanguage = config.getLanguage;
    }
    getBaseUrl() {
        return this.baseUrl;
    }
    generateCorrelationId() {
        return this.getCorrelationId ? this.getCorrelationId() : `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    }
    resolveLanguage() {
        const configured = this.getLanguage?.();
        if (configured)
            return configured;
        if (typeof document !== 'undefined')
            return document.documentElement.lang || 'en';
        return 'en';
    }
    async request(path, options = {}) {
        const correlationId = this.generateCorrelationId();
        const headers = new Headers(options.headers || {});
        headers.set('X-Correlation-ID', correlationId);
        headers.set('Accept', 'application/json');
        headers.set('Accept-Language', this.resolveLanguage());
        const token = this.getAuthToken ? this.getAuthToken() : null;
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        const cleanBase = this.baseUrl.replace(/\/$/, '');
        let finalPath = path.startsWith('/') ? path : `/${path}`;
        if (cleanBase.endsWith('/api/v1') && finalPath.startsWith('/api/v1/')) {
            finalPath = finalPath.substring('/api/v1'.length);
        }
        const url = `${cleanBase}${finalPath}`;
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
                if (response.status === 401)
                    this.onUnauthorized?.();
                throw new NormalizedApiError(response.status, errorMessage, correlationId, parsedError);
            }
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return (await response.json());
            }
            // If the server responded with 200 OK but returned an HTML document (e.g. SPA fallback on static hosting / Netlify),
            // throw NormalizedApiError 404 so callers can trigger offline/preview fallback data cleanly.
            if (contentType && contentType.includes('text/html')) {
                throw new NormalizedApiError(404, 'Endpoint returned HTML document instead of JSON (API unavailable)', correlationId);
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
    /** Fetches an authorized binary document without attempting JSON parsing. */
    async requestBlob(path, options = {}) {
        const correlationId = this.generateCorrelationId();
        const headers = new Headers(options.headers || {});
        headers.set('X-Correlation-ID', correlationId);
        headers.set('Accept', 'application/pdf');
        headers.set('Accept-Language', this.resolveLanguage());
        const token = this.getAuthToken ? this.getAuthToken() : null;
        if (token)
            headers.set('Authorization', `Bearer ${token}`);
        const cleanBase = this.baseUrl.replace(/\/$/, '');
        let finalPath = path.startsWith('/') ? path : `/${path}`;
        if (cleanBase.endsWith('/api/v1') && finalPath.startsWith('/api/v1/'))
            finalPath = finalPath.substring('/api/v1'.length);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${cleanBase}${finalPath}`, { ...options, headers, signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) {
                if (response.status === 401)
                    this.onUnauthorized?.();
                throw new NormalizedApiError(response.status, `Unable to download document (${response.status})`, correlationId);
            }
            return await response.blob();
        }
        catch (err) {
            clearTimeout(timeoutId);
            if (err instanceof NormalizedApiError)
                throw err;
            throw new NormalizedApiError(500, err instanceof Error ? err.message : 'Network error occurred', correlationId, err);
        }
    }
}
//# sourceMappingURL=http.js.map