import {spawnSync} from 'node:child_process';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const repository='asuka-chen/asuka-games-ai';
const tag='star-abyss-prototype-0.1.0';
const game=path.join(root,'releases/Star-Abyss-Windows-x64.zip');
const checksumFile=game+'.sha256';
const source=path.join(root,'releases/Star-Abyss-Source-v0.1.0.zip');
const notes=path.join(root,'scripts/game-release-notes.md');
const attachments=[game,checksumFile,source];

function gh(args,{allowMissing=false}={}){
  const env={...process.env};
  // Reuse the platform identity unless a repository-scoped upload credential is supplied securely.
  // Proxy-backed values must only be sent to the configured api.github.com / uploads.github.com routes.
  if(process.env.GITHUB_RELEASE_TOKEN)env.GH_TOKEN=process.env.GITHUB_RELEASE_TOKEN;
  const result=spawnSync('gh',args,{cwd:root,env,encoding:'utf8',maxBuffer:1024*1024});
  if(result.error)throw result.error;
  if(result.status!==0){
    if(allowMissing&&/HTTP 404|release not found/i.test(result.stderr))return null;
    const message=result.stderr.trim();
    if(/HTTP 401|Bad credentials/i.test(message))throw new Error('The current identity was rejected by the release upload API. Provide GITHUB_RELEASE_TOKEN securely in environment settings with Contents read/write access to this repository, then retry. Do not paste credentials in chat.');
    if(/Forbidden|CONNECT.*403/i.test(message))throw new Error('GitHub connection rejected. Check access to api.github.com and uploads.github.com; existing Git read access alone does not establish Release API permission. No release has been published by this script.');
    throw new Error(message||'GitHub command failed');
  }
  return result.stdout.trim();
}
const expected=(await readFile(checksumFile,'utf8')).split(/\s+/)[0];
const actual=createHash('sha256').update(await readFile(game)).digest('hex');
if(expected!==actual)throw new Error('Game checksum mismatch; upload stopped');
for(const file of attachments)if(!(await stat(file)).isFile())throw new Error('Missing attachment '+path.basename(file));
console.log('Local assets verified:',attachments.map(f=>path.basename(f)).join(', '));
if(process.argv.includes('--check-only'))process.exit(0);
const info=JSON.parse(gh(['api',`repos/${repository}`,'--jq','{private: .private, permissions: .permissions}']));
if(info.permissions?.push!==true)throw new Error('The existing GitHub identity does not have write permission for this repository. Configure repository-scoped access securely in environment settings; do not put tokens in chat.');
console.log('Repository write permission verified. Visibility:',info.private?'private':'public');
const current=gh(['release','view',tag,'--repo',repository,'--json','isDraft,url,assets'],{allowMissing:true});
if(current){
  const release=JSON.parse(current);
  if(!release.isDraft)throw new Error('A published release already uses this tag. It will not be modified.');
  for(const file of attachments){
    const found=release.assets.find(a=>a.name===path.basename(file));
    if(found){
      if(found.size!==(await stat(file)).size)throw new Error('Existing draft asset differs; refusing to overwrite '+path.basename(file));
      continue;
    }
    gh(['release','upload',tag,file,'--repo',repository]);
  }
  console.log('Draft download page:',release.url);
}else{
  const url=gh(['release','create',tag,...attachments,'--repo',repository,'--draft','--title','星渊：无限火力 · Windows 可玩原型 0.1','--notes-file',notes]);
  console.log('Draft download page:',url);
}
console.log('Saved as a draft. Sign into the repository owner account to download its assets. This script does not publish the release.');
