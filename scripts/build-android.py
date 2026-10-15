"""Compile a self-contained APK using only the official Android SDK and Java modules."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import os,subprocess,shutil,secrets,json,hashlib,sys
ROOT=Path(__file__).resolve().parent.parent
SDK=ROOT/'.cache/android-sdk';TOOLS=SDK/'build-tools/35.0.0';ANDROID=SDK/'platforms/android-35/android.jar'
BUILD=ROOT/'releases/android-build';shutil.rmtree(BUILD,ignore_errors=True);BUILD.mkdir(parents=True,exist_ok=True)
def run(args):subprocess.run([str(a) for a in args],check=True,cwd=ROOT)
assert ANDROID.exists(),'Run python scripts/setup-android.py first'
assert (ROOT/'releases/mobile-www/game.bundle.js').exists(),'Run node scripts/build-mobile.mjs first'
resources=BUILD/'res/drawable';resources.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/'star-abyss/assets/app-icon-512.png',resources/'app_icon.png')
run([TOOLS/'aapt2','compile','--dir',BUILD/'res','-o',BUILD/'resources.zip'])
manifest=ROOT/'native/android/AndroidManifest.xml'
qa='--qa' in sys.argv[1:]
if qa:
 manifest=BUILD/'AndroidManifest.xml';manifest.write_text((ROOT/'native/android/AndroidManifest.xml').read_text().replace('<application ', '<application android:debuggable="true" ',1))
run([TOOLS/'aapt2','link','-I',ANDROID,'--manifest',manifest,'-R',BUILD/'resources.zip','--auto-add-overlay','-o',BUILD/'base.apk'])
classes=BUILD/'classes';classes.mkdir(exist_ok=True)
sources=list((ROOT/'native/android/src').rglob('*.java'))
run(['java','-m','jdk.compiler/com.sun.tools.javac.Main','-source','8','-target','8','-classpath',ANDROID,'-d',classes,*sources])
dex=BUILD/'dex';dex.mkdir(exist_ok=True);run([TOOLS/'d8','--lib',ANDROID,'--min-api','28','--output',dex,*classes.rglob('*.class')])
unsigned=BUILD/'unsigned.apk';shutil.copyfile(BUILD/'base.apk',unsigned)
with ZipFile(unsigned,'a',ZIP_DEFLATED) as zipped:
 for file in dex.glob('*.dex'):zipped.write(file,file.name)
 for file in sorted((ROOT/'releases/mobile-www').rglob('*')):
  if file.is_file():zipped.write(file,Path('assets/www')/file.relative_to(ROOT/'releases/mobile-www'))
run([TOOLS/'zipalign','-f','4',unsigned,BUILD/'aligned.apk'])
signing=ROOT/'.cache/android-signing';signing.mkdir(exist_ok=True);password=signing/'password';key=signing/'star-abyss.keystore'
if not key.exists():
 password.write_text(secrets.token_hex(24));password.chmod(0o600)
 run(['keytool','-genkeypair','-keystore',key,'-storepass:file',password,'-keypass:file',password,'-alias','star-abyss','-dname','CN=Star Abyss Prototype,O=Asuka Games,C=CN','-keyalg','RSA','-keysize','4096','-validity','10000']);key.chmod(0o600)
version=json.loads((ROOT/'package.json').read_text())['version'];output=ROOT/f'releases/Star-Abyss-Android-v{version}{"-qa" if qa else ""}.apk'
run([TOOLS/'apksigner','sign','--ks',key,'--ks-key-alias','star-abyss','--ks-pass','file:'+str(password),'--out',output,BUILD/'aligned.apk'])
run([TOOLS/'apksigner','verify','--verbose',output]);run([TOOLS/'aapt2','dump','badging',output])
with ZipFile(output) as zipped:assert zipped.testzip() is None and 'classes.dex' in zipped.namelist() and 'assets/www/game.bundle.js' in zipped.namelist()
checksum=hashlib.sha256(output.read_bytes()).hexdigest();output.with_suffix('.apk.sha256').write_text(checksum+'  '+output.name+'\n');print('Verified Android APK:',output.name,output.stat().st_size,'bytes')
