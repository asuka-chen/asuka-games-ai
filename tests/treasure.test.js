import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,generateMap,selectNode,claimTreasure,treasureReward,completeNode,normalizeEarlyRoute,eventOutcome,prepareUnknownEvent,skipUnknownEvent,startChallenge} from '../star-abyss/core.js';
function goldRun(){for(let i=0;i<100;i++){const r=createRun({seed:'gold-event-'+i}),n=r.map[0][0];n.type='event';if(eventOutcome(r,n)==='treasure')return r;}}
test('every chapter has connected unknown events and no standalone treasury nodes',()=>{
 for(let seed=0;seed<1000;seed++)for(const chapter of [1,2,4]){const map=generateMap(seed,chapter);assert.deepEqual(map,generateMap(seed,chapter));assert.ok(map.slice(0,10).flat().some(n=>n.type==='event'));assert.ok(!map.flat().some(n=>n.type==='treasure'));assert.equal(map[11][0].type,'boss');assert.ok(map[10].every(n=>['repair','shop'].includes(n.type)));if(chapter===1)assert.ok(map.slice(0,3).flat().every(n=>['combat','event'].includes(n.type)));let reachable=new Set(map[0].map(n=>n.id));for(let i=0;i<12;i++){assert.ok(map[i].every(n=>reachable.has(n.id)));reachable=new Set(map[i].flatMap(n=>n.links));}}
});
test('gold reward is deterministic, keeps combat RNG and rises with depth',()=>{
 const r=createRun({seed:'vault'}),node=r.map[0][0],state=r.random.getState(),amount=treasureReward(r,node);assert.ok(amount>=120&&amount<=180);assert.equal(treasureReward(r,node),amount);r.chapter=5;assert.equal(treasureReward(r,node),amount+60);assert.equal(treasureReward(r,{...node,floor:7}),amount+60+35);assert.equal(r.random.getState(),state);
});
test('only an unknown event rolled as gold pays once and advances once',()=>{
 const r=goldRun(),node=r.map[0][0],coins=r.coins;assert.equal(claimTreasure(r),false);assert.ok(selectNode(r,node.id));const xp=r.xp,health=r.hp,state=r.random.getState(),amount=treasureReward(r);assert.equal(prepareUnknownEvent(r).kind,'treasure');assert.equal(claimTreasure(r),amount);assert.equal(r.coins,coins+amount);assert.equal(claimTreasure(r),false);assert.equal(r.coins,coins+amount);assert.ok(!skipUnknownEvent(r));assert.ok(!startChallenge(r,'no-dash'));completeNode(r);assert.equal(r.floor,1);assert.equal(r.completedNodes,1);assert.equal(claimTreasure(r),false);assert.equal(r.xp,xp);assert.equal(r.hp,health);assert.equal(r.random.getState(),state);
});
test('legacy standalone gold rooms become events while preserving route IDs, links and earned resources',()=>{
 for(const chapter of [1,2,6]){const r=createRun();r.chapter=chapter;r.map=generateMap(r.seed,chapter);r.map[0][0].type='treasure';r.map[4][0].type='treasure';r.current=r.map[0][0];r.path=[r.current.id];r.floor=1;const route=r.map.flat().map(n=>({id:n.id,links:n.links})),before={hp:r.hp,maxHp:r.maxHp,coins:r.coins,state:r.random.getState()};normalizeEarlyRoute(r);assert.ok(r.map.flat().every(n=>n.type!=='treasure'));assert.equal(r.current.type,'event');assert.deepEqual(r.map.flat().map(n=>({id:n.id,links:n.links})),route);assert.deepEqual({hp:r.hp,maxHp:r.maxHp,coins:r.coins,state:r.random.getState()},before);const snapshot=JSON.stringify(r);normalizeEarlyRoute(r);assert.equal(JSON.stringify(r),snapshot);}
});
test('three unknown outcomes are reasonably balanced, stable per node and independent of resource levels',()=>{
 const counts={laboratory:0,challenge:0,treasure:0};for(let i=0;i<3000;i++){const r=createRun({seed:'event-roll-'+i}),node=r.map[0][0],state=r.random.getState(),kind=eventOutcome(r,node);counts[kind]++;r.hp=1;r.maxShield=0;r.coins=0;assert.equal(eventOutcome(r,node),kind);assert.equal(r.random.getState(),state);}for(const n of Object.values(counts))assert.ok(n>850&&n<1150,JSON.stringify(counts));
});
