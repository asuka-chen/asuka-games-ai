import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
const port=8093,base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exit ${code}`)));});
const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:process.platform==='linux'?{executablePath:'/usr/bin/chromium'}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(),errors=[],failures=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push(r.url()));page.on('request',r=>{if(!r.url().startsWith(base)&&!r.url().startsWith('blob:'))external.push(r.url());});
async function fixture(type,{weapon='pulse',floor=['repair','shop','forge'].includes(type)?3:0,coins=1000,relics={},upgrades={},level=1,xp=0,bosses=0,cores=0,evolutions=[],elements=[],enter=true}={}){
 await page.evaluate(async options=>{
  const{createRun,eventOutcome}=await import('/star-abyss/core.js');
  const r=createRun({seed:'browser-fixture-'+options.type,weapon:options.weapon,difficulty:'story'});
  r.coins=options.coins;r.relics=options.relics;r.upgrades=options.upgrades;r.floor=options.floor;r.level=options.level;r.xp=options.xp;r.bosses=options.bosses;r.cores=options.cores;r.evolutions=options.evolutions;r.elements=options.elements;r.maxHp=r.hp=500;r.frame={...r.frame,attack:200};
  r.map[r.floor].forEach(n=>n.type=options.type);if(options.type==='event')for(let i=0;i<1000;i++){r.seed='main-browser-gold-'+i;if(eventOutcome(r,r.map[r.floor][0])==='treasure')break;}
  const{random,...data}=r;localStorage.setItem('starabyss.run.v1',JSON.stringify({version:1,randomState:random.getState(),data}));
 },{type,weapon,floor,coins,relics,upgrades,level,xp,bosses,cores,evolutions,elements});
 await page.reload();await page.getByRole('button',{name:'继续上次航行'}).click();if(enter)await page.locator('.route-card').first().click();
}
try{
 await mkdir('test-results',{recursive:true});
 await page.goto(base);await page.getByRole('button',{name:'开始出击'}).waitFor();assert.ok(page.url().endsWith('/star-abyss/'));
 await page.screenshot({path:'test-results/hangar.png'});
 await page.locator('[data-action="frame"][data-id="spectre"]').click();await page.locator('[data-action="weapon"][data-id="swarm"]').click();await page.locator('#run-seed').fill('QA-2026');await page.getByRole('button',{name:'开始出击'}).click();assert.ok((await page.locator('.run-bar').textContent()).includes('QA-2026'));
 await page.screenshot({path:'test-results/map.png'});
 await page.getByRole('button',{name:'查看构筑'}).click();await page.getByRole('button',{name:'返回航行'}).click();await page.getByRole('button',{name:'保存并返回机库'}).click();await page.getByRole('button',{name:'继续上次航行'}).click();assert.ok((await page.locator('.run-bar').textContent()).includes('QA-2026'));console.log('PASS: frame, weapon, seed, map, build and checkpoint resume');
 await fixture('repair');await page.getByRole('button',{name:/升级舰体/}).click();let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);assert.equal(saved.maxHp,520);assert.equal(saved.coins,920);assert.equal(saved.floor,4);console.log('PASS: repair service applies cost, stats and one-way progression');
 await fixture('shop');const shopCard=page.locator('.relic-card').first();await shopCard.locator('.relic-flip').click();assert.equal(await shopCard.locator('.relic-flip').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.modal .relic-accept:disabled').count(),0);assert.match(await page.locator('.modal-head').textContent(),/1000/);await shopCard.locator('.relic-flip').click();assert.equal(await shopCard.locator('.relic-flip').getAttribute('aria-pressed'),'false');await page.locator('.relic-accept').first().click();await page.getByRole('button',{name:'离开商店'}).click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);assert.equal(Object.keys(saved.relics).length,1);assert.ok(saved.coins<1000);console.log('PASS: shop purchase and inventory checkpoint');
 await fixture('forge',{relics:{C01:1}});await page.locator('.relic-accept').first().click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);assert.equal(saved.relics.C01,2);assert.equal(saved.coins,900);console.log('PASS: forge increases existing stack');
 await fixture('event');await page.locator('[data-modal="reveal-event"]').click();const goldAmount=Number((await page.locator('.treasure-amount').textContent()).match(/\d+/)[0]);await page.locator('[data-modal="claim-treasure"]').click();saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);assert.equal(saved.coins,1000+goldAmount);console.log('PASS: unknown event reward');
 await page.clock.install();
 await fixture('combat');await page.locator('#battle-canvas').waitFor();await page.clock.runFor(3500);const oldTime=await page.locator('#battle-time').textContent();await page.keyboard.press('Escape');await page.clock.runFor(2500);assert.equal(await page.locator('#battle-time').textContent(),oldTime);await page.getByRole('button',{name:'继续战斗'}).click();
 await page.keyboard.down('KeyA');await page.clock.runFor(600);await page.keyboard.up('KeyA');await page.keyboard.down('Space');await page.clock.runFor(180);await page.keyboard.up('Space');assert.notEqual(await page.locator('#dash-text').textContent(),'就绪');await page.screenshot({path:'test-results/combat.png'});
 // Real UI handles all upgrade pauses while accelerated browser time drives combat.
 for(let i=0;i<32&&await page.locator('#battle-canvas').count();i++){
  const choices=page.locator('.modal .choice-card');if(await choices.count()){await choices.first().click();continue;}
  await page.clock.runFor(1500);
 }
 assert.ok(await page.locator('.route-card').count()>0,'ordinary battle reaches next route');saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);assert.ok(saved.kills>0);assert.ok(saved.damage.PRIMARY>0);assert.equal(saved.floor,1);console.log('PASS: combat, movement, dash, pause, kills, upgrade and node completion');
 await fixture('combat',{relics:{L04:1}});
 assert.match(await page.locator('#mode-text').textContent(),/自动火力开启/);
 for(let i=0;i<45&&await page.locator('#battle-canvas').count();i++){
  const choices=page.locator('.modal .choice-card');if(await choices.count()){await choices.first().click();continue;}
  await page.clock.runFor(1500);
 }
 assert.ok(await page.locator('.route-card').count()>0,'Eternal Echo auto-fire finishes the node without pressing F');
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);
 assert.equal(saved.floor,1);assert.equal(saved.relics.L04,1);assert.ok(saved.damage.ECHO>0,'echo attacks actually executed');
 console.log('PASS: Eternal Echo node completion with uninterrupted auto-fire');
 for(const route of [
  {weapon:'pulse',id:'U09',name:'风暴加特林',relics:{C02:1,R04:1}},
  {weapon:'shotgun',id:'U12',name:'破城重炮',relics:{C09:1,R04:1}},
  {weapon:'rail',id:'U14',name:'引力穿甲弹',relics:{E06:1,C02:1},elements:['dark']},
  {weapon:'swarm',id:'U16',name:'蜂巢母舰',relics:{R04:1,R11:1}}
 ]){
  await fixture('combat',{...route,bosses:1,cores:1,enter:false});
  await page.getByRole('button',{name:'查看构筑'}).click();
  assert.equal(await page.locator('[data-evolution]').filter({hasText:route.name}).count(),1);
  await page.getByRole('button',{name:'使用进化核心'}).click();const offered=page.locator(`[data-evolution="${route.id}"]`);await offered.locator('.relic-flip').click();assert.equal(await offered.locator('.relic-flip').getAttribute('aria-pressed'),'true');assert.ok((await offered.locator('.recipe-requirements').textContent()).length>10);assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data)).cores,1);await page.locator(`[data-modal="${route.id}"]`).click();
  assert.match(await page.locator(`[data-evolution="${route.id}"]`).textContent(),/已进化/);
  await page.getByRole('button',{name:'返回航行'}).click();await page.locator('.route-card').first().click();
  assert.match(await page.locator('.combat-right').textContent(),new RegExp(route.name));await page.locator('[data-action="inspect-evolution"]').first().click();const frozen=await page.locator('#battle-time').textContent();await page.locator('[data-card-flip]').click();await page.clock.runFor(1200);assert.equal(await page.locator('#battle-time').textContent(),frozen);await page.getByRole('button',{name:'关闭介绍'}).click();
  for(let i=0;i<55&&await page.locator('#battle-canvas').count();i++){
   const choices=page.locator('.modal .choice-card');if(await choices.count()){await choices.first().click();continue;}
   await page.clock.runFor(1500);
  }
  assert.ok(await page.locator('.route-card').count()>0,route.id+' evolved weapon clears its node');
  saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('starabyss.run.v1')).data);
  assert.equal(saved.floor,1);assert.equal(saved.cores,0);assert.ok(saved.evolutions.includes(route.id));assert.ok(saved.damage.PRIMARY>0);console.log('PASS: '+route.id+' '+route.name+' chosen, used in combat and saved');
 }
 console.log('PASS: four non-beam weapon evolution offers, core consumption, HUD, combat and checkpoints');
 await fixture('combat',{weapon:'shotgun',relics:{C09:1},enter:false});await page.getByRole('button',{name:'查看构筑'}).click();assert.match(await page.locator('[data-evolution="U12"]').textContent(),/缺少.*裂变核心/);await page.getByRole('button',{name:'返回航行'}).click();
 console.log('PASS: missing evolution recipe is visible before obtaining a core');
 await fixture('combat',{relics:{C02:1},elements:['fire','ice','lightning']});await page.clock.runFor(500);await page.locator('[data-action="inspect-relic"]').first().evaluate(el=>window.originalRelicButton=el);await page.clock.runFor(500);assert.ok(await page.locator('[data-action="inspect-relic"]').first().evaluate(el=>el===window.originalRelicButton),'HUD updates retain an unchanged inspection button');await page.locator('[data-action="inspect-relic"]').click();const inspectTime=await page.locator('#battle-time').textContent();await page.locator('.relic-inspect .relic-flip').click();assert.match(await page.locator('.relic-inspect .relic-description').textContent(),/6.5%/);await page.clock.runFor(1800);assert.equal(await page.locator('#battle-time').textContent(),inspectTime);await page.getByRole('button',{name:'关闭介绍'}).click();await page.clock.runFor(1400);assert.notEqual(await page.locator('#battle-time').textContent(),inspectTime);console.log('PASS: clicking combat relic pauses simulation, flips its current description and resumes');
 await fixture('combat',{weapon:'beam',relics:{E01:1,C01:3},upgrades:{width:3,rate:4}});await page.clock.runFor(1400);await page.screenshot({path:'test-results/beam.png'});await page.keyboard.press('KeyF');await page.keyboard.down('KeyJ');await page.clock.runFor(1000);await page.keyboard.up('KeyJ');await page.clock.runFor(100);assert.equal(errors.length,0,errors.join('\n'));console.log('PASS: charged beam renders and accepts manual hold/release');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'返回机库',exact:true}).click();await page.locator('[data-page="atlas"]').click();assert.equal(await page.locator('.atlas-card').count(),56);const atlasCard=page.locator('[data-relic="C02"]');await atlasCard.locator('.relic-flip').click();assert.equal(await atlasCard.locator('.relic-flip').getAttribute('aria-pressed'),'true');assert.match(await atlasCard.locator('.relic-description').textContent(),/6.5%/);await atlasCard.locator('.relic-flip').press('Space');assert.equal(await atlasCard.locator('.relic-flip').getAttribute('aria-pressed'),'false');await page.screenshot({path:'test-results/relic-flip.png'});await page.locator('[data-action="filter"][data-id="recipes"]').click();assert.equal(await page.locator('.atlas-card').count(),40);assert.equal(await page.locator('[data-card-flip]').count(),40);for(const id of ['B17','U09','U04']){const card=page.locator(`[data-card-flip="${id}"]`);await card.click();assert.equal(await card.getAttribute('aria-pressed'),'true');assert.ok((await card.locator('.recipe-requirements').textContent()).length>5);await card.press('Enter');assert.equal(await card.getAttribute('aria-pressed'),'false');}assert.equal(await page.locator('.relic-accept').count(),0);await page.locator('[data-card-flip="U09"]').click();await page.screenshot({path:'test-results/recipe-flip.png'});await page.locator('[data-page="guide"]').click();assert.equal(await page.locator('.guide-panel').count(),4);console.log('PASS: relic archive, 24+16 recipes and flight manual');
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);assert.deepEqual(external,[]);console.log('PASS: no uncaught errors, failed requests or external runtime dependencies');
}finally{await browser.close();server.kill('SIGTERM');}
