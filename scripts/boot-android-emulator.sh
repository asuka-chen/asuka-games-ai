#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p releases
exec > >(tee releases/android-emulator.log) 2>&1
export ANDROID_AVD_HOME="$(pwd)/.cache/android-avd"
mkdir -p "$ANDROID_AVD_HOME"
sudo chmod a+rw /dev/kvm
"$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" 'system-images;android-35;google_apis;x86_64'
echo no | "$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager" create avd --force --name star-abyss-qa --package 'system-images;android-35;google_apis;x86_64' --device pixel_5 --path "$ANDROID_AVD_HOME/star-abyss-qa.avd"
test -f "$ANDROID_AVD_HOME/star-abyss-qa.ini"
"$ANDROID_HOME/emulator/emulator" -list-avds
nohup "$ANDROID_HOME/emulator/emulator" -avd star-abyss-qa -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect -feature -Vulkan -memory 2048 -no-metrics > releases/android-emulator-process.log 2>&1 &
task_android_emulator_pid=$!
cleanup(){ task_android_status=$?; set +e; if ! kill -0 "$task_android_emulator_pid" 2>/dev/null; then wait "$task_android_emulator_pid"; echo "Emulator exited with code $?"; fi; kill "$task_android_emulator_pid" 2>/dev/null; exit "$task_android_status"; }
trap cleanup EXIT
timeout 180 "$ANDROID_HOME/platform-tools/adb" wait-for-device
task_android_ready=0
for attempt in $(seq 1 120); do
  if [ "$("$ANDROID_HOME/platform-tools/adb" shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; then task_android_ready=1; break; fi
  if ! kill -0 "$task_android_emulator_pid" 2>/dev/null; then cat releases/android-emulator-process.log; exit 1; fi
  sleep 2
done
if [ "$task_android_ready" != 1 ]; then cat releases/android-emulator-process.log; exit 1; fi
# Keep emulator and test in one foreground step; do not orphan the device between steps.
node scripts/smoke-android.mjs 2>&1 | tee releases/android-smoke.log
