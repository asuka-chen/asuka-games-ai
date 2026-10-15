// Multi-touch controls share the same fixed-step input used by keyboard and gamepad.
let touchCapability=false;
export function touchDevice(){touchCapability=touchCapability||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;return touchCapability;}
export function stickVector(dx,dy,radius=46){const distance=Math.hypot(dx,dy);if(distance<6)return{x:0,y:0,knobX:dx,knobY:dy};const scale=Math.min(1,distance/radius);return{x:dx/distance*scale,y:dy/distance*scale,knobX:dx/distance*Math.min(radius,distance),knobY:dy/distance*Math.min(radius,distance)};}
export class TouchControls{
 constructor(root,canvas,{player,onManual,onCancel,onAuto,onPause,onBuild}){
  this.root=root;this.canvas=canvas;this.callbacks={player,onManual,onCancel,onAuto,onPause,onBuild};this.listeners=[];this.held=new Map();this.move=null;this.vector={x:0,y:0};this.target=null;this.fireQueued=false;this.dashQueued=false;
  const listen=(el,type,fn)=>{el.addEventListener(type,fn,{passive:false});this.listeners.push(()=>el.removeEventListener(type,fn));};
  for(const button of root.querySelectorAll('[data-touch]')){
   const action=button.dataset.touch;
   if(['auto','pause','build'].includes(action)){let touchActivatedAt=-Infinity;const invoke=()=>({auto:onAuto,pause:onPause,build:onBuild})[action]();listen(button,'pointerdown',event=>{if(event.pointerType==='touch'){event.preventDefault();touchActivatedAt=performance.now();invoke();}});listen(button,'click',event=>{if(performance.now()-touchActivatedAt>750&&event.pointerType!=='touch'&&!event.sourceCapabilities?.firesTouchEvents)invoke();});continue;}
   listen(button,'pointerdown',event=>{if(event.pointerType!=='touch'||button.disabled||[...this.held.values()].includes(action))return;event.preventDefault();button.setPointerCapture(event.pointerId);this.held.set(event.pointerId,action);button.classList.add('pressed');if(action==='fire'){this.fireQueued=true;onManual();}if(action==='dash')this.dashQueued=true;});
   const end=event=>{if(!this.held.has(event.pointerId))return;const action=this.held.get(event.pointerId);this.held.delete(event.pointerId);button.classList.remove('pressed');if(event.type!=='pointerup')this.cancel();};
   for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(button,type,end);
  }
  const stick=root.querySelector('.touch-stick'),knob=root.querySelector('.touch-knob');this.knob=knob;
  listen(stick,'pointerdown',event=>{if(event.pointerType!=='touch'||this.move)return;event.preventDefault();stick.setPointerCapture(event.pointerId);const box=stick.getBoundingClientRect();this.move={id:event.pointerId,kind:'stick',x:box.x+box.width/2,y:box.y+box.height/2,radius:Math.min(46,box.width*.32)};this.moveStick(event);});
  listen(stick,'pointermove',event=>{if(this.move?.id===event.pointerId){event.preventDefault();this.moveStick(event);}});
  listen(canvas,'pointerdown',event=>{if(event.pointerType!=='touch'||this.move)return;event.preventDefault();canvas.setPointerCapture(event.pointerId);const p=player();this.move={id:event.pointerId,kind:'drag',x:event.clientX,y:event.clientY,px:p.x,py:p.y};this.target={x:p.x,y:p.y};});
  listen(canvas,'pointermove',event=>{if(this.move?.id!==event.pointerId||this.move.kind!=='drag')return;event.preventDefault();const box=canvas.getBoundingClientRect();this.target={x:this.move.px+(event.clientX-this.move.x)*720/box.width,y:this.move.py+(event.clientY-this.move.y)*900/box.height};});
  const endMove=event=>{if(this.move?.id!==event.pointerId)return;this.move=null;this.target=null;this.vector={x:0,y:0};knob.style.transform='translate(0px,0px)';if(event.type!=='pointerup')this.cancel();};
  for(const el of [stick,canvas])for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(el,type,endMove);
 }
 moveStick(event){if(this.move?.kind!=='stick')return;const v=stickVector(event.clientX-this.move.x,event.clientY-this.move.y,this.move.radius);this.vector={x:v.x,y:v.y};this.knob.style.transform=`translate(${v.knobX}px,${v.knobY}px)`;}
 read(){const actions=new Set(this.held.values()),result={...this.vector,pointer:this.target,fire:actions.has('fire')||this.fireQueued,dash:actions.has('dash')||this.dashQueued,dashPressed:this.dashQueued,aim:Number(actions.has('right'))-Number(actions.has('left'))};this.fireQueued=false;this.dashQueued=false;return result;}
 cancel(){this.reset();this.callbacks.onCancel();}
 reset(){this.held.clear();this.move=null;this.target=null;this.vector={x:0,y:0};this.fireQueued=false;this.dashQueued=false;this.knob.style.transform='translate(0px,0px)';this.root.querySelectorAll('.pressed').forEach(el=>el.classList.remove('pressed'));}
 destroy(){this.reset();for(const remove of this.listeners)remove();this.listeners=[];}
}
export function touchMarkup(prism=false){return `<div class="touch-controls" aria-label="触屏作战操作"><div class="touch-stick" role="group" aria-label="移动摇杆"><i class="stick-ring"></i><span class="touch-knob"></span><small>移动 / 拖动画面</small></div><div class="touch-actions"><div class="touch-toolbar"><button data-touch="auto" aria-pressed="true">自动<br><span>开启</span></button><button data-touch="build">构筑</button><button data-touch="pause">暂停</button></div>${prism?'<div class="touch-aim"><button data-touch="left" aria-label="向左调整射线角度">← 调角</button><button data-touch="right" aria-label="向右调整射线角度">调角 →</button></div>':''}<div class="touch-triggers"><button data-touch="fire" aria-label="按住蓄力，松开发射">射击<small>按住 / 松开</small></button><button data-touch="dash" aria-label="闪避">闪避<small id="touch-dash-status"></small></button></div></div></div>`;}
