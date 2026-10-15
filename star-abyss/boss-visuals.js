// Warning geometry matches the simulation's fixed blast radius and beam width.
export function drawBossHazards(ctx,hazards){
 for(const h of hazards){
  const warning=!h.fired,remaining=Math.max(0,h.delay-h.elapsed),progress=Math.min(1,h.elapsed/h.delay),alpha=warning?1:Math.max(0,1-(h.elapsed-h.delay)/h.duration);
  ctx.save();ctx.globalAlpha=alpha;ctx.font='bold 13px sans-serif';ctx.textAlign='center';
  if(h.kind==='bomb'){
   ctx.fillStyle=warning?'#ff99651a':'#ffae6b66';ctx.strokeStyle=warning?'#ffac73':'#ffe8be';ctx.lineWidth=warning?2:4;ctx.beginPath();ctx.arc(h.x,h.y,h.radius,0,Math.PI*2);ctx.fill();ctx.stroke();
   if(warning){ctx.strokeStyle='#ffdf9b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(h.x,h.y,h.radius-6,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);ctx.stroke();ctx.strokeStyle='#ffcf93';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(h.x-10,h.y);ctx.lineTo(h.x+10,h.y);ctx.moveTo(h.x,h.y-10);ctx.lineTo(h.x,h.y+10);ctx.stroke();}
   else{for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(h.x+Math.cos(a)*h.radius*.3,h.y+Math.sin(a)*h.radius*.3);ctx.lineTo(h.x+Math.cos(a)*h.radius*1.15,h.y+Math.sin(a)*h.radius*1.15);ctx.stroke();}}
   ctx.lineWidth=4;ctx.strokeStyle='#070d1a';const label=warning?`炸弹 ${remaining.toFixed(1)}s`:'爆炸';ctx.strokeText(label,h.x,h.y-h.radius-10);ctx.fillStyle='#ffe2b8';ctx.fillText(label,h.x,h.y-h.radius-10);
  }
  if(h.kind==='laser'){
   const [ax,ay,bx,by]=h.segment;ctx.lineWidth=h.width;ctx.strokeStyle=warning?'#ffb47522':'#ff894caa';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
   ctx.lineWidth=warning?1.5:4;ctx.strokeStyle=warning?'#ffc692':'#fff1ce';if(warning)ctx.setLineDash([8,6]);
   for(const offset of warning?[-h.width/2,h.width/2]:[0]){ctx.beginPath();ctx.moveTo(ax+offset,ay);ctx.lineTo(bx+offset,by);ctx.stroke();}ctx.setLineDash([]);
   const label=warning?`光束 ${remaining.toFixed(1)}s`:'光束释放';ctx.save();ctx.translate(ax,240);ctx.rotate(-Math.PI/2);ctx.lineWidth=4;ctx.strokeStyle='#070d1a';ctx.strokeText(label,0,-h.width/2-10);ctx.fillStyle='#ffe0b1';ctx.fillText(label,0,-h.width/2-10);ctx.restore();
  }
  ctx.restore();
 }
}
