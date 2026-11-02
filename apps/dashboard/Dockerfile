# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
RUN npm install --global pnpm@12.16.1
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN --mount=type=cache,id=pnpm-web,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
COPY apps/dashboard apps/dashboard
COPY packages packages
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @meetflow/contracts build && pnpm --filter @meetflow/dashboard build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY deploy/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 8080
