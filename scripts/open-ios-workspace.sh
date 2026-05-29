#!/bin/bash
# Open the NordicFleet iOS workspace in Xcode.
#
# Always open the .xcworkspace (CocoaPods), never the .xcodeproj — opening
# the project directly will fail to find the Pods.
set -euo pipefail

IOS_DIR="$(cd "$(dirname "$0")/../apps/mobile/ios" && pwd)"
open "$IOS_DIR/NordicFleet.xcworkspace"
