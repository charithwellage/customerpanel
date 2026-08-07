FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/public-web build && pnpm --filter @carchief/mock-api build

FROM node:22-alpine AS runtime
WORKDIR /workspace
RUN corepack enable
COPY --from=build /workspace/package.json /workspace/pnpm-lock.yaml /workspace/pnpm-workspace.yaml /workspace/.npmrc ./
COPY --from=build /workspace/apps ./apps
COPY --from=build /workspace/packages ./packages
COPY --from=build /workspace/openapi ./openapi
COPY --from=build /workspace/node_modules ./node_modules
CMD ["pnpm", "--filter", "@carchief/public-web", "start"]
