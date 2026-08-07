FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/mock-api build
EXPOSE 4000
CMD ["pnpm", "--filter", "@carchief/mock-api", "start"]
