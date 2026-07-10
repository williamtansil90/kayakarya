#!/bin/bash
# Debug helper: verify vite is available after npm ci in Docker build stage
LOG="/home/ubuntu/kayakarya_course/.cursor/debug-749551.log"
TS=$(date +%s%3N)

log_event() {
  local hypothesis="$1" location="$2" message="$3" data="$4"
  printf '{"sessionId":"749551","runId":"verify-build","hypothesisId":"%s","location":"%s","message":"%s","data":%s,"timestamp":%s}\n' \
    "$hypothesis" "$location" "$message" "$data" "$TS" >> "$LOG"
}

log_event "A" "verify-docker-build.sh:start" "testing NODE_ENV=production npm ci" '{"NODE_ENV":"production"}'

RESULT=$(docker run --rm -e NODE_ENV=production -v "$(pwd)/frontend:/app" -w /app node:20-alpine sh -c \
  'npm ci 2>/dev/null && (test -f node_modules/.bin/vite && echo VITE_OK || echo VITE_MISSING)' 2>/dev/null || echo "RUN_FAILED")

log_event "A" "verify-docker-build.sh:prod-ci" "npm ci result under NODE_ENV=production" "{\"result\":\"$RESULT\"}"

log_event "B" "verify-docker-build.sh:start" "testing npm ci --include=dev" '{"NODE_ENV":"production","include_dev":true}'

RESULT2=$(docker run --rm -e NODE_ENV=production -v "$(pwd)/frontend:/app" -w /app node:20-alpine sh -c \
  'npm ci --include=dev 2>/dev/null && (test -f node_modules/.bin/vite && echo VITE_OK || echo VITE_MISSING)' 2>/dev/null || echo "RUN_FAILED")

log_event "B" "verify-docker-build.sh:include-dev" "npm ci --include=dev result" "{\"result\":\"$RESULT2\"}"

log_event "C" "verify-docker-build.sh:start" "testing combined npm ci + vite build in one layer" '{"pattern":"single-run"}'

RESULT3=$(docker build --no-cache -t kayakarya-verify-web -f frontend/Dockerfile frontend 2>&1 | tail -3)
STATUS=$?
log_event "C" "verify-docker-build.sh:dockerfile-build" "full docker build result" "{\"exit\":$STATUS,\"tail\":\"$(echo "$RESULT3" | tr '\n' ' ' | sed 's/"/\\"/g')\"}"

echo "prod npm ci: $RESULT"
echo "include=dev:  $RESULT2"
echo "docker build exit: $STATUS"
