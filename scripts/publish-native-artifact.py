"""Copy CI build artifacts to an isolated public branch for downloads without Actions login."""
from pathlib import Path
from urllib.request import Request,urlopen
import json,base64,os,sys
ROOT=Path(__file__).resolve().parent.parent;kind=sys.argv[1]
assert kind in ['ios','android']
repository=os.environ['GITHUB_REPOSITORY'];run_id=os.environ['GITHUB_RUN_ID'];commit_sha=os.environ['GITHUB_SHA'];token=os.environ['GITHUB_TOKEN']
assert repository=='asuka-chen/asuka-games-ai' and run_id.isdigit()
patterns=['Star-Abyss-iOS-*-unsigned.ipa','Star-Abyss-iOS-*-unsigned.ipa.sha256','ios-simulator.png','ios-simulator.log'] if kind=='ios' else ['android-native-*.png','android-ui.xml','android-*.log']
files=sorted(set(p for pattern in patterns for p in (ROOT/'releases').glob(pattern)))
assert files,'No native artifacts to publish'
def api(path,data):
 body=json.dumps(data).encode();request=Request('https://api.github.com/repos/'+repository+'/'+path,data=body,method='POST',headers={'Accept':'application/vnd.github+json','Authorization':'Bearer '+token,'Content-Type':'application/json','User-Agent':'Star-Abyss-Native-Build'})
 try:
  with urlopen(request,timeout=120) as response:return json.load(response)
 except Exception as error:raise RuntimeError('GitHub artifact publication failed: '+type(error).__name__) from None
entries=[]
for file in files:
 blob=api('git/blobs',{'content':base64.b64encode(file.read_bytes()).decode(),'encoding':'base64'});entries.append({'path':file.name,'mode':'100644','type':'blob','sha':blob['sha']})
entries.append({'path':'build.json','mode':'100644','type':'blob','content':json.dumps({'source_commit':commit_sha,'workflow_run':run_id,'platform':kind},indent=2)+'\n'})
tree=api('git/trees',{'tree':entries});commit=api('git/commits',{'message':'Native '+kind+' artifacts from verified build '+run_id,'tree':tree['sha'],'parents':[]});branch='star-abyss-native-artifacts-'+kind+'-'+run_id;api('git/refs',{'ref':'refs/heads/'+branch,'sha':commit['sha']});print('Published native build artifacts:',branch,[p.name for p in files])
