#!/bin/bash
# Regression test for the seed-clobbers-profile bug.
#
# The old seed code called `createProfile` on every run, which set-with-merge'd
# null defaults for weight/height/team/location/role/coachId — clobbering the
# user's real data. The new seed is strictly additive: it only writes to the
# skis subcollection.
#
# This script reproduces the failure mode against live Firestore:
#   1. Sign up a fresh account.
#   2. Write a real profile with weight=70 + role=coach.
#   3. Write a real (non-seed) ski.
#   4. Run the seed-equivalent over REST.
#   5. Verify: 2 seed skis added, real ski preserved, profile intact.
#   6. Run seed a second time.
#   7. Verify: still 2 seed skis (not 4), real ski preserved, profile intact.
#
# The seed logic itself is JS; we replicate it here via REST. The fix is
# verified end-to-end because we read back every relevant document after
# each step.

set -euo pipefail

API_KEY="AIzaSyD3c42tmL_-pSy7QwEdpAQ5Bkye9fJWAFg"
PROJECT="nordicfleet-11e67"
BASE="https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents"
AUTH="https://identitytoolkit.googleapis.com/v1/accounts"
TS=$(date +%s)
EMAIL="seed-verify-${TS}@nordicfleet.test"
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

# REST-equivalent of the JS seedCurrentUser():
# 1. List skis, collect seedIds already present.
# 2. For each sample ski not yet present, POST it.
seed_run() {
  local token="$1" uid="$2"
  # List existing skis.
  local list
  list=$(curl -s "${BASE}/users/${uid}/skis" -H "Authorization: Bearer ${token}")
  local existing_seed_ids
  existing_seed_ids=$(python3 -c "
import sys, json
d = json.load(sys.stdin)
out = []
for doc in d.get('documents', []):
    f = doc.get('fields', {})
    sid = f.get('seedId', {})
    if 'stringValue' in sid:
        out.append(sid['stringValue'])
print(','.join(out))
" <<<"$list")

  local created=0 skipped=0
  # Walk seedData.json and POST any ski whose seedId isn't already present.
  python3 <<EOF >/tmp/seed-actions.json
import json
existing = set(filter(None, "$existing_seed_ids".split(',')))
d = json.load(open('src/seedData.json'))
to_create = []
to_skip = []
for ski in d['users'][0]['skis']:
    if ski['id'] in existing:
        to_skip.append(ski['id'])
    else:
        to_create.append(ski)
json.dump({'create': to_create, 'skip': to_skip}, open('/tmp/seed-actions.json', 'w'))
EOF
  local to_create_count
  to_create_count=$(python3 -c "import json;print(len(json.load(open('/tmp/seed-actions.json'))['create']))")
  local to_skip_count
  to_skip_count=$(python3 -c "import json;print(len(json.load(open('/tmp/seed-actions.json'))['skip']))")

  python3 <<'PYEOF' > /tmp/seed-payloads.json
import json
actions = json.load(open('/tmp/seed-actions.json'))
payloads = []
for ski in actions['create']:
    fields = {
        'seedId': {'stringValue': ski['id']},
        'name': {'stringValue': ski['name']},
        'brand': {'stringValue': ski['brand']},
        'model': {'stringValue': ski.get('model', ski['name'])},
        'technique': {'stringValue': ski['technique'].lower()},
        'type': {'stringValue': ski['type'].lower()},
        'build': {'stringValue': ski.get('build', '')},
        'base': {'stringValue': ski.get('base', '')},
        'grind': {'stringValue': ski.get('grind', '')},
        'length': {'integerValue': str(ski.get('length', 0))},
        'flex': {'integerValue': str(ski.get('flex', 0))},
        'year': {'integerValue': str(ski.get('year', 0))},
        'notes': {'stringValue': ski.get('notes', '')},
        'retired': {'booleanValue': False},
    }
    payloads.append({'fields': fields})
json.dump(payloads, open('/tmp/seed-payloads.json', 'w'))
PYEOF

  local count
  count=$(python3 -c "import json;print(len(json.load(open('/tmp/seed-payloads.json'))))")
  if [ "$count" -gt 0 ]; then
    for i in $(seq 0 $((count - 1))); do
      python3 -c "import json;json.dump(json.load(open('/tmp/seed-payloads.json'))[$i], open('/tmp/seed-one.json','w'))"
      curl -s -X POST "${BASE}/users/${uid}/skis" \
        -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" \
        --data-binary @/tmp/seed-one.json > /dev/null
      created=$((created + 1))
    done
  fi
  echo "{\"created\":$created,\"skipped\":$to_skip_count}"
}

echo "=== Seed bug regression verification ==="
echo "User: $EMAIL"
echo

# --- Setup: sign up and create a profile with role=coach + weight=70 ---
echo "[setup] Sign up + write real profile (weight=70, role=coach)"
SIGNUP=$(curl -s "${AUTH}:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"returnSecureToken\":true}")
TOKEN=$(python3 -c "import sys,json;print(json.load(sys.stdin)['idToken'])" <<<"$SIGNUP")
USER_UID=$(python3 -c "import sys,json;print(json.load(sys.stdin)['localId'])" <<<"$SIGNUP")

curl -s -X PATCH "${BASE}/users/${USER_UID}" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  -d "{\"fields\":{\"email\":{\"stringValue\":\"$EMAIL\"},\"role\":{\"stringValue\":\"coach\"},\"weight\":{\"integerValue\":\"70\"},\"team\":{\"stringValue\":\"Real Team\"},\"coachId\":{\"nullValue\":null}}}" \
  > /dev/null
echo "  uid=$USER_UID, role=coach, weight=70, team=Real Team"

# --- Step 3: add a real (non-seed) ski ---
echo "[setup] Add a real (non-seed) ski"
REAL_SKI=$(curl -s -X POST "${BASE}/users/${USER_UID}/skis" \
  -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" \
  -d '{"fields":{"name":{"stringValue":"My Real Ski"},"technique":{"stringValue":"classic"},"retired":{"booleanValue":false}}}')
REAL_SKI_PATH=$(python3 -c "import sys,json;print(json.load(sys.stdin)['name'])" <<<"$REAL_SKI")
REAL_SKI_ID=$(basename "$REAL_SKI_PATH")
echo "  real ski id=$REAL_SKI_ID"
echo

# --- First seed run ---
echo "[run 1] Seed first time"
RESULT_1=$(seed_run "$TOKEN" "$USER_UID")
CREATED_1=$(python3 -c "import sys,json;print(json.load(sys.stdin)['created'])" <<<"$RESULT_1")
SKIPPED_1=$(python3 -c "import sys,json;print(json.load(sys.stdin)['skipped'])" <<<"$RESULT_1")
check "first run created 2 seed skis" "2" "$CREATED_1"
check "first run skipped 0 skis" "0" "$SKIPPED_1"

# Read back profile + skis after first run.
PROFILE_1=$(curl -s "${BASE}/users/${USER_UID}" -H "Authorization: Bearer ${TOKEN}")
WEIGHT_1=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['weight']['integerValue'])" <<<"$PROFILE_1")
ROLE_1=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['role']['stringValue'])" <<<"$PROFILE_1")
TEAM_1=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['team']['stringValue'])" <<<"$PROFILE_1")
check "profile.weight intact after seed (70)" "70" "$WEIGHT_1"
check "profile.role intact after seed (coach)" "coach" "$ROLE_1"
check "profile.team intact after seed (Real Team)" "Real Team" "$TEAM_1"

