FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/public-web build

FROM node:22-alpine AS runtime

WORKDIR /workspace
RUN corepack enable

COPY --from=build /workspace/apps/public-web/.next/standalone ./
COPY --from=build /workspace/apps/public-web/.next/static ./apps/public-web/.next/static
COPY --from=build /workspace/apps/public-web/public ./apps/public-web/public

EXPOSE 3000

CMD ["node", "apps/public-web/server.js"]