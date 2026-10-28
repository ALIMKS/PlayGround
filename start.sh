#!/usr/bin/env bash
# Install/build when needed, publish deployment metadata, then serve in the foreground.
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

export PORT="${PORT:-3000}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"

run_step() {
  local label="$1" start end status
  shift
  start="$(date +%s%3N)"
  printf '[start] %s\n' "$label"
  status=0
  "$@" || status=$?
  end="$(date +%s%3N)"
  printf '[timing] %s: %s ms (exit %s)\n' "$label" "$((end - start))" "$status"
  return "$status"
}

static_dir=""

if [[ -f package.json ]]; then
  if [[ -f package-lock.json ]]; then
    run_step "install dependencies" npm ci --no-audit --no-fund
  else
    run_step "install dependencies" npm install --no-audit --no-fund
  fi

  if node -e 'const p=require("./package.json"); process.exit(p.scripts && p.scripts.build ? 0 : 1)'; then
    run_step "build project" npm run build
  fi

  for candidate in dist build out; do
    if [[ -f "$PROJECT_DIR/$candidate/index.html" ]]; then
      static_dir="$PROJECT_DIR/$candidate"
      break
    fi
  done

  if [[ -z "$static_dir" && -f "$PROJECT_DIR/index.html" ]]; then
    static_dir="$PROJECT_DIR"
  fi
else
  run_step "reset static output" rm -rf "$PROJECT_DIR/dist"
  run_step "create static output" mkdir -p "$PROJECT_DIR/dist"
  run_step "copy site sources" cp -R "$PROJECT_DIR/site/." "$PROJECT_DIR/dist/"
  static_dir="$PROJECT_DIR/dist"
fi

if [[ -z "$static_dir" || ! -f "$static_dir/index.html" ]]; then
  printf '[start] error: no static index.html produced inside %s\n' "$PROJECT_DIR" >&2
  exit 1
fi

run_step "publish deployment metadata" mkdir -p "$OPENCODE_WEB_DIR"
printf '{"project":"%s","directory":"%s"}\n' "$PROJECT_DIR" "$static_dir" \
  > "$OPENCODE_WEB_DIR/deployment-output.json"

printf '[start] serving %s on port %s\n' "$static_dir" "$PORT"
cd "$static_dir"
exec env -u OPENCODE_WEB_DIR /usr/bin/time -p node "$RUNTIME_DIR/scripts/default-start.mjs"
