// Original space scenery: cached fractal clouds, shaded planets and independent parallax stars.
const themes=[['#bc526e','#386c9d','#e9ad80'],['#4f9ac0','#5369ad','#afdfef'],['#8261b4','#305788','#cdb3ee'],['#b45794','#413a91','#dfb0d1'],['#567b7a','#846859','#c6bf9c']];
const scenes=new Map();
function noiseGrid(seed){const a=new Float32Array(128*128);let n=seed;for(let i=0;i<a.length;i++){n=(Math.imul(n,1664525)+1013904223)>>>0;a[i]=n/4294967296;}return a;}
function noise(grid,x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),a=grid[(ix&127)+(iy&127)*128],b=grid[((ix+1)&127)+(iy&127)*128],c=grid[(ix&127)+((iy+1)&127)*128],d=grid[((ix+1)&127)+((iy+1)&127)*128];return(a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;}
function fractal(grid,x,y){let n=0,weight=.55;for(let i=0;i<5;i++){n+=noise(grid,x,y)*weight;x=x*2.07+13.7;y=y*2.03+9.4;weight*=.48;}return n;}
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function glow(ctx,x,y,r,color,alpha=.2){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalAlpha=1;}
function makeScene(region){const c=document.createElement('canvas');c.width=720;c.height=900;const ctx=c.getContext('2d'),grid=noiseGrid(7141+region*193),[a,b,planet]=themes[region],ca=rgb(a),cb=rgb(b),im=ctx.createImageData(720,900),p=im.data;
 for(let y=0;y<900;y++)for(let x=0;x<720;x++){const u=x/720,v=y/900,n=fractal(grid,u*3.8+region*4,v*4.2),warp=noise(grid,u*5,v*5)*.24,band=Math.exp(-((v-.2-u*.57-warp)**2)/.032),cloud=Math.max(0,(n-.28)*1.8)*band,dust=Math.max(0,noise(grid,u*12,v*14)-.45)*cloud,secondary=Math.exp(-((u+v*.6-.45)**2)/.04)*Math.max(0,n-.4)*.65,center=1-.22*Math.exp(-((u-.5)**2)/.06),i=(y*720+x)*4;p[i]=5+(ca[0]*cloud*.44+cb[0]*secondary*.65)*center-dust*25;p[i+1]=10+(ca[1]*cloud*.38+cb[1]*secondary*.7)*center-dust*20;p[i+2]=21+(ca[2]*cloud*.48+cb[2]*secondary*.7)*center-dust*15;p[i+3]=255;}
 ctx.putImageData(im,0,0);glow(ctx,105,650,250,b,.15);glow(ctx,510,240,190,a,.14);
 // A dense distant star field remains fixed; only the nearer layers drift.
 let seed=18491+region*37;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<980;i++){const x=rand()*720,y=rand()*900,size=.35+rand()*.85,alpha=.13+rand()*.6;ctx.fillStyle=`rgba(195,215,238,${alpha})`;ctx.fillRect(x,y,size,size);}
 const px=650-region%2*52,py=225+region*18,r=151+region%3*17;
 ctx.save();ctx.translate(px,py);ctx.rotate(-.3);for(let i=0;i<26;i++){ctx.strokeStyle=planet+Math.floor((.03+.06*Math.sin(i*.7)**2)*255).toString(16).padStart(2,'0');ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,0,r*1.35+i*2.5,(r*1.35+i*2.5)*.28,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
 const tex=document.createElement('canvas');tex.width=tex.height=r*2;const tc=tex.getContext('2d'),di=tc.createImageData(tex.width,tex.height),col=rgb(planet);
 for(let y=0;y<tex.height;y++)for(let x=0;x<tex.width;x++){const u=(x-r)/r,v=(y-r)/r,q=u*u+v*v,i=(y*tex.width+x)*4;if(q>1)continue;const z=Math.sqrt(1-q),lum=Math.max(0,-u*.65-v*.38+z*.34),detail=fractal(grid,u*4+28,v*5+19),bands=.72+.22*Math.sin(v*34+detail*8),shine=.10+.6*lum;di.data[i]=col[0]*shine*bands;di.data[i+1]=col[1]*shine*bands;di.data[i+2]=col[2]*shine*bands;di.data[i+3]=255;}
 tc.putImageData(di,0,0);ctx.drawImage(tex,px-r,py-r);ctx.strokeStyle=planet+'66';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,r,-Math.PI*.9,-Math.PI*.3);ctx.stroke();ctx.strokeStyle=planet+'22';ctx.lineWidth=5;ctx.beginPath();ctx.arc(px,py,r+3,-Math.PI*.9,-Math.PI*.3);ctx.stroke();
 ctx.save();ctx.translate(px,py);ctx.rotate(-.3);ctx.strokeStyle=planet+'55';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*1.56,r*.44,0,0,Math.PI);ctx.stroke();ctx.restore();
 const sx=112+region*17,sy=113;glow(ctx,sx,sy,75,'#c8e4ff',.18);ctx.fillStyle='#ddebfa';ctx.beginPath();ctx.arc(sx,sy,2,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#cee6ff55';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(sx-13,sy);ctx.lineTo(sx+13,sy);ctx.moveTo(sx,sy-13);ctx.lineTo(sx,sy+13);ctx.stroke();
 const vignette=ctx.createRadialGradient(360,450,210,360,450,600);vignette.addColorStop(0,'#02081300');vignette.addColorStop(1,'#020813bb');ctx.fillStyle=vignette;ctx.fillRect(0,0,720,900);return c;
}
const stars=Array.from({length:90},(_,i)=>({x:((i*193+47)%719),y:((i*271+59)%899),depth:i%3,size:.7+i%4*.3}));
export function drawSpace(ctx,width,height,time,region=0){const id=((region%5)+5)%5;if(!scenes.has(id))scenes.set(id,makeScene(id));ctx.save();const scale=Math.max(width/720,height/900),ox=(width-720*scale)/2,oy=(height-900*scale)/2;ctx.drawImage(scenes.get(id),ox,oy,720*scale,900*scale);const sx=scale,sy=scale;for(const s of stars){const y=(s.y+time*(3+s.depth*6))%900;ctx.fillStyle=['#a5b4c655','#b5cce48a','#d9ebf2b0'][s.depth];ctx.fillRect(ox+s.x*sx,oy+y*sy,s.size,s.size);}ctx.restore();}
export function spaceCacheSize(){return scenes.size;}
