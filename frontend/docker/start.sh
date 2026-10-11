#!/bin/sh
set -eu
case "$DATA_SOURCE" in mock|http) ;; *) echo 'DATA_SOURCE must be mock or http' >&2; exit 1;; esac
# Values are inserted into JSON and nginx configuration; reject quotes and directives.
printf '%s' "$API_BASE_URL" | grep -Eq '^(/[A-Za-z0-9._~/%-]*|https?://[A-Za-z0-9._:-]+(/[A-Za-z0-9._~/%-]*)?)$' || { echo 'Invalid API_BASE_URL' >&2; exit 1; }
if [ -n "$BACKEND_UPSTREAM" ]; then
  printf '%s' "$BACKEND_UPSTREAM" | grep -Eq '^https?://[A-Za-z0-9._:-]+$' || { echo 'BACKEND_UPSTREAM must be a plain http(s) origin' >&2; exit 1; }
  API_PROXY_DIRECTIVE="proxy_pass $BACKEND_UPSTREAM; proxy_http_version 1.1;"
else
  API_PROXY_DIRECTIVE='default_type application/json; return 503 '\''{"message":"Backend is not configured"}'\'';'
fi
export API_PROXY_DIRECTIVE
printf '{"dataSource":"%s","apiBaseUrl":"%s"}\n' "$DATA_SOURCE" "$API_BASE_URL" > /tmp/kino-config.json
envsubst '${API_PROXY_DIRECTIVE}' < /app/nginx.conf.template > /tmp/kino-nginx.conf
exec nginx -c /tmp/kino-nginx.conf -g 'daemon off;'
