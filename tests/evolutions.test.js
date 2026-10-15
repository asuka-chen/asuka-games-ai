import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP,activeSynergies,evolutionProgress,eligibleEvolutions,applyEvolution} from '../star-abyss/core.js';
import {EVOLUTIONS,SYNERGIES} from '../star-abyss/data.js';

const routes=EVOLUTIONS.filter(e=>e.slot==='primary'&&e.weapon!=='beam');
function ready(e){const r=createRun({weapon:e.weapon,seed:e.id});r.relics=Object.fromEntries(SYNERGIES.find(s=>s.id===e.synergy).relics.map(id=>[id,1]));r.bosses=1;r.cores=1;return r;}
function arena(weapon,id){const r=createRun({weapon,seed:'evolution-test'});r.random=()=>.99;r.evolutions=id?[id]:[];r.hp=r.maxHp=1e9;const b=new Battle(r,{id:'arena',type:'combat'});b.waves=0;b.duration=1e6;return b;}
function target(b,x,y){const e=b.spawnEnemy('armor',x,y);e.hp=e.maxHp=1e6;e.armor=0;e.speed=0;e.shoot=1e9;return e;}
function step(b,seconds){for(let i=0;i<Math.ceil(seconds/STEP);i++)b.update(STEP,{});}

test('each non-beam weapon has two attainable routes and exact weapon filtering',()=>{
 assert.equal(routes.length,8);
 for(const weapon of ['pulse','shotgun','rail','swarm'])assert.equal(routes.filter(e=>e.weapon===weapon).length,2);
 for(const e of routes){const r=ready(e);assert.ok(activeSynergies(r).some(s=>s.id===e.synergy));assert.ok(eligibleEvolutions(r).some(x=>x.id===e.id));
  for(const weapon of ['beam','pulse','shotgun','rail','swarm'].filter(w=>w!==e.weapon)){const other={...r,weapon};assert.ok(!activeSynergies(other).some(s=>s.id===e.synergy));assert.ok(!evolutionProgress(other).some(x=>x.id===e.id));}
  const first=SYNERGIES.find(s=>s.id===e.synergy).relics[0];delete r.relics[first];assert.ok(!applyEvolution(r,e.id));assert.equal(r.cores,1);assert.ok(evolutionProgress(r).find(x=>x.id===e.id).missingRelics.includes(first));
 }
});
test('core, boss gate, exclusive primary route and two-slot limit are enforced',()=>{
 const r=ready(routes[0]);r.bosses=0;assert.equal(applyEvolution(r,'U09'),false);r.bosses=1;r.cores=0;assert.equal(applyEvolution(r,'U09'),false);r.cores=2;
 for(const id of ['R03','C07'])r.relics[id]=1;
 assert.ok(applyEvolution(r,'U09'));assert.equal(r.cores,1);assert.equal(applyEvolution(r,'U10'),false);assert.equal(applyEvolution(r,'U09'),false);assert.ok(evolutionProgress(r).find(e=>e.id==='U10').conflicting);
 // A utility evolution can occupy the second slot alongside a primary evolution.
 r.relics.R11=1;r.relics.E11=1;r.relics.L06=1;r.elements=['lightning'];r.bosses=3;
 assert.ok(applyEvolution(r,'U05'));assert.equal(r.cores,0);r.cores=1;assert.equal(eligibleEvolutions(r).length,0);assert.equal(r.evolutions.length,2);
});
test('first and third bosses award cores, the second does not',()=>{
 const b=arena('pulse');const totals=[];
 for(let i=0;i<3;i++){const e=b.spawnEnemy('boss',360,130);b.kill(e,'PRIMARY');totals.push(b.r.cores);}
 assert.deepEqual(totals,[1,1,2]);
});
test('Storm Gatling produces three timed projectiles per attack',()=>{
 const b=arena('pulse','U09');b.shoot();assert.equal(b.bullets.length,1);assert.equal(b.scheduled.length,2);step(b,.11);assert.equal(b.bullets.length,3);assert.equal(b.r.stats.shots,1);
 assert.ok(b.bullets.every(x=>x.damage===b.r.frame.attack*.4));assert.ok(new Set(b.bullets.map(x=>x.vx)).size===3);
});
test('Prism Chain hits three distinct enemies with falloff, then expires',()=>{
 const b=arena('pulse','U10');const a=target(b,360,500),c=target(b,430,430),d=target(b,480,360);b.shoot();step(b,1);
 const events=b.damageLog.filter(e=>e.source==='PRIMARY');assert.deepEqual(events.map(e=>e.target),[a.id,c.id,d.id]);
 assert.ok(Math.abs(events[1].amount/events[0].amount-.75)<1e-8);assert.ok(Math.abs(events[2].amount/events[1].amount-.75)<1e-8);assert.equal(b.bullets.length,0);
});
test('Scatterstorm has nine distinct pellet directions',()=>{
 const b=arena('shotgun','U11');b.shoot();assert.equal(b.bullets.length,9);assert.equal(new Set(b.bullets.map(x=>x.vx)).size,9);assert.ok(b.bullets.every(x=>x.damage===4.4));
});
test('Siege Cannon has one slower slug, bounded area damage and no derived procs',()=>{
 const b=arena('shotgun','U12');b.r.relics={R04:1};b.r.elements=['fire','lightning'];const a=target(b,360,500),near=target(b,400,490),far=target(b,580,500);b.shoot();assert.equal(b.bullets.length,1);assert.equal(Math.hypot(b.bullets[0].vx,b.bullets[0].vy),430);step(b,.6);
 assert.equal(b.bullets.length,0);assert.ok(!b.damageLog.some(x=>x.target===far.id&&x.source==='EVOLUTION_BLAST'));assert.ok(b.damageLog.filter(x=>x.target===far.id).every(x=>x.source==='ELEMENT_REACTION'&&x.generation===1));assert.deepEqual(far.status,{});const blast=b.damageLog.filter(e=>e.source==='EVOLUTION_BLAST');assert.equal(blast.length,2);assert.equal(blast.find(e=>e.target===near.id).amount,22);assert.equal(blast.find(e=>e.target===a.id).amount,22*.35);assert.ok(blast.every(e=>e.generation===1));assert.deepEqual(near.status,{});
});
test('Rift Nailgun fires three rails and each can pierce multiple targets once',()=>{
 const b=arena('rail','U13');b.shoot();assert.equal(b.bullets.length,3);assert.ok(b.bullets.every(x=>x.rail&&x.damage===38));
 b.bullets=b.bullets.filter(x=>x.vx===0);const a=target(b,360,500),c=target(b,360,420);step(b,1);assert.deepEqual(b.damageLog.map(e=>e.target),[a.id,c.id]);assert.ok(b.bullets[0].life>0);
});
test('Gravity Armor-Piercer creates at most three fields per projectile',()=>{
 const b=arena('rail','U14');b.shoot();const bullet=b.bullets[0];for(let i=0;i<5;i++)b.projectileHit(bullet,target(b,360,100+i*80));
 assert.equal(b.effects.filter(e=>e.type==='well').length,3);assert.equal(bullet.gravity,0);assert.ok(b.effects.every(e=>e.fieldDamage===4.5));
});
test('gravity field performs exactly six ticks independently of frame rate',()=>{
 for(const fps of [30,60,144]){const b=arena('rail','U14');target(b,360,300);b.addEffect({type:'well',x:360,y:300,radius:85,life:1.5,maxLife:1.5,fieldDamage:5.7,ticks:0,elapsed:0,root:3});for(let i=0;i<fps*2;i++)b.update(1/fps,{});
  const events=b.damageLog.filter(e=>e.source==='EVOLUTION_FIELD');assert.equal(events.length,6,`${fps} FPS`);assert.ok(events.every(e=>e.generation===1));assert.ok(Math.abs(b.r.damage.EVOLUTION_FIELD-34.2)<1e-7);
 }
});
test('Hunter Horn gives five missiles distinct retained targets',()=>{
 const b=arena('swarm','U15');for(let i=0;i<5;i++)target(b,100+i*120,300);b.shoot();assert.equal(b.bullets.length,5);const ids=b.bullets.map(x=>x.targetId);assert.equal(new Set(ids).size,5);assert.ok(b.bullets.every(x=>x.damage===8.5));step(b,.05);assert.deepEqual(b.bullets.map(x=>x.targetId),ids);
});
test('Hive Carrier splits two parents into three children each without recursion',()=>{
 const b=arena('swarm','U16');const e=target(b,360,500);b.shoot();assert.equal(b.bullets.length,2);const parents=[...b.bullets];for(const p of parents)b.projectileHit(p,e);
 const children=b.bullets.filter(x=>x.source==='EVOLUTION_SWARM');assert.equal(children.length,6);assert.ok(children.every(x=>x.generation===1&&x.damage===4&&x.swarm));
 b.r.relics={R04:1};b.r.elements=['fire'];const clean=target(b,400,300);for(const child of children)b.projectileHit(child,clean);assert.equal(b.bullets.filter(x=>x.source==='EVOLUTION_SWARM').length,6);assert.deepEqual(clean.status,{});assert.equal(b.r.damage.EVOLUTION_SWARM,24);
});
for(const e of routes)test(`${e.id} echo preserves shape and continuous auto-fire still clears`,()=>{
 const b=arena(e.weapon,e.id);b.r.relics={L04:1};b.shoot();step(b,1.01);const echoes=b.bullets.filter(x=>x.source==='ECHO');const counts={U09:3,U10:1,U11:9,U12:1,U13:3,U14:1,U15:5,U16:2};assert.equal(echoes.length,counts[e.id]);assert.ok(echoes.every(x=>x.generation===1&&!x.splitSwarm&&!x.blast&&!x.gravity&&!x.ricochets));
 b.duration=4;for(let i=0;i<480&&!b.done;i++)b.update(STEP,{auto:true});assert.ok(b.done);assert.ok(b.scheduled.length>0,'pending echoes must not block completion');
});
