#!/usr/bin/env bash
# Build the offline NJH debug APK end to end.
#   bash tools/offline/build-apk.sh [output-dir]
# Needs JDK 21 + Android SDK (platform 35, build-tools 35). On the Grok box: source /workspace/njh-toolchain/env.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
OUTDIR="${1:-$REPO/../njh-apk}"
[ -f /workspace/njh-toolchain/env.sh ] && source /workspace/njh-toolchain/env.sh
cd "$REPO"
node tools/offline/build-offline.mjs --out offline-www
cd njh-android
[ -d node_modules/@capacitor/android ] || npm ci --silent
echo "sdk.dir=${ANDROID_HOME:?set ANDROID_HOME}" > android/local.properties
npx cap sync android
cd android && ./gradlew assembleDebug --console=plain -q
mkdir -p "$OUTDIR"
cp app/build/outputs/apk/debug/app-debug.apk "$OUTDIR/NJH-offline-debug.apk"
ls -la "$OUTDIR/NJH-offline-debug.apk"
