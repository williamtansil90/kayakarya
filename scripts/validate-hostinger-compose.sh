#!/bin/bash
# Validates docker-compose.yml for Hostinger deployment requirements.
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="/home/ubuntu/kayakarya_course/.cursor/debug-749551.log"
COMPOSE="$ROOT/docker-compose.yml"
RUN_ID="${1:-pre-fix}"

log() {
  local hyp="$1" loc="$2" msg="$3" data="$4"
  printf '{"sessionId":"749551","runId":"%s","hypothesisId":"%s","location":"%s","message":"%s","data":%s,"timestamp":%s}\n' \
    "$RUN_ID" "$hyp" "$loc" "$msg" "$data" "$(date +%s000)" >> "$LOG"
}

cd "$ROOT"

# H1: branch mismatch — main vs master
MAIN_HEAD=$(git rev-parse --short origin/main 2>/dev/null || echo "missing")
MASTER_HEAD=$(git rev-parse --short origin/master 2>/dev/null || echo "missing")
log "H1" "validate-hostinger-compose.sh:branch" "branch heads" "{\"main\":\"$MAIN_HEAD\",\"master\":\"$MASTER_HEAD\",\"diverged\":$([ \"$MAIN_HEAD\" != \"$MASTER_HEAD\" ] && echo true || echo false)}"

# H2: localhost port binding on web service blocks Hostinger
WEB_PORTS=$(awk '/^  web:/{found=1} found && /^  [a-z]/{if(!/^  web:/) exit} found && /ports:/{getline; print}' "$COMPOSE" 2>/dev/null || true)
HAS_LOCALHOST_BIND=0
echo "$WEB_PORTS" | grep -q '127.0.0.1' && HAS_LOCALHOST_BIND=1
log "H2" "validate-hostinger-compose.sh:ports" "web port bind check" "{\"webPorts\":\"$(echo "$WEB_PORTS" | tr -d '\n')\",\"localhostBind\":$([ "$HAS_LOCALHOST_BIND" -eq 1 ] && echo true || echo false),\"hostingerReady\":$([ "$HAS_LOCALHOST_BIND" -eq 0 ] && echo true || echo false)}"

# H3: env_file missing on Hostinger
HAS_ENV_FILE=0
grep -q 'env_file' "$COMPOSE" 2>/dev/null && HAS_ENV_FILE=1
HAS_ENVIRONMENT=0
grep -q 'environment:' "$COMPOSE" 2>/dev/null && HAS_ENVIRONMENT=1
log "H3" "validate-hostinger-compose.sh:env" "env config check" "{\"hasEnvFile\":$([ "$HAS_ENV_FILE" -eq 1 ] && echo true || echo false),\"hasEnvironment\":$([ "$HAS_ENVIRONMENT" -eq 1 ] && echo true || echo false)}"

# H4: compose parse + required files
PARSE_OK=false
if docker compose -f "$COMPOSE" config >/dev/null 2>&1; then
  PARSE_OK=true
fi
HAS_BACKEND_DF=$([ -f "$ROOT/backend/Dockerfile" ] && echo true || echo false)
HAS_FRONTEND_DF=$([ -f "$ROOT/frontend/Dockerfile" ] && echo true || echo false)
log "H4" "validate-hostinger-compose.sh:parse" "compose parse and dockerfiles" "{\"parseOk\":$PARSE_OK,\"backendDockerfile\":$HAS_BACKEND_DF,\"frontendDockerfile\":$HAS_FRONTEND_DF}"

# H5: web exposes public port 80
WEB_PORT=$(docker compose -f "$COMPOSE" config 2>/dev/null | grep -A2 'web:' | grep 'published' | grep -o '"80"' | head -1 || echo "")
log "H5" "validate-hostinger-compose.sh:web-port" "web public port" "{\"publishedPort80\":$([ -n \"$WEB_PORT\" ] && echo true || echo false)}"

echo "Validation complete. See $LOG"
