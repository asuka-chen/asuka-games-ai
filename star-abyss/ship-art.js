// Original vector spacecraft artwork, drawn locally at any resolution.
function poly(ctx,points,fill,stroke='#7592a8',width=1){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.stroke();
 if(typeof fill!=='string'&&points.length>=6){const cx=points.reduce((a,p)=>a+p[0],0)/points.length,cy=points.reduce((a,p)=>a+p[1],0)/points.length;ctx.strokeStyle='#07141d99';ctx.lineWidth=1.2;ctx.beginPath();points.forEach((p,i)=>{const x=cx+(p[0]-cx)*.91,y=cy+(p[1]-cy)*.91;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.stroke();for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];ctx.strokeStyle=a[0]+b[0]<0?'#d5e9f499':'#08141dbb';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(a[0]*.98,a[1]*.98);ctx.lineTo(b[0]*.98,b[1]*.98);ctx.stroke();}}
}
function line(ctx,x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function ring(ctx,x,y,r,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
function metal(ctx){const g=ctx.createLinearGradient(-50,-40,50,50);g.addColorStop(0,'#afc3d1');g.addColorStop(.18,'#435d73');g.addColorStop(.35,'#263d50');g.addColorStop(.52,'#102332');g.addColorStop(.7,'#61798a');g.addColorStop(.76,'#9cb2bf');g.addColorStop(1,'#162c3d');return g;}
function core(ctx,x,y,r,color){const g=ctx.createRadialGradient(x,y,1,x,y,r*2.6);g.addColorStop(0,color+'aa');g.addColorStop(.4,color+'30');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(x-r*2.6,y-r*2.6,r*5.2,r*5.2);ring(ctx,x,y,r+3,'#08151d',3);ring(ctx,x,y,r,color,1.5);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r*.55,0,Math.PI*2);ctx.fill();ctx.fillStyle='#edfcff';ctx.beginPath();ctx.arc(x-r*.18,y-r*.2,r*.2,0,Math.PI*2);ctx.fill();}
function exhaust(ctx,x,y,time,color,scale=1){const length=(23+Math.sin(time*25+x)*5)*scale;const g=ctx.createLinearGradient(x,y,x,y+length);g.addColorStop(0,'#e6fbff');g.addColorStop(.25,color+'bb');g.addColorStop(1,color+'00');poly(ctx,[[x-4*scale,y],[x+4*scale,y],[x+2*scale,y+length*.7],[x,y+length],[x-2*scale,y+length*.7]],g,color+'00');}
function avionics(ctx,color,wide=18,variant=0){
 for(const side of[-1,1]){const x=side*wide;poly(ctx,[[x-3,9],[x+3,9],[x+3,23],[x-3,23]],'#071723','#617a8e88',.7);for(let j=0;j<4;j++)line(ctx,x-2,11+j*3,x+2,11+j*3,j===variant%4?color+'bb':'#92b4c377',.8);line(ctx,side*6,-19,side*(wide-2),-3,'#c1d9e366',.7);line(ctx,side*6,-17,side*(wide-2),-1,'#06131eaa',1);poly(ctx,[[x-2,-10],[x+2,-10],[x+2,-5],[x-2,-5]],color+'88',color+'22',.5);}
 ctx.fillStyle='#cfe7f2aa';for(let i=0;i<3;i++)ctx.fillRect(-3+i*2.5,26,.8,2);line(ctx,-2,-25,2,-21,'#ecf8ffaa',1);line(ctx,-1,-21,2,-18,'#ecf8ff66',1);
}
function cockpit(ctx,color,wide=7){const g=ctx.createLinearGradient(-wide,-27,wide,9);g.addColorStop(0,'#bce5f088');g.addColorStop(.23,'#365d77');g.addColorStop(.45,'#102c42');g.addColorStop(.8,'#071725');g.addColorStop(1,'#4a7188');poly(ctx,[[0,-29],[wide,-17],[wide*.8,3],[0,10],[-wide*.8,3],[-wide,-17]],g,color+'bb',.8);poly(ctx,[[-wide*.65,-17],[-1,-25],[2,-18],[0,3],[-wide*.6,-2]],'#d6f5fa22','#cdebf366',.5);line(ctx,-wide*.5,-15,wide*.4,-11,'#ddf8ff88',.6);line(ctx,-wide*.5,-12,wide*.4,-8,'#78b5d04d',.5);core(ctx,0,17,2.5,color);}
function panelDecals(ctx,color,wide){for(const side of[-1,1]){const x=side*wide;poly(ctx,[[x-5,-2],[x+3,3],[x+3,8],[x-5,3]],'#112738','#7a9dac66',.5);for(let i=0;i<3;i++)line(ctx,x-3+i*2,2+i*.8,x-3+i*2,5+i*.8,color+'77',.6);line(ctx,x-side*5,17,x-side*10,23,'#d3e4eb66',.7);line(ctx,x-side*6,18,x-side*11,24,'#07151fcc',.8);ctx.fillStyle='#f0c998aa';ctx.fillRect(x-1,-3,2,1);}}
function rivets(ctx,positions){ctx.fillStyle='#b4c8d2';for(const [x,y]of positions){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}}
export function drawPlayerShip(ctx,frame,x,y,time,scale=1,alpha=1){
 const id=frame.id||frame,color=frame.accent||({falcon:'#71d6ef',spectre:'#9ee8c2',titan:'#f0be83'}[id]);ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;
 const plate=metal(ctx);
 for(const side of[-1,1])exhaust(ctx,side*(id==='titan'?22:14),29,time,color,id==='spectre'?1.3:1);
 if(id==='spectre'){
  for(const s of[-1,1]){poly(ctx,[[s*9,-21],[s*46,-5],[s*42,27],[s*28,13],[s*14,7]],plate);poly(ctx,[[s*17,-9],[s*35,-1],[s*34,14],[s*25,7]],'#0d1c28',color+'bb');line(ctx,s*20,-9,s*39,0,color,2);}
  poly(ctx,[[0,-43],[12,-19],[9,27],[0,37],[-9,27],[-12,-19]],plate);poly(ctx,[[0,-29],[5,-15],[4,5],[0,12],[-4,5],[-5,-15]],'#122535',color,1.5);core(ctx,0,-7,5,color);
 }else if(id==='titan'){
  poly(ctx,[[-35,-17],[-21,-30],[-12,-25],[0,-36],[12,-25],[21,-30],[35,-17],[41,24],[22,32],[12,22],[0,33],[-12,22],[-22,32],[-41,24]],plate);
  for(const s of[-1,1]){poly(ctx,[[s*17,-18],[s*29,-13],[s*32,14],[s*17,18]],'#324958',color+'aa');poly(ctx,[[s*24,-34],[s*31,-34],[s*32,7],[s*23,7]],'#152a39',color);for(let j=0;j<4;j++)line(ctx,s*19,j*6-8,s*29,j*6-8,'#7892a2');}
  poly(ctx,[[0,-27],[8,-13],[7,12],[0,18],[-7,12],[-8,-13]],'#163042',color);core(ctx,0,-7,6,color);
 }else{
  poly(ctx,[[0,-42],[13,-18],[41,9],[35,27],[14,18],[9,32],[0,37],[-9,32],[-14,18],[-35,27],[-41,9],[-13,-18]],plate);
  for(const s of[-1,1]){poly(ctx,[[s*14,-9],[s*32,10],[s*28,17],[s*12,10]],'#183547',color+'bb');line(ctx,s*16,-6,s*31,9,color,2);poly(ctx,[[s*12,13],[s*18,17],[s*17,31],[s*11,31]],'#193244','#8ab4c7');}
  poly(ctx,[[0,-29],[7,-14],[5,5],[0,12],[-5,5],[-7,-14]],'#092439',color,1.5);core(ctx,0,-9,5,color);
 }
 cockpit(ctx,color,id==='titan'?9:id==='spectre'?5.5:7);panelDecals(ctx,color,id==='titan'?29:id==='spectre'?29:26);
 avionics(ctx,color,id==='titan'?20:id==='spectre'?17:23,id==='spectre'?2:0);
 for(const side of[-1,1]){const x=side*(id==='spectre'?35:id==='titan'?29:28);line(ctx,x,3,x-side*7,9,'#d8e9ed88',.8);line(ctx,x,5,x-side*7,11,'#07141dcc',1);ctx.fillStyle=color+'cc';ctx.fillRect(x-1,13,2,4);}
 line(ctx,0,-39,0,-29,'#e9fbff',2);line(ctx,-4,16,-4,27,color);line(ctx,4,16,4,27,color);rivets(ctx,[[-12,-15],[12,-15],[-26,18],[26,18],[0,21]]);ctx.restore();
}
const enemyHulls={
 skirmisher:[[0,-36],[12,-13],[38,5],[29,22],[12,14],[0,26],[-12,14],[-29,22],[-38,5],[-12,-13]],
 sniper:[[0,-51],[7,-21],[10,-4],[25,10],[23,29],[8,20],[0,34],[-8,20],[-23,29],[-25,10],[-10,-4],[-7,-21]],
 armor:[[-24,-30],[24,-30],[40,-6],[37,27],[17,38],[-17,38],[-37,27],[-40,-6]],
 disruptor:[[0,-31],[19,-18],[39,-24],[45,8],[25,25],[0,15],[-25,25],[-45,8],[-39,-24],[-19,-18]],
 shield:[[0,-40],[32,-22],[42,10],[26,31],[0,38],[-26,31],[-42,10],[-32,-22]],
 kamikaze:[[0,-46],[11,-8],[33,22],[8,11],[0,31],[-8,11],[-33,22],[-11,-8]]
};
export function drawEnemyShip(ctx,e,time){
 const color=e.elite?'#ffd198':({skirmisher:'#ff956c',sniper:'#ffbd79',armor:'#e79d74',disruptor:'#c6a0ff',shield:'#86d4f2',kamikaze:'#ff788b'}[e.type]||'#ff9b72'),scale=(e.radius+5)/35;
 ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.PI);ctx.scale(scale,scale);
 exhaust(ctx,-13,25,time,color,.8);exhaust(ctx,13,25,time,color,.8);poly(ctx,enemyHulls[e.type]||enemyHulls.skirmisher,metal(ctx),color+'88',1.5);
 if(e.type==='armor'){for(const s of[-1,1]){poly(ctx,[[s*6,-23],[s*23,-20],[s*31,0],[s*24,24],[s*6,25]],'#314955','#a7b2b2');for(let i=0;i<4;i++)line(ctx,s*11,i*10-15,s*24,i*10-12,color+'99',2);}core(ctx,0,0,10,color);}
 else if(e.type==='sniper'){poly(ctx,[[-4,-46],[4,-46],[6,-12],[-6,-12]],'#142a38',color);for(let i=0;i<4;i++)line(ctx,-6,-37+i*6,6,-37+i*6,'#9eb0ba');core(ctx,0,-9,5,color);line(ctx,0,-51,0,-39,'#fff1c0',2);}
 else if(e.type==='disruptor'){for(const s of[-1,1]){core(ctx,s*29,-5,7,color);line(ctx,s*8,-5,s*21,-5,color,2);line(ctx,s*10,10,s*32,16,'#d0b5f4');}core(ctx,0,-7,7,color);ring(ctx,0,-7,15,color+'66');}
 else if(e.type==='shield'){core(ctx,0,-2,11,color);for(let i=0;i<6;i++){const a=i*Math.PI/3;line(ctx,Math.cos(a)*18,Math.sin(a)*18-2,Math.cos(a)*28,Math.sin(a)*28-2,color,2);}ctx.strokeStyle=color+'66';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,47,-Math.PI*.9,-Math.PI*.1);ctx.stroke();}
 else if(e.type==='kamikaze'){poly(ctx,[[0,-33],[6,-7],[0,16],[-6,-7]],'#72263e',color);core(ctx,0,-7,7,color);ring(ctx,0,-7,14,color+'88');}
 else{for(const s of[-1,1]){line(ctx,s*10,-11,s*26,8,color,2);poly(ctx,[[s*13,5],[s*23,9],[s*19,18],[s*11,12]],'#193448',color+'88');}core(ctx,0,-8,6,color);}
 panelDecals(ctx,color,e.type==='sniper'?12:26);
 avionics(ctx,color,e.type==='armor'?19:e.type==='sniper'?10:16,(e.id||0)%3);
 if(e.type==='sniper')for(const side of[-1,1])line(ctx,side*3,-43,side*3,-14,'#d5c6a388',.65);
 ctx.fillStyle=color+'99';for(let i=0;i<1+(e.id||0)%3;i++)ctx.fillRect(-3+i*3,21,1.2,3);
 rivets(ctx,[[-14,9],[14,9],[0,22]]);ctx.restore();
 if(e.elite){ring(ctx,e.x,e.y,e.radius+14,'#f3c58188');ctx.fillStyle='#f4cc93';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.fillText('ELITE',e.x,e.y-e.radius-23);}
}
export function drawBossModel(ctx,e,time,color,sector){
 ctx.save();ctx.translate(e.x,e.y);const plate=metal(ctx),phase=e.phase||1;
 if(sector===0){
  poly(ctx,[[0,-66],[35,-41],[65,-48],[125,-30],[118,30],[82,49],[43,31],[21,69],[0,52],[-21,69],[-43,31],[-82,49],[-118,30],[-125,-30],[-65,-48],[-35,-41]],plate,color+'aa',2);
  for(const s of[-1,1]){poly(ctx,[[s*39,-31],[s*105,-23],[s*97,18],[s*49,24]],'#152c3b','#6d8ca1',1.5);for(let i=0;i<4;i++)line(ctx,s*(51+i*12),-19,s*(48+i*12),12,color+'bb',3);poly(ctx,[[s*68,-14],[s*79,-14],[s*83,37],[s*65,37]],'#152532',color,2);core(ctx,s*94,4,7,color);}
  poly(ctx,[[0,-48],[26,-27],[24,30],[0,48],[-24,30],[-26,-27]],'#1b3b4e','#a0b6c5',1.5);
 }else if(sector===1){
  for(let i=0;i<6;i++){const a=i*Math.PI/3,rad=75;ctx.save();ctx.rotate(a);poly(ctx,[[-15,-rad+15],[0,-rad-31],[15,-rad+15],[9,-rad+33],[-9,-rad+33]],plate,color,1.5);line(ctx,0,-rad-22,0,-rad+15,color,3);ctx.restore();}
  poly(ctx,[[0,-57],[49,-28],[49,28],[0,57],[-49,28],[-49,-28]],plate,color,2);ring(ctx,0,0,44,'#a4dce3',2);ring(ctx,0,0,37,color+'88',4);
 }else{
  poly(ctx,[[-102,-17],[-78,-46],[-42,-24],[0,-56],[42,-24],[78,-46],[102,-17],[111,39],[74,54],[41,29],[0,57],[-41,29],[-74,54],[-111,39]],plate,color+'aa',2);
  for(const s of[-1,1]){poly(ctx,[[s*45,-15],[s*90,-23],[s*97,23],[s*49,18]],'#193246','#8e9bb6');core(ctx,s*74,-6,12,color);for(let i=0;i<3;i++)line(ctx,s*(45+i*14),24,s*(47+i*14),39,color,3);}ring(ctx,0,0,52,color+'99',2);
 }
 for(const s of[-1,1]){poly(ctx,[[s*65,21],[s*79,21],[s*80,44],[s*64,44]],'#162b39',color,1.5);line(ctx,s*67,29,s*77,29,'#a4c3d3',2);if(e.gunFlash>0){core(ctx,s*72,43,9,color);exhaust(ctx,s*72,44,time,'#ffca9f',.7);}}
 for(const side of[-1,1]){const x=side*49;poly(ctx,[[x,-28],[x+side*14,-19],[x+side*14,6],[x,15]],'#102433','#718fa577',.7);for(let j=0;j<4;j++)line(ctx,x+side*3,-13+j*5,x+side*10,-9+j*5,color+'66',.8);core(ctx,side*42,24,3,color);}
 for(const side of[-1,1]){for(let j=0;j<5;j++){const x=side*(46+j*9);line(ctx,x,-28,x+side*3,-23,'#b3ccd766',.8);line(ctx,x,17,x+side*3,22,'#0b1a26cc',1.4);}poly(ctx,[[side*14,-41],[side*27,-31],[side*28,-18],[side*15,-27]],'#0b202e','#7696aa88',.8);for(let j=0;j<3;j++)line(ctx,side*16,-35+j*4,side*24,-29+j*4,color+'99',1);line(ctx,side*65,24,side*65,38,'#d2e7eb66',.8);line(ctx,side*79,24,side*79,38,'#091826cc',1.5);}
 ctx.save();ctx.rotate(-time*.12);ctx.setLineDash([3,6]);ring(ctx,0,0,45,color+'55',.8);ctx.setLineDash([]);ctx.restore();
 ring(ctx,0,0,26,color+'44',8);core(ctx,0,0,20+phase*2,color);ctx.save();ctx.rotate(time*(.25+phase*.1));for(let i=0;i<8;i++){const a=i*Math.PI/4;line(ctx,Math.cos(a)*32,Math.sin(a)*32,Math.cos(a)*40,Math.sin(a)*40,color,phase);}ctx.restore();
 for(const s of[-1,1]){rivets(ctx,[[s*45,-12],[s*55,14],[s*90,17],[s*73,24]]);line(ctx,s*10,48,s*21,58,color,2);}ctx.restore();
}
