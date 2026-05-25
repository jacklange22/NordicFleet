#!/bin/bash
# Comprehensive data-integrity verification against the live Firestore.
# Goes beyond verify-flows.sh (happy path) — exercises every CRUD operation,
# edge cases (empty patch, retired filter, hard delete), and every security
# rule with a positive and negative case. Two test users (A, B) so the
# negative rule checks can attempt cross-user reads.
#
# Coach-side rule checks (coach reads athlete, coach blocked from writing)
# live in verify-coach-pairing.sh for clarity.
#
# Exit 0 = every check passed. Exit non-zero on the first failure with a
# human-readable description.

set -euo pipefail

API_KEY="AIzaSyD3c42tmL_-pSy7QwEdpAQ5Bkye9fJWAFg"
PROJECT="nordicfleet-11e67"
BASE="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents"
AUTH="https://identitytoolkit.googleapis.com/v1/accounts"
TS=$(date +%s)
A_EMAIL="data-a-${TS}@nordicfleet.test"
B_EMAIL="data-b-${TS}@nordicfleet.test"
PASS="Test1234!"

PASS_COUNT=0
FAIL_COUNT=0

check() {
  # $1: description, $2: expected, $3: actual
  if [ "$2" = "$3" ]; then
    echo "  ✓ $1"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ✗ $1 — expected '$2', got '$3'"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

http_status() {
  # Performs a request and echos the HTTP status code only.
  # $1: method, $2: url, $3: bearer token, $4: optional body
  local method="$1"
  local url="$2"
  local token="$3"
  local body="${4:-}"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$url" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" \
      -X "$method" "$url" \
      -H "Authorization: Bearer ${token}"
  fi
}

echo "=== NordicFleet data integrity verification ==="
echo "User A: $A_EMAIL"
echo "User B: $B_EMAIL"
echo

# ─── Setup: create two athlete users ─────────────────────────────────
echo "[setup] Creating two test users…"

A_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$A_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
A_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$A_SIGNUP")
A_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$A_SIGNUP")

B_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$B_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
B_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$B_SIGNUP")
B_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$B_SIGNUP")
echo "  A uid=$A_UID"
echo "  B uid=$B_UID"
echo

# ─── 1. CREATE operations ─────────────────────────────────────────────
echo "[1/5] CREATE operations"

# 1a. User profile (PATCH the doc into existence the same way the app does).
curl -s -X PATCH "${BASE}/users/${A_UID}" \
  -H "Authorization: Bearer ${A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$A_EMAIL\"},\"role\":{\"stringValue\":\"athlete\"},\"weight\":{\"nullValue\":null},\"height\":{\"nullValue\":null},\"team\":{\"nullValue\":null},\"location\":{\"nullValue\":null}}}" \
  > /tmp/di-profile-a.json
A_EMAIL_BACK=$(python3 -c "import sys,json;print(json.load(open('/tmp/di-profile-a.json'))['fields']['email']['stringValue'])")
check "profile doc created with email" "$A_EMAIL" "$A_EMAIL_BACK"
A_ROLE_BACK=$(python3 -c "import sys,json;print(json.load(open('/tmp/di-profile-a.json'))['fields']['role']['stringValue'])")
check "profile doc has role=athlete" "athlete" "$A_ROLE_BACK"

# Same for B (used in rule checks).
curl -s -X PATCH "${BASE}/users/${B_UID}" \
  -H "Authorization: Bearer ${B_TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$B_EMAIL\"},\"role\":{\"stringValue\":\"athlete\"}}}" \
  > /dev/null

# 1b. Ski creation with the full 14-field shape the app writes.
SKI_BODY='{"fields":{"name":{"stringValue":"DI Speedmax"},"brand":{"stringValue":"Fischer"},"model":{"stringValue":"Speedmax"},"technique":{"stringValue":"classic"},"type":{"stringValue":"cold"},"build":{"stringValue":"WC"},"base":{"stringValue":"Plus"},"grind":{"stringValue":"Universal"},"length":{"integerValue":"200"},"flex":{"integerValue":"90"},"year":{"nullValue":null},"notes":{"stringValue":""},"retired":{"booleanValue":false},"seedId":{"nullValue":null}}}'
curl -s -X POST "${BASE}/users/${A_UID}/skis" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d "$SKI_BODY" > /tmp/di-ski.json
SKI_PATH=$(python3 -c "import sys,json;print(json.load(open('/tmp/di-ski.json'))['name'])")
SKI_ID=$(basename "$SKI_PATH")
FIELD_COUNT=$(python3 -c "import sys,json;print(len(json.load(open('/tmp/di-ski.json'))['fields']))")
check "ski has 14 fields written" "14" "$FIELD_COUNT"
RETIRED=$(python3 -c "import sys,json;print(json.load(open('/tmp/di-ski.json'))['fields']['retired']['booleanValue'])")
check "ski retired=false by default" "False" "$RETIRED"

# 1c. Wax log with 2-element glideWaxes array.
WAX_BODY="{\"fields\":{\"skiId\":{\"stringValue\":\"$SKI_ID\"},\"date\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"binder\":{\"nullValue\":null},\"kickLayers\":{\"integerValue\":\"1\"},\"kickWax\":{\"stringValue\":\"VR40\"},\"glideLayers\":{\"integerValue\":\"2\"},\"glideWaxes\":{\"arrayValue\":{\"values\":[{\"stringValue\":\"CH8\"},{\"stringValue\":\"HF8\"}]}},\"notes\":{\"stringValue\":\"\"}}}"
curl -s -X POST "${BASE}/users/${A_UID}/waxLogs" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d "$WAX_BODY" > /tmp/di-wax.json
GLIDE_COUNT=$(python3 -c "import sys,json;print(len(json.load(open('/tmp/di-wax.json'))['fields']['glideWaxes']['arrayValue']['values']))")
check "wax log glideWaxes length matches glideLayers (2)" "2" "$GLIDE_COUNT"

# 1d. Test log on a classic ski — kickRating set, stability/climbing null.
TEST_BODY="{\"fields\":{\"skiId\":{\"stringValue\":\"$SKI_ID\"},\"date\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"temperature\":{\"integerValue\":\"-5\"},\"humidity\":{\"integerValue\":\"70\"},\"snowType\":{\"stringValue\":\"old\"},\"surface\":{\"stringValue\":\"hardpack\"},\"glideRating\":{\"integerValue\":\"8\"},\"kickRating\":{\"integerValue\":\"7\"},\"stabilityRating\":{\"nullValue\":null},\"climbingRating\":{\"nullValue\":null},\"notes\":{\"stringValue\":\"\"}}}"
curl -s -X POST "${BASE}/users/${A_UID}/testLogs" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d "$TEST_BODY" > /tmp/di-test.json
STAB=$(python3 -c "import sys,json;f=json.load(open('/tmp/di-test.json'))['fields']['stabilityRating'];print('NULL' if 'nullValue' in f else 'NOT_NULL')")
check "classic test log: stabilityRating null" "NULL" "$STAB"
KR=$(python3 -c "import sys,json;print(json.load(open('/tmp/di-test.json'))['fields']['kickRating']['integerValue'])")
check "classic test log: kickRating preserved" "7" "$KR"
echo

# ─── 2. READ operations ──────────────────────────────────────────────
echo "[2/5] READ operations"

# 2a. List skis returns one doc.
LIST=$(curl -s "${BASE}/users/${A_UID}/skis" -H "Authorization: Bearer ${A_TOKEN}")
SKI_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))" <<<"$LIST")
check "list skis returns 1 doc" "1" "$SKI_COUNT"

