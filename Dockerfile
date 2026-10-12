# syntax=docker/dockerfile:1

FROM node:22-slim AS build
COPY --from=oven/bun:1.3 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN test -f realworld/assets/theme/styles.css \
    || (echo "realworld submodule missing: run 'git submodule update --init'" && exit 1)
RUN bun run build --configuration docker

FROM nginxinc/nginx-unprivileged:1.27-alpine
ENV BACKEND_URL=http://backend:8080
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/angular-conduit/browser /usr/share/nginx/html
EXPOSE 8080