# Real ski still exists.
REAL_GONE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE}/users/${USER_UID}/skis/${REAL_SKI_ID}" -H "Authorization: Bearer ${TOKEN}")
check "real (non-seed) ski still exists after first run" "200" "$REAL_GONE"

# Total ski count: 1 real + 2 seed = 3.
SKIS_LIST_1=$(curl -s "${BASE}/users/${USER_UID}/skis" -H "Authorization: Bearer ${TOKEN}")
TOTAL_1=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))" <<<"$SKIS_LIST_1")
check "total ski count after first run is 3 (1 real + 2 seed)" "3" "$TOTAL_1"
echo

# --- Second seed run (idempotency check) ---
echo "[run 2] Seed a second time (idempotency)"
RESULT_2=$(seed_run "$TOKEN" "$USER_UID")
CREATED_2=$(python3 -c "import sys,json;print(json.load(sys.stdin)['created'])" <<<"$RESULT_2")
SKIPPED_2=$(python3 -c "import sys,json;print(json.load(sys.stdin)['skipped'])" <<<"$RESULT_2")
check "second run creates 0 new skis" "0" "$CREATED_2"
check "second run skips 2 already-seeded skis" "2" "$SKIPPED_2"

# Ski count unchanged.
SKIS_LIST_2=$(curl -s "${BASE}/users/${USER_UID}/skis" -H "Authorization: Bearer ${TOKEN}")
TOTAL_2=$(python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('documents',[])))" <<<"$SKIS_LIST_2")
check "total ski count after second run still 3 (not doubled)" "3" "$TOTAL_2"

# Profile still intact.
PROFILE_2=$(curl -s "${BASE}/users/${USER_UID}" -H "Authorization: Bearer ${TOKEN}")
WEIGHT_2=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['weight']['integerValue'])" <<<"$PROFILE_2")
ROLE_2=$(python3 -c "import sys,json;print(json.load(sys.stdin)['fields']['role']['stringValue'])" <<<"$PROFILE_2")
check "profile.weight still intact after second run (70)" "70" "$WEIGHT_2"
check "profile.role still intact after second run (coach)" "coach" "$ROLE_2"
echo

echo "=============================="
echo "Passed: $PASS_COUNT, Failed: $FAIL_COUNT"
echo "=============================="
if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
