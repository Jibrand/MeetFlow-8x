# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*
RUN npm install --global pnpm@12.16.1
WORKDIR /workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/ui/package.json packages/ui/package.json
# Generate Prisma explicitly; runtime uses the OS FFmpeg instead of downloading ffmpeg-static.
RUN --mount=type=cache,id=pnpm-api,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile --ignore-scripts
COPY apps/api apps/api
COPY packages/contracts packages/contracts
COPY packages/ui packages/ui
RUN pnpm --filter @meetflow/api prisma:generate \
 && pnpm --filter @meetflow/contracts build \
 && pnpm --filter @meetflow/api typecheck \
 && pnpm --filter @meetflow/api build \
 && pnpm --filter @meetflow/api deploy --prod --ignore-scripts /out \
 && cd /out && node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma

FROM node:24-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl ffmpeg && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000 MEDIA_STORAGE_DIR=/app/media FFMPEG_PATH=/usr/bin/ffmpeg
WORKDIR /app
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/dist ./dist
COPY --from=build --chown=node:node /out/prisma ./prisma
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --chown=node:node docs/api ./docs/api
RUN mkdir -p /app/media && chown node:node /app/media
USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
