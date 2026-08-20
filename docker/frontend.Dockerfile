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
# Source changes invalidate only the build layers below the cached install.
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi
RUN pnpm --filter @carchief/public-web... build && pnpm --filter @carchief/mock-api... build

FROM node:22-alpine AS runtime
WORKDIR /workspace
RUN corepack enable
COPY --from=build /workspace/package.json /workspace/pnpm-lock.yaml /workspace/pnpm-workspace.yaml /workspace/.npmrc ./
COPY --from=build /workspace/apps ./apps
COPY --from=build /workspace/packages ./packages
COPY --from=build /workspace/openapi ./openapi
COPY --from=build /workspace/node_modules ./node_modules
# Next standalone output must be copied at the workspace root so its server can
# resolve static assets and the public directory using its expected paths.
COPY --from=build /workspace/apps/public-web/.next/standalone ./
COPY --from=build /workspace/apps/public-web/.next/static ./apps/public-web/.next/static
COPY --from=build /workspace/apps/public-web/public ./apps/public-web/public
CMD ["node", "apps/public-web/server.js"]
