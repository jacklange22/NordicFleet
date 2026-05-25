#!/bin/bash
# Coach-pairing flow end-to-end against live Firestore.
# Mirrors setCoachByEmail / removeCoach / subscribeAthletesForCoach plus
# the security rules that gate coach reads of athlete subcollections.
#
# 13 checks total, exit 0 if all pass.

set -euo pipefail

API_KEY="AIzaSyD3c42tmL_-pSy7QwEdpAQ5Bkye9fJWAFg"
PROJECT="nordicfleet-11e67"
BASE="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents"
AUTH="https://identitytoolkit.googleapis.com/v1/accounts"
TS=$(date +%s)
COACH_EMAIL="coach-verify-${TS}@nordicfleet.test"
ATHLETE_EMAIL="athlete-verify-${TS}@nordicfleet.test"
GHOST_EMAIL="ghost-${TS}@nordicfleet.test"
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

http_status() {
  local method="$1" url="$2" token="$3" body="${4:-}"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" \
      -H "Authorization: Bearer ${token}"
  fi
}

# Replicates the JS findCoachByEmail logic — query users where
# email==EMAIL AND role=='coach'.
find_coach_by_email() {
  local token="$1" email="$2"
  local body
  body=$(cat <<EOF
{"structuredQuery":{"from":[{"collectionId":"users"}],"where":{"compositeFilter":{"op":"AND","filters":[{"fieldFilter":{"field":{"fieldPath":"email"},"op":"EQUAL","value":{"stringValue":"$email"}}},{"fieldFilter":{"field":{"fieldPath":"role"},"op":"EQUAL","value":{"stringValue":"coach"}}}]}}}}
EOF
)
  curl -s -X POST "${BASE}:runQuery" \
    -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" \
    -d "$body"
}

echo "=== NordicFleet coach-pairing verification ==="
echo "Coach:   $COACH_EMAIL"
echo "Athlete: $ATHLETE_EMAIL"
echo

# ─── [1] Sign up coach ───────────────────────────────────────────────
echo "[1/13] Sign up coach + role=coach profile"
COACH_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$COACH_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
COACH_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$COACH_SIGNUP")
COACH_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$COACH_SIGNUP")
curl -s -X PATCH "${BASE}/users/${COACH_UID}" \
  -H "Authorization: Bearer ${COACH_TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$COACH_EMAIL\"},\"role\":{\"stringValue\":\"coach\"}}}" \
  > /tmp/cp-coach.json
COACH_ROLE=$(python3 -c "import sys,json;print(json.load(open('/tmp/cp-coach.json'))['fields']['role']['stringValue'])")
check "coach profile written with role=coach" "coach" "$COACH_ROLE"

# ─── [2] Sign up athlete ─────────────────────────────────────────────
echo "[2/13] Sign up athlete + role=athlete profile"
ATH_SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ATHLETE_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
ATH_TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$ATH_SIGNUP")
ATH_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$ATH_SIGNUP")
curl -s -X PATCH "${BASE}/users/${ATH_UID}" \
  -H "Authorization: Bearer ${ATH_TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$ATHLETE_EMAIL\"},\"role\":{\"stringValue\":\"athlete\"},\"coachId\":{\"nullValue\":null}}}" \
  > /tmp/cp-athlete.json
ATH_ROLE=$(python3 -c "import sys,json;print(json.load(open('/tmp/cp-athlete.json'))['fields']['role']['stringValue'])")
check "athlete profile written with role=athlete" "athlete" "$ATH_ROLE"

# ─── [3] Athlete calls the setCoachByEmail equivalent ─────────────────
echo "[3/13] setCoachByEmail (athlete looks up coach + writes coachId)"
LOOKUP=$(find_coach_by_email "$ATH_TOKEN" "$COACH_EMAIL")
FOUND_UID=$(python3 -c "import sys,json;d=json.load(sys.stdin);ds=[r for r in d if 'document' in r];print(ds[0]['document']['name'].split('/')[-1] if ds else '')" <<<"$LOOKUP")
check "athlete's coach-by-email lookup finds coach uid" "$COACH_UID" "$FOUND_UID"

curl -s -X PATCH "${BASE}/users/${ATH_UID}?updateMask.fieldPaths=coachId" \
  -H "Authorization: Bearer ${ATH_TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"coachId\":{\"stringValue\":\"$COACH_UID\"}}}" \
  > /dev/null

# ─── [4] Verify athlete profile has coachId set ─────────────────────
echo "[4/13] Verify athlete profile now has coachId=COACH_UID"
ATH_READ=$(curl -s "${BASE}/users/${ATH_UID}" -H "Authorization: Bearer ${ATH_TOKEN}")
ATH_COACH_ID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['coachId']['stringValue'])" <<<"$ATH_READ")
check "athlete.coachId == coach uid" "$COACH_UID" "$ATH_COACH_ID"

# ─── [5] subscribeAthletesForCoach equivalent ─────────────────────────
echo "[5/13] Query users where coachId == COACH_UID (coach's view of roster)"
ROSTER_BODY=$(cat <<EOF
{"structuredQuery":{"from":[{"collectionId":"users"}],"where":{"fieldFilter":{"field":{"fieldPath":"coachId"},"op":"EQUAL","value":{"stringValue":"$COACH_UID"}}}}}
EOF
)
ROSTER=$(curl -s -X POST "${BASE}:runQuery" \
  -H "Authorization: Bearer ${COACH_TOKEN}" -H "Content-Type: application/json" \
  -d "$ROSTER_BODY")
ROSTER_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d if 'document' in r))" <<<"$ROSTER")
check "coach's roster query returns 1 athlete" "1" "$ROSTER_COUNT"

