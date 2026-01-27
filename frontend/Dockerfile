FROM oven/bun:1.1.32 AS base
WORKDIR /app

FROM base AS dev
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN bun run build

FROM base AS prod
ENV NODE_ENV=production
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile
COPY --from=build /app/.output /app/.output
EXPOSE 3000
CMD ["bun", "run", "start"]
