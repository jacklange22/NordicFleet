#!/bin/bash
# End-to-end verification of the NordicFleet data layer using Firebase REST APIs.
# Exercises the same Auth + Firestore code paths the iOS app does:
#   Auth: signUp / signIn
#   Firestore: createDocument (users/{uid}, users/{uid}/skis/, /waxLogs/, /testLogs/)
#              patchDocument (users/{uid}.weight)
#              listDocuments  (read-back verification)
# Uses the Firebase project's API key (public, safe to hard-code; rules enforce auth).
#
# Exit 0 = all flows verified, exit non-zero = a flow failed.

set -euo pipefail

API_KEY="AIzaSyD3c42tmL_-pSy7QwEdpAQ5Bkye9fJWAFg"
PROJECT="nordicfleet-11e67"
TS=$(date +%s)
EMAIL="e2e-test-${TS}@nordicfleet.test"
PASS="Test1234!"

echo "=== NordicFleet flow verification ==="
echo "Test user: $EMAIL"
echo

# --- Flow 1: Signup → user doc creation ---
echo "[1/6] Signup..."
SIGNUP=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
ID_TOKEN=$(echo "$SIGNUP" | python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])")
USER_UID=$(echo "$SIGNUP" | python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])")
echo "  uid=$USER_UID"

# Write users/{uid} document — same shape as services/userService.js#createProfile
echo "  Writing users/$USER_UID profile doc..."
curl -s -X PATCH "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$EMAIL\"},\"displayName\":{\"nullValue\":null},\"weight\":{\"nullValue\":null},\"height\":{\"nullValue\":null},\"team\":{\"nullValue\":null},\"location\":{\"nullValue\":null}}}" \
  > /tmp/v-flow1.json
test "$(python3 -c "import sys,json;print(json.load(open('/tmp/v-flow1.json'))['fields']['email']['stringValue'])")" = "$EMAIL" && \
  echo "  ✓ profile doc created" || { echo "  ✗ FAILED" && cat /tmp/v-flow1.json && exit 1; }

# --- Flow 2: Add ski ---
echo "[2/6] Add ski (Fischer Speedmax)..."
curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}/skis" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"name":{"stringValue":"Test Ski 1"},"brand":{"stringValue":"Fischer"},"model":{"stringValue":"Speedmax"},"technique":{"stringValue":"classic"},"type":{"stringValue":"cold"},"build":{"stringValue":"World Cup"},"base":{"stringValue":"Plus"},"grind":{"stringValue":"Universal"},"length":{"integerValue":"200"},"flex":{"integerValue":"90"},"notes":{"stringValue":""},"retired":{"booleanValue":false}}}' \
  > /tmp/v-flow2.json
SKI_NAME=$(python3 -c "import sys,json;print(json.load(open('/tmp/v-flow2.json'))['fields']['name']['stringValue'])")
SKI_PATH=$(python3 -c "import sys,json;print(json.load(open('/tmp/v-flow2.json'))['name'])")
SKI_ID=$(basename "$SKI_PATH")
test "$SKI_NAME" = "Test Ski 1" && echo "  ✓ ski created, id=$SKI_ID" || { echo "  ✗ FAILED" && cat /tmp/v-flow2.json && exit 1; }

# Read-back: list skis
LIST=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}/skis" \
  -H "Authorization: Bearer ${ID_TOKEN}")
COUNT=$(echo "$LIST" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))")
test "$COUNT" = "1" && echo "  ✓ ski list read-back: 1 doc" || { echo "  ✗ FAILED count=$COUNT" && exit 1; }

# --- Flow 3: Wax log ---
echo "[3/6] Wax log for Test Ski 1..."
curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}/waxLogs" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"skiId\":{\"stringValue\":\"$SKI_ID\"},\"date\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"binder\":{\"nullValue\":null},\"kickLayers\":{\"integerValue\":\"1\"},\"kickWax\":{\"stringValue\":\"VR40\"},\"glideLayers\":{\"integerValue\":\"2\"},\"glideWaxes\":{\"arrayValue\":{\"values\":[{\"stringValue\":\"CH8\"},{\"stringValue\":\"HF8\"}]}},\"notes\":{\"stringValue\":\"test wax\"}}}" \
  > /tmp/v-flow3.json
WAX_KICK=$(python3 -c "import sys,json;print(json.load(open('/tmp/v-flow3.json'))['fields']['kickWax']['stringValue'])")
test "$WAX_KICK" = "VR40" && echo "  ✓ wax log created" || { echo "  ✗ FAILED" && cat /tmp/v-flow3.json && exit 1; }

# --- Flow 4: Test log ---
echo "[4/6] Test log for Test Ski 1..."
curl -s -X POST "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}/testLogs" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"fields\":{\"skiId\":{\"stringValue\":\"$SKI_ID\"},\"date\":{\"timestampValue\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},\"temperature\":{\"integerValue\":\"-5\"},\"humidity\":{\"integerValue\":\"70\"},\"snowType\":{\"stringValue\":\"old\"},\"surface\":{\"stringValue\":\"hardpack\"},\"glideWax\":{\"stringValue\":\"CH8\"},\"kickWax\":{\"stringValue\":\"VR40\"},\"glideRating\":{\"integerValue\":\"8\"},\"kickRating\":{\"integerValue\":\"7\"},\"notes\":{\"stringValue\":\"e2e test\"}}}" \
  > /tmp/v-flow4.json
TEMP=$(python3 -c "import sys,json;print(json.load(open('/tmp/v-flow4.json'))['fields']['temperature']['integerValue'])")
test "$TEMP" = "-5" && echo "  ✓ test log created" || { echo "  ✗ FAILED" && cat /tmp/v-flow4.json && exit 1; }

# --- Flow 5: Profile edit (weight) ---
echo "[5/6] Profile edit: weight=72..."
curl -s -X PATCH "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}?updateMask.fieldPaths=weight" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"fields":{"weight":{"integerValue":"72"}}}' \
  > /tmp/v-flow5.json
WEIGHT=$(python3 -c "import sys,json;print(json.load(open('/tmp/v-flow5.json'))['fields']['weight']['integerValue'])")
test "$WEIGHT" = "72" && echo "  ✓ weight updated to 72" || { echo "  ✗ FAILED" && cat /tmp/v-flow5.json && exit 1; }

# --- Flow 6: Sign in again, verify persistence ---
echo "[6/6] Sign out + sign in, verify persistence..."
SIGNIN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
ID_TOKEN2=$(echo "$SIGNIN" | python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])")
test -n "$ID_TOKEN2" && echo "  ✓ signed back in" || { echo "  ✗ FAILED" && echo "$SIGNIN" && exit 1; }

# Read profile + ski list
PROFILE=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}" \
  -H "Authorization: Bearer ${ID_TOKEN2}")
P_WEIGHT=$(echo "$PROFILE" | python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['weight']['integerValue'])")
test "$P_WEIGHT" = "72" && echo "  ✓ weight persisted across session" || { echo "  ✗ FAILED" && echo "$PROFILE" && exit 1; }

SKIS=$(curl -s "https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${USER_UID}/skis" \
  -H "Authorization: Bearer ${ID_TOKEN2}")
S_COUNT=$(echo "$SKIS" | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))")
test "$S_COUNT" = "1" && echo "  ✓ ski list persisted" || { echo "  ✗ FAILED count=$S_COUNT" && exit 1; }

echo
echo "=== ALL 6 FLOWS VERIFIED ==="
echo "Test uid: $USER_UID"
echo "Test email: $EMAIL"
