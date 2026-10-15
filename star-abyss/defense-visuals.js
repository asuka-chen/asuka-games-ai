// Defensive effects use simulation geometry; drawing never changes combat or RNG.
const TAU=Math.PI*2;
function ring(ctx,x,y,r,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();}
export function drawDefensiveWave(ctx,w){
 if(w.radius<=0)return;const fade=Math.min(1,w.life/.18),r=w.radius;
 ctx.save();ctx.globalAlpha=fade;ctx.globalCompositeOperation='lighter';
 const glow=ctx.createRadialGradient(w.x,w.y,Math.max(0,r-23),w.x,w.y,r+2);glow.addColorStop(0,'#53baff00');glow.addColorStop(.8,'#64e2ff30');glow.addColorStop(1,'#d4ffff00');ctx.fillStyle=glow;ctx.fillRect(w.x-r-2,w.y-r-2,r*2+4,r*2+4);
 ring(ctx,w.x,w.y,r,'#4dbaff42',10);ring(ctx,w.x,w.y,r,'#b8f7ff',2);ring(ctx,w.x,w.y,r*.91,'#64d8ff65',1);
 for(let i=0;i<12;i++){const a=i*TAU/12+w.elapsed*.5;ctx.strokeStyle=i%2?'#a7f8ff':'#bbadff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(w.x,w.y,r,a,a+.06);ctx.stroke();}
 ctx.restore();
}
export function drawDefenseEffect(ctx,v){
 const a=Math.max(0,v.life/v.maxLife),p=1-a;ctx.save();ctx.globalAlpha=a;ctx.globalCompositeOperation='lighter';
 if(v.type==='shield-gate'){
  ring(ctx,v.x,v.y,40+p*26,'#7ee4ff66',8);ring(ctx,v.x,v.y,40+p*26,'#dbfbff',1.5);
  for(let i=0;i<6;i++){const angle=i*TAU/6,r=43+p*20;ctx.save();ctx.translate(v.x+Math.cos(angle)*r,v.y+Math.sin(angle)*r);ctx.rotate(angle);ctx.strokeStyle='#a5f3ff';ctx.fillStyle='#55aaff22';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-4,-12);ctx.lineTo(7,-8);ctx.lineTo(7,8);ctx.lineTo(-4,12);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 }
 if(v.type==='bullet-dissolve'){ring(ctx,v.x,v.y,3+p*12,'#b4f9ff',1.5);for(let i=0;i<4;i++){const angle=i*TAU/4+p;ctx.fillStyle='#acdcff';ctx.fillRect(v.x+Math.cos(angle)*p*15-1,v.y+Math.sin(angle)*p*15-1,2,2);}}
 if(v.type==='retaliation'){
  const [x,y,xx,yy]=v.segment,dx=xx-x,dy=yy-y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  for(const width of [8,2]){ctx.strokeStyle=width===8?'#e96fc444':'#ffd7ef';ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);for(let i=1;i<=8;i++){const q=i/8,offset=i===8?0:Math.sin(i*2.3)*9*a;ctx.lineTo(x+dx*q+nx*offset,y+dy*q+ny*offset);}ctx.stroke();}
  ring(ctx,xx,yy,10+p*23,'#f699d4',2);ring(ctx,x,y,20+p*18,'#e786c455',1.5);
 }
 ctx.restore();
}
