#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

: "${CAPTURE_URL:?CAPTURE_URL is required}"
: "${CAPTURE_DIR:?CAPTURE_DIR is required}"
export CAPTURE_URL CAPTURE_DIR

timed() {
  local label="$1"
  shift
  printf '\n[capture] %s\n' "$label"
  /usr/bin/time -p "$@"
}

timed "prepare capture directory" mkdir -p "$CAPTURE_DIR"
printf '\n[capture] URL %s\n[capture] output %s\n' "$CAPTURE_URL" "$CAPTURE_DIR"
exec /usr/bin/time -p node capture.mjs
