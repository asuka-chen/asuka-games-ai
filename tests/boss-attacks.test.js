import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP} from '../star-abyss/core.js';
import {BOSS_ATTACKS,BOSS_PATTERNS} from '../star-abyss/data.js';
function arena(chapter=1){const r=createRun({weapon:'pulse',seed:'boss-'+chapter});r.chapter=chapter;r.shield=r.maxShield=0;const b=new Battle(r,{id:'boss',type:'boss'});b.boss.shoot=1e9;b.boss.pressureEnabled=false;return b;}
function step(b,seconds){for(let i=0;i<Math.round(seconds/STEP);i++)b.update(STEP,{});}

test('chapter/phase sequences rotate deterministically and cover five attack types',()=>{
 for(let chapter=1;chapter<=3;chapter++){const b=arena(chapter),seen=new Set();for(let phase=1;phase<=3;phase++){b.boss.phase=phase;b.boss.attackCount=0;const sequence=BOSS_PATTERNS[chapter-1][phase-1];for(let i=0;i<sequence.length*2;i++){b.bossAttack(b.boss);assert.equal(b.boss.attackName,BOSS_ATTACKS[sequence[i%sequence.length]]);seen.add(sequence[i%sequence.length]);b.bossHazards=[];b.enemyBullets=[];}}assert.equal(seen.size,5);}
 assert.equal(new Set(BOSS_PATTERNS.map(p=>p[0][0])).size,3);
});
test('delayed bomb locks its initial position and moving out prevents damage',()=>{
 const b=arena();b.bossAttack(b.boss,'bombs');const h=b.bossHazards[0],point={x:h.x,y:h.y};assert.equal(h.delay,1.8);assert.equal(h.x,b.player.x);assert.equal(h.y,b.player.y);
 b.player.x+=180;step(b,1.9);assert.deepEqual({x:h.x,y:h.y},point);assert.equal(b.r.hp,b.r.maxHp);assert.ok(h.fired);
});
test('bomb deals no warning damage, explodes once at 1.8 seconds, then expires',()=>{
 const b=arena();b.bossAttack(b.boss,'bombs');step(b,1.79);assert.equal(b.r.hp,b.r.maxHp);step(b,.02);assert.ok(b.r.hp<b.r.maxHp);const hp=b.r.hp;step(b,.3);assert.equal(b.r.hp,hp);step(b,.1);assert.equal(b.bossHazards.length,0);assert.equal(b.r.lastDeath,'');
});
test('dash immunity at bomb detonation prevents the explosion hit',()=>{
 const b=arena();b.bossAttack(b.boss,'bombs');step(b,1.4);b.update(STEP,{dash:true});step(b,.4);assert.equal(b.r.hp,b.r.maxHp);assert.ok(b.bossHazards[0].fired);
});
test('laser warning matches a fixed line, and moving out or entering after expiry is safe',()=>{
 const b=arena();b.bossAttack(b.boss,'laser');const h=b.bossHazards[0],line=[...h.segment];b.player.x+=100;step(b,1.7);assert.equal(b.r.hp,b.r.maxHp);assert.deepEqual(h.segment,line);step(b,.4);assert.equal(b.bossHazards.length,0);b.player.x=line[0];step(b,.1);assert.equal(b.r.hp,b.r.maxHp);
});
test('laser can hit a player entering the active line, only once per release',()=>{
 const b=arena();b.bossAttack(b.boss,'laser');b.player.x+=100;step(b,1.7);b.player.x-=100;b.update(STEP,{});assert.ok(b.r.hp<b.r.maxHp);const hp=b.r.hp;step(b,.3);assert.equal(b.r.hp,hp);
});
test('corner targeting and multi-bomb patterns preserve separation and room to escape',()=>{
 for(let chapter=1;chapter<=3;chapter++)for(const x of [25,360,695]){const b=arena(chapter);b.player.x=x;b.player.y=865;b.boss.phase=3;b.bossAttack(b.boss,'bombs');assert.ok(b.bossHazards.length>=1&&b.bossHazards.length<=3);for(const h of b.bossHazards){assert.ok(h.x-h.radius>=20&&h.x+h.radius<=700);assert.ok(h.y+h.radius<=880);for(const q of b.bossHazards.filter(q=>q.id!==h.id))assert.ok(Math.hypot(h.x-q.x,h.y-q.y)>=h.radius+q.radius+24);}}
});
test('frozen-region mines leave one of four lanes open',()=>{
 const b=arena(2);b.boss.phase=2;b.bossAttack(b.boss,'bombs');assert.equal(b.bossHazards.length,3);assert.ok(!b.bossHazards.some(h=>h.x===90));assert.ok(b.bossHazards.every(h=>h.delay>=1.8));
});
test('bullet curtain has a visible gap and cannot fill all flight lanes',()=>{
 const b=arena();b.bossAttack(b.boss,'corridor');const xs=b.enemyBullets.map(h=>h.x);assert.ok(xs.length>=8&&xs.length<17);assert.ok(b.enemyBullets.every(h=>h.vy>0));assert.ok(!xs.some(x=>Math.abs(x-270)<=85));
});
test('boss defeat clears bombs, lasers and bullets before rewards finish',()=>{
 const b=arena();b.bossAttack(b.boss,'bombs');b.bossAttack(b.boss,'laser');b.bossAttack(b.boss,'fan');assert.ok(b.bossHazards.length>0&&b.enemyBullets.length>0);b.damage(b.boss,1e8,'PRIMARY',1,0,false);assert.equal(b.bossHazards.length,0);assert.equal(b.enemyBullets.length,0);
 const hp=b.r.hp;for(const pickup of b.pickups){pickup.x=b.player.x;pickup.y=b.player.y;}b.update(STEP,{auto:true});assert.equal(b.done,true);assert.equal(b.r.hp,hp);
});
test('bomb damage and single detonation agree at 30, 60 and 144 FPS',()=>{
 const damages=[];for(const fps of [30,60,144]){const b=arena();b.bossAttack(b.boss,'bombs');for(let i=0;i<fps*3;i++)b.update(1/fps,{});damages.push(b.r.stats.damageTaken);assert.equal(b.bossHazards.length,0);}assert.deepEqual(damages,[11.05,11.05,11.05]);
});
test('boss warning patterns stay bounded through five simulated minutes',()=>{
 const b=arena(3);b.boss.shoot=0;b.boss.pressureEnabled=true;b.r.hp=b.r.maxHp=1e9;b.player.invincible=1e9;let maximum=0;for(let i=0;i<36000;i++){b.boss.hp=b.boss.maxHp*(i<12000?.9:i<24000?.5:.2);b.update(STEP,{});maximum=Math.max(maximum,b.bossHazards.length);assert.ok(b.enemyBullets.length<420);}assert.ok(maximum>0&&maximum<=12);assert.ok(b.r.events.some(e=>e.type==='boss-attack'));assert.ok(Number.isFinite(b.r.hp));
});
