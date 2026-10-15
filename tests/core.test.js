import test from 'node:test';
import assert from 'node:assert/strict';
import {RELICS,RELIC_BY_ID,SYNERGIES,EVOLUTIONS,UPGRADES} from '../star-abyss/data.js';
import {generateMap,createRun,nextNodes,selectNode,completeNode,randomGenerator,legalRelic,relicOffers,applyRelic,activeSynergies,eligibleEvolutions,Battle,STEP,beamStats} from '../star-abyss/core.js';

test('all design IDs and recipe references are unique and valid',()=>{
 assert.equal(RELICS.length,56);assert.equal(new Set(RELICS.map(r=>r.id)).size,56);
 assert.equal(SYNERGIES.length,24);assert.equal(EVOLUTIONS.length,16);
 for(const s of SYNERGIES)for(const id of s.relics)assert.ok(RELIC_BY_ID[id]);
 for(const e of EVOLUTIONS){assert.ok(SYNERGIES.find(s=>s.id===e.synergy));if(e.extra)assert.ok(RELIC_BY_ID[e.extra]);}
});
test('1000 seeded star maps are deterministic, connected and supply every route before boss',()=>{
 for(let seed=0;seed<1000;seed++){
  const map=generateMap(seed,1);assert.deepEqual(map,generateMap(seed,1));assert.equal(map.length,12);assert.equal(map[11][0].type,'boss');
  let reachable=new Set(map[0].map(n=>n.id));
  for(let i=0;i<11;i++){
   assert.ok(map[i].length>=2&&map[i].length<=4);
   const next=new Set();for(const n of map[i]){
    assert.ok(reachable.has(n.id),'no orphan nodes');assert.ok(n.links.length>=1);
    for(const id of n.links){const target=map[i+1].find(n=>n.id===id);assert.ok(target);next.add(id);assert.ok(!(['elite','rift'].includes(n.type)&&['elite','rift'].includes(target.type)),'forced consecutive high risk');}
   }reachable=next;
  }
  assert.ok(reachable.has(map[11][0].id));assert.ok(map[10].every(n=>['repair','shop'].includes(n.type)));
 }
});
test('route traversal disallows returning, skipping or selecting disconnected nodes',()=>{
 const r=createRun({seed:'routes'});assert.equal(selectNode(r,r.map[2][0].id),null);
 for(let i=0;i<12;i++){const n=nextNodes(r)[0];assert.ok(selectNode(r,n.id));const old=n.id;completeNode(r);assert.equal(selectNode(r,old),null);}
 assert.equal(r.chapter,2);assert.equal(r.floor,0);
});
test('RNG checkpoints replay the same sequence',()=>{const a=randomGenerator(42);for(let i=0;i<50;i++)a();const b=randomGenerator(a.getState());assert.deepEqual(Array.from({length:50},()=>a()),Array.from({length:50},()=>b()));});
test('weapon, element, max-stack, shape and forbidden-source restrictions are enforced',()=>{
 const r=createRun({weapon:'pulse'});assert.equal(legalRelic(r,RELIC_BY_ID.E02,'elite'),false);assert.equal(legalRelic(r,RELIC_BY_ID.R05,'elite'),false);assert.equal(legalRelic(r,RELIC_BY_ID.X01,'shop'),false);
 r.elements=['fire'];assert.equal(legalRelic(r,RELIC_BY_ID.R05,'elite'),true);r.relics.C01=3;assert.equal(legalRelic(r,RELIC_BY_ID.C01),false);
 r.weapon='beam';assert.ok(applyRelic(r,'E02'));assert.equal(legalRelic(r,RELIC_BY_ID.E03,'boss'),false);assert.equal(legalRelic(r,RELIC_BY_ID.L03,'boss'),false);
 applyRelic(r,'X01');applyRelic(r,'X03');assert.equal(legalRelic(r,RELIC_BY_ID.X04,'boss'),false);
});
test('10000 reward screens contain unique, legal relics; elite screens have a rare candidate',()=>{
 for(const weapon of['beam','pulse']){
  const r=createRun({seed:'drops-'+weapon,weapon});r.elements=['fire','ice','lightning'];
  for(let i=0;i<5000;i++){const source=['elite','boss','shop','danger','rift'][i%5];const options=relicOffers(r,source);assert.equal(options.length,3);assert.equal(new Set(options.map(x=>x.id)).size,3);for(const x of options)assert.ok(legalRelic(r,x,source));if(source==='elite')assert.ok(options.some(x=>x.rarity!=='C'));r.logs=[];}
 }
});
test('synergies and evolutions require full recipes, gates and at most two evolutions',()=>{
 const r=createRun();applyRelic(r,'E02');assert.ok(!activeSynergies(r).some(s=>s.id==='B02'));applyRelic(r,'E01');assert.ok(activeSynergies(r).some(s=>s.id==='B02'));applyRelic(r,'L02');assert.equal(eligibleEvolutions(r).length,0);r.bosses=3;assert.ok(eligibleEvolutions(r).some(e=>e.id==='U03'));r.evolutions=['U01','U05'];assert.equal(eligibleEvolutions(r).length,0);
 r.weapon='pulse';assert.ok(!activeSynergies(r).some(s=>s.id==='B02'));
});
test('elite guarantee survives exhausting the rare tier when higher legal relics remain',()=>{
 const r=createRun({seed:'elite-fallback'});for(const item of RELICS.filter(x=>x.rarity==='R'))r.relics[item.id]=item.max;
 for(let i=0;i<100;i++)assert.ok(relicOffers(r,'elite').some(item=>item.rarity!=='C'));
});
function beamResult(fps){const r=createRun({seed:'beam-ticks'});r.frame={...r.frame,attack:10};const b=new Battle(r,{id:'test',type:'combat'});b.waves=0;b.duration=10000;const e=b.spawnEnemy('armor',360,300);e.hp=e.maxHp=1e6;e.armor=0;e.speed=0;e.shoot=1e6;b.releaseBeam();let accumulator=0;for(let frame=0;frame<fps;frame++){accumulator+=1/fps;while(accumulator+1e-9>=STEP){b.update(STEP,{});accumulator-=STEP;}}return{damage:r.damage.BEAM_TICK,hits:b.damageLog.filter(x=>x.source==='BEAM_TICK').length};}
test('unmodified beam has exactly 8 ticks, with identical damage at 30/60/144 FPS',()=>{
 const thirty=beamResult(30),sixty=beamResult(60),high=beamResult(144);assert.equal(sixty.hits,8);assert.deepEqual(sixty,high);assert.deepEqual(sixty,thirty);assert.ok(sixty.damage>=120);
});
test('derived damage never recursively triggers relics; reaction damage respects boss budget',()=>{
 const r=createRun({seed:'reaction'});r.elements=['fire','ice'];r.relics={R01:3,L02:1,R04:2};const b=new Battle(r,{id:'boss-test',type:'boss'});const e=b.boss;e.hp=e.maxHp=1000;e.armor=0;b.damage(e,500,'ELEMENT_REACTION',1,1,false);b.damage(e,500,'ELEMENT_REACTION',2,1,false);assert.equal(r.damage.ELEMENT_REACTION,20);
 const count=b.damageLog.length;b.damage(e,10,'REFLECT',3,1);assert.equal(b.damageLog.length,count+1);assert.equal(b.effects.length,0);assert.equal(b.bullets.length,0);assert.equal(b.damage(e,10,'REFLECT',3,2),0);
});
test('blood sacrifice charges health once only for a full release; early shots stay weaker',()=>{
 const r=createRun();r.relics.X04=1;const b=new Battle(r,{id:'sacrifice',type:'combat'});b.waves=0;b.releaseBeam(.5);assert.equal(r.hp,r.maxHp);assert.equal(b.player.beam.damage,15*.25);for(let i=0;i<100;i++)b.update(STEP,{});b.releaseBeam();assert.equal(r.hp,r.maxHp*.97);for(let i=0;i<100;i++)b.update(STEP,{});assert.equal(r.hp,r.maxHp*.97);
});
test('player hit immunity prevents one-frame burst, shield absorbs and regenerates',()=>{
 const r=createRun();const b=new Battle(r,{id:'immunity',type:'combat'});b.waves=0;b.hurtPlayer(20);b.hurtPlayer(20);assert.equal(r.shield,10);assert.equal(r.hp,r.maxHp);for(let i=0;i<720;i++)b.update(STEP,{});assert.ok(r.shield>10);
});
test('three complete chapter maps reach endless chapter four',()=>{
 const r=createRun({seed:'complete'});let victories=0;
 for(let i=0;i<36;i++){selectNode(r,nextNodes(r)[0].id);if(completeNode(r))victories++;}assert.equal(victories,1);assert.equal(r.chapter,4);assert.equal(r.floor,0);assert.equal(nextNodes(r).length,r.map[0].length);
});
