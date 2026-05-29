#!/bin/bash
# Live verification for the Wax Truck waxTests subcollection and the
# public marketingSignups collection, against the real Firestore.
#
# Checks (positive + negative for each new security rule):
#   waxTests:        owner can create + read its own; another user is
#                    blocked from reading it.
#   marketingSignups: anyone (even unauthenticated) can create one;
#                    nobody can read them back from the client.
#
# Exit 0 = every check passed. Mirrors verify-data-integrity.sh.

set -euo pipefail

API_KEY="AIzaSyD3c42tmL_-pSy7QwEdpAQ5Bkye9fJWAFg"
PROJECT="nordicfleet-11e67"
BASE="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents"
AUTH="https://identitytoolkit.googleapis.com/v1/accounts"
TS=$(date +%s)
A_EMAIL="wax-a-${TS}@nordicfleet.test"
B_EMAIL="wax-b-${TS}@nordicfleet.test"
PASS="Test1234!"

PASS_COUNT=0
FAIL_COUNT=0

check() {
  if [ "$2" = "$3" ]; then
    echo "  ✓ $1"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ✗ $1 — expected '$2', got '$3'"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

status_authed() {
  # $1 method, $2 url, $3 token, $4 body(optional)
  if [ -n "${4:-}" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$1" "$2" \
      -H "Authorization: Bearer $3" -H "Content-Type: application/json" -d "$4"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$1" "$2" \
      -H "Authorization: Bearer $3"
  fi
}

status_anon() {
  # $1 method, $2 url, $3 body(optional) — no auth header
  if [ -n "${3:-}" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$1" "$2" \
      -H "Content-Type: application/json" -d "$3"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$1" "$2"
  fi
}

echo "=== NordicFleet Wax Truck + marketing-signups verification ==="
echo "User A: $A_EMAIL"
echo "User B: $B_EMAIL"
echo

echo "[setup] Creating two test users…"
A_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" -H "Content-Type: application/json" \
  -d "{\"email\":\"$A_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
A_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$A_SIGNUP")
A_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$A_SIGNUP")
B_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" -H "Content-Type: application/json" \
  -d "{\"email\":\"$B_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
B_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$B_SIGNUP")
B_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$B_SIGNUP")
echo "  A uid=$A_UID"
echo "  B uid=$B_UID"
echo

# ─── Wax Truck (owner-only waxTests) ────────────────────────────────
echo "[1/2] Wax Truck — users/{uid}/waxTests"

WT_BODY='{"fields":{"name":{"stringValue":"Verify AM test"},"status":{"stringValue":"setup"},"fleetSize":{"integerValue":"4"}}}'

# 1a. Owner creates a wax test (PATCH a known id).
WT_ID="verify-${TS}"
code=$(status_authed PATCH "${BASE}/users/${A_UID}/waxTests/${WT_ID}" "$A_TOKEN" "$WT_BODY")
check "owner can create a wax test" "200" "$code"

# 1b. Owner reads it back.
code=$(status_authed GET "${BASE}/users/${A_UID}/waxTests/${WT_ID}" "$A_TOKEN")
check "owner can read own wax test" "200" "$code"

# 1c. Another user is blocked from reading it.
code=$(status_authed GET "${BASE}/users/${A_UID}/waxTests/${WT_ID}" "$B_TOKEN")
check "other user blocked from reading the wax test (403)" "403" "$code"

# 1d. Another user is blocked from writing into A's waxTests.
code=$(status_authed PATCH "${BASE}/users/${A_UID}/waxTests/intruder-${TS}" "$B_TOKEN" "$WT_BODY")
check "other user blocked from writing the wax test (403)" "403" "$code"
echo

# ─── Marketing signups (public create, no read) ─────────────────────
echo "[2/2] marketingSignups — public create, no client read"

MS_BODY="{\"fields\":{\"email\":{\"stringValue\":\"lead-${TS}@example.com\"},\"source\":{\"stringValue\":\"verify-script\"},\"role\":{\"nullValue\":null},\"createdAt\":{\"timestampValue\":\"2026-05-29T00:00:00Z\"}}}"

# 2a. Anonymous create succeeds (open create rule).
code=$(status_anon POST "${BASE}/marketingSignups?key=${API_KEY}" "$MS_BODY")
check "anonymous can create a marketing signup" "200" "$code"

# 2b. Anonymous list/read is blocked.
code=$(status_anon GET "${BASE}/marketingSignups?key=${API_KEY}")
check "anonymous blocked from listing signups (403)" "403" "$code"

# 2c. Even a signed-in user can't read signups.
code=$(status_authed GET "${BASE}/marketingSignups" "$A_TOKEN")
check "signed-in user blocked from listing signups (403)" "403" "$code"
echo

echo "=== Summary: ${PASS_COUNT} passed, ${FAIL_COUNT} failed ==="
[ "$FAIL_COUNT" -eq 0 ]
