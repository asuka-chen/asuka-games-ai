"""Install the two required Android SDK components locally with Google's checksums."""
from pathlib import Path
from urllib.request import urlopen
from concurrent.futures import ThreadPoolExecutor
from zipfile import ZipFile
import hashlib,shutil,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
SDK=ROOT/'.cache/android-sdk'
SDK.mkdir(parents=True,exist_ok=True)
with urlopen('https://dl.google.com/android/repository/repository2-3.xml',timeout=90) as response:metadata=response.read()
packages=ET.fromstring(metadata)
def install(spec):
 name,destination,marker=spec;target=SDK/destination
 if (target/marker).exists():print('SDK already available:',name,flush=True);return
 package=next(p for p in packages.iter('remotePackage') if p.attrib.get('path')==name)
 archive=next(a for a in package.findall('./archives/archive') if a.findtext('host-os') in [None,'linux']).find('complete')
 filename=archive.findtext('url');expected=archive.findtext('checksum');size=int(archive.findtext('size'));download=SDK/filename
 if not download.exists() or download.stat().st_size!=size or hashlib.sha1(download.read_bytes()).hexdigest()!=expected:
  with urlopen('https://dl.google.com/android/repository/'+filename,timeout=180) as response:body=response.read()
  assert len(body)==size and hashlib.sha1(body).hexdigest()==expected,'Google SDK checksum mismatch'
  download.write_bytes(body)
 temporary=SDK/('extract-'+destination.replace('/','-'));shutil.rmtree(temporary,ignore_errors=True);temporary.mkdir()
 with ZipFile(download) as zipped:
  assert zipped.testzip() is None
  for entry in zipped.infolist():
   path=(temporary/entry.filename).resolve();assert path.is_relative_to(temporary.resolve());zipped.extract(entry,temporary)
   mode=(entry.external_attr>>16)&0o777
   if mode and path.is_file():path.chmod(mode)
 source=next(p for p in temporary.iterdir() if p.is_dir());target.parent.mkdir(parents=True,exist_ok=True);shutil.rmtree(target,ignore_errors=True);shutil.move(str(source),target);shutil.rmtree(temporary);assert (target/marker).exists();print('Verified and installed:',name,flush=True)
with ThreadPoolExecutor(max_workers=2) as executor:list(executor.map(install,[('platforms;android-35','platforms/android-35','android.jar'),('build-tools;35.0.0','build-tools/35.0.0','aapt2')]))
print('Android SDK ready:',SDK,flush=True)
