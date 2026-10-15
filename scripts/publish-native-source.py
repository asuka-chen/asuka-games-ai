"""Publish a separate, reviewable native-build branch without changing main."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import base64,hashlib,json,os,subprocess,tempfile
ROOT=Path(__file__).resolve().parent.parent;REPO='asuka-chen/asuka-games-ai';VERSION=json.loads((ROOT/'package.json').read_text())['version'];BRANCH='star-abyss-mobile-build-v'+VERSION
def api(method,path,data=None,missing=False):
 environment=os.environ.copy();environment.pop('GH_DEBUG',None)
 if environment.get('GITHUB_RELEASE_TOKEN'):environment['GH_TOKEN']=environment['GITHUB_RELEASE_TOKEN']
 args=['gh','api','--method',method,path];file=None
 if data is not None:
  with tempfile.NamedTemporaryFile('w',suffix='.json',delete=False) as output:json.dump(data,output);file=Path(output.name)
  args+=['--input',str(file)]
 try:
  result=subprocess.run(args,env=environment,capture_output=True,text=True,timeout=120)
  if result.returncode:
   if missing and 'HTTP 404' in result.stderr:return None
   raise RuntimeError(result.stderr.strip())
  return json.loads(result.stdout)
 finally:
  if file:file.unlink(missing_ok=True)
stateFile=ROOT/f'releases/native-source-v{VERSION}-state.json';state=json.loads(stateFile.read_text()) if stateFile.exists() else {}
existing=api('GET',f'repos/{REPO}/git/ref/heads/{BRANCH}',missing=True)
if existing and existing['object']['sha']!=state.get('commit'):raise RuntimeError('Refusing to overwrite an unknown native-build branch')
files=[ROOT/name for name in ['package.json','package-lock.json','README.md','.gitignore']]
for directory in ['star-abyss','native','scripts','.github','desktop','tests']:
 files.extend(p for p in (ROOT/directory).rglob('*') if p.is_file() and 'node_modules' not in p.parts and 'www' not in p.parts)
files=sorted(set(files));entries=[];expected={};binary=[]
for file in files:
 name=str(file.relative_to(ROOT));body=file.read_bytes();expected[name]=hashlib.sha1(f'blob {len(body)}\0'.encode()+body).hexdigest()
 try:content=body.decode('utf8');entries.append({'path':name,'mode':'100644','type':'blob','content':content})
 except UnicodeDecodeError:binary.append((name,body))
def upload(item):
 name,body=item;blob=api('POST',f'repos/{REPO}/git/blobs',{'content':base64.b64encode(body).decode(),'encoding':'base64'});assert blob['sha']==expected[name];return {'path':name,'mode':'100644','type':'blob','sha':blob['sha']}
with ThreadPoolExecutor(max_workers=3) as pool:entries.extend(pool.map(upload,binary))
tree=api('POST',f'repos/{REPO}/git/trees',{'tree':entries});remote=api('GET',f'repos/{REPO}/git/trees/{tree["sha"]}?recursive=1');assert not remote.get('truncated');actual={x['path']:x['sha'] for x in remote['tree'] if x['type']=='blob'};assert actual==expected
commit=api('POST',f'repos/{REPO}/git/commits',{'message':f'Build Star Abyss {VERSION} Android and iOS offline apps','tree':tree['sha'],'parents':[existing['object']['sha']] if existing else []});state={'branch':BRANCH,'commit':commit['sha'],'tree':tree['sha']};stateFile.write_text(json.dumps(state,indent=2)+'\n')
if existing:api('PATCH',f'repos/{REPO}/git/refs/heads/{BRANCH}',{'sha':commit['sha'],'force':False})
else:api('POST',f'repos/{REPO}/git/refs',{'ref':'refs/heads/'+BRANCH,'sha':commit['sha']})
print('Published verified native source:',BRANCH,commit['sha'],len(files),'files')
