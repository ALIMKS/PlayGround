#!/usr/bin/env bash
# Capture the public preview at CAPTURE_URL into CAPTURE_DIR/final-{desktop,mobile}.png.
# Exit 75 for temporary infrastructure failures, 1 for script or rendering defects.
set -euo pipefail

RUNTIME_DIR="${RUNTIME_DIR:-/home/runner/work/_temp/omgithub-runtime}"

: "${CAPTURE_URL:?Set CAPTURE_URL to the preview URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an output directory outside the project source.}"

run_step() {
  local label="$1" start end status
  shift
  start="$(date +%s%3N)"
  printf '[capture] %s\n' "$label"
  status=0
  "$@" || status=$?
  end="$(date +%s%3N)"
  printf '[timing] %s: %s ms (exit %s)\n' "$label" "$((end - start))" "$status"
  return "$status"
}

run_step "create capture directory" mkdir -p "$CAPTURE_DIR"

run_step "capture desktop and mobile views" \
  env CAPTURE_URL="$CAPTURE_URL" CAPTURE_DIR="$CAPTURE_DIR" \
  node "$RUNTIME_DIR/scripts/default-capture.mjs"

for view in desktop mobile; do
  shot="$CAPTURE_DIR/final-$view.png"
  if [[ ! -s "$shot" ]]; then
    printf '[capture] error: missing screenshot %s\n' "$shot" >&2
    exit 1
  fi
done

printf '[capture] wrote %s/final-desktop.png and %s/final-mobile.png\n' "$CAPTURE_DIR" "$CAPTURE_DIR"
