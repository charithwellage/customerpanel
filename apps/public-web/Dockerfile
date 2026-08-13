FROM node:22-alpine AS base
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/public-web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@carchief/public-web", "start"]
