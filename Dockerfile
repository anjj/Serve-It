FROM oven/bun:1-alpine AS base
RUN apk add --no-cache openssl libc6-compat

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV SUPABASE_URL="https://placeholder-project.supabase.co"
ENV SUPABASE_SERVICE_ROLE_KEY="placeholder-key"
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG BETTER_AUTH_SECRET
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
RUN bun run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 servit
COPY --from=builder --chown=servit:bunjs /app/.output ./.output
USER servit
EXPOSE 3000
ENV PORT=3000
CMD ["bun", ".output/server/index.mjs"]
