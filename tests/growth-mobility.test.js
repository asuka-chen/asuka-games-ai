import test from 'node:test';
import assert from 'node:assert/strict';
import {FRAMES,ELEMENTS,RELIC_BY_ID} from '../star-abyss/data.js';
import {createRun,Battle,STEP,attributes,primaryBonus,dashStats,elementStats,applyUpgrade,applyRelic,upgradeOffers} from '../star-abyss/core.js';
function arena(options={}){const r=createRun({weapon:'rail',seed:'v080',...options});r.random=()=>.99;const b=new Battle(r,{id:'growth-test',type:'combat'});b.waves=0;b.duration=1e6;return b;}
function advance(b,seconds,input={},fps=120){for(let i=0;i<Math.round(seconds*fps);i++)b.update(1/fps,input);}
function enemy(b,x=360,y=600){const e=b.spawnEnemy('armor',x,y);e.hp=e.maxHp=1e9;e.armor=0;e.speed=0;e.shoot=1e9;return e;}
function close(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);}
test('crit conversion uses capped actual crit and shares the conditional damage ceiling',()=>{
 for(const weapon of ['beam','pulse','shotgun','rail','swarm']){const r=createRun({weapon});const e={armor:0,elite:false,status:{}};assert.ok(upgradeOffers({...r,random:()=>0,upgrades:Object.fromEntries(['attack','rate','health','shield','speed','crit'].map(id=>[id,99]))}).some(x=>x.id==='crit-conversion'));
  assert.ok(applyUpgrade(r,'crit-conversion'));close(primaryBonus(r,e),1.025);r.upgrades['crit-conversion']=3;r.upgrades.crit=5;r.relics.C06=3;assert.equal(attributes(r).crit,.4);close(primaryBonus(r,e),1.6);assert.ok(!applyUpgrade(r,'crit-conversion'));r.relics={C06:3,X01:1,X02:1,E07:2,E09:1};r.hp=1;r.chapter=20;assert.equal(primaryBonus(r,e,5),3);
 }
});
test('new frame life and dash traits differ; old saved life and upgrades stay untouched',()=>{
 const agile=createRun({frame:'spectre'}),heavy=createRun({frame:'titan'});assert.equal(agile.maxHp,35);assert.equal(heavy.maxHp,80);assert.equal(dashStats(agile).charges,2);assert.equal(dashStats(heavy).charges,1);assert.ok(dashStats(agile).duration<dashStats(heavy).duration);
 agile.frame={id:'spectre',hp:80,shield:20,speed:330,attack:11};agile.hp=121;agile.maxHp=180;agile.upgrades.health=5;const before=JSON.stringify(agile);assert.equal(dashStats(agile).charges,2);new Battle(agile,{id:'legacy',type:'combat'});assert.equal(JSON.stringify(agile),before);
});
test('two taps spend two agile dashes; holding never spends the second charge',()=>{
 const b=arena({frame:'spectre'});advance(b,.5,{dash:true,x:1});assert.equal(b.player.dashCharges,1);assert.equal(b.player.dash,0);assert.ok(b.player.dashCD>5.4);b.update(STEP,{});b.update(STEP,{dash:true});assert.equal(b.player.dashCharges,0);close(b.player.dash,.35);advance(b,1,{dash:true});assert.equal(b.player.dashCharges,0);
});
test('dash recovery is sequential, bounded and frame-rate independent',()=>{
 for(const fps of [30,60,144]){const b=arena({frame:'spectre'});b.update(STEP,{dash:true});b.update(STEP,{});b.update(STEP,{dash:true});advance(b,6,{},fps);assert.equal(b.player.dashCharges,1);advance(b,6,{},fps);assert.equal(b.player.dashCharges,2);assert.equal(b.player.dashCD,0);advance(b,12,{},fps);assert.equal(b.player.dashCharges,2);}
});
test('phase extension stacks up to three and changes the real invulnerability interval',()=>{
 for(const frame of FRAMES){const b=arena({frame:frame.id});for(let i=0;i<3;i++)assert.ok(applyRelic(b.r,'R13'));assert.ok(!applyRelic(b.r,'R13'));close(dashStats(b.r).duration,Math.min(1.2,frame.dashDuration+.3));b.update(STEP,{dash:true});close(b.player.invincible,dashStats(b.r).duration);advance(b,frame.dashDuration+.1);const before=b.r.hp+b.r.shield;b.hurtPlayer(10);assert.equal(b.r.hp+b.r.shield,before);advance(b,.3);b.hurtPlayer(10);assert.ok(b.r.hp+b.r.shield<before);}
});
test('dash does not shorten revival or existing hit protection',()=>{const b=arena({frame:'spectre'});b.player.invincible=1.5;b.update(STEP,{dash:true});assert.ok(b.player.invincible>1.4);});
test('anchored armor costs a real charge, allows zero dashes and reduces shield and hull damage',()=>{
 for(const frame of FRAMES){const b=arena({frame:frame.id});assert.ok(applyRelic(b.r,'E13'));assert.ok(!applyRelic(b.r,'E13'));const max=frame.dashCharges-1;assert.equal(dashStats(b.r).charges,max);b.update(STEP,{dash:true});assert.equal(b.player.dashCharges,Math.max(0,max-1));if(!max){assert.equal(b.player.dash,0);assert.equal(b.player.dashCD,0);}b.player.invincible=0;b.r.shield=30;const hp=b.r.hp;b.hurtPlayer(20);close(b.r.shield,17);assert.equal(b.r.hp,hp);b.player.invincible=0;b.r.shield=0;b.hurtPlayer(20);close(b.r.hp,hp-13);assert.match(RELIC_BY_ID.E13.restriction,/无法闪避/);}
});
test('rail projectiles are slower and wider across both evolutions, and upgrade remains rail-only',()=>{
 for(const evo of [null,'U13','U14']){const b=arena();if(evo)b.r.evolutions=[evo];b.shoot();assert.ok(b.bullets.every(x=>Math.abs(Math.hypot(x.vx,x.vy)-360)<1e-8&&x.radius===12));assert.ok(applyUpgrade(b.r,'rail-mark'));}
 for(const weapon of ['beam','pulse','shotgun','swarm']){const b=arena({weapon});assert.ok(!applyUpgrade(b.r,'rail-mark'));assert.ok(!upgradeOffers(b.r).some(x=>x.id==='rail-mark'));}
});
test('three overlapping evolved rail tracks share a six-tick per-target imprint limit',()=>{
 for(const fps of [30,60,144]){const b=arena();b.r.evolutions=['U13'];b.r.upgrades['rail-mark']=3;const e=enemy(b);b.shoot();advance(b,5,{},fps);const events=b.damageLog.filter(x=>x.source==='RAIL_MARK'&&x.target===e.id);assert.equal(events.length,6,`${fps} FPS`);assert.ok(events.every(x=>x.generation===1));close(events.reduce((a,x)=>a+x.amount,0),27);assert.equal(b.railMarks.length,0);advance(b,1,{},fps);assert.equal(b.railMarkGroups.size,0);}
});
test('weak rail imprint damage scales with charge squared and cannot attach elements or proc echoes',()=>{
 for(const q of [.25,.5,1]){const b=arena();b.r.upgrades['rail-mark']=3;b.r.relics={L04:1,R04:2};b.r.elements=['fire','ice'];const e=enemy(b,100,300);b.shoot(q);const [id,g]=[...b.railMarkGroups][0];b.bullets=[];b.railMarks.push({segment:[100,260,100,340],group:id,radius:22,life:1.5,maxLife:1.5,quality:q});advance(b,.5);const events=b.damageLog.filter(x=>x.source==='RAIL_MARK');assert.equal(events.length,2);close(events[0].amount,4.5*q*q);assert.deepEqual(e.status,{});advance(b,.6);assert.ok(b.bullets.every(x=>x.source==='ECHO'&&!x.markGroup));assert.equal(b.railMarkGroups.size,1);}
});
test('rail marks have bounded queues in sustained late combat and never block node completion',()=>{
 const b=arena();b.player.invincible=1e9;b.r.evolutions=['U13'];b.r.upgrades={'rail-mark':3,rate:4};b.r.relics={L04:1,C02:3};let peak=0;for(let i=0;i<120*60;i++){b.update(STEP,{auto:true});peak=Math.max(peak,b.railMarks.length);assert.ok(b.railMarks.length<=180);assert.ok(b.railMarkGroups.size<=6);}assert.ok(peak>60);b.duration=b.time;b.update(STEP,{auto:true});assert.equal(b.done,true);
});
test('every element grows duration per layer and stops at its cap; expired stacks start over',()=>{
 for(const {id}of ELEMENTS){const b=arena();b.r.elements=[id];const e=enemy(b);const cap=elementStats(b.r,id).cap;let duration=0;for(let i=0;i<cap+10;i++){b.time=i*.2;b.attachElements(e,i+1);const d=e.status[id].until-b.time;assert.ok(d>=duration-1e-8);duration=d;assert.ok(e.status[id].stacks<=cap);}assert.equal(e.status[id].stacks,cap);close(duration,elementStats(b.r,id,cap).duration);b.time=e.status[id].until+1;b.attachElements(e,99);assert.equal(e.status[id].stacks,1);close(e.status[id].until-b.time,elementStats(b.r,id,1).duration);}
});
test('fire relic raises the finite stack ceiling; poison and fire DOT increase with stacks',()=>{
 const b=arena();b.r.relics.R05=2;b.r.elements=['fire'];const e=enemy(b);for(let i=0;i<30;i++){b.time=i*.2;b.attachElements(e,i);}assert.equal(e.status.fire.stacks,9);close(e.status.fire.until-b.time,8);
 for(const id of ['fire','poison']){const damage=[];for(const n of [1,4]){const a=arena();const t=enemy(a);t.status[id]={stacks:n,until:100};a.update(STEP,{});damage.push(a.r.damage.DOT);}close(damage[1]/damage[0],4);}
});
test('lightning retains capped layers and higher layers deal stronger finite chains',()=>{
 const values=[];for(const stacks of [2,5]){const b=arena();b.r.elements=['lightning'];const e=enemy(b,300,300),other=enemy(b,400,300);e.status.lightning={stacks,until:100};b.attachElements(e,1);assert.equal(e.status.lightning.stacks,stacks+1);values.push(b.damageLog.find(x=>x.target===other.id&&x.source==='CHAIN').amount);}assert.ok(values[1]>values[0]);close(values[1],43.75);
});
test('reaction stack bonus is capped at 50% and boss reaction budget remains intact',()=>{
 const values=[];for(const stacks of [0,5]){const b=arena();b.r.elements=['fire','ice'];const e=enemy(b);if(stacks){e.status.fire={stacks,until:100};e.status.ice={stacks,until:100};}b.attachElements(e,1);values.push(b.r.damage.ELEMENT_REACTION);}close(values[1]/values[0],1.5);
 const b=arena();b.r.elements=['fire','ice'];const e=enemy(b);e.type='boss';e.maxHp=e.hp=100;e.status.fire={stacks:5,until:100};e.status.ice={stacks:6,until:100};b.attachElements(e,1);close(b.r.damage.ELEMENT_REACTION,2);assert.equal(e.status.freeze,undefined);
});
test('full icy layers freeze ordinary enemies for a bounded interval; light/dark consume three',()=>{
 const b=arena();b.r.elements=['ice'];b.r.relics.R06=2;const e=enemy(b);for(let i=0;i<6;i++){b.time=i*.2;b.attachElements(e,i);}close(e.status.freeze.until-b.time,2.25);assert.ok(e.status.freeze.until-b.time<3);
 b.r.elements=['light','dark'];e.status.light={stacks:5,until:100};e.status.dark={stacks:5,until:100};b.time=3;b.attachElements(e,99);assert.equal(e.status.light.stacks,2);assert.equal(e.status.dark.stacks,2);
});

test('ice and light stacks increase direct damage; dark is independent target vulnerability, within the same global ceiling',()=>{const r=createRun(),e={armor:0,elite:false,status:{ice:{stacks:6},light:{stacks:5},dark:{stacks:5}}};close(primaryBonus(r,e),1.16);});
