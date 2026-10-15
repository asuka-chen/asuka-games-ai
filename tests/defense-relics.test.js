import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP,applyRelic,legalRelic,relicOffers,laboratoryOffers,payLaboratory,attributes} from '../star-abyss/core.js';
import {RELIC_BY_ID} from '../star-abyss/data.js';
function arena(relics={}){const r=createRun({seed:'defensive-relics',weapon:'pulse'});r.relics={...relics};const b=new Battle(r,{id:'defense-test',type:'combat'});b.waves=0;b.duration=1e6;return b;}
function target(b,x=200,y=250){const e=b.spawnEnemy('armor',x,y);e.hp=e.maxHp=1e6;e.armor=0;e.speed=0;e.shoot=1e6;return e;}
function advance(b,time){for(let i=0;i<Math.round(time/STEP);i++)b.update(STEP,{});}
function bullet(b,d,boss=false){const q={x:b.player.x+d,y:b.player.y,vx:0,vy:0,radius:2,life:5,damage:10,boss};b.enemyBullets.push(q);return q;}
test('shield gate blocks only the breaking hit overflow, with and without damage amplification',()=>{
 for(const extra of [{},{X03:1},{E13:1}]){const b=arena({E16:1,...extra});b.r.shield=5;const hp=b.r.hp;b.hurtPlayer(40);assert.equal(b.r.shield,0);assert.equal(b.r.hp,hp);assert.equal(b.r.stats.damageTaken,0);assert.ok(b.visualEffects.some(x=>x.type==='shield-gate'));b.player.invincible=0;b.hurtPlayer(10);assert.ok(b.r.hp<hp);}
 const normal=arena();normal.r.shield=5;normal.hurtPlayer(40);assert.equal(normal.r.hp,15);
});
test('shield gate supports exact break, shield regeneration and shieldless challenges',()=>{
 const b=arena({E16:1});b.r.shield=5;b.hurtPlayer(5);assert.equal(b.r.hp,b.r.maxHp);b.player.invincible=0;b.r.shield=1;b.hurtPlayer(999);assert.equal(b.r.hp,b.r.maxHp);
 const r=createRun();r.relics.E16=1;r.challenge={id:'no-shield',remaining:3};const challenged=new Battle(r,{id:'no-shield',type:'combat'});challenged.hurtPlayer(10);assert.equal(r.hp,r.maxHp-10);
});
test('shield gate and shockwave exclude each other in both directions and every candidate source',()=>{
 for(const [owned,blocked] of [['E16','E17'],['E17','E16']]){const b=arena();assert.ok(applyRelic(b.r,owned));const state=JSON.stringify(b.r);assert.equal(applyRelic(b.r,blocked),false);assert.equal(JSON.stringify(b.r),state);
  for(const source of ['elite','boss','shop','rift','danger']){assert.equal(legalRelic(b.r,RELIC_BY_ID[blocked],source),false);for(let i=0;i<20;i++)assert.ok(relicOffers(b.r,source,4).every(x=>x.id!==blocked));}
  b.r.coins=9999;b.r.hp=100;b.r.current={id:'lab',type:'event',floor:0,encounter:{version:12,kind:'laboratory',offers:[{id:'coins',relicId:blocked,cost:111}]}};b.r.path=['lab'];const before=JSON.stringify(b.r);assert.equal(laboratoryOffers(b.r)[0].available,false);assert.equal(payLaboratory(b.r,'coins'),false);assert.equal(JSON.stringify(b.r),before);
 }
});
test('wave upgrades have a finite radius, clear normal and boss bullets, and deal zero enemy damage',()=>{
 for(let level=1;level<=3;level++){const b=arena();for(let i=0;i<level;i++)assert.ok(applyRelic(b.r,'E17'));const e=target(b,b.player.x,b.player.y-100),radius=140+55*(level-1),inside=bullet(b,radius-4),boss=bullet(b,-radius+4,true),outside=bullet(b,radius+8);b.hurtPlayer(2);assert.equal(b.defensiveWaves[0].maxRadius,radius);advance(b,.5);assert.equal(inside.life,0);assert.equal(boss.life,0);assert.ok(outside.life>0);assert.equal(e.hp,e.maxHp);assert.deepEqual(b.r.damage,{});advance(b,.2);assert.equal(b.defensiveWaves.length,0);}
 const b=arena({E17:3});assert.equal(applyRelic(b.r,'E17'),false);
});
test('wave clears progressively from the original hit position and leaves friendly shots and hazards intact',()=>{
 const b=arena({E17:1}),near=bullet(b,25),far=bullet(b,120);b.bossHazards=[{kind:'bomb',x:100,y:100,radius:40,elapsed:0,delay:2,duration:.3}];const ally={x:300,y:400,vx:0,vy:0,life:4,damage:1,radius:2,source:'SPLIT',generation:1,root:1,hit:new Set()};b.bullets.push(ally);b.hurtPlayer(1);const origin=b.player.x;advance(b,.12);assert.equal(near.life,0);assert.ok(far.life>0);b.player.x=100;advance(b,.35);assert.equal(far.life,0);assert.equal(b.defensiveWaves[0].x,origin);assert.ok(b.bullets.includes(ally));assert.equal(b.bossHazards.length,1);
});
test('invulnerability, blocked hits and non-enemy life costs do not trigger defensive relics',()=>{
 const b=arena({E17:1,R15:1,X04:1});target(b);b.player.invincible=1;b.hurtPlayer(20);b.player.invincible=0;for(const n of [0,-1,NaN,Infinity])b.hurtPlayer(n);assert.equal(b.defensiveWaves.length,0);assert.equal(b.r.damage.RETALIATION,undefined);
 b.r.weapon='beam';b.releaseBeam();assert.ok(b.r.hp<b.r.maxHp);assert.equal(b.defensiveWaves.length,0);assert.equal(b.r.damage.RETALIATION,undefined);
});
test('retaliation uses actual shield and hull loss once, prefers the source and supports orphan bullets',()=>{
 const b=arena({R15:1}),near=target(b,350,650),source=target(b,200,120);b.r.shield=3;b.hurtPlayer(10,'弹幕',source.id);assert.equal(b.r.damage.RETALIATION,15);assert.equal(source.hp,source.maxHp-15);assert.equal(near.hp,near.maxHp);b.hurtPlayer(10,'弹幕',source.id);assert.equal(b.r.damage.RETALIATION,15);b.player.invincible=0;source.dead=true;b.hurtPlayer(10,'弹幕',source.id);assert.equal(near.hp,near.maxHp-15);
});
test('retaliation caps overkill and buff multiplication, honors armor/vulnerability and never chains',()=>{
 const b=arena({R15:3,C01:3,R04:2,R07:2,X03:1});b.r.elements=['fire','ice','lightning','dark'];b.r.upgrades.attack=5;const e=target(b);e.armor=100;e.status.dark={stacks:5,until:10};b.r.hp=10000;b.r.shield=0;b.hurtPlayer(1000,'弹幕',e.id);const expected=b.r.frame.attack*attributes(b.r).attack*6*1.1/2;assert.ok(Math.abs(b.r.damage.RETALIATION-expected)<1e-8);assert.equal(b.damageLog.length,1);assert.equal(b.damageLog[0].generation,1);assert.deepEqual(Object.keys(e.status),['dark']);assert.equal(b.bullets.length,0);
 const fatal=arena({R15:1});const victim=target(fatal);fatal.r.hp=2;fatal.r.shield=1;fatal.hurtPlayer(99999,'弹幕',victim.id);assert.equal(fatal.r.damage.RETALIATION,4.5);assert.ok(fatal.over);
});
test('retaliation may combine with either exclusive defense and only reflects damage actually paid',()=>{
 const gate=arena({E16:1,R15:1}),e=target(gate);gate.r.shield=2;gate.hurtPlayer(1000,'弹幕',e.id);assert.equal(gate.r.damage.RETALIATION,3);assert.equal(gate.r.hp,gate.r.maxHp);
 const wave=arena({E17:1,R15:1});target(wave);wave.hurtPlayer(10);assert.equal(wave.r.damage.RETALIATION,15);assert.equal(wave.defensiveWaves.length,1);
});
test('real normal, boss, pressure, collision and delayed hazard damage retain the attack source',()=>{
 for(const type of ['normal','boss','pressure','collision','bomb']){const b=arena({R15:1}),near=target(b,350,650),source=target(b,200,250);if(type==='normal')b.enemyShoot(source);if(type==='boss')b.bossAttack({...source,phase:1},'fan');if(type==='pressure'){source.phase=1;source.pressureClock=1;source.pressureEnabled=true;source.age=1;b.bossPressure(source,STEP);}if(['normal','boss','pressure'].includes(type)){assert.ok(b.enemyBullets.length);assert.ok(b.enemyBullets.every(x=>x.attackerId===source.id));const q=b.enemyBullets[0];q.x=b.player.x;q.y=b.player.y;q.vx=q.vy=0;}if(type==='collision'){source.x=b.player.x;source.y=b.player.y;source.type='armor';}if(type==='bomb')b.addBossHazard(source,{kind:'bomb',x:b.player.x,y:b.player.y,radius:50,delay:0,duration:.35,damage:10,source:'测试炸弹'});b.update(STEP,{});assert.ok(source.hp<source.maxHp,type);assert.equal(near.hp,near.maxHp,type);}
});
