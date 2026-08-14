import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** Host port for both `vite dev` and `vite preview`; mirrors `.env.example`'s `PORT`. */
const CUSTOMER_APP_PORT = Number(process.env.PORT ?? 3001);

/**
 * Where the dev/preview server forwards same-origin `/api/v1/*` calls.
 *
 * This is read by the Node process that serves the bundle, **not** baked into
 * the browser bundle, which is why the container can point it at the
 * Compose-internal `http://mock-api:4000` while the browser only ever calls
 * the customer app's own origin. Baking `VITE_API_BASE_URL=http://mock-api:4000`
 * into the bundle instead would produce a URL the host browser cannot resolve.
 */
const API_PROXY_TARGET = process.env.CUSTOMER_API_PROXY_TARGET ?? 'http://127.0.0.1:4000';

/**
 * Serves `/healthz` from the dev and preview servers so the customer app
 * exposes the same readiness URL that `public-web` and `mock-api` already do,
 * which is what the Compose healthcheck and the fresh-runtime gate in
 * `tasks/TASK_EXECUTION_PROTOCOL.md` §3 verify before browsing.
 */
function healthzPlugin(): Plugin {
  const handler = (
    req: { url?: string },
    res: { setHeader: (k: string, v: string) => void; end: (body: string) => void },
    next: () => void,
  ): void => {
    if (req.url === '/healthz') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok', service: 'customer-app' }));
      return;
    }
    next();
  };

  return {
    name: 'carchief-customer-healthz',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

const apiProxy = {
  '/api/v1': {
    target: API_PROXY_TARGET,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react(), healthzPlugin()],
  server: {
    port: CUSTOMER_APP_PORT,
    // Fail loudly rather than silently moving to another port: runtime evidence
    // must name the port that was actually served.
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    port: CUSTOMER_APP_PORT,
    strictPort: true,
    // Bind every interface so the published container port reaches the server.
    host: true,
    proxy: apiProxy,
  },
});
