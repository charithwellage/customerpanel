# Customer Application container for the UI/container validation gate
# (docker-compose.frontend.yml). Mirrors the layer-caching and corepack handling
# of docker/frontend.Dockerfile, which serves public-web and mock-api.
FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Keep dependency installation in a stable Docker layer. Application source is
# copied only after this step so normal source edits do not redownload packages.
COPY apps/customer-app/package.json apps/customer-app/package.json
COPY apps/mock-api/package.json apps/mock-api/package.json
COPY apps/public-web/package.json apps/public-web/package.json
COPY apps/salesperson-app/package.json apps/salesperson-app/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/pwa/package.json packages/pwa/package.json
COPY packages/testing/package.json packages/testing/package.json
COPY packages/theme/package.json packages/theme/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/validation/package.json packages/validation/package.json
COPY packages/vehicle-detail/package.json packages/vehicle-detail/package.json
COPY packages/vehicle-search/package.json packages/vehicle-search/package.json
RUN pnpm install --frozen-lockfile
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi
# The dependency closure (`...`) is required: unlike public-web, Vite resolves
# each @carchief/* workspace package through its published `main`, so every
# dependency must have emitted dist/ before the app bundle is built.
RUN pnpm --filter @carchief/customer-app... build

EXPOSE 3001
# `vite preview` serves the built bundle. It reads CUSTOMER_API_PROXY_TARGET at
# start time and proxies same-origin /api/v1 calls to the Mock API, so no
# container-internal hostname is ever baked into the browser bundle.
CMD ["pnpm", "--filter", "@carchief/customer-app", "preview"]
