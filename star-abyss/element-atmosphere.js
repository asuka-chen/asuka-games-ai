// Element surfaces are visual only: no particles, cooldowns or random calls enter combat state.
const colors={fire:'#ff9864',ice:'#92dcff',lightning:'#ba9aff',poison:'#a0ed9a',light:'#ffe4a0',dark:'#db9cf2'};
function stroke(ctx,points,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
function glow(ctx,x,y,r,color,alpha=.3){ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color+'cc');g.addColorStop(.35,color+'55');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore();}
function flame(ctx,x,y,length,width,phase){ctx.save();ctx.translate(x,y);const bend=Math.sin(phase)*width*.5,g=ctx.createLinearGradient(0,-2,0,length);g.addColorStop(0,'#fff3bbee');g.addColorStop(.25,'#ffbf70cc');g.addColorStop(.6,'#f7674b77');g.addColorStop(1,'#ba365800');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-width,0);ctx.bezierCurveTo(-width*1.1,length*.4,bend-width*.4,length*.66,bend,length);ctx.bezierCurveTo(bend+width*.2,length*.45,width*1.25,length*.2,width,0);ctx.quadraticCurveTo(0,-width*.6,-width,0);ctx.fill();ctx.fillStyle='#fff4c9bb';ctx.beginPath();ctx.moveTo(-width*.35,0);ctx.quadraticCurveTo(bend,length*.3,bend*.2,length*.58);ctx.quadraticCurveTo(width*.4,length*.1,width*.35,0);ctx.fill();ctx.restore();}
function crystal(ctx,x,y,size,angle){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle='#b4eaff44';ctx.strokeStyle='#c8f5ffcc';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.4,0);ctx.lineTo(0,size*.8);ctx.lineTo(-size*.4,0);ctx.closePath();ctx.fill();ctx.stroke();stroke(ctx,[[0,-size],[0,size*.8]],'#f0fdff99',.6);ctx.restore();}
export function drawElementAura(ctx,x,y,elements,time,radius=33,strength=1){
 if(!elements?.length)return;ctx.save();ctx.globalAlpha*=strength;
 for(let k=0;k<elements.length;k++){const id=elements[k],color=colors[id];if(!color)continue;const phase=time*3.2+k;
  if(id==='fire'){glow(ctx,x,y+9,radius*1.4,color,.15);for(const side of[-1,1]){const px=x+side*radius*1.08;flame(ctx,px,y+6,26+8*Math.sin(time*8+side)**2,6+Math.sin(time*6+side),phase+side);for(let i=0;i<3;i++){const f=(time*.7+i*.31+k*.13)%1;ctx.fillStyle=i%2?'#ffe5aabb':'#ff956488';ctx.fillRect(px+Math.sin(i*4+time)*6,y+14+f*38,1.3,2.4);}}}
  if(id==='ice'){glow(ctx,x,y,radius*1.5,color,.10);for(let i=0;i<5;i++){const f=(time*.22+i*.21)%1,side=i%2?1:-1;glow(ctx,x+side*(radius*.98+f*12),y+f*30-10,10+f*13,color,(1-f)*.24);crystal(ctx,x+side*radius*.62,y-6+i*5,3+i%2*2,time*.12+i);}ctx.strokeStyle='#a8e6ff55';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y+12,radius*1.15,13,-.2,0,Math.PI*1.5);ctx.stroke();}
  if(id==='lightning'){for(const side of[-1,1]){const px=x+side*radius*1.03,jitter=Math.sin(time*21+side)*4;stroke(ctx,[[px,y-20],[px+side*7,y-9],[px+jitter,y],[px+side*8,y+11],[px,y+24]],color+'bb',1.2);glow(ctx,px,y,12,color,.13);}}
  if(id==='poison'){for(let i=0;i<5;i++){const a=phase*.35+i*1.9,f=(time*.18+i*.22)%1,px=x+Math.cos(a)*radius*1.1,py=y+Math.sin(a)*radius*.8+f*15;glow(ctx,px,py,12+f*10,color,.2);ctx.strokeStyle=color+'55';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(px,py,2+f*3,0,Math.PI*2);ctx.stroke();}}
  if(id==='light'){glow(ctx,x,y,radius*1.4,color,.12);ctx.strokeStyle=color+'66';ctx.lineWidth=.8;ctx.beginPath();ctx.ellipse(x,y,radius*1.12,radius*.78,phase*.13,0,Math.PI*2);ctx.stroke();for(let i=0;i<4;i++){const a=phase*.25+i*Math.PI/2,px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius*.75;stroke(ctx,[[px-3,py],[px+3,py]],'#fff6cfbb');stroke(ctx,[[px,py-3],[px,py+3]],'#fff6cfbb');}}
  if(id==='dark'){ctx.strokeStyle=color+'77';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(x,y,radius+i*3,radius*.5,phase*.12+i*.6,phase+i*2,phase+i*2+1.8);ctx.stroke();}glow(ctx,x,y+18,radius*1.1,color,.08);}
 }ctx.restore();
}
export function drawElementCoating(ctx,x,y,elements,time,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);for(const id of elements){
 if(id==='fire'){for(const side of[-1,1]){ctx.fillStyle='#ffb77b33';ctx.beginPath();ctx.moveTo(side*13,-7);ctx.lineTo(side*31,9);ctx.lineTo(side*24,17);ctx.lineTo(side*11,8);ctx.closePath();ctx.fill();stroke(ctx,[[side*15,-5],[side*28,9]],'#ffc08188',1);}}
 if(id==='ice'){for(const side of[-1,1]){stroke(ctx,[[side*12,-9],[side*21,1],[side*17,8],[side*29,12]],'#c0eeff99',.8);crystal(ctx,side*20,9,5,side*.25);}}
 if(id==='lightning')stroke(ctx,[[-10,13],[-4,9],[0,15],[5,10],[11,14]],'#c8b1ffbb',1);
 if(id==='poison'){ctx.fillStyle='#b2f6a266';for(const side of[-1,1]){ctx.beginPath();ctx.arc(side*20,13,2,0,Math.PI*2);ctx.fill();}}
 if(id==='light'){stroke(ctx,[[-5,-22],[0,-28],[5,-22]],'#fff0bfbb',1.5);}
 if(id==='dark'){stroke(ctx,[[-19,12],[-10,7],[-5,15]],'#e5adf088',1.3);stroke(ctx,[[19,12],[10,7],[5,15]],'#e5adf088',1.3);}
 }ctx.restore();}
