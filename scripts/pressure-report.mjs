import * as current from '../star-abyss/core.js';
import {pathToFileURL} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
const previous=process.argv[2]?await import(pathToFileURL(process.argv[2]).href):null;
function measure(core,chapter,phase){const r=core.createRun({seed:'pressure-report'});r.chapter=chapter;r.floor=11;r.hp=r.maxHp=1e9;const b=new core.Battle(r,{id:'boss',type:'boss'});b.player.invincible=1e9;b.boss.hp=b.boss.maxHp*[.9,.5,.2][phase-1];let shots=0,peak=0,sum=0,lower=0;
 for(const name of ['bossAttack','bossPressure'])if(b[name]){const original=b[name].bind(b);b[name]=(...args)=>{const count=b.enemyBullets.length;original(...args);shots+=b.enemyBullets.length-count;};}
 for(let i=0;i<3600;i++){b.update(core.STEP,{});peak=Math.max(peak,b.enemyBullets.length);sum+=b.enemyBullets.length;lower+=b.enemyBullets.filter(e=>e.y>300&&e.y<900).length;}return{shots,peak,average:+(sum/3600).toFixed(1),lower:+(lower/3600).toFixed(1)};}
const results=[];for(let chapter=1;chapter<=3;chapter++)for(let phase=1;phase<=3;phase++){const now=measure(current,chapter,phase),old=previous?measure(previous,chapter,phase):null;results.push({chapter,phase,oldShots:old?.shots,newShots:now.shots,oldAverage:old?.average,newAverage:now.average,lowerScreen:now.lower,peak:now.peak});}
await mkdir('test-results',{recursive:true});await writeFile('test-results/pressure-report.json',JSON.stringify({scenario:'30 second stationary, invulnerable-player simulations without player firing',results},null,2));console.table(results);
