import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const port=8118,base=`http://127.0.0.1:${port}`,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
async function fixture(type,relics){
 await page.evaluate(async ({type,relics})=>{const {createRun}=await import('/star-abyss/core.js'),{RELICS}=await import('/star-abyss/data.js'),r=createRun({weapon:'pulse',seed:'defense-ui'});r.coins=9999;r.floor=3;r.relics=relics==='exhausted'?Object.fromEntries(RELICS.filter(x=>!['E16','E17','R15'].includes(x.id)).map(x=>[x.id,x.max])):relics;r.map[3].forEach(n=>n.type=type);const{random,...data}=r;localStorage.setItem('starabyss.run.v1',JSON.stringify({version:1,randomState:random.getState(),data}));},{type,relics});
 await page.reload();await page.getByRole('button',{name:'继续上次航行'}).click();await page.locator('.route-card').first().click();
}
try{
 await mkdir('test-results',{recursive:true});await page.goto(base);await page.locator('[data-page="atlas"]').click();assert.equal(await page.locator('.atlas-card').count(),56);
 for(const id of ['E16','E17','R15']){const card=page.locator(`[data-relic="${id}"]`);await card.locator('.relic-flip').click();assert.equal(await card.locator('.relic-flip').getAttribute('aria-pressed'),'true');assert.ok((await card.locator('.relic-description').textContent()).length>25);assert.ok(await card.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0));}
 assert.match(await page.locator('[data-relic="E16"] .relic-restriction').textContent(),/震荡净场器.*互斥/);assert.match(await page.locator('[data-relic="E17"] .relic-description').textContent(),/140.*195.*250.*不造成伤害/);
 await page.locator('[data-relic="E17"]').screenshot({path:'test-results/defense-card-back.png'});
 for(const [owned,blocked] of [['E16','E17'],['E17','E16']]){await fixture('shop','exhausted');assert.equal(await page.locator(`[data-relic="${owned}"]`).count(),1);assert.equal(await page.locator(`[data-relic="${blocked}"]`).count(),1);await page.locator(`[data-relic="${owned}"] .relic-accept`).click();const button=page.locator(`[data-relic="${blocked}"] .relic-accept`);assert.ok(await button.isDisabled());assert.match(await button.textContent(),/互斥/);await page.getByRole('button',{name:'离开商店'}).click();const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);assert.equal(saved.relics[owned],1);assert.equal(saved.relics[blocked],undefined);}
 await fixture('forge',{E17:1});await page.locator('[data-relic="E17"] .relic-accept').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data.relics.E17),2);
 await page.evaluate(async ()=>{
  const {createRun,Battle,STEP}=await import('/star-abyss/core.js'),{renderBattle,prepareCanvas}=await import('/star-abyss/render.js'),r=createRun({weapon:'pulse'});r.relics={E17:3,R15:2};const b=new Battle(r,{id:'visual-test',type:'combat'});b.waves=0;b.duration=1e6;b.player.y=580;const e=b.spawnEnemy('armor',360,320);e.hp=e.maxHp=10000;e.speed=0;e.shoot=1e6;for(let i=0;i<60;i++){const a=i*Math.PI*2/60;b.enemyBullets.push({x:360+Math.cos(a)*235,y:580+Math.sin(a)*235,vx:0,vy:0,radius:5,damage:1,life:5});}b.hurtPlayer(10,'测试',e.id);for(let i=0;i<30;i++)b.update(STEP,{});const canvas=document.createElement('canvas');canvas.id='defense-preview';canvas.style.cssText='position:fixed;inset:0;z-index:9999;width:720px;height:900px';document.body.append(canvas);renderBattle(prepareCanvas(canvas),b);
 });await page.locator('#defense-preview').screenshot({path:'test-results/defense-shockwave.png'});assert.deepEqual(errors,[]);console.log('PASS: three new relic cards/icons, bidirectional shop exclusion, forge radius upgrade and shared defensive rendering');
}finally{await browser.close();server.kill();}
