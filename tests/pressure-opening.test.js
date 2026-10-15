import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun,Battle,STEP,normalizeEarlyRoute,generateMap} from '../star-abyss/core.js';
import {readFileSync} from 'node:fs';
import {RELICS,SYNERGIES,EVOLUTIONS,WEAPONS,UPGRADES,ELEMENTS,SUPPLY_REWARDS,ELEMENT_REACTIONS,CHALLENGES} from '../star-abyss/data.js';

test('first three layers have no forge, market or repair across 1000 seeds',()=>{
 for(let seed=0;seed<1000;seed++){const map=generateMap(seed,1);assert.ok(map[0].some(n=>n.type==='combat')&&map[0].some(n=>n.type==='event'));assert.ok(map.slice(0,3).flat().every(n=>['combat','event'].includes(n.type)));assert.ok(map[10].every(n=>['repair','shop'].includes(n.type)));}
});
test('early checkpoint normalization preserves visited nodes, IDs, links and RNG',()=>{
 const r=createRun({seed:'legacy-services'});const nodes=r.map.slice(0,3).flat();nodes.forEach((n,i)=>n.type=['shop','forge','repair'][i%3]);r.path=[nodes[0].id];r.current=nodes[0];const structure=nodes.map(n=>({id:n.id,links:[...n.links]})),state=r.random.getState();normalizeEarlyRoute(r);
 assert.equal(nodes[0].type,'shop');assert.ok(nodes.slice(1).every(n=>['combat','event'].includes(n.type)));assert.deepEqual(nodes.map(n=>({id:n.id,links:n.links})),structure);assert.equal(r.random.getState(),state);
 const snapshot=JSON.stringify(r.map);normalizeEarlyRoute(r);assert.equal(JSON.stringify(r.map),snapshot);
});
test('later chapter service nodes are not removed by opening migration',()=>{const r=createRun();r.chapter=2;r.map=generateMap('later',2);const before=JSON.stringify(r.map);normalizeEarlyRoute(r);assert.equal(JSON.stringify(r.map),before);});
function boss(phase){const r=createRun();r.hp=r.maxHp=1e9;const b=new Battle(r,{id:'pressure',type:'boss'});b.player.invincible=1e9;b.boss.shoot=1e9;b.boss.hp=b.boss.maxHp*[.9,.5,.2][phase-1];return b;}
test('boss side guns keep firing during bomb and laser warnings',()=>{
 for(const pattern of ['bombs','laser']){const b=boss(1);b.bossAttack(b.boss,pattern);for(let i=0;i<120;i++)b.update(STEP,{});assert.ok(b.bossHazards.some(h=>!h.fired));assert.ok(b.enemyBullets.filter(e=>e.pressure).length>=6);}
});
test('sustained fire grows with phase and never pauses for main skill cooldown',()=>{
 const rates=[];for(const phase of [1,2,3]){const b=boss(phase),original=b.bossPressure.bind(b);let emitted=0;b.bossPressure=(e,dt)=>{const before=b.enemyBullets.length;original(e,dt);emitted+=b.enemyBullets.length-before;};for(let i=0;i<1200;i++)b.update(STEP,{});rates.push(emitted/10);assert.ok(b.enemyBullets.length<360);}
 assert.ok(rates[0]>=8);assert.ok(rates[1]>rates[0]);assert.ok(rates[2]>rates[1]*1.5);
});
test('boss defeat ends sustained fire as well as pending skills',()=>{const b=boss(3);for(let i=0;i<240;i++)b.update(STEP,{});assert.ok(b.enemyBullets.some(e=>e.pressure));b.kill(b.boss,'PRIMARY');assert.equal(b.enemyBullets.length,0);b.bossPressure(b.boss,10);assert.equal(b.enemyBullets.length,0);});
test('all equipment, recipe, weapon and elemental cards have self-contained SVG artwork',()=>{
 const ids=[...RELICS,...SYNERGIES,...EVOLUTIONS,...ELEMENT_REACTIONS].map(x=>x.id).concat(WEAPONS.map(x=>'weapon-'+x.id),UPGRADES.map(x=>'upgrade-'+x.id),ELEMENTS.map(x=>'element-'+x.id),SUPPLY_REWARDS.map(x=>x.icon),CHALLENGES.map(x=>'challenge-'+x.id));assert.equal(ids.length,140);const files=ids.map(id=>readFileSync(new URL('../star-abyss/assets/icons/'+id+'.svg',import.meta.url),'utf8'));for(const svg of files){assert.match(svg,/viewBox="0 0 128 128"/);assert.doesNotMatch(svg,/<script|<image|href=/);}assert.equal(new Set(files).size,140);
});