# 2b. Get profile for a nonexistent uid. Firestore returns either 404
#     (the doc is missing) OR 403 (rules can't evaluate resource.data on
#     a missing doc and fall through to deny). Either way our service
#     translates to null — confirm we get one of those two statuses
#     instead of 200 (which would mean the doc unexpectedly exists).
GHOST_STATUS=$(http_status GET "${BASE}/users/does-not-exist-${TS}" "$A_TOKEN")
if [ "$GHOST_STATUS" = "404" ] || [ "$GHOST_STATUS" = "403" ]; then
  echo "  ✓ get nonexistent profile returns $GHOST_STATUS (service maps to null)"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  ✗ get nonexistent profile returned $GHOST_STATUS (expected 404 or 403)"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 2c. Wax logs filter by skiId — write a second log on a different (fake) ski
#     and verify the where clause path returns only ours.
DIFF_SKI="other_ski_${TS}"
curl -s -X POST "${BASE}/users/${A_UID}/waxLogs" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"skiId\":{\"stringValue\":\"$DIFF_SKI\"},\"date\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"glideWaxes\":{\"arrayValue\":{\"values\":[]}},\"glideLayers\":{\"integerValue\":\"0\"},\"kickLayers\":{\"integerValue\":\"0\"}}}" \
  > /dev/null
