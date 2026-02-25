#!/usr/bin/env bash
# trigger-jenkins.sh
# Triggers a Jenkins parameterized build, polls until completion,
# and exits 0 on SUCCESS or 1 on any other outcome.
set -euo pipefail

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
log()  { echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

# ---------------------------------------------------------------------------
# Validate required environment variables
# ---------------------------------------------------------------------------
required_vars=(
  JENKINS_URL
  JENKINS_USER
  JENKINS_API_TOKEN
  JOB_NAME
  GIT_COMMIT_SHA
  BRANCH_NAME
  BUILD_NUMBER
  ARTIFACT_VERSION
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    fail "Required environment variable '$var' is not set or empty."
  fi
done

JENKINS_URL="${JENKINS_URL%/}"   # strip trailing slash
CRUMB_HEADER=""

# ---------------------------------------------------------------------------
# Fetch Jenkins crumb (CSRF)
# ---------------------------------------------------------------------------
log "Fetching Jenkins crumb..."
CRUMB_RESPONSE=$(curl -s -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
  "${JENKINS_URL}/crumbIssuer/api/json" || true)

CRUMB_FIELD=$(echo "$CRUMB_RESPONSE" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d['crumbRequestField'])
except Exception:
    print('')
")
CRUMB_VALUE=$(echo "$CRUMB_RESPONSE" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(d['crumb'])
except Exception:
    print('')
")

if [[ -n "$CRUMB_FIELD" && -n "$CRUMB_VALUE" ]]; then
  CRUMB_HEADER="${CRUMB_FIELD}:${CRUMB_VALUE}"
  log "Got Jenkins crumb."
else
  log "Warning: Could not fetch crumb; proceeding without it."
fi

# ---------------------------------------------------------------------------
# POST to Jenkins with retry (3 attempts, exponential backoff starting at 10s)
# ---------------------------------------------------------------------------
TRIGGER_URL="${JENKINS_URL}/job/${JOB_NAME}/buildWithParameters"
PARAMS=(
  "GIT_COMMIT_SHA=${GIT_COMMIT_SHA}"
  "BRANCH_NAME=${BRANCH_NAME}"
  "BUILD_NUMBER=${BUILD_NUMBER}"
  "ARTIFACT_VERSION=${ARTIFACT_VERSION}"
)

PARAM_STRING=$(printf '&%s' "${PARAMS[@]}")
PARAM_STRING="${PARAM_STRING:1}"  # remove leading &

MAX_ATTEMPTS=3
BACKOFF=10
QUEUE_URL=""

for attempt in $(seq 1 $MAX_ATTEMPTS); do
  log "Triggering Jenkins build (attempt ${attempt}/${MAX_ATTEMPTS})..."

  CURL_ARGS=(-s -o /dev/null -w "%{http_code}" -X POST
    -u "${JENKINS_USER}:${JENKINS_API_TOKEN}"
    --data "${PARAM_STRING}")

  if [[ -n "$CRUMB_HEADER" ]]; then
    CURL_ARGS+=(-H "$CRUMB_HEADER")
  fi

  # Capture Location header separately
  RESPONSE=$(curl "${CURL_ARGS[@]}" \
    -D /tmp/jenkins_trigger_headers.txt \
    "${TRIGGER_URL}" || true)

  log "HTTP response code: ${RESPONSE}"

  if [[ "$RESPONSE" =~ ^(201|302)$ ]]; then
    QUEUE_URL=$(grep -i '^location:' /tmp/jenkins_trigger_headers.txt \
      | tr -d '\r' | awk '{print $2}' || true)
    log "Build queued. Queue URL: ${QUEUE_URL}"
    break
  fi

  if [[ "$attempt" -lt "$MAX_ATTEMPTS" ]]; then
    log "Trigger failed (HTTP ${RESPONSE}). Retrying in ${BACKOFF}s..."
    sleep "$BACKOFF"
    BACKOFF=$(( BACKOFF * 2 ))
  else
    fail "Jenkins trigger failed after ${MAX_ATTEMPTS} attempts (last HTTP ${RESPONSE})."
  fi
done

[[ -n "$QUEUE_URL" ]] || fail "No queue URL returned from Jenkins."

QUEUE_URL="${QUEUE_URL%/}"  # strip trailing slash

# ---------------------------------------------------------------------------
# Poll queue until build number is assigned (5s interval, 5min timeout)
# ---------------------------------------------------------------------------
log "Polling queue for build number..."
QUEUE_POLL_INTERVAL=5
QUEUE_TIMEOUT=300
QUEUE_ELAPSED=0
BUILD_NUMBER_ASSIGNED=""
BUILD_URL=""

while [[ $QUEUE_ELAPSED -lt $QUEUE_TIMEOUT ]]; do
  QUEUE_JSON=$(curl -s -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
    "${QUEUE_URL}/api/json" || true)

  EXECUTABLE=$(echo "$QUEUE_JSON" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ex = d.get('executable') or {}
    print(ex.get('number', ''))
except Exception:
    print('')
" || true)

  BUILD_URL_RAW=$(echo "$QUEUE_JSON" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ex = d.get('executable') or {}
    print(ex.get('url', ''))
except Exception:
    print('')
" || true)

  if [[ -n "$EXECUTABLE" ]]; then
    BUILD_NUMBER_ASSIGNED="$EXECUTABLE"
    BUILD_URL="$BUILD_URL_RAW"
    log "Build number assigned: ${BUILD_NUMBER_ASSIGNED}"
    log "Build URL: ${BUILD_URL}"
    echo "${BUILD_URL}" > /tmp/jenkins_build_url
    break
  fi

  sleep "$QUEUE_POLL_INTERVAL"
  QUEUE_ELAPSED=$(( QUEUE_ELAPSED + QUEUE_POLL_INTERVAL ))
done

[[ -n "$BUILD_NUMBER_ASSIGNED" ]] || fail "Timed out waiting for Jenkins build number (${QUEUE_TIMEOUT}s)."

# ---------------------------------------------------------------------------
# Poll build status until complete (30s interval, 30min timeout)
# ---------------------------------------------------------------------------
log "Polling build status for build #${BUILD_NUMBER_ASSIGNED}..."
STATUS_POLL_INTERVAL=30
STATUS_TIMEOUT=1800
STATUS_ELAPSED=0
FINAL_RESULT=""

STATUS_URL="${BUILD_URL%/}/api/json"

while [[ $STATUS_ELAPSED -lt $STATUS_TIMEOUT ]]; do
  STATUS_JSON=$(curl -s -u "${JENKINS_USER}:${JENKINS_API_TOKEN}" \
    "${STATUS_URL}" || true)

  BUILDING=$(echo "$STATUS_JSON" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    print(str(d.get('building', True)).lower())
except Exception:
    print('true')
" || true)

  RESULT=$(echo "$STATUS_JSON" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    r = d.get('result')
    print(r if r else '')
except Exception:
    print('')
" || true)

  if [[ "$BUILDING" == "false" && -n "$RESULT" ]]; then
    FINAL_RESULT="$RESULT"
    break
  fi

  log "Build still running (elapsed ${STATUS_ELAPSED}s)... result=${RESULT:-pending}"
  sleep "$STATUS_POLL_INTERVAL"
  STATUS_ELAPSED=$(( STATUS_ELAPSED + STATUS_POLL_INTERVAL ))
done

if [[ -z "$FINAL_RESULT" ]]; then
  fail "Timed out waiting for Jenkins build to complete (${STATUS_TIMEOUT}s). Build URL: ${BUILD_URL}"
fi

log "Jenkins build finished with result: ${FINAL_RESULT}"

if [[ "$FINAL_RESULT" == "SUCCESS" ]]; then
  log "Jenkins build SUCCEEDED."
  exit 0
else
  fail "Jenkins build did NOT succeed. Result: ${FINAL_RESULT}. Build URL: ${BUILD_URL}"
fi
