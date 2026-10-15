import test from 'node:test';
import assert from 'node:assert/strict';
import {FRAMES,UPGRADES,RELIC_BY_ID,RELIC_EFFECTS} from '../star-abyss/data.js';
import {createRun,Battle,STEP,attributes,beamStats,upgradeLimit,upgradeOffers,applyUpgrade,supportServices,primaryBonus,chapterHealth,gainXP,xpRequired} from '../star-abyss/core.js';
const basic=['attack','rate','health','shield','speed','crit','projectile','element'];
function arena(weapon='pulse',chapter=1){const r=createRun({weapon,seed:'endless-split'});r.chapter=chapter;r.random=()=>.99;const b=new Battle(r,{id:'endless',type:'combat'});b.waves=0;b.duration=1e6;b.player.invincible=1e9;return b;}
function step(b,time,input={}){for(let i=0;i<Math.ceil(time/STEP);i++)b.update(STEP,input);}
function target(b){const e=b.spawnEnemy('boss',360,130,true);e.hp=e.maxHp=1e9;e.armor=0;e.speed=0;e.shoot=1e9;e.pressureEnabled=false;e.radius=65;return e;}
test('all three new runs have exactly half the previous initial hull and preserve dodge and shield traits',()=>{
 assert.deepEqual(FRAMES.map(f=>f.hp),[50,35,80]);for(const f of FRAMES){const r=createRun({frame:f.id});assert.equal(r.hp,f.hp);assert.equal(r.maxHp,f.hp);assert.equal(r.shield,f.shield);}
 const r=createRun();r.hp=87;r.maxHp=200;r.frame={...r.frame,hp:100};const snapshot=JSON.stringify(r);new Battle(r,{id:'old',type:'combat'});assert.equal(JSON.stringify(r),snapshot);
});
test('only endless basic upgrades reopen, remain legal at arbitrary levels and grant actual growth',()=>{
 for(const id of basic){const r=createRun({weapon:'pulse'});r.elements=['fire'];const u=UPGRADES.find(x=>x.id===id);r.upgrades[id]=u.max;assert.equal(upgradeLimit(r,u),u.max);assert.ok(!applyUpgrade(r,id));r.chapter=4;assert.equal(upgradeLimit(r,u),Infinity);const before={...attributes(r),hp:r.maxHp,shield:r.maxShield,element:r.upgrades.element};assert.ok(applyUpgrade(r,id));const after={...attributes(r),hp:r.maxHp,shield:r.maxShield,element:r.upgrades.element};const key=({health:'hp',rate:'rate',projectile:'projectile'})[id]||id;assert.ok(id==='rate'?after.rate<before.rate:after[key]>before[key],id);r.upgrades[id]=1000;assert.ok(applyUpgrade(r,id));assert.equal(r.upgrades[id],1001);}
 for(const id of ['duration','width','crit-conversion','rail-mark']){const r=createRun({weapon:id==='rail-mark'?'rail':'beam'});r.chapter=10;const u=UPGRADES.find(x=>x.id===id);r.upgrades[id]=u.max;assert.equal(upgradeLimit(r,u),u.max);assert.ok(!applyUpgrade(r,id));}
});
test('old capped endless saves receive real upgrades and paid refreshes again without resetting inventory',()=>{
 const r=createRun();r.chapter=6;r.level=50;r.elements=['fire'];r.upgrades=Object.fromEntries(UPGRADES.map(u=>[u.id,u.max]));r.relics={E01:2,L04:1};const relics=JSON.stringify(r.relics);assert.equal(upgradeOffers(r).length,3);assert.ok(upgradeOffers(r).every(u=>basic.includes(u.id)));assert.ok(supportServices(r).find(x=>x.id==='reroll').available);gainXP(r,xpRequired(r.level));assert.equal(r.pending.shift().type,'upgrade');assert.ok(applyUpgrade(r,'attack'));assert.equal(r.upgrades.attack,6);assert.equal(JSON.stringify(r.relics),relics);
});
test('deep growth never produces negative intervals, invalid crit probabilities or weaker beams',()=>{
 const b=arena('beam',8),r=b.r;r.relics={C02:3,C10:3,C06:3,X06:1};const values=[];for(const n of [4,20,100,1000]){r.upgrades={attack:n,rate:n,crit:n,speed:n,element:n};const a=attributes(r),beam=beamStats(r);assert.ok(a.crit>=0&&a.crit<=1);assert.ok(a.rate>0&&Number.isFinite(a.rate));assert.ok(beam.charge>0&&Number.isFinite(beam.charge));values.push({attack:a.attack,rate:a.rate,speed:a.speed,critDamage:a.critDamage,charge:beam.charge});}
 for(let i=1;i<values.length;i++){assert.ok(values[i].attack>values[i-1].attack);assert.ok(values[i].speed>values[i-1].speed);assert.ok(values[i].rate<values[i-1].rate);assert.ok(values[i].charge<values[i-1].charge);assert.ok(values[i].critDamage>=values[i-1].critDamage);}r.upgrades.crit=100;assert.equal(attributes(r).crit,1);assert.ok(attributes(r).critDamage>1.5);r.chapter=3;assert.equal(attributes(r).crit,.4);
});
test('campaign boss health is unchanged while endless health stays finite and rises gradually',()=>{
 for(const chapter of [1,2,3]){const r=createRun();r.chapter=chapter;const b=new Battle(r,{id:'boss',type:'boss'});assert.equal(b.boss.maxHp,Math.round(2200*2.25**(chapter-1)));}
 let last=0;for(const chapter of [3,4,6,9,20,50,100]){const r=createRun();r.chapter=chapter;const b=new Battle(r,{id:'boss',type:'boss'});assert.ok(Number.isFinite(b.boss.maxHp)&&b.boss.maxHp>last);last=b.boss.maxHp;}assert.ok(2200*chapterHealth(9,true)<70000);assert.ok(chapterHealth(9,true)<2.25**8/20);
});
test('C12 launches its split rounds immediately even with no kills, for all bullet weapons',()=>{
 for(const weapon of ['pulse','shotgun','rail','swarm'])for(const stacks of [1,2,3]){const b=arena(weapon);b.r.relics.C12=stacks;assert.equal(b.r.kills,0);b.shoot();const derived=b.bullets.filter(x=>x.source==='SPLIT');assert.equal(derived.length,stacks);assert.ok(derived.every(x=>x.generation===1&&x.splitLaunch&&x.y<b.player.y));assert.equal(b.r.kills,0);}
 assert.match(RELIC_EFFECTS.C12,/每次发射/);assert.doesNotMatch(RELIC_EFFECTS.C12,/击杀后/);
});
test('C12 contributes real nonrecursive damage to a surviving boss, including weak charged rails',()=>{
 for(const weapon of ['pulse','shotgun','rail','swarm']){const b=arena(weapon);b.r.relics.C12=3;b.r.elements=['fire'];const e=target(b);b.shoot(weapon==='rail'?.5:1);step(b,3);const events=b.damageLog.filter(x=>x.source==='SPLIT'&&x.target===e.id);assert.ok(events.length>0,weapon);assert.ok(events.every(x=>x.generation===1));assert.ok(e.hp>0);assert.equal(b.r.kills,0);}
 const damage=[];for(const q of [.5,1]){const b=arena('rail');b.r.relics.C12=1;b.shoot(q);damage.push(b.bullets.find(x=>x.source==='SPLIT').damage);}assert.equal(damage[0]/damage[1],.25);
});
test('kills do not generate extra C12 splits and echo does not duplicate launch-derived rounds',()=>{
 const b=arena();b.r.relics={C12:3,L04:1};b.shoot();assert.equal(b.bullets.filter(x=>x.source==='SPLIT').length,3);const e=target(b);b.kill(e,'PRIMARY');assert.equal(b.bullets.filter(x=>x.source==='SPLIT').length,3);b.bullets=[];step(b,1.1);assert.equal(b.bullets.filter(x=>x.source==='ECHO').length,1);assert.ok(b.bullets.every(x=>!x.splitLaunch));
});
test('C12 derived projectiles cannot create elemental statuses or trigger fracture effects',()=>{
 const b=arena();b.r.relics={C12:3,R04:2};b.r.elements=['fire','ice'];const e=target(b);b.shoot();const child=b.bullets.find(x=>x.source==='SPLIT');b.projectileHit(child,e);assert.deepEqual(e.status,{});assert.equal(b.bullets.filter(x=>x.source==='SPLIT').length,3);
});
