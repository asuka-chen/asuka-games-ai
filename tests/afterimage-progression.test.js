import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP,eligibleEvolutions,evolutionProgress,applyEvolution,applySupplyReward,supplyRewardAvailable,upgradeOffers,gainXP,xpRequired,attributes,supportServices,buySupport,fabricationOffers,buyBlueprint,exchangeEvolutionCore} from '../star-abyss/core.js';
import {EVOLUTIONS,SYNERGIES,UPGRADES} from '../star-abyss/data.js';
function ready(e){const r=createRun({weapon:'beam',seed:e.id});r.relics=Object.fromEntries([...SYNERGIES.find(s=>s.id===e.synergy).relics,...(e.extra?[e.extra]:[])].map(id=>[id,1]));r.elements=['fire','ice'];r.bosses=1;r.cores=1;return r;}
function capped(weapon='beam'){const r=createRun({weapon});r.elements=['fire'];r.upgrades=Object.fromEntries(UPGRADES.map(x=>[x.id,x.max]));return r;}
function arena(weapon='pulse'){const r=createRun({weapon,seed:'ghost-test'}),b=new Battle(r,{id:'ghost-arena',type:'combat'});b.waves=0;b.duration=1e6;return b;}
function advance(b,seconds,input={}){for(let i=0;i<Math.ceil(seconds/STEP);i++)b.update(STEP,input);}
test('all four beam routes are attainable after one boss with exact recipe and core gates',()=>{
 const routes=EVOLUTIONS.filter(e=>e.weapon==='beam');assert.equal(routes.length,4);
 for(const e of routes){const r=ready(e);assert.ok(eligibleEvolutions(r).some(x=>x.id===e.id));r.bosses=0;assert.ok(!applyEvolution(r,e.id));r.bosses=1;r.cores=0;assert.ok(!applyEvolution(r,e.id));r.cores=1;const required=SYNERGIES.find(s=>s.id===e.synergy).relics[0];delete r.relics[required];assert.ok(!applyEvolution(r,e.id));assert.ok(evolutionProgress(r).find(x=>x.id===e.id).missingRelics.includes(required));r.relics[required]=1;assert.ok(applyEvolution(r,e.id));assert.equal(r.cores,0);assert.deepEqual(r.evolutions,[e.id]);}
});
test('beam primary shapes are exclusive; existing evolved saves keep their selected shapes',()=>{
 const r=ready(EVOLUTIONS.find(e=>e.id==='U03'));Object.assign(r.relics,{E03:1,R01:1});r.cores=2;assert.ok(applyEvolution(r,'U03'));assert.ok(!applyEvolution(r,'U02'));assert.ok(evolutionProgress(r).find(e=>e.id==='U02').conflicting);
 r.evolutions=['U02','U03'];const before=JSON.stringify(r.evolutions);evolutionProgress(r);assert.equal(JSON.stringify(r.evolutions),before);assert.equal(eligibleEvolutions(r).length,0);
});
test('capped growth still produces level rewards without raising any permanent statistic',()=>{
 for(const weapon of ['beam','pulse','shotgun','rail','swarm']){const r=capped(weapon),stats=attributes(r),limits=[r.maxHp,r.maxShield],upgrades={...r.upgrades},coins=r.coins;r.level=40;assert.deepEqual(upgradeOffers(r),[]);
  for(let i=0;i<20;i++){gainXP(r,xpRequired(r.level));assert.equal(r.pending.shift().type,'upgrade');assert.ok(applySupplyReward(r,'supply-coins'));}
  assert.equal(r.level,60);assert.equal(r.coins,coins+20*120);assert.deepEqual(r.upgrades,upgrades);assert.deepEqual(attributes(r),stats);assert.deepEqual([r.maxHp,r.maxShield],limits);
 }
});
test('supply repair clamps to existing limits and full stocks reject rewards',()=>{
 const r=capped();r.hp=r.maxHp-5;r.shield=r.maxShield-2;assert.ok(applySupplyReward(r,'supply-repair'));assert.equal(r.hp,r.maxHp);assert.equal(r.shield,r.maxShield);assert.ok(!applySupplyReward(r,'supply-repair'));r.recast=8;assert.ok(applySupplyReward(r,'supply-logistics'));assert.equal(r.recast,9);assert.ok(!applySupplyReward(r,'supply-logistics'));assert.ok(!applySupplyReward(r,'invented'));assert.ok(supplyRewardAvailable(r,'supply-coins'));
});
test('paid supplies support legacy saves, charge atomically and increase future prices',()=>{
 const r=createRun();assert.equal(r.supportPurchases,undefined);r.coins=1000;r.hp=1;r.shield=0;const before=supportServices(r),max=[r.maxHp,r.maxShield];assert.ok(buySupport(r,'repair'));assert.equal(r.coins,880);assert.equal(r.supportPurchases,1);assert.equal(r.hp,1+r.maxHp*.2);assert.equal(r.shield,15);assert.ok(supportServices(r)[0].cost>before[0].cost);assert.deepEqual([r.maxHp,r.maxShield],max);
 r.coins=0;const snapshot=JSON.stringify(r);assert.ok(!buySupport(r,'recast'));assert.equal(JSON.stringify(r),snapshot);r.coins=1000;r.rerolls=9;assert.ok(!buySupport(r,'reroll'));r.recast=9;assert.ok(!buySupport(r,'recast'));
});
test('paid upgrade refreshes are unavailable after growth is capped',()=>{const r=capped();r.coins=1000;assert.equal(supportServices(r).find(x=>x.id==='reroll').available,false);assert.ok(!buySupport(r,'reroll'));assert.equal(r.coins,1000);});
test('fabrication completes a beam recipe while preserving RNG and normal caps',()=>{
 const r=createRun({seed:'fabricate'});r.bosses=1;r.cores=1;r.coins=5000;r.relics={E02:1};const state=r.random.getState(),offers=fabricationOffers(r);assert.ok(offers.some(x=>x.id==='E01'));assert.ok(!offers.some(x=>['E03','E04','E05','X04','E08'].includes(x.id)));const price=offers.find(x=>x.id==='E01').cost;assert.ok(buyBlueprint(r,'E01'));assert.equal(r.coins,5000-price);assert.equal(r.relics.E01,1);assert.equal(r.random.getState(),state);assert.ok(!buyBlueprint(r,'E01'));assert.ok(applyEvolution(r,'U03'));assert.ok(!fabricationOffers(r).some(x=>['E03','E04'].includes(x.id)));
});
test('fabrication never sells forbidden relics or consumes currency for an invalid request',()=>{const r=createRun();r.coins=10000;const snapshot=JSON.stringify(r);assert.ok(!buyBlueprint(r,'X04'));assert.equal(JSON.stringify(r),snapshot);r.evolutions=['U03','U05'];assert.deepEqual(fabricationOffers(r),[]);});
test('dash ghosts follow actual movement and expire independently of frame rate',()=>{
 for(const fps of [30,60,144]){const b=arena(),rng=b.r.random.getState();for(let i=0;i<Math.round(fps*.3);i++)b.update(1/fps,{x:1,dash:i===0});const ghosts=b.afterimages.filter(x=>x.kind==='dash');assert.ok(ghosts.length>=6&&ghosts.length<=8);assert.ok(ghosts.every(g=>g.x<b.player.x&&g.y===b.player.y));assert.ok(b.player.invincible>0);assert.ok(b.player.dashCD>7.6);assert.equal(b.r.random.getState(),rng);advance(b,1);assert.equal(b.afterimages.length,0);}
});
test('afterimage storage is bounded and does not create collision targets',()=>{const b=arena();for(let i=0;i<1000;i++)b.addAfterimage('echo',i,500,.5);assert.equal(b.afterimages.length,64);assert.equal(b.enemies.length,0);assert.equal(b.enemyBullets.length,0);advance(b,.6);assert.equal(b.afterimages.length,0);});
for(const weapon of ['pulse','shotgun','rail','swarm'])test(`${weapon} echo clone stays at its original firing point`,()=>{const b=arena(weapon);b.r.relics.L04=1;const origin={x:b.player.x,y:b.player.y};b.shoot();advance(b,1.01,{x:1});const ghost=b.afterimages.find(g=>g.kind==='echo');assert.ok(ghost);assert.equal(ghost.x,origin.x);assert.equal(ghost.y,origin.y);assert.notEqual(ghost.x,b.player.x);assert.ok(b.bullets.some(x=>x.source==='ECHO'));advance(b,1);assert.equal(b.afterimages.length,0);});
test('beam echo hull and beam share the same fixed origin and lifetime',()=>{const b=arena('beam');b.r.relics.L04=1;b.releaseBeam();advance(b,.8,{x:1});const point={x:b.player.x,y:b.player.y};advance(b,1.02,{x:-1});const ghost=b.afterimages.find(g=>g.kind==='echo'),beam=b.echoBeams[0];assert.ok(ghost&&beam);assert.ok(Math.abs(ghost.x-point.x)<3);assert.equal(ghost.x,beam.origin.x);assert.equal(ghost.y,beam.origin.y);assert.equal(ghost.maxLife,beam.stats.duration);assert.equal(beam.damage,15*.35);advance(b,1);assert.equal(b.afterimages.length,0);assert.equal(b.echoBeams.length,0);});

test('core exchange never overfills recast inventory or consumes an unusable core',()=>{const r=createRun();r.cores=2;r.recast=7;assert.ok(exchangeEvolutionCore(r));assert.equal(r.cores,1);assert.equal(r.recast,9);assert.ok(!exchangeEvolutionCore(r));assert.equal(r.cores,1);r.recast=8;assert.ok(!exchangeEvolutionCore(r));assert.equal(r.recast,8);});
