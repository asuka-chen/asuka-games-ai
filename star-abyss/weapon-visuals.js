import {drawElementProjectileSkin,drawElementBeamSkin} from './element-atmosphere.js';
import {ELEMENT_STYLE} from './element-visuals.js';
function line(ctx,x1,y1,x2,y2,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function ring(ctx,x,y,r,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
export function drawProjectile(ctx,b,r,time){
 const element=b.generation===0?r.elements[b.root%Math.max(1,r.elements.length)]:null,color=ELEMENT_STYLE[element]?.color||b.color||(b.source==='SUMMON'?'#baaeff':'#82e8ff');const quality=b.chargeRatio??1,size=b.rail?.4+.6*quality:1;ctx.save();ctx.globalAlpha=(b.source==='ECHO'?.45:1)*(.2+.8*quality);
 if(b.trail?.length>1){for(const [width,alpha]of [[8,'16'],[2,'88']]){ctx.lineWidth=width*size;ctx.strokeStyle=color+alpha;ctx.beginPath();b.trail.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.lineTo(b.x,b.y);ctx.stroke();}}
 const velocity=Math.hypot(b.vx,b.vy)||1,length=Math.min(b.rail?.13:b.swarm?.07:.055,100/velocity);
 if(b.rail){const ux=b.vx/velocity,uy=b.vy/velocity,nx=-uy,ny=ux;ctx.save();ctx.globalCompositeOperation='screen';for(const side of[-1,1]){line(ctx,b.x+nx*side*6*size,b.y+ny*side*6*size,b.x-b.vx*length*.85+nx*side*3*size,b.y-b.vy*length*.85+ny*side*3*size,color+'77',1.2);}}
 line(ctx,b.x,b.y,b.x-b.vx*length,b.y-b.vy*length,color+'22',(b.rail?29:12)*size);line(ctx,b.x,b.y,b.x-b.vx*length,b.y-b.vy*length,color,(b.rail?8:2.5)*size);
 if(b.rail){ctx.restore();ring(ctx,b.x,b.y,9*size,color+'bb',1);line(ctx,b.x,b.y,b.x-b.vx*length*.8,b.y-b.vy*length*.8,'#f0fbff',2*size);}
 if(b.splitLaunch){ring(ctx,b.x,b.y,Math.max(3,b.radius)*1.4,'#b7e2fb88',.8);}
 if(b.swarm){ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vx,-b.vy));ctx.fillStyle='#d4eaf2';ctx.strokeStyle=color;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(4,-2);ctx.lineTo(4,5);ctx.lineTo(8,9);ctx.lineTo(0,6);ctx.lineTo(-8,9);ctx.lineTo(-4,5);ctx.lineTo(-4,-2);ctx.closePath();ctx.fill();ctx.stroke();line(ctx,-2,-5,-2,4,'#0b2639',1.5);line(ctx,2,-5,2,4,'#ffffffaa',.8);ctx.fillStyle=color;ctx.fillRect(-1,-6,2,3);line(ctx,-5,6,-3,7,'#ffffff99',.8);line(ctx,3,7,5,6,'#ffffff99',.8);line(ctx,0,8,0,20+Math.sin(time*80+b.root)*4,color,3);line(ctx,0,7,0,15,'#fff6df',1.5);}
 else if(b.radius>=8){ring(ctx,b.x,b.y,b.radius*1.5,color+'44',3);ctx.fillStyle=color;ctx.beginPath();ctx.arc(b.x,b.y,b.radius*.7,0,Math.PI*2);ctx.fill();ring(ctx,b.x,b.y,b.radius,'#fff0d4',1.5);}
 else{ctx.fillStyle='#effaff';ctx.beginPath();ctx.ellipse(b.x,b.y,(b.rail?5:2)*size,(b.rail?9:5)*size,Math.atan2(b.vx,-b.vy),0,Math.PI*2);ctx.fill();}
 ctx.restore();drawElementProjectileSkin(ctx,b,r.elements,time);
}
export function drawEnergyBeam(ctx,beam,r,p,time){
 const colors=r.elements.length?r.elements.map(id=>ELEMENT_STYLE[id].color):[r.evolutions.includes('U01')?'#ff779e':'#eca1d8'],origin=beam.origin||p,quality=beam.chargeRatio??1;ctx.save();ctx.globalAlpha=(beam.echo?.35:1)*(.2+.8*quality);
 if(r.relics.E04){
  colors.forEach((color,i)=>{ring(ctx,origin.x,origin.y,150+i*4,color+'18',beam.stats.width*2);ring(ctx,origin.x,origin.y,150+i*4,color+'88',beam.stats.width*.5);});ring(ctx,origin.x,origin.y,150,'#ffe9fa',3);
  for(let i=0;i<12;i++){const a=time*2+i*Math.PI/6,x=origin.x+Math.cos(a)*150,y=origin.y+Math.sin(a)*150;line(ctx,x,y,x+Math.cos(a+.4)*12,y+Math.sin(a+.4)*12,colors[i%colors.length],2);}
 }else for(const s of beam.segments){const [x1,y1,x2,y2]=s.line,dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
  line(ctx,x1,y1,x2,y2,colors[0]+'12',s.width*2.5);line(ctx,x1,y1,x2,y2,colors[0]+'35',s.width*1.25);line(ctx,x1,y1,x2,y2,colors[0]+'aa',s.width*.55);line(ctx,x1,y1,x2,y2,'#fff3fb',Math.max(2,s.width*.12));
  ctx.save();ctx.globalCompositeOperation='screen';ctx.setLineDash([16,24]);ctx.lineDashOffset=-time*120;for(const side of[-1,1])line(ctx,x1+nx*s.width*.35*side,y1+ny*s.width*.35*side,x2+nx*s.width*.35*side,y2+ny*s.width*.35*side,colors[0]+'66',1);ctx.setLineDash([]);ctx.restore();
  for(let strand=0;strand<(quality>=.8?3:1);strand++){ctx.lineWidth=1.5;ctx.strokeStyle=colors[strand%colors.length]+'b0';ctx.beginPath();for(let i=0;i<=20;i++){const f=i/20,offset=Math.sin(f*50+time*38+strand*2)*s.width*.2,x=x1+dx*f+nx*offset,y=y1+dy*f+ny*offset;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  for(let i=0;i<5;i++){const f=(time*1.4+i/5)%1,x=x1+dx*f,y=y1+dy*f;line(ctx,x-nx*s.width*.4,y-ny*s.width*.4,x+nx*s.width*.4,y+ny*s.width*.4,colors[i%colors.length]+'99',2);}
  drawElementBeamSkin(ctx,s,r.elements,time,quality);
  for(let i=1;i<colors.length;i++)line(ctx,x1+nx*s.width*i*.2,y1+ny*s.width*i*.2,x2+nx*s.width*i*.2,y2+ny*s.width*i*.2,colors[i]+'bb',3);
 }
 const radius=Math.max(12,beam.stats.width*.6);ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<3;i++){const a=time*3+i*Math.PI*2/3;ring(ctx,origin.x+Math.cos(a)*radius*.65,origin.y-25+Math.sin(a)*radius*.65,3*quality,colors[0]+'99',1);}ctx.restore();ring(ctx,origin.x,origin.y-25,radius,colors[0]+'55',5);ring(ctx,origin.x,origin.y-25,radius*.6,'#ffe7f3',2);ctx.restore();
}
export function drawWeaponEffect(ctx,v,time){
 const quality=v.chargeRatio??1,alpha=Math.max(0,v.life/v.maxLife),progress=1-alpha,color=v.color||'#92e8ff';ctx.save();ctx.globalAlpha=alpha*(.2+.8*quality);
 if(v.type==='split-launch'){for(const side of[-1,1]){const x=v.x+side*progress*30,y=v.y-progress*40;line(ctx,v.x,v.y,x,y,color+'aa',1.5);ring(ctx,x,y,3+progress*4,'#f1faff',.8);}}
 if(v.type==='muzzle'){const radius=8+progress*(10+14*quality);ctx.save();ctx.translate(v.x,v.y);ctx.scale(1,.45);ring(ctx,0,0,radius,color+'88',2);ring(ctx,0,0,radius*.6,'#ecfbff',1);ctx.restore();for(let i=0;i<6;i++){const a=i*Math.PI/3+time;line(ctx,v.x+Math.cos(a)*5,v.y+Math.sin(a)*5,v.x+Math.cos(a)*radius,v.y+Math.sin(a)*radius,color,2);}}
 if(v.type==='weapon-hit'){const radius=6+progress*(v.weapon==='rail'?42:26);const glow=ctx.createRadialGradient(v.x,v.y,0,v.x,v.y,radius);glow.addColorStop(0,'#f0fcff88');glow.addColorStop(.3,color+'44');glow.addColorStop(1,color+'00');ctx.fillStyle=glow;ctx.fillRect(v.x-radius,v.y-radius,radius*2,radius*2);ctx.save();ctx.translate(v.x,v.y);ctx.scale(1,.55);ring(ctx,0,0,radius*1.4,color+'66',1);ctx.restore();ring(ctx,v.x,v.y,radius,color+'88',1.5);for(let i=0;i<7;i++){const a=i*Math.PI*2/7+v.x*.01,near=radius*.55;line(ctx,v.x+Math.cos(a)*near,v.y+Math.sin(a)*near,v.x+Math.cos(a)*radius,v.y+Math.sin(a)*radius,i%2?color:'#e7faff',2);}}
 ctx.restore();
}

export function drawPrismAim(ctx,segments){
 ctx.save();ctx.setLineDash([7,11]);ctx.lineWidth=1.2;
 for(let i=0;i<segments.length;i++){const s=segments[i];ctx.globalAlpha=.25*Math.pow(.75,i);line(ctx,...s.line,'#c4b2fa',1.2);if(i<segments.length-1){ctx.setLineDash([]);ring(ctx,s.line[2],s.line[3],3,'#c4b2fa',1);ctx.setLineDash([7,11]);}}
 ctx.restore();
}
export function drawCharging(ctx,p,ratio,weapon,time){
 if(ratio<=0)return;const full=ratio>=1-1e-6,color=weapon==='rail'?'#8edaff':'#efa0e4';ctx.save();ctx.globalAlpha=.2+.7*ratio;
 ring(ctx,p.x,p.y,32+ratio*8,color+'77',full?2:1);if(full){ring(ctx,p.x,p.y,44+Math.sin(time*8)*2,color+'44',2);for(let i=0;i<4;i++){const angle=time*2+i*Math.PI/2,x=p.x+Math.cos(angle)*40,y=p.y+Math.sin(angle)*40;line(ctx,x,y,x+Math.cos(angle+.4)*8,y+Math.sin(angle+.4)*8,color,2);}}
 ctx.restore();
}

export function drawRailMarks(ctx,marks,time){
 ctx.save();for(const m of marks){const alpha=Math.max(0,m.life/m.maxLife)*(.25+.55*m.quality),[x1,y1,x2,y2]=m.segment;ctx.globalAlpha=alpha;line(ctx,x1,y1,x2,y2,'#6399ed22',m.radius*2);line(ctx,x1,y1,x2,y2,'#88bded66',m.radius*.55);ctx.setLineDash([5,7]);ctx.lineDashOffset=-time*22;line(ctx,x1,y1,x2,y2,'#d3eaff',2);ctx.setLineDash([]);}ctx.restore();
}

const hostileSprites=new Map();let hostileFireTail;
export function drawEnemyProjectile(ctx,b,time,sector=0){
 const color=b.color||'#ff9786',key=`${color}:${b.radius}`;if(!hostileSprites.has(key)){const c=document.createElement('canvas');c.width=c.height=40;const g=c.getContext('2d'),r=b.radius,halo=g.createRadialGradient(20,20,1,20,20,r*2.5);halo.addColorStop(0,color+'88');halo.addColorStop(.45,color+'22');halo.addColorStop(1,color+'00');g.fillStyle=halo;g.fillRect(0,0,40,40);g.fillStyle='#180e1a';g.beginPath();g.arc(20,20,r+1,0,Math.PI*2);g.fill();g.strokeStyle=color;g.lineWidth=1.6;g.beginPath();g.arc(20,20,r-.5,0,Math.PI*2);g.stroke();g.fillStyle='#ffe7cb';g.beginPath();g.arc(20,20,Math.max(1.4,r*.35),0,Math.PI*2);g.fill();if(hostileSprites.size>=40)hostileSprites.delete(hostileSprites.keys().next().value);hostileSprites.set(key,c);}
 ctx.save();if(b.boss&&sector%3===0){if(!hostileFireTail){hostileFireTail=document.createElement('canvas');hostileFireTail.width=18;hostileFireTail.height=30;const q=hostileFireTail.getContext('2d'),g=q.createLinearGradient(0,0,0,30);g.addColorStop(0,'#ffdcaab0');g.addColorStop(.3,'#ff966a88');g.addColorStop(1,'#d45a5000');q.fillStyle=g;q.beginPath();q.moveTo(4,0);q.bezierCurveTo(1,11,8,19,9,30);q.bezierCurveTo(16,13,16,5,14,0);q.fill();}ctx.save();ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vx,-b.vy));ctx.drawImage(hostileFireTail,-9,-1);ctx.restore();}const tail=b.pressure?.065:.04;line(ctx,b.x,b.y,b.x-b.vx*tail,b.y-b.vy*tail,color+'66',2);if(b.boss){const speed=Math.hypot(b.vx,b.vy)||1,nx=-b.vy/speed,ny=b.vx/speed;if(sector%3===1){line(ctx,b.x+nx*5,b.y+ny*5,b.x-nx*5,b.y-ny*5,'#a9e7ff66',1);line(ctx,b.x,b.y,b.x-b.vx*.08,b.y-b.vy*.08,'#87c9ed33',4);}else if(sector%3===2){line(ctx,b.x,b.y,b.x-b.vx*.05+nx*3,b.y-b.vy*.05+ny*3,'#bf99f477',1);}}ctx.drawImage(hostileSprites.get(key),b.x-20,b.y-20);ctx.restore();
}
