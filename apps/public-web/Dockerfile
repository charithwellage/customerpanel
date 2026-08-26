FROM node:22-alpine AS build

WORKDIR /workspace
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages
COPY openapi ./openapi

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* values are embedded into the browser bundle during `next build`.
# Azure supplies the deployment-specific customer portal URL as a build arg.
ARG NEXT_PUBLIC_CUSTOMER_APP_URL
ENV NEXT_PUBLIC_CUSTOMER_APP_URL=${NEXT_PUBLIC_CUSTOMER_APP_URL}

RUN pnpm --filter @carchief/public-web build

FROM node:22-alpine AS runtime

WORKDIR /workspace
RUN corepack enable

COPY --from=build /workspace/apps/public-web/.next/standalone ./
COPY --from=build /workspace/apps/public-web/.next/static ./apps/public-web/.next/static
COPY --from=build /workspace/apps/public-web/public ./apps/public-web/public

EXPOSE 3000

CMD ["node", "apps/public-web/server.js"]
