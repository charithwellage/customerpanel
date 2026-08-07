FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/salesperson-app build
EXPOSE 3002
CMD ["pnpm", "--filter", "@carchief/salesperson-app", "preview"]
