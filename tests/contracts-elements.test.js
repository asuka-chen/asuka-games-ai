import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTS,ELEMENT_REACTIONS,CHALLENGES,RELIC_BY_ID,UPGRADES} from '../star-abyss/data.js';
import {createRun,Battle,STEP,primaryBonus,targetDamageTaken,elementStats,legalRelic,applyRelic,relicOffers,laboratoryOffers,payLaboratory,startChallenge,advanceChallenge,completeNode,challengeAvailable,dashStats,applyUpgrade,weaponDamageProfile,attributes,chapterHealth,endlessThreat,eventOutcome,prepareUnknownEvent,skipUnknownEvent,activeElementReactions} from '../star-abyss/core.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function arena(elements=[]){const r=createRun({weapon:'pulse',seed:'contracts'});r.random=()=>.99;r.elements=elements;const b=new Battle(r,{id:'combat',type:'combat'});b.waves=0;b.duration=1e6;const e=b.spawnEnemy('armor',360,350);e.hp=e.maxHp=1e6;e.armor=0;e.shoot=1e9;e.speed=0;return{r,b,e};}
function event(r,kind='challenge'){const n=r.map[r.floor][0];n.type='event';for(let i=0;i<1000;i++){r.seed=`contract-${kind}-${i}`;if(eventOutcome(r,n)===kind)break;}r.current=n;r.path.push(n.id);prepareUnknownEvent(r);return n;}
test('all fifteen unordered elemental pairs are unique and independently trigger their documented reaction',()=>{
 const expected=ELEMENTS.flatMap((a,i)=>ELEMENTS.slice(i+1).map(b=>[a.id,b.id].sort().join('+')));
 assert.deepEqual(ELEMENT_REACTIONS.map(q=>q.elements.toSorted().join('+')).toSorted(),expected.toSorted());
 for(const q of ELEMENT_REACTIONS){const {r,b,e}=arena(q.elements);for(let i=0;i<4;i++){b.time=i*.2;b.attachElements(e,i);}
  assert.ok(r.events.some(x=>x.type==='reaction'&&x.name===q.name),q.name);assert.ok(b.damageLog.some(x=>x.source==='ELEMENT_REACTION'&&x.generation===1),q.name);
  assert.ok(b.damageLog.every(x=>x.generation<=1));assert.ok(e.hp>0);
 }
});
test('light affects direct attacks, while dark amplifies every damage source and expires',()=>{
 const sources=['PRIMARY','BEAM_TICK','DOT','ECHO','SUMMON','ELEMENT_REACTION','RAIL_MARK'];
 for(const source of sources){const {r,b,e}=arena();e.status.light={stacks:5,until:100};close(primaryBonus(r,e),1.1);const generation=['PRIMARY','BEAM_TICK'].includes(source)?0:1;
  const light=b.damage(e,100,source,0,generation);e.status.dark={stacks:5,until:100};close(primaryBonus(r,e),1.1);const dark=b.damage(e,100,source,0,generation);close(dark/light,1.1);
  e.status.dark.until=0;close(b.damage(e,100,source,0,generation),light);
 }
});
test('three dedicated dark relics require dark and improve distinct capped mechanics',()=>{
 const {r,b,e}=arena();for(const id of ['R14','E14','E15']){assert.ok(!legalRelic(r,RELIC_BY_ID[id]));}r.elements=['dark'];
 for(const id of ['R14','R14','E14','E15'])assert.ok(applyRelic(r,id));assert.ok(!applyRelic(r,'R14'));assert.ok(!applyRelic(r,'E14'));assert.ok(!applyRelic(r,'E15'));
 assert.equal(elementStats(r,'dark').cap,7);assert.equal(elementStats(r,'dark',7).duration,7);
 for(let i=0;i<8;i++){b.time=i*.2;b.damage(e,1,'PRIMARY',i);}assert.equal(e.status.dark.stacks,7);assert.ok(r.damage.DARK_PULSE>0);assert.ok(b.damageLog.filter(x=>x.source==='DARK_PULSE').every(x=>x.generation===1));
 close(targetDamageTaken(r,e,b.time),1.28);e.status.dark.stacks=100;e.status.frailty={until:100};e.status.nightflame={until:100};close(targetDamageTaken(r,e,b.time),1.5);
});
test('steam no longer needs a relic, crystalline fields slow hostile projectiles and dark thunder is delayed',()=>{
 let a=arena(['fire','ice']);a.b.attachElements(a.e,1);assert.ok(a.b.effects.some(x=>x.type==='steam'));a.b.update(.5,{});assert.ok(a.b.damageLog.filter(x=>x.source==='ELEMENT_REACTION').length>=2);
 a=arena(['ice','light']);a.b.attachElements(a.e,1);a.b.enemyBullets.push({x:360,y:350,vx:100,vy:0,damage:1,radius:3,life:10});a.b.update(.1,{});close(a.b.enemyBullets[0].x,367);
 a=arena(['lightning','dark']);a.b.attachElements(a.e,1);const initial=a.r.damage.ELEMENT_REACTION;a.b.update(.7,{});close(a.r.damage.ELEMENT_REACTION,initial);a.b.update(.11,{});assert.ok(a.r.damage.ELEMENT_REACTION>initial);
});
test('reactions inherit weak charge, retain boss budgets and cannot recursively attach elements',()=>{
 for(const q of ELEMENT_REACTIONS){const amounts=[];for(const power of [.25,1]){const {b,e}=arena(q.elements);b.attackStrengths.set(7,{power,expires:100});for(const id of q.elements)e.status[id]={stacks:5,until:100};b.attachElements(e,7);amounts.push(b.r.damage.ELEMENT_REACTION);}close(amounts[0]/amounts[1],.25);}
 const {r,b,e}=arena(['light','dark']);e.type='boss';e.hp=e.maxHp=100;e.status.dark={stacks:5,until:100};b.damage(e,999,'ELEMENT_REACTION',1,1,false);b.damage(e,999,'ELEMENT_REACTION',2,1,false);close(r.damage.ELEMENT_REACTION,2);assert.equal(e.status.light,undefined);
});
test('laboratory binds unique relics to each sampled cost and pays only the selected trade once',()=>{
 for(const id of ['health','shield','coins']){const r=createRun();r.hp=r.maxHp=100;r.coins=1000;event(r,'laboratory');const offers=laboratoryOffers(r);assert.equal(offers.length,3);assert.equal(new Set(offers.map(o=>o.relicId)).size,3);
  const offer=offers.find(o=>o.id===id),before={hp:r.hp,maxHp:r.maxHp,shield:r.shield,maxShield:r.maxShield,coins:r.coins};
  const expected={...r,relics:{...r.relics},logs:[],events:[]};if(id==='health')expected.hp-=offer.cost;if(id==='shield'){expected.maxShield-=offer.cost;expected.shield=Math.min(expected.shield,expected.maxShield);}if(id==='coins')expected.coins-=offer.cost;applyRelic(expected,offer.relicId);
  assert.equal(payLaboratory(r,id),offer.cost);assert.equal(r.relics[offer.relicId],1);for(const key of Object.keys(before))assert.equal(r[key],expected[key],key);assert.equal(payLaboratory(r,id),false);assert.equal(r.logs.filter(l=>l.type==='laboratory').length,1);assert.equal(r.logs.find(l=>l.type==='laboratory').relicId,offer.relicId);
 }
});
test('life payment rejects death at equality, does not consume shields, and does not reduce the life cap',()=>{
 const r=createRun();r.relics.X01=1;r.maxHp=r.hp=100;r.shield=30;event(r,'laboratory');const o=laboratoryOffers(r).find(o=>o.id==='health');r.hp=o.cost;let snapshot=JSON.stringify(r);assert.equal(payLaboratory(r,'health'),false);assert.equal(JSON.stringify(r),snapshot);r.hp=o.cost-.01;snapshot=JSON.stringify(r);assert.equal(payLaboratory(r,'health'),false);assert.equal(JSON.stringify(r),snapshot);r.hp=o.cost+.01;assert.equal(payLaboratory(r,'health'),o.cost);close(r.hp,.01);assert.equal(r.maxHp,100);assert.equal(r.shield,30);
});
test('maximum shield payment permits exactly zero and coin payment permits an exact wallet',()=>{
 for(const id of ['shield','coins']){const r=createRun();r.hp=r.maxHp=100;r.relics.L06=1;event(r,'laboratory');const o=laboratoryOffers(r).find(o=>o.id===id);if(id==='shield'){r.maxShield=r.shield=o.cost-1;}else r.coins=o.cost-1;const snapshot=JSON.stringify(r);assert.equal(payLaboratory(r,id),false);assert.equal(JSON.stringify(r),snapshot);if(id==='shield'){r.maxShield=r.shield=o.cost;}else r.coins=o.cost;assert.equal(payLaboratory(r,id),o.cost);assert.equal(id==='shield'?r.maxShield:r.coins,0);if(id==='shield')assert.equal(r.shield,0);}
});
test('laboratory prices stay in their inclusive ranges and all six coin prices are sampled',()=>{
 const health=new Set(),shield=new Set(),coins=new Set();for(let i=0;i<600;i++){const r=createRun({seed:'cost-'+i});const n=r.map[0][0];n.type='event';r.current=n;r.path.push(n.id);if(eventOutcome(r,n)!=='laboratory')continue;const offers=laboratoryOffers(r);const [a,b,c]=offers;assert.ok(a.cost>=20&&a.cost<=28);assert.ok(b.cost>=10&&b.cost<=18);assert.ok([111,222,333,444,555,666].includes(c.cost));health.add(a.cost);shield.add(b.cost);coins.add(c.cost);}assert.equal(health.size,9);assert.equal(shield.size,9);assert.equal(coins.size,6);
});
test('reopening, flipping previews, resource changes and serialization do not resample a bound trade',()=>{
 const r=createRun();event(r,'laboratory');const state=r.random.getState(),offers=laboratoryOffers(r).map(o=>({id:o.id,relicId:o.relicId,cost:o.cost})),logs=r.logs.length;r.coins=9999;r.hp=1;const again=laboratoryOffers(r).map(o=>({id:o.id,relicId:o.relicId,cost:o.cost}));assert.deepEqual(again,offers);assert.equal(r.logs.length,logs);assert.equal(r.random.getState(),state);const copy=JSON.parse(JSON.stringify(r));copy.random=r.random;assert.deepEqual(laboratoryOffers(copy).map(o=>({id:o.id,relicId:o.relicId,cost:o.cost})),offers);
});
test('low maximum health cannot be raised by forbidden contracts or lethal-protection evolution',()=>{
 const {r,b}=arena();r.maxHp=r.hp=20;const low=r.maxHp;assert.match(RELIC_BY_ID.X01.restriction,/至少保留 1/);assert.doesNotMatch(RELIC_BY_ID.X06.restriction,/25%/);applyRelic(r,'X01');assert.ok(r.maxHp<low);r.evolutions=['U08'];r.relics={};const before=r.maxHp;b.hurtPlayer(9999);assert.equal(r.hp,1);assert.ok(r.maxHp<=before);
});
test('exhausted candidates and wrong event outcomes cannot spend lab resources or start a challenge',()=>{
 const r=createRun();r.coins=1000;assert.ok(!payLaboratory(r,'health'));r.relics=Object.fromEntries(Object.values(RELIC_BY_ID).map(x=>[x.id,x.max]));event(r,'laboratory');assert.equal(laboratoryOffers(r).length,3);assert.ok(laboratoryOffers(r).every(o=>!o.available&&o.relicId===null));let before=JSON.stringify(r);assert.ok(!payLaboratory(r,'health'));assert.equal(JSON.stringify(r),before);assert.ok(!startChallenge(r,'weak-weapon'));assert.equal(JSON.stringify(r),before);assert.ok(skipUnknownEvent(r));assert.ok(!skipUnknownEvent(r));
 const c=createRun();event(c,'challenge');assert.ok(!payLaboratory(c,'coins'));
});
test('owned elemental pairs are visible without relic requirements or gameplay mutations',()=>{
 const r=createRun();for(const ids of [[],['dark'],['fire','ice'],['fire','ice','dark']]){r.elements=ids;const before=JSON.stringify(r);assert.equal(activeElementReactions(r).length,Math.max(0,ids.length*(ids.length-1)/2));assert.ok(activeElementReactions(r).every(q=>q.elements.every(id=>ids.includes(id))));assert.equal(JSON.stringify(r),before);}
});
test('challenge progress spans safe nodes and save reloads, and awards exactly one selection after three battles',()=>{
 const r=createRun();event(r);assert.ok(startChallenge(r,'no-dash'));assert.ok(!startChallenge(r,'weak-weapon'));completeNode(r);
 assert.ok(!advanceChallenge(r,{id:'shop',type:'shop'}));assert.equal(r.challenge.remaining,3);assert.ok(advanceChallenge(r,{id:'fight-1',type:'combat'}));assert.ok(!advanceChallenge(r,{id:'fight-1',type:'combat'}));
 const saved=JSON.parse(JSON.stringify(r));saved.random=r.random;assert.ok(advanceChallenge(saved,{id:'fight-2',type:'elite'}));assert.equal(saved.challenge.remaining,1);assert.ok(advanceChallenge(saved,{id:'fight-3',type:'boss'}));assert.equal(saved.challenge.remaining,0);assert.deepEqual(saved.pending,[{type:'challenge-relic',id:'no-dash'}]);assert.ok(!advanceChallenge(saved,{id:'fight-4',type:'combat'}));assert.equal(saved.pending.length,1);assert.equal(dashStats(saved).charges,1);
});
test('dash challenge prevents real dodges; shield challenge stops all recovery and restores the previous pool',()=>{
 let r=createRun({frame:'spectre'});event(r);assert.ok(startChallenge(r,'no-dash'));let b=new Battle(r,{id:'fight',type:'combat'});b.waves=0;for(let i=0;i<20;i++)b.update(STEP,{dash:true});assert.equal(b.player.dash,0);assert.equal(b.player.invincible,0);assert.equal(b.player.dashCharges,0);
 r=createRun();r.relics={L06:1};r.shield=23;event(r);assert.ok(startChallenge(r,'no-shield'));b=new Battle(r,{id:'fight',type:'combat'});b.waves=0;b.duration=1e6;assert.equal(r.shield,0);applyUpgrade(r,'shield');b.update(11,{});assert.equal(r.shield,0);b.hurtPlayer(5);assert.equal(r.hp,r.maxHp-5);b.restoreChallengeShield();assert.equal(r.shield,23);b.restoreChallengeShield();assert.equal(r.shield,23);r.relics.E13=1;r.challenge=null;assert.ok(!challengeAvailable(r,'no-dash'));
});
test('firepower challenge reduces actual main damage and its HUD profile without reducing summons',()=>{
 for(const source of ['PRIMARY','BEAM_TICK','SUMMON','DOT']){const {r,b,e}=arena();const base=b.damage(e,100,source,0,source==='PRIMARY'||source==='BEAM_TICK'?0:1);r.challenge={id:'weak-weapon',remaining:3,total:3,counted:[]};const reduced=b.damage(e,100,source,0,source==='PRIMARY'||source==='BEAM_TICK'?0:1);close(reduced/base,['PRIMARY','BEAM_TICK'].includes(source)?.75:1);}
 for(const weapon of ['beam','pulse','shotgun','rail','swarm']){const r=createRun({weapon});r.upgrades.attack=2;const profile=weaponDamageProfile(r);assert.ok(profile.damage>0&&Number.isFinite(profile.damage));r.challenge={id:'weak-weapon',remaining:3};close(weaponDamageProfile(r).damage/profile.damage,.75);assert.equal(attributes(r).crit,.05);}
});
test('endless scales health, damage, armor and fire cadence while retaining campaign stats and continued basic growth',()=>{
 for(const chapter of [1,2,3])assert.deepEqual(endlessThreat(chapter),{damage:1,armor:0,haste:1});
 let previous={damage:0,armor:0,haste:0};for(const chapter of [4,6,9,20]){const t=endlessThreat(chapter);assert.ok(t.damage>previous.damage&&t.armor>previous.armor&&t.haste>previous.haste);previous=t;const d=chapter-3;const old=2.25**2*(1+.18*d+.015*d*d);assert.ok(chapterHealth(chapter,true)>old);}
 const r=createRun();r.chapter=9;r.upgrades=Object.fromEntries(UPGRADES.map(u=>[u.id,u.max]));assert.ok(applyUpgrade(r,'attack'));const b=new Battle(r,{id:'boss',type:'boss'});assert.equal(b.boss.armor,39);assert.equal(b.boss.maxHp,49228);b.bossAttack(b.boss,'fan');close(b.enemyBullets[0].damage,(7+13.5)*1.408);
});
