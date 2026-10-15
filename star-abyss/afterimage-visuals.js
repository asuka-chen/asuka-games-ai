import {drawPlayerShip} from './ship-art.js';
// Cached hulls preserve the selected aircraft's panels and silhouette in every ghost.
const hulls=new Map();
function hull(frame,accent){
 const key=`${frame.id}:${accent}`;if(hulls.has(key))return hulls.get(key);
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=144;
 drawPlayerShip(canvas.getContext('2d'),{...frame,accent},64,64,0,1.2);hulls.set(key,canvas);return canvas;
}
export function drawShipAfterimage(ctx,ghost,frame,time){
 const fade=Math.max(0,ghost.life/ghost.maxLife),echo=ghost.kind==='echo',scale=.85/1.2,w=128*scale,h=144*scale,left=ghost.x-64*scale,top=ghost.y-64*scale;
 const original=hull(frame,frame.accent),cyan=hull(frame,'#60f4ff'),magenta=hull(frame,'#ed72ff');
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=fade*.16;
 ctx.drawImage(cyan,left-3,top,w,h);ctx.drawImage(magenta,left+3,top+1,w,h);
 ctx.globalCompositeOperation='source-over';ctx.globalAlpha=fade*(echo?.48:.36);ctx.drawImage(original,left,top,w,h);
 // Split a few horizontal strips for the chromatic glitch, without hiding the hull.
 ctx.save();ctx.beginPath();for(let i=0;i<3;i++){const y=top+18+i*19+Math.sin(time*12+i)*4;ctx.rect(left-8,y,w+16,3);}ctx.clip();ctx.globalCompositeOperation='screen';ctx.globalAlpha=fade*.32;
 ctx.drawImage(cyan,left+Math.sin(time*25+ghost.created*4)*5,top,w,h);ctx.restore();
 if(echo){ctx.globalAlpha=fade*.5;ctx.strokeStyle='#c793ff';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(ghost.x,ghost.y+30,27,6,0,0,Math.PI*2);ctx.stroke();ctx.font='8px monospace';ctx.fillStyle='#a9effa';ctx.textAlign='center';ctx.fillText('ECHO',ghost.x,ghost.y+46);}
 ctx.restore();
}
