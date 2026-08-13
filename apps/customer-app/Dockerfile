FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @carchief/customer-app build
EXPOSE 3001
CMD ["pnpm", "--filter", "@carchief/customer-app", "preview"]
