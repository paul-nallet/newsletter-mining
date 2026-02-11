FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . ./
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV SKIP_DB_MIGRATIONS=1
RUN apk add --no-cache postgresql-client
EXPOSE 3000
COPY --from=build /app/.output ./.output
COPY --from=build /app/server/database/migrations ./server/database/migrations
COPY docker-entrypoint.sh ./docker-entrypoint.sh
COPY db-migrate.sh ./db-migrate.sh
RUN chmod +x ./docker-entrypoint.sh ./db-migrate.sh
CMD ["./docker-entrypoint.sh"]
