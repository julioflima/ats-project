# Build the React bundle, serve it via Caddy (which also proxies /graphql to
# the backend service — same topology in docker-compose and on k3s).
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /build/dist /srv/dist
EXPOSE 80
