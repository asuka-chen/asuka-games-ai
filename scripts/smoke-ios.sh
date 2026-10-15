#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p releases
exec > >(tee releases/ios-simulator.log) 2>&1
task_ios_simulator_build="$(pwd)/releases/ios-simulator-build"
xcodebuild -project native/ios/StarAbyss.xcodeproj -scheme StarAbyss -configuration Debug -sdk iphonesimulator -destination generic/platform=iOS\ Simulator -derivedDataPath "$task_ios_simulator_build" CODE_SIGNING_ALLOWED=NO build
# Use a runtime already installed on the Mac runner; do not download an SDK.
task_ios_simulator_id="$(xcrun simctl list devices available -j | python3 -c 'import json,sys; devices=json.load(sys.stdin)["devices"]; print(next(d["udid"] for rows in devices.values() for d in rows if d["name"].startswith("iPhone")))')"
xcrun simctl boot "$task_ios_simulator_id"
xcrun simctl bootstatus "$task_ios_simulator_id" -b
xcrun simctl install "$task_ios_simulator_id" "$task_ios_simulator_build/Build/Products/Debug-iphonesimulator/StarAbyss.app"
xcrun simctl launch "$task_ios_simulator_id" com.asukachen.starabyss
sleep 8
xcrun simctl io "$task_ios_simulator_id" screenshot releases/ios-simulator.png
xcrun simctl spawn "$task_ios_simulator_id" launchctl list | rg 'com.asukachen.starabyss'
xcrun simctl shutdown "$task_ios_simulator_id"
