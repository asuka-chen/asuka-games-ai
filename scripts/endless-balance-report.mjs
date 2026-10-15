// Deterministic damage benchmark; boss guns disabled to isolate offensive balance.
import * as core from '../star-abyss/core.js';
import {UPGRADES} from '../star-abyss/data.js';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const old=process.argv[2]?await import(pathToFileURL(process.argv[2]).href):null;
const configs=[['beam','U01',{E01:2,C10:3}],['pulse','U09',{R04:2,C12:3}],['shotgun','U12',{C09:3,R04:2,C12:3}],['rail','U13',{C07:3,C09:3,C12:3}],['swarm','U16',{R04:2,R11:3,C12:3}]];
function measure(engine,weapon,evolution,relics,extra){const r=engine.createRun({weapon,seed:'endless-balance-'+weapon});r.chapter=9;r.elements=['fire','ice','lightning'];r.evolutions=[evolution];r.relics={C01:3,C02:3,C06:3,L04:1,...relics};r.upgrades=Object.fromEntries(UPGRADES.map(u=>[u.id,u.max+(['attack','rate','crit','element','projectile'].includes(u.id)?extra:0)]));r.hp=r.maxHp=1e9;r.random=()=>.99;
 const b=new engine.Battle(r,{id:'benchmark',type:'boss'});b.player.invincible=1e9;b.boss.shoot=1e9;b.boss.pressureEnabled=false;const hp=b.boss.maxHp,armor=b.boss.armor;let ticks=0;while(!b.bossKilled&&ticks++<240*120)b.update(engine.STEP,{auto:true});assert.ok(b.bossKilled,weapon+' cannot kill within 240s');return{hp,armor,killSeconds:+b.time.toFixed(2)};}
const rows=[];for(const[weapon,evo,relics]of configs){const previous=old?measure(old,weapon,evo,relics,12):null,current=measure(core,weapon,evo,relics,12),grown=measure(core,weapon,evo,relics,24);if(previous)assert.ok(current.killSeconds>previous.killSeconds,weapon+' should face greater resistance');assert.ok(grown.killSeconds<current.killSeconds,weapon+' should benefit from continued growth');rows.push({weapon,previous,current,withFurtherGrowth:grown});}
await mkdir('test-results',{recursive:true});await writeFile('test-results/endless-v011-report.json',JSON.stringify({scenario:'Chapter nine, primary evolution, capped campaign upgrades plus 12 offensive levels; second measurement adds another 12 levels; stationary invulnerable player, boss guns disabled, no critical rolls. Measures offensive resistance, not player survival.',rows},null,2)+'\n');console.log(JSON.stringify(rows,null,2));
