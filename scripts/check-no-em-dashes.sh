#!/bin/bash
# Guard: fail if an em dash (U+2014, the "—" character) appears in user-facing
# app source. User-facing copy must use commas, periods, parentheses, colons,
# or hyphens instead. Scope is app source under apps/*/src, excluding tests,
# node_modules, and build output (test files and code internals are not shown
# to users).
#
# Run: ./scripts/check-no-em-dashes.sh   (exit 1 on any hit)

set -uo pipefail
cd "$(dirname "$0")/.."

HITS=$(grep -rn $'—' \
  apps/marketing/src apps/web/src apps/mobile/src \
  --include="*.js" --include="*.jsx" --include="*.tsx" 2>/dev/null \
  | grep -v "/node_modules/" | grep -v "/__tests__/" | grep -v "/.next/")

if [ -n "$HITS" ]; then
  echo "Em dash found in user-facing source. Replace with , . ( ) : or - :"
  echo "$HITS"
  exit 1
fi

echo "OK: no em dashes in user-facing app source (apps/*/src)."
