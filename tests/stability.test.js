import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP,applyRelic,activeSynergies,beamStats} from '../star-abyss/core.js';
test('mirror + prism + branches + echo stays bounded through ten simulated minutes',()=>{
 const r=createRun({seed:'mirror-soak'});r.relics={E03:1,R01:3,L02:1,L04:1,E01:1,C10:3};const b=new Battle(r,{id:'soak',type:'combat'});b.waves=0;b.duration=1e6;r.hp=r.maxHp=1e9;
 for(let i=0;i<40;i++){const e=b.spawnEnemy('armor',30+i%8*85,100+Math.floor(i/8)*95,true);e.hp=e.maxHp=1e9;e.speed=0;e.shoot=1e9;}
 for(let i=0;i<72000;i++){b.update(STEP,{auto:true});if(i%1200===0){assert.ok(b.damageLog.length<=300);assert.ok(b.echoBeams.length<5);assert.ok(b.scheduled.length<8);assert.ok(b.effects.length<=150);assert.ok(b.tickEvents.size<3000);}}
 assert.ok(!b.over);assert.ok((r.damage.BEAM_TICK||0)>0);assert.ok((r.damage.ECHO||0)>0);assert.ok((r.damage.REFLECT||0)>0);assert.ok(b.damageLog.every(e=>e.generation<=1));for(const amount of Object.values(r.damage))assert.ok(Number.isFinite(amount));
});
test('reserve battery stores only one charge and slows its carrier',()=>{
 const r=createRun();r.relics={R02:1,E04:1};const b=new Battle(r,{id:'battery',type:'combat'});b.waves=0;b.duration=1e6;b.releaseBeam();for(let i=0;i<170;i++)b.update(STEP,{fire:true});assert.equal(b.player.stored,1);const x=b.player.x;b.update(STEP,{x:1});assert.ok(b.player.x-x<r.frame.speed*STEP);assert.ok(activeSynergies(r).some(s=>s.id==='B04'));
});
test('echo creates an independent attack and cannot produce a second echo',()=>{
 const r=createRun();r.relics.L04=1;const b=new Battle(r,{id:'echo',type:'combat'});b.waves=0;b.duration=1e6;const e=b.spawnEnemy('armor',360,300);e.hp=e.maxHp=1e6;e.armor=0;e.speed=0;e.shoot=1e6;b.releaseBeam();for(let i=0;i<600;i++)b.update(STEP,{});assert.ok(r.damage.ECHO>0);assert.equal(b.echoBeams.length,0);assert.equal(b.scheduled.length,0);assert.equal(b.damageLog.filter(e=>e.source==='ECHO').length,8);
});
test('boss phases change patterns without resetting damage or locking health',()=>{
 const r=createRun();const b=new Battle(r,{id:'boss',type:'boss'});b.boss.hp=b.boss.maxHp*.6;b.update(STEP,{});assert.equal(b.boss.phase,2);b.damage(b.boss,b.boss.maxHp*.5,'PRIMARY',1,0,false);b.update(STEP,{});assert.equal(b.boss.phase,3);b.damage(b.boss,1e6,'PRIMARY',2,0,false);assert.equal(b.boss.dead,true);assert.equal(r.bosses,1);assert.ok(b.bossKilled);
});