# REST :runQuery equivalent for `where('skiId','==',SKI_ID)`.
QUERY_BODY=$(cat <<EOF
{"structuredQuery":{"from":[{"collectionId":"waxLogs"}],"where":{"fieldFilter":{"field":{"fieldPath":"skiId"},"op":"EQUAL","value":{"stringValue":"$SKI_ID"}}}}}
EOF
)
QUERY=$(curl -s -X POST "${BASE}/users/${A_UID}:runQuery" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d "$QUERY_BODY")
FILTERED_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d if 'document' in r))" <<<"$QUERY")
check "wax-logs filter by skiId returns only matching" "1" "$FILTERED_COUNT"
echo

# ─── 3. UPDATE operations ────────────────────────────────────────────
echo "[3/5] UPDATE operations"

# 3a. PATCH with updateMask — only weight should change, role left alone.
curl -s -X PATCH "${BASE}/users/${A_UID}?updateMask.fieldPaths=weight" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d '{"fields":{"weight":{"integerValue":"72"}}}' \
  > /dev/null
PROFILE=$(curl -s "${BASE}/users/${A_UID}" -H "Authorization: Bearer ${A_TOKEN}")
NEW_WEIGHT=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['weight']['integerValue'])" <<<"$PROFILE")
check "PATCH weight=72 succeeded" "72" "$NEW_WEIGHT"
ROLE_AFTER=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['role']['stringValue'])" <<<"$PROFILE")
check "PATCH preserved role" "athlete" "$ROLE_AFTER"

# 3b. Update ski sets a new updatedAt (use serverTimestamp transform).
BEFORE_SKI=$(curl -s "${BASE}/users/${A_UID}/skis/${SKI_ID}" -H "Authorization: Bearer ${A_TOKEN}")
BEFORE_TS=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('updateTime','none'))" <<<"$BEFORE_SKI")
sleep 1
curl -s -X PATCH "${BASE}/users/${A_UID}/skis/${SKI_ID}?updateMask.fieldPaths=grind" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d '{"fields":{"grind":{"stringValue":"Cold"}}}' > /dev/null
AFTER_SKI=$(curl -s "${BASE}/users/${A_UID}/skis/${SKI_ID}" -H "Authorization: Bearer ${A_TOKEN}")
AFTER_TS=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('updateTime','none'))" <<<"$AFTER_SKI")
if [ "$AFTER_TS" != "$BEFORE_TS" ] && [ "$AFTER_TS" != "none" ]; then
  echo "  ✓ ski update bumped updateTime ($BEFORE_TS → $AFTER_TS)"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  ✗ ski update did not bump updateTime"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo

# ─── 4. DELETE operations ────────────────────────────────────────────
echo "[4/5] DELETE operations"

# 4a. Soft delete — PATCH retired=true.
curl -s -X PATCH "${BASE}/users/${A_UID}/skis/${SKI_ID}?updateMask.fieldPaths=retired" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d '{"fields":{"retired":{"booleanValue":true}}}' > /dev/null
RETIRED_DOC=$(curl -s "${BASE}/users/${A_UID}/skis/${SKI_ID}" -H "Authorization: Bearer ${A_TOKEN}")
IS_RETIRED=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['retired']['booleanValue'])" <<<"$RETIRED_DOC")
check "soft delete: retired flag set true, doc still exists" "True" "$IS_RETIRED"

