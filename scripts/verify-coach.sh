#!/bin/bash
# End-to-end verification of the coach feature against live Firestore.
# Exercises:
#   1. Create coach account (Auth + profile with role='coach')
#   2. Create athlete account (Auth + profile with role='athlete')
#   3. Athlete sets coachId via setCoachByEmail-equivalent REST flow
#   4. Athlete creates a ski + wax log
#   5. Coach lists athletes via `users where coachId == coachUid` (rule check)
#   6. Coach reads athlete profile directly (rule check)
#   7. Coach reads athlete's ski subcollection (rule check)
#   8. Coach reads athlete's waxLogs subcollection (rule check)
#   9. Coach attempts a forbidden write (should be denied)
#
# Exit 0 = all checks pass. Run after `firebase deploy --only firestore:rules`.

set -euo pipefail

API_KEY="AIzaSyD3c42tmL_-pSy7QwEdpAQ5Bkye9fJWAFg"
PROJECT="nordicfleet-11e67"
TS=$(date +%s)
COACH_EMAIL="coach-test-${TS}@nordicfleet.test"
ATHLETE_EMAIL="athlete-test-${TS}@nordicfleet.test"
PASS="Test1234!"

echo "=== Coach feature verification ==="
echo "Coach:   $COACH_EMAIL"
echo "Athlete: $ATHLETE_EMAIL"
echo

# --- 1. Sign up coach ---
echo "[1/9] Sign up coach..."
COACH_SIGNUP=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$COACH_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
COACH_TOKEN=$(echo "$COACH_SIGNUP" | python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])")
COACH_UID=$(echo "$COACH_SIGNUP" | python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])")
echo "  coach uid=$COACH_UID"

# Write coach profile with role='coach'.
curl -s -X PATCH "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${COACH_UID}" \
  -H "Authorization: Bearer ${COACH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$COACH_EMAIL\"},\"role\":{\"stringValue\":\"coach\"},\"coachId\":{\"nullValue\":null}}}" \
  > /dev/null
echo "  ✓ coach profile written"

# --- 2. Sign up athlete ---
echo "[2/9] Sign up athlete..."
ATH_SIGNUP=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ATHLETE_EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
ATH_TOKEN=$(echo "$ATH_SIGNUP" | python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])")
ATH_UID=$(echo "$ATH_SIGNUP" | python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])")
echo "  athlete uid=$ATH_UID"

# Write athlete profile with role='athlete' and coachId pointing at coach.
curl -s -X PATCH "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}" \
  -H "Authorization: Bearer ${ATH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$ATHLETE_EMAIL\"},\"role\":{\"stringValue\":\"athlete\"},\"coachId\":{\"stringValue\":\"$COACH_UID\"}}}" \
  > /dev/null
echo "  ✓ athlete profile written with coachId=$COACH_UID"

