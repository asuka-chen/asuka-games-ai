import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP} from '../star-abyss/core.js';

for(const type of ['combat','elite'])for(const weapon of ['pulse','shotgun','rail','swarm','beam']){
 test(`${type} ends with ${weapon} auto-fire and Eternal Echo still enabled`,()=>{
  const r=createRun({weapon,seed:'completion-'+weapon});
  r.relics={L04:1,C02:3};r.upgrades.rate=4;
  const b=new Battle(r,{id:'cleared-node',type});b.waves=0;b.duration=8;
  for(let i=0;i<1200&&!b.done;i++)b.update(STEP,{auto:true});
  assert.ok(r.stats.shots>0,'weapon was actually firing');
  assert.ok(b.done,'friendly attacks must not prevent clearing an empty completed node');
  assert.ok(b.time<8.02,'no need to stop firing or wait for the echo queue to drain');
 });
}

test('a future enemy wave still prevents an early node completion',()=>{
 const r=createRun({weapon:'pulse'});
 const b=new Battle(r,{id:'future-wave',type:'combat'});b.waves=1;b.duration=.1;
 for(let i=0;i<60;i++)b.update(STEP,{auto:true});
 assert.equal(b.done,false);assert.equal(b.wave,0);
});

test('remaining scheduled enemies must spawn and be defeated before leaving',()=>{
 const r=createRun({weapon:'pulse'});r.relics.L04=1;
 const b=new Battle(r,{id:'spawn-queue',type:'combat'});b.waves=1;b.duration=.1;
 b.spawnWave();const expectedKills=5+r.chapter;
 const firstTask=b.scheduled.shift();firstTask.action();
 b.damage(b.enemies[0],10000,'PRIMARY',1,0,false);
 for(const item of b.pickups){item.x=b.player.x;item.y=b.player.y;}
 b.time=.2;b.update(STEP,{auto:true});
 assert.equal(b.enemies.length,0);assert.equal(b.pickups.length,0);
 assert.equal(b.done,false,'waiting enemies must not be confused with delayed player attacks');
 for(let i=0;i<600&&!b.done;i++){
  for(const e of b.enemies)b.damage(e,10000,'PRIMARY',1,0,false);
  for(const item of b.pickups){item.x=b.player.x;item.y=b.player.y;}
  b.update(STEP,{auto:true});
 }
 assert.ok(b.done);assert.equal(r.kills,expectedKills);
});

test('earned pickups are collected before completion even while auto-fire continues',()=>{
 const r=createRun({weapon:'pulse'});r.relics.L04=1;
 const b=new Battle(r,{id:'pickup-wait',type:'combat'});b.waves=0;b.duration=.1;
 b.pickups.push({x:50,y:50,xp:10,coins:5,life:1});
 b.update(STEP,{auto:true});assert.equal(b.done,false);
 for(let i=0;i<240&&!b.done;i++)b.update(STEP,{auto:true});
 assert.ok(b.done);assert.equal(r.xp,10);assert.equal(r.coins,125);
});
