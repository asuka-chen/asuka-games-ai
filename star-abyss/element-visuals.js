import {ELEMENTS,ELEMENT_LIMITS,ELEMENT_REACTIONS} from './data.js';

export const ELEMENT_STYLE=Object.fromEntries(ELEMENTS.map(e=>[e.id,e]));
export const REACTION_VISUALS=Object.fromEntries(ELEMENT_REACTIONS.map(q=>[q.name,q]));
function line(ctx,points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();}
function ring(ctx,x,y,r,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
export function drawElementMark(ctx,id,x,y,size,time=0){
 const color=ELEMENT_STYLE[id]?.color||'#ffffff';ctx.save();ctx.translate(x,y);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
 if(id==='fire'){ctx.beginPath();ctx.moveTo(0,-size);ctx.quadraticCurveTo(size*.9,-size*.1,size*.5,size*.5);ctx.quadraticCurveTo(0,size,-size*.5,size*.5);ctx.quadraticCurveTo(-size*.8,0,0,-size);ctx.fill();ctx.fillStyle='#ffdf9d';ctx.beginPath();ctx.arc(0,size*.3,size*.25,0,Math.PI*2);ctx.fill();}
 if(id==='ice'){for(let i=0;i<6;i++){const a=i*Math.PI/3;line(ctx,[[0,0],[Math.cos(a)*size,Math.sin(a)*size]],color);line(ctx,[[Math.cos(a-.4)*size*.65,Math.sin(a-.4)*size*.65],[Math.cos(a)*size*.45,Math.sin(a)*size*.45],[Math.cos(a+.4)*size*.65,Math.sin(a+.4)*size*.65]],color,1);}}
 if(id==='lightning')line(ctx,[[size*.3,-size],[-size*.5,0],[size*.35,-size*.1],[-size*.3,size]],color,3);
 if(id==='poison'){for(let i=0;i<3;i++){const a=i*Math.PI*2/3+time;ctx.beginPath();ctx.arc(Math.cos(a)*size*.4,Math.sin(a)*size*.4,size*.38,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#173b26';ctx.beginPath();ctx.arc(0,0,size*.2,0,Math.PI*2);ctx.fill();}
 if(id==='light'){ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,r=i%2?size*.3:size;const p=[Math.cos(a)*r,Math.sin(a)*r];i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.closePath();ctx.fill();}
 if(id==='dark'){ring(ctx,0,0,size*.72,color,2.5);ctx.fillStyle='#150a24';ctx.beginPath();ctx.arc(size*.35,-size*.25,size*.65,0,Math.PI*2);ctx.fill();line(ctx,[[-size,-size*.5],[-size*.7,-size*.5]],color,3);}
 ctx.restore();
}
export function drawElementStatus(ctx,e,time){
 const ids=ELEMENTS.filter(s=>e.status[s.id]?.stacks>0).map(s=>s.id);if(!ids.length&&!e.status.freeze)return;
 ctx.save();
 ids.forEach((id,i)=>{const color=ELEMENT_STYLE[id].color,r=e.radius+10+i*6;ctx.globalAlpha=.4+.4*e.status[id].stacks/(e.status[id].cap||ELEMENT_LIMITS[id].cap);
  if(id==='ice'){ring(ctx,e.x,e.y,r,color+'aa');for(let n=0;n<4;n++){const a=n*Math.PI/2+.2;drawElementMark(ctx,id,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,6,time);}}
  else if(id==='dark'){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,r,time, time+Math.PI*1.4);ctx.stroke();}
  else for(let n=0;n<3;n++){const a=time*(id==='lightning'?2:.65)+n*Math.PI*2/3+i;drawElementMark(ctx,id,e.x+Math.cos(a)*r,e.y+Math.sin(a)*r,7,time);}
 });
 if(e.status.freeze){ctx.globalAlpha=.8;ctx.fillStyle='#88d8ff22';ctx.strokeStyle='#c5f4ff';ctx.lineWidth=2;ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3,r=e.radius+14;i?ctx.lineTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r):ctx.moveTo(e.x+Math.cos(a)*r,e.y+Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();}
 ctx.globalAlpha=1;ctx.font='bold 10px sans-serif';ctx.textAlign='left';ids.forEach((id,i)=>{const x=e.x-(ids.length*38)/2+i*38,y=e.y+e.radius+27;drawElementMark(ctx,id,x,y,5,time);ctx.fillStyle=ELEMENT_STYLE[id].color;ctx.fillText(`${e.status[id].stacks}/${e.status[id].cap||ELEMENT_LIMITS[id].cap}`,x+8,y+4);});ctx.restore();
}
export function drawElementEffect(ctx,v,time){
 const alpha=Math.max(0,v.life/v.maxLife),progress=1-alpha;ctx.save();ctx.globalAlpha=alpha*.9;
 if(v.type==='element-hit'){v.elements.forEach((id,i)=>{const a=i*Math.PI*2/v.elements.length+progress*2;drawElementMark(ctx,id,v.x+Math.cos(a)*(12+progress*20),v.y+Math.sin(a)*(12+progress*20),7+alpha*3,time);});}
 if(v.type==='dark-pulse'){ring(ctx,v.x,v.y,18+progress*48,'#e092ef',3);drawElementMark(ctx,'dark',v.x,v.y,18+progress*12,time);}
 if(v.type==='reaction'){
  const style=REACTION_VISUALS[v.name],radius=24+progress*76;
  const glow=ctx.createRadialGradient(v.x,v.y,1,v.x,v.y,radius);glow.addColorStop(0,style.color+'35');glow.addColorStop(1,style.color+'00');ctx.fillStyle=glow;ctx.fillRect(v.x-radius,v.y-radius,radius*2,radius*2);
  ring(ctx,v.x,v.y,radius,style.color,3);ring(ctx,v.x,v.y,radius*.7,ELEMENT_STYLE[style.elements[1]].color,2);
  if(style.shape==='spiral'){for(let k=0;k<3;k++){ctx.strokeStyle=style.color;ctx.beginPath();ctx.arc(v.x,v.y,radius*(.4+k*.18),time+k*2,time+k*2+Math.PI*1.1);ctx.stroke();}}
  if(style.shape==='flare')for(let k=0;k<8;k++){const a=k*Math.PI/4;line(ctx,[[v.x+Math.cos(a)*radius*.3,v.y+Math.sin(a)*radius*.3],[v.x+Math.cos(a)*radius*1.15,v.y+Math.sin(a)*radius*1.15]],style.color,3);}
  if(style.shape==='eclipse'){ctx.fillStyle='#13071ee0';ctx.beginPath();ctx.arc(v.x,v.y,radius*.5,0,Math.PI*2);ctx.fill();ring(ctx,v.x,v.y,radius*.55,'#fff1d0',3);}
  for(let i=0;i<6;i++){const a=i*Math.PI/3+progress*.7,x=v.x+Math.cos(a)*radius*.75,y=v.y+Math.sin(a)*radius*.75;drawElementMark(ctx,style.elements[i%2],x,y,style.shape==='crystal'?13:9,time);if(style.shape==='arc')line(ctx,[[v.x,v.y],[x+10,y-10],[x-4,y+7],[x,y]],style.color,2);}
  ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.font='bold 14px sans-serif';ctx.lineWidth=4;ctx.strokeStyle='#06101f';ctx.strokeText(v.name,v.x,v.y-radius-12);ctx.fillStyle=style.color;ctx.fillText(v.name,v.x,v.y-radius-12);
 }
 ctx.restore();
}