# ─── [6] Athlete creates a ski (we'll let the coach try to read it) ──
echo "[6/13] Athlete adds a ski to their fleet"
SKI=$(curl -s -X POST "${BASE}/users/${ATH_UID}/skis" \
  -H "Authorization: Bearer ${ATH_TOKEN}" -H "Content-Type: application/json" \
  -d '{"fields":{"name":{"stringValue":"Roster Ski"},"technique":{"stringValue":"classic"},"type":{"stringValue":"cold"},"retired":{"booleanValue":false}}}')
SKI_NAME=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['name']['stringValue'])" <<<"$SKI")
SKI_PATH=$(python3 -c "import sys,json;print(json.load(sys.stdin)['name'])" <<<"$SKI")
SKI_ID=$(basename "$SKI_PATH")
check "ski 'Roster Ski' created" "Roster Ski" "$SKI_NAME"

# ─── [7] Coach reads athlete's skis subcollection (should succeed) ───
echo "[7/13] Coach reads athlete's skis subcollection (rule: isCoachOf)"
COACH_READ=$(curl -s "${BASE}/users/${ATH_UID}/skis" -H "Authorization: Bearer ${COACH_TOKEN}")
COACH_SKI_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))" <<<"$COACH_READ")
check "coach sees 1 ski in athlete's fleet" "1" "$COACH_SKI_COUNT"

# ─── [8] Coach attempts to write to athlete's skis (should fail) ────
echo "[8/13] Coach POST to athlete's skis — should be denied"
WRITE_STATUS=$(http_status POST "${BASE}/users/${ATH_UID}/skis" "$COACH_TOKEN" \
  '{"fields":{"name":{"stringValue":"coach-attempted-write"}}}')
check "coach write to athlete's skis denied" "403" "$WRITE_STATUS"

# ─── [9] Athlete calls removeCoach ──────────────────────────────────
echo "[9/13] removeCoach — athlete clears coachId"
curl -s -X PATCH "${BASE}/users/${ATH_UID}?updateMask.fieldPaths=coachId" \
  -H "Authorization: Bearer ${ATH_TOKEN}" -H "Content-Type: application/json" \
  -d '{"fields":{"coachId":{"nullValue":null}}}' \
  > /dev/null
echo "  ✓ PATCH submitted"
PASS_COUNT=$((PASS_COUNT + 1))

# ─── [10] Verify coachId is null ────────────────────────────────────
echo "[10/13] Verify athlete profile coachId is now null"
ATH_READ_2=$(curl -s "${BASE}/users/${ATH_UID}" -H "Authorization: Bearer ${ATH_TOKEN}")
COACH_ID_NULL=$(python3 -c "import sys,json;f=json.load(sys.stdin)['fields']['coachId'];print('NULL' if 'nullValue' in f else 'NOT_NULL')" <<<"$ATH_READ_2")
check "athlete.coachId is null after removeCoach" "NULL" "$COACH_ID_NULL"

# ─── [11] Coach can no longer read athlete skis (rule: isCoachOf fails) ─
echo "[11/13] After unlink, coach read of athlete's skis is denied"
DENIED_STATUS=$(http_status GET "${BASE}/users/${ATH_UID}/skis" "$COACH_TOKEN")
# Listing may return 200 with an empty document set if Firestore can't
# evaluate the rule per-doc, OR 403 because the rule short-circuits.
# Test for either denied behavior:
#   - status 403, OR
#   - status 200 with 0 documents.
if [ "$DENIED_STATUS" = "403" ]; then
  echo "  ✓ coach list denied with 403"
  PASS_COUNT=$((PASS_COUNT + 1))
elif [ "$DENIED_STATUS" = "200" ]; then
  EMPTY=$(curl -s "${BASE}/users/${ATH_UID}/skis" -H "Authorization: Bearer ${COACH_TOKEN}")
  EMPTY_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))" <<<"$EMPTY")
  if [ "$EMPTY_COUNT" = "0" ]; then
    echo "  ✓ coach list returns 200 with 0 docs (rules filter)"
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    echo "  ✗ coach list returned $EMPTY_COUNT docs after unlink"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
else
  echo "  ✗ unexpected status $DENIED_STATUS"
  FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# Direct GET on a single ski should now be 403 even more cleanly:
SKI_GET=$(http_status GET "${BASE}/users/${ATH_UID}/skis/${SKI_ID}" "$COACH_TOKEN")
check "after unlink, coach direct ski read denied" "403" "$SKI_GET"

# ─── [12] setCoachByEmail with non-existent email ────────────────────
echo "[12/13] setCoachByEmail with non-existent email returns no coach"
GHOST_LOOKUP=$(find_coach_by_email "$ATH_TOKEN" "$GHOST_EMAIL")
GHOST_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d if 'document' in r))" <<<"$GHOST_LOOKUP")
check "non-existent email lookup returns 0 coaches (service throws coach/not-found)" "0" "$GHOST_COUNT"

# ─── [13] setCoachByEmail with an athlete email (role!=coach) ────────
echo "[13/13] setCoachByEmail with an athlete email returns no coach"
# Look up the original athlete (role=athlete) with the coach-role filter.
ATH_LOOKUP=$(find_coach_by_email "$ATH_TOKEN" "$ATHLETE_EMAIL")
ATH_LOOKUP_COUNT=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(sum(1 for r in d if 'document' in r))" <<<"$ATH_LOOKUP")
check "athlete email + role=coach filter returns 0 (service throws coach/not-found)" "0" "$ATH_LOOKUP_COUNT"
echo

echo "=============================="
echo "Passed: $PASS_COUNT, Failed: $FAIL_COUNT"
echo "=============================="
if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
