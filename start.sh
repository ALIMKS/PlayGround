#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PROJECT_DIR="$(pwd)"
WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
PORT="${PORT:-3000}"
export PORT

timed() {
  local label="$1"
  shift
  printf '\n[start] %s\n' "$label"
  /usr/bin/time -p "$@"
}

timed "install dependencies" npm install --no-audit --no-fund --ignore-scripts
timed "build static site" npm run build --silent
timed "verify build output" test -f "$PROJECT_DIR/dist/index.html"
timed "write deployment metadata" node -e '
  const fs = require("node:fs");
  const path = require("node:path");
  const [file, project, directory] = process.argv.slice(1);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ project, directory }) + "\n");
' "$WEB_DIR/deployment-output.json" "$PROJECT_DIR" "$PROJECT_DIR/dist"

printf '\n[start] serving %s on port %s\n' "$PROJECT_DIR/dist" "$PORT"
exec /usr/bin/time -p node server.mjs
