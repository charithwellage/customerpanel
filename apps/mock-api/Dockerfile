FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/mock-api build
EXPOSE 4000
CMD ["node", "apps/mock-api/dist/server.js"]
