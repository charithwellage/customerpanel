/**
 * The Customer Application is served on its own port (`.env.example` PORT=3001)
 * by `vite preview`, separate from public-web's 3000 that `PLAYWRIGHT_BASE_URL`
 * points at. These specs therefore navigate to an absolute URL instead of the
 * project-level `baseURL`, so one suite run can cover both applications.
 */
export const CUSTOMER_APP_BASE_URL = process.env.CUSTOMER_APP_BASE_URL ?? 'http://127.0.0.1:3001';