export function drawElementProjectileSkin(ctx,b,elements,time){
 if(!elements?.length||!(b.generation===0||b.source==='ECHO'))return;const id=elements[b.root%elements.length],quality=b.chargeRatio??1,speed=Math.hypot(b.vx,b.vy)||1;ctx.save();ctx.globalAlpha*=(b.source==='ECHO'?.4:1)*(.25+.7*quality);ctx.translate(b.x,b.y);ctx.rotate(Math.atan2(b.vx,-b.vy));
 if(id==='fire'){flame(ctx,0,0,Math.min(48,16+speed*.045),b.rail?7:4,time*11+b.root);for(let i=0;i<2;i++){const f=(time*2+i*.5+b.root*.13)%1;ctx.fillStyle='#ffd7a799';ctx.fillRect(Math.sin(b.root+i)*5,f*35,1.2,2);}}
 if(id==='ice'){glow(ctx,0,8,b.rail?19:12,colors.ice,.18);for(let i=0;i<3;i++){const f=(time*.8+i*.33)%1;glow(ctx,Math.sin(b.root+i)*6,10+f*35,5+f*5,colors.ice,(1-f)*.13);}crystal(ctx,0,0,b.rail?10:6,0);}
 if(id==='lightning'){stroke(ctx,[[0,0],[5,8],[-4,18],[4,28],[0,38]],colors.lightning+'aa',1);}
 if(id==='poison'){for(let i=0;i<3;i++)glow(ctx,Math.sin(time*3+i)*4,i*9,6,colors.poison,.12);}
 if(id==='light'){glow(ctx,0,0,14,colors.light,.16);stroke(ctx,[[-6,0],[6,0]],'#fff3c8bb');}
 if(id==='dark'){ctx.strokeStyle=colors.dark+'88';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,4,6,10,time,0,Math.PI*1.6);ctx.stroke();}
 ctx.restore();
}
export function drawElementBeamSkin(ctx,segment,elements,time,quality=1){
 if(!elements?.length)return;const [x1,y1,x2,y2]=segment.line,dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,count=Math.min(16,Math.ceil(length/65));ctx.save();ctx.globalAlpha*=(.25+.6*quality);
 for(let k=0;k<elements.length;k++){const id=elements[k];for(let i=0;i<count;i++){const f=(i+.5)/count,x=x1+dx*f,y=y1+dy*f,side=(i+k)%2?1:-1,edge=segment.width*.4;
  if(id==='fire'){ctx.save();ctx.translate(x+nx*edge*side,y+ny*edge*side);ctx.rotate(Math.atan2(-dx,dy));flame(ctx,0,0,17+7*Math.sin(time*9+i)**2,4,time*8+i);ctx.restore();}
  if(id==='ice'){glow(ctx,x+nx*edge*side,y+ny*edge*side,14,colors.ice,.11);if(i%2===0)crystal(ctx,x+nx*edge*side,y+ny*edge*side,4+quality*3,time*.15+i);}
  if(id==='poison'&&i%2===0)glow(ctx,x,y,12,colors.poison,.13);
  if(id==='light'&&i%3===0)stroke(ctx,[[x+nx*5,y+ny*5],[x-nx*5,y-ny*5]],'#fff4c999',1);
 }}ctx.restore();
}
