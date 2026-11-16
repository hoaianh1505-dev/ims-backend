# Stage 1: Build application
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm 9 to avoid pnpm 10 build script approval restrictions
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

ENV NODE_ENV=production
ENV PORT=5000

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/main"]
