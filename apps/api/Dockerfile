# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.13.0
ARG PNPM_VERSION=10.33.3

# ---- base ----
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates curl tini \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/advpl-builder/package.json packages/advpl-builder/
COPY packages/dictionary-validator/package.json packages/dictionary-validator/
COPY packages/dictionary-diff/package.json packages/dictionary-diff/
COPY packages/protheus-csv/package.json packages/protheus-csv/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---- build ----
FROM deps AS build
COPY . .
RUN pnpm --filter @sxgerador/shared-types build \
 && pnpm --filter @sxgerador/advpl-builder build \
 && pnpm --filter @sxgerador/dictionary-validator build \
 && pnpm --filter @sxgerador/dictionary-diff build \
 && pnpm --filter @sxgerador/protheus-csv build
RUN pnpm --filter api prisma generate \
 && pnpm --filter api build

# ---- runtime ----
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.3 --activate
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates tini \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy only production-relevant pieces
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/turbo.json ./
COPY --from=build /app/apps/api/package.json apps/api/
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/src/generated apps/api/src/generated
COPY --from=build /app/packages packages
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/apps/api/node_modules apps/api/node_modules

USER node
EXPOSE 3000
ENV PORT=3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "apps/api/dist/index.js"]
