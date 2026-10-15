#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p releases
exec > >(tee releases/android-emulator.log) 2>&1
sudo chmod a+rw /dev/kvm
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" 'system-images;android-35;google_apis;x86_64'
echo no | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd --force --name star-abyss-qa --package 'system-images;android-35;google_apis;x86_64' --device pixel_5
"$ANDROID_HOME/emulator/emulator" -avd star-abyss-qa -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect -memory 2048 -no-metrics > releases/android-emulator-process.log 2>&1 &
task_android_emulator_pid=$!
timeout 180 "$ANDROID_HOME/platform-tools/adb" wait-for-device
for attempt in $(seq 1 120); do
  if [ "$("$ANDROID_HOME/platform-tools/adb" shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; then exit 0; fi
  if ! kill -0 "$task_android_emulator_pid" 2>/dev/null; then cat releases/android-emulator-process.log; exit 1; fi
  sleep 2
done
cat releases/android-emulator-process.log
exit 1
