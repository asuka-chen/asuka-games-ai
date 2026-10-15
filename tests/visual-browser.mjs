import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const port=8094,server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium'});
try{
 await mkdir('test-results',{recursive:true});const page=await browser.newPage({viewport:{width:1450,height:1240}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${port}/star-abyss/`);await page.getByRole('button',{name:'开始出击'}).waitFor();
 async function grid(reactions){return page.evaluate(async reactions=>{
  const {createRun,Battle,STEP}=await import('/star-abyss/core.js'),{ELEMENTS}=await import('/star-abyss/data.js'),{renderBattle}=await import('/star-abyss/render.js'),{REACTION_VISUALS}=await import('/star-abyss/element-visuals.js');
  const entries=reactions?Object.entries(REACTION_VISUALS).map(([name,s])=>({name,elements:s.elements})):ELEMENTS.map(e=>({name:e.name,elements:[e.id]}));
  document.body.innerHTML='<main id="visual-grid" style="width:100%;padding:16px;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;background:#060c17"></main>';
  return entries.map(entry=>{const r=createRun({weapon:'beam',seed:'visual-'+entry.name});r.elements=entry.elements;r.random=()=>.99;r.relics={E01:1};r.upgrades.duration=3;const b=new Battle(r,{id:'visual',type:'combat'});b.waves=0;b.duration=1e6;b.shake=0;const e=b.spawnEnemy('armor',360,430,true);e.hp=e.maxHp=1e6;e.armor=0;e.shoot=1e6;e.speed=0;
   for(let i=0;i<5;i++){b.time=i*.2;b.damage(e,1,'PRIMARY',i,0,false);}b.releaseBeam();b.update(STEP,{});b.tickBeam(b.player.beam);b.update(.25,{});b.shake=0;
   const figure=document.createElement('section'),label=document.createElement('div'),canvas=document.createElement('canvas');label.textContent=entry.name;label.style.cssText='font:18px sans-serif;color:#dce7ee;text-align:center;padding:8px';canvas.width=720;canvas.height=900;canvas.style.cssText='width:100%;height:auto;border:1px solid #334455';figure.append(label,canvas);document.getElementById('visual-grid').append(figure);renderBattle(canvas.getContext('2d'),b);
   const data=canvas.getContext('2d').getImageData(0,0,720,900).data;let hash=2166136261;for(let i=0;i<data.length;i+=4)hash=Math.imul(hash^data[i]^data[i+1]^data[i+2],16777619);
   return{name:entry.name,pixelHash:hash,statuses:Object.keys(e.status),reaction:b.visualEffects.some(v=>v.type==='reaction'&&v.name===entry.name)};
  });
 },reactions);}
 const elements=await grid(false);assert.equal(new Set(elements.map(e=>e.pixelHash)).size,6);assert.ok(elements.every(e=>e.statuses.length>0));await page.screenshot({path:'test-results/elements.png',fullPage:true});
 const reactions=await grid(true);assert.equal(new Set(reactions.map(e=>e.pixelHash)).size,15);assert.ok(reactions.every(e=>e.reaction));await page.screenshot({path:'test-results/reactions.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS: all six elemental beams/statuses and all fifteen named reaction effects render distinct images without errors');
}finally{await browser.close();server.kill('SIGTERM');}
