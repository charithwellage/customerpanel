FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/public-web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@carchief/public-web", "start"]
