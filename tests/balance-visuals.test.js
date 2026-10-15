import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMap,createRun,Battle,STEP,attributes,primaryBonus} from '../star-abyss/core.js';
import {ELEMENT_STYLE,REACTION_VISUALS} from '../star-abyss/element-visuals.js';

test('seeded openings offer combat and a safe alternative across chapters',()=>{
 const variants=new Set();for(let seed=0;seed<1000;seed++)for(const chapter of [1,2,3]){
  const opening=generateMap(seed,chapter)[0];assert.ok(opening.some(n=>n.type==='combat'));assert.ok(opening.some(n=>['event','shop','repair'].includes(n.type)));assert.ok(opening.every(n=>['combat','event','shop','repair'].includes(n.type)));if(chapter===1)assert.ok(generateMap(seed,chapter).slice(0,3).flat().every(n=>['combat','event','treasure'].includes(n.type)));variants.add(opening.map(n=>n.type).join(','));
 }assert.ok(variants.size>10);
});
test('haste and critical growth have bounded stacked values, early weapons stay unchanged',()=>{
 const r=createRun();assert.equal(attributes(r).rate,1);assert.equal(primaryBonus(r,{armor:0,elite:false,status:{}},10),1);
 r.relics={C02:3,C06:3,X06:1,X03:1};r.upgrades={rate:4,crit:5};r.evolutions=['U08'];r.hp=20;
 assert.equal(attributes(r).rate,.5);assert.equal(attributes(r).crit,.4);assert.ok(attributes(r).critDamage<=2.6);
});
test('conditional damage bonuses add rather than multiply in a late build',()=>{
 const r=createRun();r.chapter=8;r.hp=r.maxHp*.2;r.relics={X01:1,X02:1,E09:1,E07:2,R08:3,C09:3};r.elements=['light'];const e={armor:35,elite:true,status:{light:{stacks:5},dark:{stacks:5}}};
 assert.equal(primaryBonus(r,e,5),3);r.relics={X01:1,E09:1};assert.equal(primaryBonus(r,{armor:0,elite:false,status:{}},0),2.1);
});
function arena(weapon='beam'){const r=createRun({weapon,seed:'balance'});r.random=()=>.99;const b=new Battle(r,{id:'test',type:'combat'});b.waves=0;b.duration=1e6;const e=b.spawnEnemy('armor',360,300,true);e.hp=e.maxHp=1e9;e.armor=0;e.speed=0;e.shoot=1e9;return{r,b,e};}
test('one beam release shares its boss budget with reflection, branch and finisher damage',()=>{
 const {r,b,e}=arena();e.type='boss';b.releaseBeam();const root=b.player.beam.id,limit=b.player.beam.damage*8*2.2*(1+.05*.5);
 for(const source of ['BEAM_TICK','REFLECT','BRANCH','FINISHER'])b.damage(e,10000,source,root,source==='BEAM_TICK'?0:1,false);
 const total=Object.values(r.damage).reduce((a,c)=>a+c,0);assert.ok(Math.abs(total-limit)<1e-7);assert.equal(b.damage(e,1,'BRANCH',root,1),0);
 // A new release has an independent allowance; this never locks boss health.
 b.player.beam=null;b.releaseBeam();assert.ok(b.damage(e,10,'BEAM_TICK',b.player.beam.id,0,false)>0);
});
for(const evolution of ['U03','U04'])test(`${evolution} echo cannot re-run its full-strength evolution finisher`,()=>{
 const {r,b,e}=arena();r.relics={L04:1,E01:1};r.upgrades.duration=3;r.evolutions=[evolution];if(evolution==='U03')r.relics.E02=1;if(evolution==='U04'){r.relics.E04=1;e.y=600;}
 b.releaseBeam();for(let i=0;i<1200;i++)b.update(STEP,{});
 assert.ok(r.damage.FINISHER>0);assert.ok(r.damage.ECHO>0);const finishers=b.damageLog.filter(e=>e.source==='FINISHER');assert.ok(finishers.every(e=>e.root_attack_id===1));assert.equal(b.attackBudgets.size,0);
});
test('rapid multi-pellet hits do not instantly stack all elemental statuses',()=>{
 const {r,b,e}=arena('shotgun');r.elements=['fire','ice','lightning'];for(let i=0;i<9;i++)b.damage(e,1,'PRIMARY',i,0,false);
 assert.equal(e.status.fire.stacks,1);assert.equal(e.status.ice.stacks,1);assert.equal(e.status.lightning.stacks,1);
 b.time=.18;b.damage(e,1,'PRIMARY',12,0,false);assert.equal(e.status.fire.stacks,2);
});
test('overlapping fields from one evolved rail round deal at most six ticks per enemy',()=>{
 const {r,b,e}=arena('rail');r.evolutions=['U14'];b.shoot();const bullet=b.bullets[0];for(let i=0;i<3;i++)b.projectileHit(bullet,e);b.bullets=[];
 for(let i=0;i<240;i++)b.update(STEP,{});const events=b.damageLog.filter(e=>e.source==='EVOLUTION_FIELD');assert.equal(events.length,6);assert.equal(r.damage.EVOLUTION_FIELD,27);
});
test('evolved drone damage scales with collected drone stacks instead of a fourfold one-stack jump',()=>{
 for(const count of [1,2,3]){const {r,b}=arena('pulse');r.relics={R11:count};r.evolutions=['U05'];b.update(STEP,{});const drones=b.bullets.filter(e=>e.source==='SUMMON');assert.equal(drones.length,3);const newDps=drones.reduce((s,e)=>s+e.damage,0)/1.1,oldDps=r.frame.attack*.35*count/.8;assert.ok(newDps/oldDps<1.3);assert.ok(newDps>oldDps);}
});
test('all six elements and fifteen reactions have distinct visual definitions',()=>{
 assert.equal(Object.keys(ELEMENT_STYLE).length,6);assert.equal(new Set(Object.values(ELEMENT_STYLE).map(e=>e.color)).size,6);assert.equal(Object.keys(REACTION_VISUALS).length,15);assert.equal(new Set(Object.values(REACTION_VISUALS).map(e=>e.color)).size,15);
});
test('impact visuals appear even on lethal hits and never consume the gameplay RNG',()=>{
 const {r,b,e}=arena('pulse');r.elements=['poison'];e.hp=1;r.random=()=>.99;b.damage(e,2,'PRIMARY',1,0,false);assert.ok(b.visualEffects.some(v=>v.type==='element-hit'&&v.elements.includes('poison')));
 const a=createRun({seed:'visual-rng'}),state=a.random.getState();const visual=new Battle(a,{id:'visual',type:'combat'});for(let i=0;i<300;i++)visual.addVisual({type:'element-hit',elements:['light'],x:0,y:0,life:.5,maxLife:.5});assert.equal(a.random.getState(),state);assert.equal(visual.visualEffects.length,96);assert.equal(visual.effects.length,0);
});
for(const [name,style]of Object.entries(REACTION_VISUALS))test(`${name} emits its named reaction effect when actually dealt`,()=>{
 const {r,b,e}=arena('pulse');r.elements=style.elements;for(let i=0;i<3;i++){b.time=i*.2;b.damage(e,1,'PRIMARY',i,0,false);}assert.ok(b.visualEffects.some(v=>v.type==='reaction'&&v.name===name));assert.ok(r.damage.ELEMENT_REACTION>0);
});