# --- 3. Athlete looks up coach by email (replicates findCoachByEmail) ---
echo "[3/9] Athlete queries 'users where email==coach AND role==coach'..."
# REST API structuredQuery
QUERY_BODY=$(python3 -c "
import json
print(json.dumps({
  'structuredQuery': {
    'from': [{'collectionId': 'users'}],
    'where': {
      'compositeFilter': {
        'op': 'AND',
        'filters': [
          {'fieldFilter': {'field': {'fieldPath': 'email'}, 'op': 'EQUAL', 'value': {'stringValue': '$COACH_EMAIL'}}},
          {'fieldFilter': {'field': {'fieldPath': 'role'}, 'op': 'EQUAL', 'value': {'stringValue': 'coach'}}}
        ]
      }
    }
  }
}))
")
QRESULT=$(curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery" \
  -H "Authorization: Bearer ${ATH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$QUERY_BODY")
FOUND_COACH=$(echo "$QRESULT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for row in d:
  if 'document' in row:
    name = row['document']['name']
    print(name.rsplit('/', 1)[-1])
    break
")
test "$FOUND_COACH" = "$COACH_UID" && echo "  ✓ athlete found coach by email" || { echo "  ✗ FAILED (got: '$FOUND_COACH')" && echo "$QRESULT" | head -c 1000 && exit 1; }

# --- 4. Athlete creates a ski + wax log ---
echo "[4/9] Athlete creates ski + wax log..."
SKI=$(curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}/skis" \
  -H "Authorization: Bearer ${ATH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"name":{"stringValue":"Coach E2E Ski"},"technique":{"stringValue":"classic"},"type":{"stringValue":"cold"},"retired":{"booleanValue":false}}}')
SKI_ID=$(echo "$SKI" | python3 -c "import sys,json;print(json.load(sys.stdin)['name'].rsplit('/',1)[-1])")
echo "  ✓ ski created: $SKI_ID"

curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}/waxLogs" \
  -H "Authorization: Bearer ${ATH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"skiId\":{\"stringValue\":\"$SKI_ID\"},\"date\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"glideLayers\":{\"integerValue\":\"2\"},\"glideWaxes\":{\"arrayValue\":{\"values\":[{\"stringValue\":\"CH8\"}]}},\"notes\":{\"stringValue\":\"coach e2e wax\"}}}" \
  > /dev/null
echo "  ✓ wax log created"

# --- 5. Coach lists athletes via `users where coachId == COACH_UID` ---
echo "[5/9] Coach queries 'users where coachId == self.uid'..."
QUERY2=$(python3 -c "
import json
print(json.dumps({
  'structuredQuery': {
    'from': [{'collectionId': 'users'}],
    'where': {'fieldFilter': {'field': {'fieldPath': 'coachId'}, 'op': 'EQUAL', 'value': {'stringValue': '$COACH_UID'}}}
  }
}))
")
QR=$(curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery" \
  -H "Authorization: Bearer ${COACH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$QUERY2")
ATH_LISTED=$(echo "$QR" | python3 -c "
import json, sys
d = json.load(sys.stdin)
for row in d:
  if 'document' in row:
    print(row['document']['name'].rsplit('/', 1)[-1])
")
echo "  Listed athletes: $ATH_LISTED"
echo "$ATH_LISTED" | grep -q "^$ATH_UID$" && echo "  ✓ coach found athlete" || { echo "  ✗ FAILED" && echo "$QR" | head -c 1000 && exit 1; }

# --- 6. Coach reads athlete profile ---
echo "[6/9] Coach reads athlete's profile doc..."
RP=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}" \
  -H "Authorization: Bearer ${COACH_TOKEN}")
RP_EMAIL=$(echo "$RP" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('fields',{}).get('email',{}).get('stringValue',''))")
test "$RP_EMAIL" = "$ATHLETE_EMAIL" && echo "  ✓ coach read athlete profile" || { echo "  ✗ FAILED (got: '$RP_EMAIL')" && echo "$RP" | head -c 600 && exit 1; }

# --- 7. Coach reads athlete's ski subcollection ---
echo "[7/9] Coach reads athlete's skis..."
RS=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}/skis" \
  -H "Authorization: Bearer ${COACH_TOKEN}")
COUNT=$(echo "$RS" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))")
test "$COUNT" = "1" && echo "  ✓ coach read $COUNT ski(s)" || { echo "  ✗ FAILED (count=$COUNT)" && echo "$RS" | head -c 600 && exit 1; }

# --- 8. Coach reads athlete's waxLogs ---
echo "[8/9] Coach reads athlete's wax logs..."
RW=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}/waxLogs" \
  -H "Authorization: Bearer ${COACH_TOKEN}")
WCOUNT=$(echo "$RW" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))")
test "$WCOUNT" = "1" && echo "  ✓ coach read $WCOUNT wax log(s)" || { echo "  ✗ FAILED (count=$WCOUNT)" && echo "$RW" | head -c 600 && exit 1; }

# --- 9. Coach attempts a write to athlete's profile (should be denied) ---
echo "[9/9] Coach attempts to write athlete's profile (must be denied)..."
WR=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
  "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${ATH_UID}?updateMask.fieldPaths=weight" \
  -H "Authorization: Bearer ${COACH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"weight":{"integerValue":"999"}}}')
test "$WR" = "403" && echo "  ✓ write denied (HTTP $WR)" || { echo "  ✗ FAILED — write was permitted (HTTP $WR)" && exit 1; }

echo
echo "=== COACH FEATURE: ALL 9 CHECKS PASSED ==="
echo "Coach uid:   $COACH_UID"
echo "Athlete uid: $ATH_UID"
