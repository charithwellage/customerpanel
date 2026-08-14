FROM node:22-alpine AS build
WORKDIR /workspace
RUN npm install -g pnpm@10.2.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY node_modules ./node_modules
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi
RUN pnpm --filter @carchief/public-web build && pnpm --filter @carchief/mock-api build

FROM node:22-alpine AS runtime
WORKDIR /workspace
RUN npm install -g pnpm@10.2.0
COPY --from=build /workspace/package.json /workspace/pnpm-lock.yaml /workspace/pnpm-workspace.yaml /workspace/.npmrc ./
COPY --from=build /workspace/apps ./apps
COPY --from=build /workspace/packages ./packages
COPY --from=build /workspace/openapi ./openapi
COPY --from=build /workspace/node_modules ./node_modules
COPY --from=build /workspace/apps/public-web/.next/standalone ./
COPY --from=build /workspace/apps/public-web/.next/static ./apps/public-web/.next/static
COPY --from=build /workspace/apps/public-web/public ./apps/public-web/public
CMD ["node", "apps/public-web/server.js"]
