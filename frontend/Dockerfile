FROM node:22-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.25.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm check && pnpm test && pnpm build

FROM nginx:1.28-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf.template /app/nginx.conf.template
COPY docker/start.sh /app/start.sh
ENV DATA_SOURCE=mock API_BASE_URL=/api BACKEND_UPSTREAM=""
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -q -O /dev/null http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["/bin/sh", "/app/start.sh"]
