/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL for Mock API calls. Left empty by default so the browser issues
   * same-origin `/api/v1/*` requests that the dev/preview server proxies —
   * see `vite.config.ts`. Only set this to an absolute URL when the API is
   * genuinely reachable from the browser under that exact origin.
   */
  readonly VITE_API_BASE_URL?: string;
  /** Semantic theme id; anything unknown resolves to `carchief`. */
  readonly VITE_THEME_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
