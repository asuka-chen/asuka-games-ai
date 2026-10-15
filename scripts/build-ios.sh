#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v xcodebuild >/dev/null; then
  echo 'An Apple Mac with Xcode is required to compile the iOS app.' >&2
  exit 1
fi
node scripts/build-mobile.mjs
task_ios_build="$(pwd)/releases/ios-build"
xcodebuild -project native/ios/StarAbyss.xcodeproj -scheme StarAbyss -configuration Release -sdk iphoneos -destination generic/platform=iOS -derivedDataPath "$task_ios_build" CODE_SIGNING_ALLOWED=NO build
python3 - <<'PY'
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import json,plistlib,hashlib
root=Path.cwd();version=json.loads((root/'package.json').read_text())['version'];app=root/'releases/ios-build/Build/Products/Release-iphoneos/StarAbyss.app';assert app.exists();info=plistlib.loads((app/'Info.plist').read_bytes());assert info['CFBundleShortVersionString']==version;assert (app/'www/game.bundle.js').exists()
ipa=root/f'releases/Star-Abyss-iOS-v{version}-unsigned.ipa'
with ZipFile(ipa,'w',ZIP_DEFLATED) as archive:
 for file in sorted(app.rglob('*')):
  if file.is_file():archive.write(file,Path('Payload/StarAbyss.app')/file.relative_to(app))
with ZipFile(ipa) as archive:assert archive.testzip() is None
ipa.with_suffix('.ipa.sha256').write_text(hashlib.sha256(ipa.read_bytes()).hexdigest()+'  '+ipa.name+'\n');print('Built unsigned iOS IPA:',ipa.name,'(requires Apple signing before installation)')
PY
