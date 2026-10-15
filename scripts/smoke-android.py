"""Launch the actual APK and enter combat through Android's touch/accessibility APIs."""
from pathlib import Path
import os,subprocess,time,re,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
SDK=Path(os.environ.get('ANDROID_HOME','/usr/local/lib/android/sdk'));ADB=SDK/'platform-tools/adb'
def adb(*args,capture=False):
 result=subprocess.run([str(ADB),*args],capture_output=True,text=True,timeout=60)
 if not capture or result.returncode:
  if result.stdout:print(result.stdout,flush=True)
  if result.stderr:print(result.stderr,flush=True)
 result.check_returncode();return result
def screenshot(name):
 with (ROOT/'releases'/name).open('wb') as output:subprocess.run([str(ADB),'exec-out','screencap','-p'],stdout=output,check=True,timeout=20)
def tap_text(text):
 adb('shell','uiautomator','dump','--compressed','/sdcard/star-abyss-ui.xml')
 source=adb('shell','cat','/sdcard/star-abyss-ui.xml',capture=True).stdout
 (ROOT/'releases/android-ui.xml').write_text(source)
 for node in ET.fromstring(source).iter('node'):
  if text in node.get('text','') or text in node.get('content-desc',''):
   box=[int(n) for n in re.findall(r'\d+',node.get('bounds',''))]
   if len(box)==4 and box[2]>box[0] and box[3]>box[1]:
    adb('shell','input','tap',str((box[0]+box[2])//2),str((box[1]+box[3])//2));return
 raise AssertionError('Android accessibility control missing: '+text)
adb('shell','wm','size','780x1688');adb('shell','wm','density','320')
adb('install','-r',str(next((ROOT/'releases').glob('Star-Abyss-Android-*.apk'))))
adb('logcat','-c');adb('shell','am','start','-W','-n','com.asukachen.starabyss/.GameActivity');time.sleep(15)
(ROOT/'releases/android-webview.log').write_text(adb('shell','dumpsys','webviewupdate',capture=True).stdout)
(ROOT/'releases/android-console.log').write_text(adb('logcat','-d','-s','chromium','AndroidRuntime','StarAbyss',capture=True).stdout)
screenshot('android-native-hangar.png')
for _ in range(6):adb('shell','input','swipe','400','1400','400','300','200')
tap_text('开始出击');time.sleep(2)
# Route cards follow the horizontally scrollable map.
for _ in range(4):adb('shell','input','swipe','400','1400','400','450','200')
try:tap_text('普通战斗')
except AssertionError:tap_text('裂隙')
time.sleep(2);screenshot('android-native-battle.png')
adb('shell','uiautomator','dump','--compressed','/sdcard/star-abyss-ui.xml')
source=adb('shell','cat','/sdcard/star-abyss-ui.xml',capture=True).stdout
assert '闪避' in source and '构筑' in source,'Native Android combat controls failed to load'
print('PASS: native Android APK launches with local assets and enters combat using real UI taps')
