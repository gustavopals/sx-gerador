# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.13.0
ARG PNPM_VERSION=10.33.3

# ---- build ----
FROM node:${NODE_VERSION}-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/advpl-builder/package.json packages/advpl-builder/
COPY packages/dictionary-validator/package.json packages/dictionary-validator/
COPY packages/dictionary-diff/package.json packages/dictionary-diff/
COPY packages/protheus-csv/package.json packages/protheus-csv/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @sxgerador/shared-types build \
 && pnpm --filter @sxgerador/advpl-builder build \
 && pnpm --filter @sxgerador/dictionary-validator build \
 && pnpm --filter @sxgerador/dictionary-diff build \
 && pnpm --filter @sxgerador/protheus-csv build
RUN pnpm --filter web build -- --configuration=production

# ---- runtime (nginx) ----
FROM nginx:1.27-alpine AS runtime
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
