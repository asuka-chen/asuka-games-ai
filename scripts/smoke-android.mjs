// Exercise the actual Android WebView through CDP. Debugging is enabled only in the QA APK.
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),output=path.join(root,'releases'),adb=path.join(process.env.ANDROID_HOME,'platform-tools/adb');
await mkdir(output,{recursive:true});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function command(...args){return execFileSync(adb,args,{encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024}).trim();}
async function screenshot(name){await writeFile(path.join(output,name),execFileSync(adb,['exec-out','screencap','-p'],{timeout:20000,maxBuffer:16*1024*1024}));}
let socket;const pending=new Map(),errors=[];let sequence=0;
async function send(method,params={}){const id=++sequence;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timed out: '+method));},30000);pending.set(id,{resolve:r=>{clearTimeout(timeout);resolve(r);},reject:e=>{clearTimeout(timeout);reject(e);}});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert.equal(result.exceptionDetails,undefined,JSON.stringify(result.exceptionDetails));return result.result.value;}
async function until(expression,label){for(let i=0;i<60;i++){if(await evaluate(expression))return;await wait(500);}throw new Error('Native WebView readiness failed: '+label);}
async function point(selector){return evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Control missing');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);}
async function touch(type,points){await send('Input.dispatchTouchEvent',{type,touchPoints:points});}
async function tap(selector){const p=await point(selector);await touch('touchStart',[{id:1,...p}]);await wait(60);await touch('touchEnd',[]);await wait(100);}
try{
 command('shell','wm','size','780x1688');command('shell','wm','density','320');command('shell','settings','put','secure','immersive_mode_confirmations','confirmed');command('logcat','-c');
 command('install','--no-incremental','-r',path.join(output,'Star-Abyss-Android-v'+JSON.parse(await (await import('node:fs/promises')).readFile(path.join(root,'package.json'),'utf8')).version+'-qa.apk'));
 command('shell','am','start','-W','-n','com.asukachen.starabyss/.GameActivity');
 let pages=[];
 for(let i=0;i<40;i++){try{const pid=command('shell','pidof','com.asukachen.starabyss').split(' ')[0];command('forward','tcp:9223','localabstract:webview_devtools_remote_'+pid);pages=await(await fetch('http://127.0.0.1:9223/json')).json();if(pages.some(p=>p.webSocketDebuggerUrl))break;}catch{}await wait(500);}
 const target=pages.find(p=>p.webSocketDebuggerUrl);assert.ok(target,'Debug QA WebView target missing');
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const job=pending.get(message.id);if(job){pending.delete(message.id);message.error?job.reject(new Error(JSON.stringify(message.error))):job.resolve(message.result);}}if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);});
 await send('Runtime.enable');await send('Page.enable');
 console.log('WebView initial document:',await evaluate(`JSON.stringify({url:location.href,ready:document.readyState,scripts:[...document.scripts].map(s=>s.src),screen:document.getElementById('screen')?.innerHTML.length})`));
 await until(`Boolean(document.querySelector('[data-action="start"]'))`,'hangar');console.log('Native hangar is ready');await wait(1000);await screenshot('android-native-hangar.png');
 console.log('Native hangar screenshot captured');await evaluate(`document.getElementById('run-seed').value='native-android-smoke';document.querySelector('[data-action="difficulty"][data-id="story"]').click()`);
 console.log('Native difficulty selected');await tap('[data-action="start"]');await until(`Boolean(document.querySelector('.route-card'))`,'star chart');
 const route=await evaluate(`[...document.querySelectorAll('.route-card')].find(e=>/普通战斗|裂隙/.test(e.textContent))?.dataset.id`);assert.ok(route,'A playable opening combat route must exist');await tap('.route-card[data-id="'+route+'"]');
 await until(`document.body.dataset.gamePage==='battle'&&Boolean(document.querySelector('[data-touch="fire"]'))`,'combat');
 assert.equal(await evaluate(`document.body.classList.contains('mobile-ui')`),true);await wait(1000);await screenshot('android-native-battle.png');
 await tap('[data-touch="fire"]');await wait(1100);await tap('[data-touch="fire"]');await wait(1000);
 const fire=await point('[data-touch="fire"]');await touch('touchStart',[{id:1,...fire}]);await until(`/蓄满/.test(document.getElementById('mobile-charge').textContent)`,'full held charge');await wait(500);assert.match(await evaluate(`document.getElementById('mobile-charge').textContent`),/蓄满/);await touch('touchEnd',[]);await wait(100);assert.equal(await evaluate(`document.querySelector('[data-touch="auto"]').getAttribute('aria-pressed')`),'false');
 await tap('[data-touch="dash"]');await until(`document.getElementById('touch-dash-status').textContent.startsWith('0/1')`,'dash charge consumed');assert.match(await evaluate(`document.getElementById('touch-dash-status').textContent`),/0\/1/);
 await tap('[data-touch="pause"]');await until(`Boolean(document.querySelector('.modal-head'))`,'pause');assert.match(await evaluate(`document.querySelector('.modal-head').textContent`),/作战暂停/);
 assert.deepEqual(errors,[]);await screenshot('android-native-paused.png');console.log('PASS: native offline Android WebView opens, enters combat, accepts touch charging/release/dash and pauses without JavaScript errors');
}finally{
 if(socket?.readyState===1)socket.close();
 for(const [name,args] of [['android-console.log',['logcat','-d','-s','chromium','AndroidRuntime','StarAbyss']],['android-webview.log',['shell','dumpsys','webviewupdate']]]){try{await writeFile(path.join(output,name),command(...args));}catch{}}
}
