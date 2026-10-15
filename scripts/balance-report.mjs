// Compare deterministic, fixed-target damage. This does not model player dodge or a full run.
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import * as current from '../star-abyss/core.js';
import {EVOLUTIONS,SYNERGIES} from '../star-abyss/data.js';
const previous=process.argv[2]?await import(pathToFileURL(process.argv[2]).href):null;
function measure(core,weapon,evolution,late){
 const r=core.createRun({weapon,seed:'fixed-balance'});r.random=()=>.99;r.hp=r.maxHp*.25;r.chapter=3;
 if(evolution){r.evolutions=[evolution.id];const recipe=SYNERGIES.find(s=>s.id===evolution.synergy);for(const id of [...recipe.relics,...(evolution.extra?[evolution.extra]:[])])r.relics[id]=1;r.elements=[...recipe.elements];}
 if(late){Object.assign(r.relics,{C01:3,C02:3,C06:3,C09:3,E07:2,E09:1,R08:2,X01:1,X03:1});r.upgrades={attack:5,rate:4,crit:5,element:3};r.elements=[...new Set([...r.elements,'fire','lightning','light'])].slice(0,3);if(!r.elements.includes('light'))delete r.relics.R08;if(r.relics.X04)delete r.relics.X03;if(weapon==='beam')Object.assign(r.relics,{E01:1,C10:3,L04:1});}
 const b=new core.Battle(r,{id:'measurement',type:'combat'});b.waves=0;b.duration=1e6;b.player.invincible=1e9;if(r.relics.E04)b.player.y=280;if(r.relics.E03){b.player.x=80;b.player.y=610;}if(weapon==='shotgun')b.player.y=240;
 const e=b.spawnEnemy('armor',360,300,true);e.hp=e.maxHp=1e9;e.type='boss';e.armor=15;e.shoot=1e9;
 for(let i=0;i<3600;i++){e.age=0;e.x=360;e.y=130;b.update(core.STEP,{auto:true});}
 return Object.values(r.damage).reduce((a,c)=>a+c,0)/30;
}
const results=[];
for(const evolution of EVOLUTIONS){const synergy=SYNERGIES.find(s=>s.id===evolution.synergy),weapon=evolution.weapon||(synergy.weapon==='beam'?'beam':synergy.weapon==='bullet'?'pulse':'swarm');
 const after=measure(current,weapon,evolution,true),before=previous?measure(previous,weapon,evolution,true):null;
 results.push({evolution:evolution.id,name:evolution.name,weapon,previousDps:before&&+before.toFixed(2),currentDps:+after.toFixed(2),changePercent:before?+((after/before-1)*100).toFixed(1):null});
}
await mkdir('test-results',{recursive:true});await writeFile('test-results/balance-report.json',JSON.stringify({scenario:'30s static durable boss, chapter 3, stacked late-build relics, no critical rolls; each recipe retains its required elements and mutually exclusive primary shape; no critical rolls; fixed chapter 3 enemy stats for comparison regardless of evolution unlock gate',results},null,2)+'\n');
console.table(results);
