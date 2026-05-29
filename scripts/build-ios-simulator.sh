#!/bin/bash
# Build the NordicFleet iOS app for a simulator — from the CORRECT dir.
#
# Common mistake: running `xcodebuild` from apps/mobile (no Xcode project
# there) or from apps/mobile/ios with a device destination (needs signing).
# This script always uses the workspace + a simulator destination, so it
# never hits code-signing.
#
# Usage:
#   ./scripts/build-ios-simulator.sh                # defaults to "iPhone 17"
#   ./scripts/build-ios-simulator.sh "iPhone 15"    # pick another simulator
set -euo pipefail

SIM="${1:-iPhone 17}"
IOS_DIR="$(cd "$(dirname "$0")/../apps/mobile/ios" && pwd)"
cd "$IOS_DIR"

if ! xcrun simctl list devices available | grep -q "$SIM"; then
  echo "Simulator '$SIM' not found. Available iPhone simulators:"
  xcrun simctl list devices available | grep -i iphone || true
  echo
  echo "Re-run with one of the above, e.g.:"
  echo "  ./scripts/build-ios-simulator.sh \"iPhone 16\""
  exit 1
fi

echo "Building NordicFleet (Debug) for simulator: $SIM"
exec xcodebuild \
  -workspace NordicFleet.xcworkspace \
  -scheme NordicFleet \
  -configuration Debug \
  -derivedDataPath build \
  -destination "platform=iOS Simulator,name=$SIM" \
  build