# 4b. The historic wax + test logs for the retired ski still exist (we
#     deliberately don't cascade — the user's history is preserved).
HIST_WAX=$(curl -s "${BASE}/users/${A_UID}/waxLogs" -H "Authorization: Bearer ${A_TOKEN}")
HIST_WAX_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))" <<<"$HIST_WAX")
# We wrote 2 wax logs above; both should still be present after the ski's soft-delete.
check "soft-deleted ski's wax logs remain (history preserved)" "2" "$HIST_WAX_COUNT"

# 4c. Hard delete — DELETE the doc.
DEL_STATUS=$(http_status DELETE "${BASE}/users/${A_UID}/skis/${SKI_ID}" "$A_TOKEN")
check "hard delete returns 200" "200" "$DEL_STATUS"
GONE_STATUS=$(http_status GET "${BASE}/users/${A_UID}/skis/${SKI_ID}" "$A_TOKEN")
check "after hard delete, GET returns 404" "404" "$GONE_STATUS"
echo

# ─── 5. SECURITY RULE enforcement ────────────────────────────────────
echo "[5/5] SECURITY rules"

# 5a. Unauthenticated read — no Bearer header.
UNAUTH=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/users/${A_UID}")
# Firestore returns 401 (PERMISSION_DENIED maps to either 401 or 403
# depending on the path). Accept either.
if [ "$UNAUTH" = "401" ] || [ "$UNAUTH" = "403" ]; then
  echo "  ✓ unauthenticated request denied ($UNAUTH)"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  ✗ unauthenticated request returned $UNAUTH (expected 401/403)"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# 5b. User B reads user A's profile — both are athletes, no coach relation.
#     A's profile has role='athlete', so the rule denies (only owner /
#     coach-of / role=='coach' reads pass).
CROSS_PROF=$(http_status GET "${BASE}/users/${A_UID}" "$B_TOKEN")
check "User B cannot read User A's athlete profile" "403" "$CROSS_PROF"

# 5c. User B writes to User A's skis subcollection.
WRITE_BODY='{"fields":{"name":{"stringValue":"unauthorized"}}}'
CROSS_WRITE=$(http_status POST "${BASE}/users/${A_UID}/skis" "$B_TOKEN" "$WRITE_BODY")
check "User B cannot write to User A's skis" "403" "$CROSS_WRITE"

# 5d. Coach lookup by email — write coach profile then query.
C_EMAIL="data-coach-${TS}@nordicfleet.test"
C_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$C_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
C_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$C_SIGNUP")
C_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$C_SIGNUP")
curl -s -X PATCH "${BASE}/users/${C_UID}" \
  -H "Authorization: Bearer ${C_TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$C_EMAIL\"},\"role\":{\"stringValue\":\"coach\"}}}" > /dev/null

# As user A, query users where email==C_EMAIL and role==coach.
LOOKUP_BODY=$(cat <<EOF
{"structuredQuery":{"from":[{"collectionId":"users"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"email"},"op":"EQUAL","value":{"stringValue":"$C_EMAIL"}}},{"fieldFilter":{"field":{"fieldPath":"role"},"op":"EQUAL","value":{"stringValue":"coach"}}}]}}}}
EOF
)
LOOKUP=$(curl -s -X POST "${BASE}:runQuery" \
  -H "Authorization: Bearer ${A_TOKEN}" -H "Content-Type: application/json" \
  -d "$LOOKUP_BODY")
LOOKUP_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d if 'document' in r))" <<<"$LOOKUP")
check "coach lookup by email returns the coach doc" "1" "$LOOKUP_COUNT"
echo

# ─── 6. Offline persistence config (code-level) ──────────────────────
echo "[6/6] OFFLINE persistence (code-level — verified via grep)"
if grep -q "persistence: true" src/services/firebase.js && \
   grep -q "CACHE_SIZE_UNLIMITED" src/services/firebase.js; then
  echo "  ✓ src/services/firebase.js enables persistence with CACHE_SIZE_UNLIMITED"
  PASS_COUNT=$((PASS_COUNT + 1))
else
  echo "  ✗ persistence config missing in src/services/firebase.js"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi
echo

echo "=============================="
echo "Passed: $PASS_COUNT, Failed: $FAIL_COUNT"
echo "=============================="
if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
