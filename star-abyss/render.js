import { W,H,beamStats,attributes,targetDamageTaken } from './core.js';
import { REGIONS } from './data.js';
import {ELEMENT_STYLE,drawElementMark,drawElementStatus,drawElementEffect} from './element-visuals.js';
import {drawBossHazards} from './boss-visuals.js';
import {drawPlayerShip,drawEnemyShip,drawBossModel} from './ship-art.js';
import {drawProjectile,drawEnergyBeam,drawWeaponEffect,drawPrismAim,drawCharging,drawRailMarks,drawEnemyProjectile} from './weapon-visuals.js';
import {drawElementAura,drawElementCoating} from './element-atmosphere.js';
import {drawSpace} from './space-art.js';
import {drawShipAfterimage} from './afterimage-visuals.js';
export const sprites={};
const filenames=['playerShip1_blue.png','playerShip1_green.png','playerShip1_orange.png','playerShip2_orange.png','playerShip3_orange.png','meteorGrey_big1.png','laserBlue01.png'];
export const assetsReady=Promise.all(filenames.map(name=>new Promise(resolve=>{const img=new Image();img.onload=()=>{sprites[name]=img;resolve();};img.onerror=resolve;img.src=new URL(`assets/ships/${name}`,import.meta.url).href;})));
export function initCosmos(canvas){const ctx=canvas.getContext('2d');let width=0,height=0;function resize(){width=innerWidth;height=innerHeight;canvas.width=width;canvas.height=height;}resize();addEventListener('resize',resize);return time=>drawSpace(ctx,width,height,time,0);}
export function prepareCanvas(canvas){const touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0,dpr=touch?Math.min(1.25,Math.max(.7,(canvas.getBoundingClientRect().width||720)*(devicePixelRatio||1)/W)):Math.min(devicePixelRatio||1,2);canvas.width=W*dpr;canvas.height=H*dpr;const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return ctx;}
function line(ctx,points,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(points[0],points[1]);ctx.lineTo(points[2],points[3]);ctx.stroke();}
function ring(ctx,x,y,r,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
export function renderBattle(ctx,b){
 const r=b.r,p=b.player,t=b.time,region=REGIONS[(r.chapter-1)%REGIONS.length];
 ctx.save();ctx.clearRect(0,0,W,H);ctx.fillStyle='#08101c';ctx.fillRect(0,0,W,H);
 if(b.shake>0)ctx.translate((Math.random()-.5)*b.shake,(Math.random()-.5)*b.shake);
 drawSpace(ctx,W,H,t,(r.chapter-1)%REGIONS.length);
 for(const e of b.effects){
  const alpha=e.life/e.maxLife||.6;
  if(e.type==='ring')ring(ctx,e.x,e.y,e.radius*(1-alpha*.7),e.color+Math.floor(alpha*150).toString(16).padStart(2,'0'),2);
  if(e.type==='line'){ctx.globalAlpha=Math.min(1,alpha);line(ctx,e.segment,e.color,e.width);ctx.globalAlpha=1;}
  if(['steam','well','crystal','miasma'].includes(e.type)){
   const color=e.color||(e.type==='steam'?'#93cbdf':'#b38aed');const g=ctx.createRadialGradient(e.x,e.y,5,e.x,e.y,e.radius);g.addColorStop(0,e.blackHole?'#090111bb':color+'22');g.addColorStop(.7,color+'11');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(e.x-e.radius,e.y-e.radius,e.radius*2,e.radius*2);ring(ctx,e.x,e.y,e.radius*.7,color+'55',1);ring(ctx,e.x,e.y,e.radius*(.65+.15*Math.sin(t*3)),color+'33');
  }
  if(e.type==='time'){ctx.fillStyle='#689cdf0b';ctx.fillRect(0,0,W,H);}
 }
 drawRailMarks(ctx,b.railMarks,t);
 for(const item of b.pickups){ctx.save();ctx.translate(item.x,item.y);ctx.rotate(t);ctx.fillStyle='#a8acf0';ctx.shadowColor='#a8acf0';ctx.shadowBlur=10;ctx.fillRect(-4,-4,8,8);ctx.restore();}
 if(r.weapon==='beam'&&r.relics.E03)drawPrismAim(ctx,b.previewBeamSegments());
 for(const e of b.enemies){
  const attached=Object.entries(e.status).filter(([id,state])=>state.stacks>0&&ELEMENT_STYLE[id]).map(([id])=>id);if(attached.length)drawElementAura(ctx,e.x,e.y,attached,t,e.radius,.65);
  if(e.type==='boss')drawBossModel(ctx,e,t,region.color,(r.chapter-1)%3);else drawEnemyShip(ctx,e,t);
  if(e.type!=='boss'&&e.hp<e.maxHp){ctx.fillStyle='#1d2636';ctx.fillRect(e.x-22,e.y-e.radius-14,44,3);ctx.fillStyle=e.elite?'#dab378':'#b46c75';ctx.fillRect(e.x-22,e.y-e.radius-14,44*e.hp/e.maxHp,3);}
 }
 for(const ghost of b.afterimages)drawShipAfterimage(ctx,ghost,r.frame,t);
 for(const bullet of b.bullets)drawProjectile(ctx,bullet,r,t);
 for(const beam of[p.beam,...b.echoBeams].filter(Boolean))drawEnergyBeam(ctx,beam,r,p,t);
 for(const q of b.particles){ctx.fillStyle=q.color;ctx.globalAlpha=Math.min(1,q.life*2);ctx.fillRect(q.x,q.y,q.size,q.size);}ctx.globalAlpha=1;
 for(const v of b.visualEffects)if(['muzzle','weapon-hit','split-launch'].includes(v.type))drawWeaponEffect(ctx,v,t);else drawElementEffect(ctx,v,t);
 for(const e of b.enemies){drawElementStatus(ctx,e,t);const vulnerable=targetDamageTaken(r,e,t)-1;if(vulnerable>0){ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.strokeStyle='#090e1f';ctx.lineWidth=3;const label=`易伤 +${Math.round(vulnerable*100)}%`;ctx.strokeText(label,e.x,e.y+e.radius+14);ctx.fillStyle='#eaa7f3';ctx.fillText(label,e.x,e.y+e.radius+14);ctx.restore();}}
 drawBossHazards(ctx,b.bossHazards);
 if(r.relics.R11){const n=r.evolutions.includes('U05')?1:r.relics.R11;for(let i=0;i<n;i++)drawPlayerShip(ctx,{id:r.evolutions.includes('U05')?'titan':'falcon',accent:'#baa6ed'},p.x+(i-(n-1)/2)*45,p.y+22,t,r.evolutions.includes('U05')?.44:.25,.9);}
 if(p.charge>0)drawCharging(ctx,p,Math.min(1,p.charge/(r.weapon==='rail'?2.2*attributes(r).rate:beamStats(r).charge)),r.weapon,t);
 drawElementAura(ctx,p.x,p.y,r.elements,t,34);
 drawPlayerShip(ctx,r.frame,p.x,p.y,t,.85,p.invincible>0?.45+.4*Math.sin(t*35):1);
 drawElementCoating(ctx,p.x,p.y,r.elements,t,.85);
 if(r.shield>0)ring(ctx,p.x,p.y,37,r.frame.accent+'45',1);
 r.elements.forEach((id,i)=>{const angle=t*.6+i*Math.PI*2/r.elements.length;drawElementMark(ctx,id,p.x+Math.cos(angle)*46,p.y+Math.sin(angle)*46,7,t);});
 if(p.charge>0){const full=r.weapon==='rail'?2.2*attributes(r).rate:beamStats(r).charge;ctx.beginPath();ctx.arc(p.x,p.y,41,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p.charge/full));ctx.strokeStyle='#f0c6b0';ctx.lineWidth=3;ctx.stroke();}
 if(p.stored){ctx.fillStyle='#f1a8cc';ctx.fillRect(p.x+42,p.y-4,6,8);}
 // The actual collision point stays visible above the ship and friendly effects.
 ctx.fillStyle='#ecfafb';ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();
 // Enemy projectiles are drawn last for readability.
 for(const bullet of b.enemyBullets)drawEnemyProjectile(ctx,bullet,t,r.chapter-1);
 ctx.font='12px monospace';ctx.textAlign='center';for(const f of b.floaters){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.color;ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
 ctx.restore();
}
