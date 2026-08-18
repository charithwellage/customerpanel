export interface HttpClientConfig {
  baseUrl: string;
  timeoutMs?: number;
  getAuthToken?: () => string | null | undefined;
  getCorrelationId?: () => string;
}

export class NormalizedApiError extends Error {
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly rawError?: unknown;

  constructor(statusCode: number, message: string, correlationId: string, rawError?: unknown) {
    super(message);
    this.name = 'NormalizedApiError';
    this.statusCode = statusCode;
    this.correlationId = correlationId;
    this.rawError = rawError;
  }
}

export class HttpClient {
  private baseUrl: string;
  private timeoutMs: number;
  private getAuthToken?: () => string | null | undefined;
  private getCorrelationId?: () => string;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.timeoutMs = config.timeoutMs || 10000;
    this.getAuthToken = config.getAuthToken;
    this.getCorrelationId = config.getCorrelationId;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private generateCorrelationId(): string {
    return this.getCorrelationId ? this.getCorrelationId() : `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  }

  public async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const correlationId = this.generateCorrelationId();
    const headers = new Headers(options.headers || {});
    headers.set('X-Correlation-ID', correlationId);
    headers.set('Accept', 'application/json');

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
        let parsedError: unknown = null;
        try {
          parsedError = await response.json();
          if (parsedError && typeof parsedError === 'object' && 'message' in parsedError) {
            errorMessage = String((parsedError as { message: unknown }).message);
          }
        } catch {
          // ignore non-json error payloads
        }

        throw new NormalizedApiError(response.status, errorMessage, correlationId, parsedError);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return (await response.json()) as T;
      }

      return {} as T;
    } catch (err: unknown) {
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
