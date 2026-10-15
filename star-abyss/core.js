import {FRAMES,ELEMENT_LIMITS,ELEMENT_REACTIONS,UNKNOWN_EVENTS,CHALLENGES,RELICS,RELIC_BY_ID,RARITIES,SYNERGIES,EVOLUTIONS,UPGRADES,SUPPLY_REWARDS,REGIONS,BOSS_ATTACKS,BOSS_PATTERNS} from './data.js';
import {REACTION_VISUALS} from './element-visuals.js';
export const W=720, H=900, STEP=1/120;
export const MAX_PRISM_ANGLE=1.25;
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const chargePower=ratio=>Number.isFinite(ratio)?clamp(ratio,0,1)**2:0;
export const getPrismAngle=r=>Number.isFinite(r.prismAngle)?clamp(r.prismAngle,-MAX_PRISM_ANGLE,MAX_PRISM_ANGLE):0;
export function prismSegments(x,y,angle,width){
 angle=clamp(angle,-MAX_PRISM_ANGLE,MAX_PRISM_ANGLE);const lines=[];let dx=Math.sin(angle),dy=-Math.cos(angle);
 for(let i=0;i<3;i++){const top=(-40-y)/dy,side=Math.abs(dx)<1e-9?Infinity:(dx>0?W-x:-x)/dx,length=Math.min(top,side);if(!Number.isFinite(length)||length<0)break;const xx=clamp(x+dx*length,0,W),yy=y+dy*length;lines.push({line:[x,y,xx,yy],scale:.75**i,width});if(top<=side+1e-8)break;x=xx;y=yy;dx=-dx;}
 return lines;
}
export function beamIntersection(segments){if(segments.length<2)return null;const [ax,ay,bx,by]=segments[0].line,[cx,cy,dx,dy]=segments[1].line,den=(bx-ax)*(dy-cy)-(by-ay)*(dx-cx);if(Math.abs(den)<1e-9)return null;const u=((cx-ax)*(dy-cy)-(cy-ay)*(dx-cx))/den,v=((cx-ax)*(by-ay)-(cy-ay)*(bx-ax))/den;if(u<0||u>1||v<0||v>1)return null;return{x:ax+u*(bx-ax),y:ay+u*(by-ay)};}
export function seedNumber(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function randomGenerator(seed){let a=seed>>>0;const random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};random.getState=()=>a;return random;}
export function generateMap(seed,chapter){
 const random=randomGenerator(seedNumber(`${seed}:${chapter}`));
 const types=['combat','combat','combat','elite','shop','repair','forge','event','rift','event'];
 const layers=Array.from({length:12},(_,i)=>{const pool=chapter===1&&i<3?['combat','combat','event','event']:types;return Array.from({length:i===11?1:2+Math.floor(random()*3)},(_,j)=>({id:`${chapter}-${i}-${j}`,floor:i,row:j,type:i===11?'boss':i===10?(j%2?'shop':'repair'):pool[Math.floor(random()*pool.length)],links:[]}));});
 const opening=chapter===1?['combat','event']:['combat',['event','shop','repair'][Math.floor(random()*3)]];
 const openingPool=chapter===1?['combat','event']:['combat','event','shop','repair'];
 while(opening.length<layers[0].length)opening.push(openingPool[Math.floor(random()*openingPool.length)]);
 for(let i=opening.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[opening[i],opening[j]]=[opening[j],opening[i]];}
 layers[0].forEach((n,i)=>n.type=opening[i]);
 for(let i=0;i<11;i++)for(const n of layers[i]){
  const next=layers[i+1], position=n.row/Math.max(1,layers[i].length-1)*(next.length-1);
  const near=Math.round(position);n.links.push(next[near].id);
  const neighbor=clamp(near+(random()<.5?-1:1),0,next.length-1);
  if(neighbor!==near)n.links.push(next[neighbor].id);
  if(['elite','rift'].includes(n.type))for(const id of n.links){const target=next.find(x=>x.id===id);if(['elite','rift'].includes(target.type))target.type='combat';}
 }
 // Connect every node to an incoming edge as well, so the whole displayed graph is useful.
 for(let i=1;i<12;i++)for(const n of layers[i])if(!layers[i-1].some(p=>p.links.includes(n.id))){const p=layers[i-1][Math.round(n.row/Math.max(1,layers[i].length-1)*(layers[i-1].length-1))];p.links.push(n.id);if(['elite','rift'].includes(p.type)&&['elite','rift'].includes(n.type))n.type='combat';}
 if(!layers.slice(0,10).flat().some(n=>n.type==='event')){const floor=3+Math.floor(random()*6),row=Math.floor(random()*layers[floor].length);layers[floor][row].type='event';}
 return layers;
}
export function normalizeEarlyRoute(r){for(const node of r.map.flat())if(node.type==='treasure')node.type='event';if(r.current?.type==='treasure')r.current.type='event';if(r.chapter!==1)return;for(const layer of r.map.slice(0,3))for(const node of layer)if(['forge','shop','repair'].includes(node.type)&&!r.path.includes(node.id)&&r.current?.id!==node.id)node.type=seedNumber(`${r.seed}:${node.id}:early`)%2?'event':'combat';}
export function treasureReward(r,node=r.current){return 120+15*Math.max(0,r.chapter-1)+5*(node?.floor||0)+seedNumber(`${r.seed}:${node?.id}:treasure`)%61;}
export function eventOutcome(r,node=r.current){return UNKNOWN_EVENTS[Math.floor(randomGenerator(seedNumber(`${r.seed}:${node?.id}:unknown-v12`))()*UNKNOWN_EVENTS.length)].id;}
export function prepareUnknownEvent(r){const node=r.current;if(node?.type!=='event'||node.floor!==r.floor||!r.path.includes(node.id))return null;
 if(node.encounter?.version===12)return node.encounter;
 const encounter={version:12,kind:eventOutcome(r,node)};
 if(encounter.kind==='laboratory'){
  const random=randomGenerator(seedNumber(`${r.seed}:${node.id}:laboratory-v12`));
  const items=relicOffers({...r,random,shown:{...r.shown},logs:[]},'danger');
  const costs=[20+Math.floor(random()*9),10+Math.floor(random()*9),111*(1+Math.floor(random()*6))];
  encounter.offers=['health','shield','coins'].map((id,i)=>({id,relicId:items[i]?.id||null,cost:costs[i]}));
 }
 node.encounter=encounter;r.logs.push({type:'event-roll',node:node.id,kind:encounter.kind});return encounter;
}
export function claimTreasure(r){if(!eventUnused(r)||prepareUnknownEvent(r)?.kind!=='treasure')return false;const amount=treasureReward(r);r.coins+=amount;r.logs.push({type:'treasure',node:r.current.id,amount,chapter:r.chapter});return amount;}

export function has(r,id){return r.relics[id]||0;}
export function dashStats(r){const f=FRAMES.find(f=>f.id===r.frame.id)||FRAMES[0];return{charges:activeChallenge(r,'no-dash')?0:Math.max(0,f.dashCharges-Math.min(1,has(r,'E13'))),duration:Math.min(1.2,f.dashDuration+.1*Math.min(3,has(r,'R13'))),cooldown:f.dashCooldown,reduction:has(r,'E13')?.35:0};}
export function elementStats(r,id,stacks=1){const rule=ELEMENT_LIMITS[id],cap=rule.cap+(id==='fire'?2*Math.min(2,has(r,'R05')):id==='dark'&&has(r,'E15')?2:0),level=clamp(stacks,1,cap);return{cap,duration:Math.min(rule.max+(id==='dark'&&has(r,'E14')?2:0),rule.base+rule.step*(level-1)+(id==='dark'&&has(r,'E14')?2:0))};}
export function weaponFits(r,tag){return !tag|| (tag==='bullet'?r.weapon!=='beam':r.weapon===tag);}
export function legalRelic(r,item,source='elite'){
 if(!weaponFits(r,item.weapon)||item.elements.some(e=>!r.elements.includes(e))||r.elements.length<item.minElements||has(r,item.id)>=item.max)return false;
 if((item.conflicts||[]).some(id=>has(r,id))||RELICS.some(x=>has(r,x.id)&&x.conflicts?.includes(item.id)))return false;
 if(item.shape&&RELICS.some(x=>x.shape&&x.id!==item.id&&has(r,x.id)))return false;
 if(EVOLUTIONS.some(e=>r.evolutions.includes(e.id)&&e.conflicts.includes(item.id)))return false;
 if(item.rarity==='X'&&(!['boss','rift','danger'].includes(source)||RELICS.filter(x=>x.rarity==='X'&&has(r,x.id)).length>=2))return false;
 return true;
}
export function activeSynergies(r){return SYNERGIES.filter(s=>s.relics.every(id=>has(r,id))&&weaponFits(r,s.weapon)&&s.elements.every(e=>r.elements.includes(e))&&r.elements.length>=s.minElements);}
export function weaponEvolution(r){return EVOLUTIONS.find(e=>e.slot==='primary'&&e.weapon===r.weapon&&r.evolutions.includes(e.id));}
export function evolutionProgress(r){return EVOLUTIONS.filter(e=>{
 const s=SYNERGIES.find(s=>s.id===e.synergy);return weaponFits(r,e.weapon)&&weaponFits(r,s.weapon);
 }).map(e=>{const s=SYNERGIES.find(s=>s.id===e.synergy);const relics=[...s.relics,...(e.extra?[e.extra]:[])];return{...e,missingRelics:relics.filter(id=>!has(r,id)),missingElements:s.elements.filter(id=>!r.elements.includes(id)),missingElementCount:Math.max(0,s.minElements-r.elements.length),selected:r.evolutions.includes(e.id),conflicting:e.conflicts.some(id=>has(r,id))||(e.slot==='primary'&&!!weaponEvolution(r)&&!r.evolutions.includes(e.id))};});}
export function eligibleEvolutions(r){return evolutionProgress(r).filter(e=>!e.missingRelics.length&&!e.missingElements.length&&!e.missingElementCount&&r.bosses>=e.bosses&&!e.conflicting&&!e.selected&&r.evolutions.length<2).sort((a,b)=>Number(b.weapon===r.weapon)-Number(a.weapon===r.weapon));}
export function applyEvolution(r,id){if(r.cores<=0||!eligibleEvolutions(r).some(e=>e.id===id))return false;r.cores--;r.evolutions.push(id);r.logs.push({type:'evolution',id});r.events.push({type:'evolution',name:EVOLUTIONS.find(e=>e.id===id).name});return true;}
export function exchangeEvolutionCore(r){if(r.cores<=0||r.recast>7)return false;r.cores--;r.recast+=2;r.logs.push({type:'core-recast'});return true;}
const quality={elite:[.48,.30,.15,.07,0],boss:[.15,.35,.32,.16,.02],shop:[.35,.40,.20,.05,0],rift:[0,.20,.45,.25,.10],danger:[0,0,.25,.35,.40]};
function drawWeighted(random,items,weights){let t=random()*weights.reduce((a,b)=>a+b,0);return items[weights.findIndex(w=>(t-=w)<0)]||items.at(-1);}
export function relicWeight(r,item,source){
 let w=1; if(item.weapon&&weaponFits(r,item.weapon))w*=1.6;
 if(item.elements.length)w*=1.5;
 const missing=SYNERGIES.some(s=>s.relics.includes(item.id)&&s.relics.filter(id=>!has(r,id)).length===1&&weaponFits(r,s.weapon)&&s.elements.every(e=>r.elements.includes(e)));
 if(missing)w*=source==='shop'?1.5:2;
 if(item.tag===r.track)w*=1.3;
 if(item.tag===REGIONS[(r.chapter-1)%REGIONS.length].tag)w*=1.2;
 if(r.shown[item.id])w*=.7;
 if(has(r,item.id))w*=.6;
 if(item.tag===r.track&&r.pity>=2)w*=r.pity>=3?1.8:1.4;
 return clamp(w,.2,4);
}
export function relicOffers(r,source='elite',count=3){
 const pool=RELICS.filter(x=>legalRelic(r,x,source)&&(source!=='danger'||['E','L','X'].includes(x.rarity)));const result=[];
 for(let slot=0;slot<count&&pool.length;slot++){
  let rarity=drawWeighted(r.random,['C','R','E','L','X'],quality[source]||quality.elite);
  if(source==='elite'&&slot===0&&rarity==='C')rarity='R';
  const order=['C','R','E','L','X'];let candidates=[];
  for(let i=order.indexOf(rarity);i>=0&&!candidates.length;i--)candidates=pool.filter(x=>x.rarity===order[i]);
  if(!candidates.length)candidates=pool;
  const item=drawWeighted(r.random,candidates,candidates.map(x=>relicWeight(r,x,source)));
  result.push(item);pool.splice(pool.indexOf(item),1);
 }
 if(source==='elite'&&!result.some(x=>x.rarity!=='C')){const rare=pool.filter(x=>x.rarity!=='C');if(rare.length)result[0]=drawWeighted(r.random,rare,rare.map(x=>relicWeight(r,x,source)));}
 if(r.chapter>=2&&!RELICS.some(x=>x.weapon&&has(r,x.id))&&source==='boss'&&r.weaponPity!==true){
  const candidate=pool.find(x=>x.weapon&&['C','R'].includes(x.rarity));if(candidate){result[result.length-1]=candidate;r.weaponPity=true;}
 }
 if(source==='boss'&&r.cores>0&&!weaponEvolution(r)&&r.evolutions.length<2){const missing=new Set(evolutionProgress(r).filter(e=>e.slot==='primary'&&!e.conflicting&&!e.selected).flatMap(e=>e.missingRelics));if(!result.some(x=>missing.has(x.id))){const candidates=pool.filter(x=>missing.has(x.id));if(candidates.length)result[0]=drawWeighted(r.random,candidates,candidates.map(x=>relicWeight(r,x,source)));}}
 r.pity=result.some(x=>x.tag===r.track)?0:r.pity+1;
 result.forEach(x=>r.shown[x.id]=(r.shown[x.id]||0)+1);
 r.logs.push({type:'offer',source,ids:result.map(x=>x.id),floor:r.floor,chapter:r.chapter});
 return result;
}
export const isEndless=r=>r.chapter>3;
const endlessBasics=new Set(['attack','rate','health','shield','speed','crit','projectile','element']);
export function upgradeLimit(r,u){return isEndless(r)&&endlessBasics.has(u.id)?Infinity:u.max;}
export function upgradeDescription(r,u){if(!isEndless(r))return u.desc;return({rate:'无尽充能：继续提升射击与蓄力速度，原四级之后按递减收益成长，不受两倍攻速上限限制',speed:'无尽推进：继续提升移动速度，原四级之后按递减收益成长，不受 420 速度上限限制',crit:'暴击率 +4 个百分点，无尽可提升至 100%；超过 100% 的部分每个百分点增加 0.005 暴击倍率',element:'元素伤害 +15%，无尽升级等级不设上限','crit-conversion':'每层把实际暴击率的 50% 转为主武器条件增伤，最多三层；无尽暴击率提高后继续加强转化，总条件增伤最多 +200%'})[u.id]||u.desc;}
export function endlessHaste(r){return isEndless(r)?1+.18*Math.log1p(Math.max(0,(r.upgrades.rate||0)-4)):1;}
export function chapterHealth(chapter,boss=false){const depth=Math.max(0,chapter-3);return Math.pow(boss?2.25:1.42,Math.min(2,Math.max(0,chapter-1)))*(boss?1+.30*depth+.045*depth*depth:1+.25*depth+.04*depth*depth);}
export function upgradeOffers(r){const pool=UPGRADES.filter(x=>(r.upgrades[x.id]||0)<upgradeLimit(r,x)&&weaponFits(r,x.weapon)&&r.elements.length>=(x.minElements||0));return Array.from({length:Math.min(3,pool.length)},()=>pool.splice(Math.floor(r.random()*pool.length),1)[0]);}
export function supplyRewardAvailable(r,id){return id==='supply-coins'||id==='supply-repair'&&(r.hp<r.maxHp||r.shield<r.maxShield)||id==='supply-logistics'&&r.recast<9&&RELICS.some(x=>legalRelic(r,x,'shop'));}
export function applySupplyReward(r,id){
 if(!SUPPLY_REWARDS.some(x=>x.id===id)||!supplyRewardAvailable(r,id))return false;
 if(id==='supply-coins')r.coins+=120;
 if(id==='supply-repair'){r.hp=Math.min(r.maxHp,r.hp+r.maxHp*.2);r.shield=Math.min(r.maxShield,r.shield+r.maxShield*.5);}
 if(id==='supply-logistics')r.recast=Math.min(9,r.recast+1);
 r.logs.push({type:'supply',id,level:r.level});return true;
}
export function supportServices(r){
 const scale=1+.15*(r.supportPurchases||0),quote=(id,name,desc,base,available,icon,unavailable)=>({id,name,desc,cost:Math.ceil(base*scale/5)*5,available,icon,unavailable});
 const growth=UPGRADES.some(x=>(r.upgrades[x.id]||0)<upgradeLimit(r,x)&&weaponFits(r,x.weapon)&&r.elements.length>=(x.minElements||0)),recast=RELICS.some(x=>legalRelic(r,x,'shop'));
 return [quote('repair','舰体修复','回复 20% 最大生命与 50% 最大护盾',120,r.hp<r.maxHp||r.shield<r.maxShield,'upgrade-repair','生命与护盾已满'),quote('reroll','刷新补给','增加 1 次升级刷新，最多储存 9 次',180,r.rerolls<9&&growth,'upgrade-rate',growth?'刷新库存已满':'当前可用成长已满'),quote('recast','定向重铸券','增加 1 张商店重铸券，最多储存 9 张',240,r.recast<9&&recast,'upgrade-logistics',recast?'重铸库存已满':'当前没有合法遗物候选')];
}
export function buySupport(r,id){
 const item=supportServices(r).find(x=>x.id===id);if(!item?.available||r.coins<item.cost)return false;
 r.coins-=item.cost;r.supportPurchases=(r.supportPurchases||0)+1;
 if(id==='repair'){r.hp=Math.min(r.maxHp,r.hp+r.maxHp*.2);r.shield=Math.min(r.maxShield,r.shield+r.maxShield*.5);}
 if(id==='reroll')r.rerolls++;if(id==='recast')r.recast++;
 r.logs.push({type:'support',id,cost:item.cost});return true;
}
export function fabricationOffers(r){
 if(r.evolutions.length>=2)return[];
 const ids=new Set(evolutionProgress(r).filter(e=>!e.selected&&!e.conflicting).flatMap(e=>e.missingRelics));
 const primary=new Set(evolutionProgress(r).filter(e=>e.slot==='primary'&&!e.selected&&!e.conflicting).flatMap(e=>e.missingRelics));
 return [...ids].map(id=>RELIC_BY_ID[id]).filter(x=>x.rarity!=='X'&&legalRelic(r,x,'shop')).map(x=>({...x,cost:Math.ceil((primary.has(x.id)?clamp(priceFor(r,x)*1.6,240,320):priceFor(r,x)*1.6)*(1+.15*(r.supportPurchases||0))/5)*5}));
}
export function buyBlueprint(r,id){
 const item=fabricationOffers(r).find(x=>x.id===id);if(!item||r.coins<item.cost||!applyRelic(r,id))return false;
 r.coins-=item.cost;r.supportPurchases=(r.supportPurchases||0)+1;r.logs.push({type:'fabrication',id,cost:item.cost});return true;
}
export function createRun({frame='falcon',weapon='beam',seed=Date.now().toString(36),difficulty='normal'}={}){
 const f=FRAMES.find(x=>x.id===frame)||FRAMES[0];
 return {seed,random:randomGenerator(seedNumber(seed)),frame:f,weapon,prismAngle:0,difficulty,hp:f.hp,maxHp:f.hp,shield:f.shield,maxShield:f.shield,coins:120,xp:0,level:1,chapter:1,floor:0,map:generateMap(seed,1),current:null,path:[],relics:{},upgrades:{},elements:[],evolutions:[],cores:0,bosses:0,rerolls:3,recast:0,shown:{},track:weapon==='beam'?'beam':'attack',pity:0,kills:0,score:0,damage:{},logs:[],events:[],time:0,lastDeath:'',revivedAt:-100,emergencyNode:'',evolutionReviveNode:'',stats:{shots:0,hits:0,damageTaken:0,maxChain:0},availableElementMilestones:[],pending:[],completedNodes:0};
}
export function xpRequired(level){return Math.round(20+8*level+1.2*level*level);}
export function applyRelic(r,id){
 const item=RELIC_BY_ID[id];if(!item||!legalRelic(r,item,'danger'))return false;
 const old=activeSynergies(r).map(s=>s.id);r.relics[id]=(r.relics[id]||0)+1;
 if(id==='C03'){r.maxHp+=20;r.hp=Math.min(r.maxHp,r.hp+20);}
 if(id==='X01'){r.maxHp=Math.max(1,Math.round(r.maxHp*.65));r.hp=Math.min(r.hp,r.maxHp);}
 if(id==='L06')r.maxShield=Math.max(r.maxShield,Math.round(r.maxHp*.3));
 r.logs.push({type:'relic',id});for(const s of activeSynergies(r))if(!old.includes(s.id))r.events.push({type:'synergy',name:s.name});
 return true;
}
export function applyUpgrade(r,id){
 const u=UPGRADES.find(x=>x.id===id);if(!u||!weaponFits(r,u.weapon)||r.elements.length<(u.minElements||0)||(r.upgrades[id]||0)>=upgradeLimit(r,u))return false;r.upgrades[id]=(r.upgrades[id]||0)+1;
 if(id==='health'){r.maxHp+=20;r.hp=Math.min(r.maxHp,r.hp+20);}if(id==='shield'){r.maxShield+=15;r.shield=Math.min(r.maxShield,r.shield+15);}return true;
}
export function gainXP(r,amount){r.xp+=amount;while(r.xp>=xpRequired(r.level)){r.xp-=xpRequired(r.level++);r.pending.push({type:'upgrade'});if([10,30].includes(r.level))r.pending.push({type:'element'});}}
export function beamStats(r){
 const sy=activeSynergies(r).map(s=>s.id), heart=has(r,'E01');
 let charge=1.2*(1+.15*heart),duration=.8+.35*heart+.1*(r.upgrades.duration||0),damage=15,width=28*(1+.35*heart+.2*(r.upgrades.width||0));
 if(has(r,'L01')){charge=2.4;duration=1.8;damage=r.frame.attack*.95;}
 if(r.evolutions.includes('U01')){charge*=1.15;duration+=.1;damage*=1.05;width*=1.5;}
 if(has(r,'E04'))duration=2.4;
 charge*=(1-.05*has(r,'C02'))*(1-.05*has(r,'C10'))*(1-.065*Math.min(4,r.upgrades.rate||0));
 if(has(r,'X06'))charge/=1.2;
 if(sy.includes('B06')){charge*=.9;duration+=.15;}
 return{charge:Math.max(.6,charge)/endlessHaste(r),duration,damage,width};
}
export function attributes(r){
 const endless=isEndless(r),crit=.05+.05*has(r,'C06')+.04*(r.upgrades.crit||0),speedLevel=r.upgrades.speed||0;
 return {attack:1+.12*has(r,'C01')+.12*(r.upgrades.attack||0),speed:Math.min(420,r.frame.speed*(1+.09*has(r,'C04')+.08*Math.min(4,speedLevel)))+(endless?r.frame.speed*.08*Math.log1p(Math.max(0,speedLevel-4)):0),crit:Math.min(endless?1:.4,crit),critDamage:Math.min(2.6,1.5+.8*has(r,'X03')+(r.evolutions.includes('U08')&&r.hp/r.maxHp<.35?.25:0))+(endless?Math.max(0,crit-1)*.5:0),rate:Math.max(.5,(1-.065*has(r,'C02'))*(1-.065*Math.min(4,r.upgrades.rate||0))/(has(r,'X06')?1.2:1))/endlessHaste(r),projectile:1+.18*has(r,'C07')+.15*(r.upgrades.projectile||0)};
}
export function primaryBonus(r,e,attackTime=0){
 let bonus=attributes(r).crit*.5*Math.min(3,r.upgrades['crit-conversion']||0);
 if(has(r,'X01'))bonus+=.55;
 if(has(r,'E09')&&r.hp/r.maxHp<.35)bonus+=.45;
 if(has(r,'E07')&&attackTime>=4)bonus+=.35*has(r,'E07');
 if(has(r,'X02'))bonus+=Math.min(.8,.08*(r.chapter-1));
 if(has(r,'R08')&&r.elements.includes('light')&&e.elite)bonus+=.12*has(r,'R08');
 if(activeSynergies(r).some(s=>s.id==='B15')&&r.hp/r.maxHp<.35)bonus+=.1;
 if(e.armor&&has(r,'C09'))bonus+=.1*has(r,'C09');
 bonus+=.02*(e.status.light?.stacks||0)+.01*(e.status.ice?.stacks||0);
 return 1+Math.min(2,bonus);
}
export const activeChallenge=(r,id)=>r.challenge?.remaining>0&&(!id||r.challenge.id===id);
export const primaryChallengeFactor=r=>activeChallenge(r,'weak-weapon')?.75:1;
export function targetDamageTaken(r,e,time=0){const s=e.status,dark=s.dark&&s.dark.until>time?s.dark.stacks:0;return 1+Math.min(.5,dark*(.02+.01*Math.min(2,has(r,'R14')))+(s.nightflame?.until>time?.08:0)+(s.frailty?.until>time?.1:0));}
export function endlessThreat(chapter){const d=Math.max(0,chapter-3);return{damage:1+.05*d+.003*d*d,armor:Math.min(120,4*d),haste:1+.12*Math.log1p(d)};}
function eventUnused(r){const n=r.current;return n?.type==='event'&&n.floor===r.floor&&r.path.includes(n.id)&&!r.logs.some(l=>['laboratory','challenge-start','treasure','event-skip'].includes(l.type)&&l.node===n.id);}
export function laboratoryOffers(r){if(prepareUnknownEvent(r)?.kind!=='laboratory')return[];return r.current.encounter.offers.map(o=>{
 const item=RELIC_BY_ID[o.relicId],validCost=o.id==='health'?Number.isInteger(o.cost)&&o.cost>=20&&o.cost<=28:o.id==='shield'?Number.isInteger(o.cost)&&o.cost>=10&&o.cost<=18:[111,222,333,444,555,666].includes(o.cost);
 const affordable=o.id==='health'?r.hp>o.cost:o.id==='shield'?r.maxShield>=o.cost:r.coins>=o.cost;
 return{...o,item,available:Boolean(eventUnused(r)&&validCost&&affordable&&item&&legalRelic(r,item,'danger')),reason:!item?'高品质候选已耗尽':!eventUnused(r)?'本事件已完成':!legalRelic(r,item,'danger')?'当前不能获得此遗物':o.id==='health'&&!affordable?'生命不足，支付后会死亡':o.id==='shield'&&!affordable?'最大护盾不足':o.id==='coins'&&!affordable?'星币不足':''};
 });}
export function payLaboratory(r,id){const offer=laboratoryOffers(r).find(o=>o.id===id);if(!offer?.available)return false;
 const before={hp:r.hp,maxShield:r.maxShield,shield:r.shield,coins:r.coins};
 if(id==='health')r.hp-=offer.cost;if(id==='shield'){r.maxShield-=offer.cost;r.shield=Math.min(r.shield,r.maxShield);}if(id==='coins')r.coins-=offer.cost;
 if(!applyRelic(r,offer.relicId)){Object.assign(r,before);return false;}
 r.logs.push({type:'laboratory',node:r.current.id,id,relicId:offer.relicId,cost:offer.cost});return offer.cost;
}
export function skipUnknownEvent(r){if(!eventUnused(r))return false;r.logs.push({type:'event-skip',node:r.current.id});return true;}
export function challengeAvailable(r,id){return !activeChallenge(r)&&CHALLENGES.some(c=>c.id===id)&&(id!=='no-dash'||dashStats(r).charges>0)&&(id!=='no-shield'||r.maxShield>0);}
export function startChallenge(r,id){if(!eventUnused(r)||prepareUnknownEvent(r)?.kind!=='challenge'||!challengeAvailable(r,id))return false;r.challenge={id,remaining:3,total:3,counted:[]};r.logs.push({type:'challenge-start',node:r.current.id,id});return true;}
export function activeElementReactions(r){return ELEMENT_REACTIONS.filter(q=>q.elements.every(id=>r.elements.includes(id)));}

export function advanceChallenge(r,node){const c=r.challenge;if(!activeChallenge(r)||!['combat','elite','boss','rift'].includes(node.type)||c.counted.includes(node.id))return false;
 c.counted.push(node.id);c.remaining--;r.logs.push({type:'challenge-progress',id:c.id,node:node.id,remaining:c.remaining});if(!c.remaining){r.pending.push({type:'challenge-relic',id:c.id});r.logs.push({type:'challenge-complete',id:c.id});}return true;
}
export function weaponDamageProfile(r){const evo=weaponEvolution(r)?.id,base=r.weapon==='beam'?beamStats(r).damage:r.weapon==='pulse'?r.frame.attack*(evo==='U09'?.4:evo==='U10'?.85:1):r.weapon==='shotgun'?(evo==='U11'?4.4:evo==='U12'?22:7):r.weapon==='rail'?(evo==='U13'?38:evo==='U14'?80:95):evo==='U15'?8.5:evo==='U16'?11:18;
 return{damage:base*attributes(r).attack*primaryChallengeFactor(r),label:r.weapon==='beam'?'单跳射线 · 满蓄力':r.weapon==='rail'?'单枚主弹 · 满蓄力':'单枚主弹'};
}
export function nextNodes(r){if(r.floor>=12)return[];return r.map[r.floor].filter(n=>!r.current||r.current.links.includes(n.id));}
export function selectNode(r,id){const n=nextNodes(r).find(x=>x.id===id);if(!n)return null;r.current=n;r.path.push(id);r.logs.push({type:'route',node:n.type,id,chapter:r.chapter});return n;}
export function completeNode(r){r.completedNodes++;r.floor++;if(r.floor===12){r.chapter++;r.floor=0;r.current=null;r.map=generateMap(r.seed,r.chapter);}return r.chapter===4&&r.floor===0;}
export function priceFor(r,item){return Math.round(RARITIES[item.rarity].price*(1+.025*(r.chapter-1))*(has(r,'R12')?1.08:1)/5)*5;}
export function pointSegmentDistance(x,y,s){const [ax,ay,bx,by]=s;const dx=bx-ax,dy=by-ay;const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-t*dx,y-ay-t*dy);}
const primarySources=new Set(['PRIMARY','BEAM_TICK']);
export class Battle{
 constructor(run,node){
  this.challengeShield=activeChallenge(run,'no-shield')?run.shield:null;if(this.challengeShield!==null)run.shield=0;this.r=run;run.prismAngle=getPrismAngle(run);this.node=node;this.time=0;this.player={x:W/2,y:H-145,invincible:0,dash:0,dashCD:0,lastHit:-10,charge:0,cooldown:0,held:false,manualHeld:false,beam:null,stored:0,reserveCharge:0,ringDelay:0,pendingStoredRelease:false,dashCharges:dashStats(run).charges,dashHeld:false};
  this.defensiveWaves=[];this.railMarks=[];this.railMarkGroups=new Map();this.enemies=[];this.bullets=[];this.enemyBullets=[];this.bossHazards=[];this.particles=[];this.effects=[];this.visualEffects=[];this.afterimages=[];this.afterimageClock=0;this.attackBudgets=new Map();this.attackStrengths=new Map();this.pickups=[];this.floaters=[];this.scheduled=[];this.nextId=1;this.nextAttack=1;this.done=false;this.over=false;this.shake=0;this.combo=0;this.attackTime=0;this.idleTime=0;this.procBudget=0;this.procSecond=0;this.tickEvents=new Set();this.damageLog=[];this.nextDrone=0;this.nextOrb=4;this.nextWell=12;this.nextTime=18;this.nextShield=10;this.lastKills=0;this.droneAttacks=0;this.echoBeams=[];
  this.duration=node.type==='boss'?Infinity:node.type==='rift'?45:node.type==='elite'?28:24;
  this.wave=0;this.nextWave=1;this.waves=node.type==='rift'?4:node.type==='elite'?3:2;
  if(node.type==='boss')this.spawnBoss();
  if(has(run,'X06'))run.hp=Math.max(1,run.hp-run.maxHp*.04);
 }
 restoreChallengeShield(){if(this.challengeShield!==null){this.r.shield=Math.min(this.r.maxShield,this.challengeShield);this.challengeShield=null;}}
 addEffect(effect){if(this.effects.length<150)this.effects.push(effect);}
 addVisual(effect){if(this.visualEffects.length>=96)this.visualEffects.shift();this.visualEffects.push(effect);}
 addAfterimage(kind,x,y,life){if(this.afterimages.length>=64)this.afterimages.shift();this.afterimages.push({kind,x,y,life,maxLife:life,created:this.time});}
 spawnEnemy(type,x,y=-50,elite=false){
  const r=this.r, difficulty=r.difficulty==='story'?.72:1,scale=(1+.09*r.floor)*chapterHealth(r.chapter)*difficulty;
  const e={id:this.nextId++,type,x,y,radius:type==='armor'?27:20,hp:(type==='armor'?65:type==='kamikaze'?24:35)*scale*(elite?4:1),maxHp:0,armor:(type==='armor'?35:type==='shield'?18:0)+endlessThreat(r.chapter).armor,speed:50+this.r.random()*30,age:0,shoot:.7+this.r.random()*1.3,elite,phase:1,status:{},cooldowns:{},dead:false,reactionWindow:0,reactionBudget:0};
  if(elite){e.radius=38;e.speed=40;}e.maxHp=e.hp;this.enemies.push(e);return e;
 }
 spawnBoss(){
  const e=this.spawnEnemy('boss',W/2,130,true);e.hp=e.maxHp=Math.round(2200*chapterHealth(this.r.chapter,true)*(this.r.difficulty==='story'?.65:1));e.radius=65;e.armor=15+endlessThreat(this.r.chapter).armor;e.shoot=1.15;e.speed=0;e.warning=0;e.attackCount=0;e.pressureClock=0;e.pressureEnabled=true;this.boss=e;
 }
 spawnWave(){
  const types=['skirmisher','sniper','armor','disruptor','shield','kamikaze'];const n=5+this.r.chapter+this.wave*2;
  for(let i=0;i<n;i++)this.scheduled.push({kind:'spawn',at:this.time+i*.35,action:()=>this.spawnEnemy(types[(i+this.wave+this.r.floor)%6],80+(i%6)*(W-160)/5,-40-(i%2)*50)});
  if(['elite','rift'].includes(this.node.type)&&this.wave===1)this.spawnEnemy('armor',W/2,-80,true);
  this.wave++;this.nextWave=this.time+9;this.r.events.push({type:'wave',wave:this.wave});
 }
 hurtPlayer(amount,source='敌方弹幕',attackerId=null){
  const p=this.player,r=this.r;if(p.invincible>0||this.over||!Number.isFinite(amount)||amount<=0)return;
  if(has(r,'X03'))amount*=1.35;if(has(r,'E09')&&r.hp/r.maxHp<.35)amount*=1.2;if(activeSynergies(r).some(s=>s.id==='B15')&&r.hp/r.maxHp<.35)amount*=1.1;
  amount*=1-dashStats(r).reduction;
  if(activeChallenge(r,'no-shield'))r.shield=0;const absorbed=Math.min(r.shield,amount);r.shield-=absorbed;amount-=absorbed;
  if(absorbed>0&&r.shield===0&&has(r,'E16')){amount=0;this.addVisual({type:'shield-gate',x:p.x,y:p.y,life:.5,maxLife:.5});this.floaters.push({x:p.x,y:p.y-46,text:'屏障 · 溢出阻断',color:'#91ecff',life:.9});}
  const taken=absorbed+Math.min(r.hp,amount);r.hp-=amount;r.stats.damageTaken+=amount;p.lastHit=this.time;p.invincible=.7;this.shake=9;
  r.events.push({type:'hurt'});this.floaters.push({x:p.x,y:p.y-25,text:`−${Math.round(amount+absorbed)}`,color:'#ff859a',life:.8});
  if(r.hp>0&&r.hp/r.maxHp<.3&&has(r,'C08')&&r.emergencyNode!==this.node.id){r.hp=Math.min(r.maxHp,r.hp+r.maxHp*.08*has(r,'C08'));r.emergencyNode=this.node.id;}
  if(r.hp<=0){
   if(has(r,'R10')&&r.completedNodes-r.revivedAt>=10){r.hp=1;r.revivedAt=r.completedNodes;p.invincible=1.5;r.events.push({type:'revive'});}
   else if(r.evolutions.includes('U08')&&r.evolutionReviveNode!==this.node.id){r.hp=1;p.invincible=.8;r.evolutionReviveNode=this.node.id;r.maxHp=Math.max(1,Math.min(r.maxHp,Math.max(r.frame.hp*.8,r.maxHp-r.frame.hp*.05)));}
   else{r.hp=0;this.over=true;r.lastDeath=source;r.events.push({type:'death'});}
  }
  if(taken>0)this.onPlayerHit(taken,attackerId);
 }
 onPlayerHit(taken,attackerId){
  const r=this.r,p=this.player;
  if(has(r,'E17')){const radius=140+55*(Math.min(3,has(r,'E17'))-1);this.defensiveWaves.push({x:p.x,y:p.y,radius:0,maxRadius:radius,elapsed:0,duration:.45,life:.6});}
  if(has(r,'R15')){
   const target=this.enemies.find(e=>!e.dead&&e.id===attackerId)||this.enemies.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
   if(target){const amount=Math.min(taken*1.5*Math.min(3,has(r,'R15')),r.frame.attack*attributes(r).attack*6);this.addVisual({type:'retaliation',segment:[p.x,p.y,target.x,target.y],life:.35,maxLife:.35});this.damage(target,amount,'RETALIATION',this.nextAttack++,1,false);}
  }
 }
 updateDefensiveWaves(dt){
  for(const wave of this.defensiveWaves){wave.elapsed+=dt;wave.life-=dt;wave.radius=wave.maxRadius*Math.min(1,wave.elapsed/wave.duration);
   for(const bullet of this.enemyBullets)if(bullet.life>0&&Math.hypot(bullet.x-wave.x,bullet.y-wave.y)<=wave.radius+(bullet.radius||0)){bullet.life=0;this.addVisual({type:'bullet-dissolve',x:bullet.x,y:bullet.y,life:.2,maxLife:.2});}
  }
  this.defensiveWaves=this.defensiveWaves.filter(w=>w.life>0);
 }
 damage(e,amount,source='PRIMARY',root=0,generation=0,applyBuffs=true){
  if(e.dead||generation>1||!Number.isFinite(amount))return 0;
  const r=this.r;if(generation&&this.procBudget>=60)return 0;if(generation)this.procBudget++;
  const a=attributes(r);let crit=false;
  if(applyBuffs){amount*=a.attack;if(primarySources.has(source)){
   if(r.random()<a.crit){amount*=a.critDamage;crit=true;}
   amount*=primaryBonus(r,e,this.attackTime)*primaryChallengeFactor(r);
  }}
  amount*=targetDamageTaken(r,e,this.time);
  amount*=100/(100+e.armor*(e.status.superconduct?.8:1));
  if(source==='ELEMENT_REACTION'&&e.type==='boss'){
   if(this.time-e.reactionWindow>=1){e.reactionWindow=this.time;e.reactionBudget=0;}
   amount=Math.max(0,Math.min(amount,e.maxHp*.03,e.maxHp*.02-e.reactionBudget));e.reactionBudget+=amount;
  }
  const budget=this.attackBudgets.get(root);
  if(budget&&e.type==='boss'){
   const a=attributes(r),limit=budget.base*a.attack*(budget.echo?1:primaryBonus(r,e,this.attackTime))*(budget.echo?1:1+a.crit*(a.critDamage-1))*targetDamageTaken(r,e,this.time)*primaryChallengeFactor(r)*2.2;
   amount=Math.max(0,Math.min(amount,limit-(budget.spent.get(e.id)||0)));budget.spent.set(e.id,(budget.spent.get(e.id)||0)+amount);
  }
  if(amount<=0)return 0;
  if(!generation&&primarySources.has(source)&&this.time>=(e.weaponVisualAt||0)){e.weaponVisualAt=this.time+.07;this.addVisual({type:'weapon-hit',weapon:r.weapon,x:e.x,y:e.y,chargeRatio:Math.sqrt(this.attackStrengths.get(root)?.power??1),life:.24,maxLife:.24,color:r.elements.length?undefined:'#8ee3f8'});}
  if(!generation&&primarySources.has(source)&&r.elements.length&&this.time>=(e.visualAt||0)){e.visualAt=this.time+.12;const elements=has(r,'L05')?[r.elements[Math.max(0,r.stats.shots-1)%r.elements.length]]:[...r.elements];this.addVisual({type:'element-hit',x:e.x,y:e.y,elements,life:.45,maxLife:.45});}
  e.hp-=amount;r.damage[source]=(r.damage[source]||0)+amount;r.stats.hits++;
  if(this.floaters.length<65&&(crit||e.elite||r.random()<.25))this.floaters.push({x:e.x+(r.random()-.5)*20,y:e.y-20,text:Math.round(amount).toString(),color:crit?'#f7d493':source==='ELEMENT_REACTION'?'#ccabff':'#b9edff',life:.6});
  const event={eventId:`${root}:${e.id}:${this.nextAttack++}`,root_attack_id:root,generation,source,target:e.id,amount,time:this.time};this.damageLog.push(event);if(this.damageLog.length>300)this.damageLog.shift();
  if(e.hp<=0){this.kill(e,source,this.attackStrengths.get(root)?.power??1);return amount;}
  if(!generation&&primarySources.has(source)){
   const strength=this.attackStrengths.get(root)?.power??1;this.attachElements(e,root);
   if(!e.dead&&has(r,'E14')&&e.status.dark?.stacks>=5&&this.ready(e,'dark-pulse',1.5)){this.damage(e,r.frame.attack*.7*strength,'DARK_PULSE',root,1);this.addVisual({type:'dark-pulse',x:e.x,y:e.y,life:.5,maxLife:.5});}
   if(has(r,'R04')&&e.elite&&this.ready(e,'split',1.5))for(const direction of[-1,1])this.bullets.push({x:e.x,y:e.y,vx:direction*180,vy:-180,radius:5,damage:r.frame.attack*.25*has(r,'R04')*strength,life:2,source:'SPLIT',generation:1,root,hit:new Set()});
   if(has(r,'R01')&&source==='BEAM_TICK'&&this.ready(e,'reflect',activeSynergies(r).some(s=>s.id==='B01')?.35:.2))this.chain(e,r.frame.attack*.6*strength*(activeSynergies(r).some(s=>s.id==='B01')?.85:1),Math.min(3,has(r,'R01')),root,'REFLECT',activeSynergies(r).some(s=>s.id==='B01')?.85:.75);
   if(has(r,'L02')&&source==='BEAM_TICK'&&e.elite&&this.ready(e,'branch',.8)){
    for(const angle of[-.5,0,.5]){const segment=[e.x,e.y,e.x+Math.sin(angle)*200,e.y-250];this.addEffect({type:'line',segment,color:'#c3a1ff',width:4,life:.5,maxLife:.5});for(const t of this.enemies)if(t.id!==e.id&&pointSegmentDistance(t.x,t.y,segment)<t.radius+6)this.damage(t,r.frame.attack*.4*strength,'BRANCH',root,1);}
   }
  }
  return amount;
 }
 ready(e,key,seconds){if((e.cooldowns[key]??-100)>this.time)return false;e.cooldowns[key]=this.time+seconds;return true;}
 attachElements(e,root){
  const r=this.r;if(!r.elements.length)return;
  if(!this.ready(e,'elementAttach',.18))return;
  const power=this.attackStrengths.get(root)?.power??1;const attached=has(r,'L05')?[r.elements[Math.max(0,r.stats.shots-1)%r.elements.length]]:r.elements;
  for(const id of attached){const old=e.status[id],stacks=Math.min(elementStats(r,id).cap,(old&&old.until>this.time?old.stacks:0)+1),stats=elementStats(r,id,stacks);e.status[id]={stacks,cap:stats.cap,until:this.time+stats.duration};}
  if(e.status.lightning?.stacks>=3&&this.ready(e,'lightning',1)){this.chain(e,25*(1+.15*(e.status.lightning.stacks-1))*power,2+has(r,'R07'),root,'CHAIN',has(r,'R07')?.85:.8);}
  if(e.status.ice?.stacks>=6&&e.type!=='boss'&&this.ready(e,'freeze',3)){e.status.freeze={until:this.time+Math.min(2.5,(.75+.125*e.status.ice.stacks)*(1+.25*has(r,'R06')))};}
  for(const q of ELEMENT_REACTIONS){const[a,b]=q.elements;
   if(!q.elements.every(id=>r.elements.includes(id)&&e.status[id]?.stacks>0&&e.status[id].until>this.time)||Object.entries(q.min||{}).some(([id,n])=>e.status[id].stacks<n))continue;
   if(!this.ready(e,q.name,q.cd*(has(r,'X05')?1.5:1)))continue;
   let multiplier=1+.15*(r.upgrades.element||0)+(has(r,'E08')?.25+(r.elements.length===3?.1:0):0)+(has(r,'L05')?.3:0);
   if(has(r,'X05'))multiplier*=1.7;if(activeSynergies(r).some(s=>s.id==='B11'))multiplier*=1.15;
   const stacks=e.status[a].stacks+e.status[b].stacks,damage=(r.frame.attack*q.scale+q.flat)*multiplier*Math.min(1.5,1+.06*(stacks-2))*power;
   const dealt=this.damage(e,damage,'ELEMENT_REACTION',root,1,false);
   if(dealt>0){this.addVisual({type:'reaction',name:q.name,x:e.x,y:e.y,life:.85,maxLife:.85});r.events.push({type:'reaction',name:q.name});}
   if(q.effect==='superconduct')e.status.superconduct={until:this.time+Math.min(5,3+.2*(stacks-2))};
   if(['nightflame','cryotoxin','frailty','blind'].includes(q.effect))e.status[q.effect]={until:this.time+4};
   if(['arc','toxic-chain'].includes(q.effect))this.chain(e,damage*.45,2,root,'ELEMENT_REACTION',.75);
   if(['blast','flare','purge','annihilation'].includes(q.effect)){const radius=q.effect==='purge'?110:q.effect==='blast'?90:100;for(const t of [...this.enemies])if(t!==e&&!t.dead&&Math.hypot(t.x-e.x,t.y-e.y)<radius+t.radius)this.damage(t,damage*.5,'ELEMENT_REACTION',root,1,false);}
   if(q.effect==='delayed')this.scheduled.push({at:this.time+.8,action:()=>{if(!e.dead){this.damage(e,damage*.55,'ELEMENT_REACTION',root,1,false);this.addVisual({type:'reaction',name:q.name,x:e.x,y:e.y,life:.5,maxLife:.5});}}});
   if(q.effect==='steam'){const life=Math.min(6,(has(r,'E12')?(r.evolutions.includes('U06')?4:3):2)+.15*(stacks-2));this.addEffect({type:'steam',x:e.x,y:e.y,radius:activeSynergies(r).some(s=>s.id==='B10')?110:has(r,'E12')?90:75,life,maxLife:life,next:this.time+.5,root,damage:r.frame.attack*.45*multiplier*power,color:q.color});}
   if(q.effect==='crystal')this.addEffect({type:'crystal',x:e.x,y:e.y,radius:95,life:2.5,maxLife:2.5,color:q.color});
   if(q.effect==='miasma')this.addEffect({type:'miasma',x:e.x,y:e.y,radius:95,life:3,maxLife:3,next:this.time+.5,root,damage:r.frame.attack*.25*multiplier*power,color:q.color});
   for(const[id,n]of Object.entries(q.consume||{}))e.status[id].stacks-=n;
   if(e.dead)break;
  }
 }

 chain(origin,damage,count,root,source='CHAIN',falloff=.8){
  let p=origin;const visited=new Set([p.id]);
  for(let i=0;i<count;i++){const target=this.enemies.filter(e=>!e.dead&&!visited.has(e.id)&&Math.hypot(e.x-p.x,e.y-p.y)<300).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!target)break;
   this.addEffect({type:'line',segment:[p.x,p.y,target.x,target.y],color:source==='REFLECT'?'#ffa5d6':'#a8acff',width:3,life:.18,maxLife:.18});this.damage(target,damage*Math.pow(falloff,i),source,root,1,source!=='ELEMENT_REACTION');visited.add(target.id);p=target;
  }this.r.stats.maxChain=Math.max(this.r.stats.maxChain,visited.size-1);
 }
 kill(e,source,power=1){
  if(e.dead)return;e.dead=true;const r=this.r;r.kills++;r.score+=e.type==='boss'?5000:e.elite?500:50;this.combo++;this.burst(e.x,e.y,e.type==='boss'?'#d297fa':'#ffc896',e.elite?35:14);r.events.push({type:'kill',boss:e.type==='boss'});
  if(primarySources.has(source)){this.lastKills++;if(has(r,'R09')&&this.lastKills>=15){this.nextEmpowered=true;this.lastKills=0;}}
  const xp=e.type==='boss'?Math.round(xpRequired(r.level)*1.5):e.elite?50:7+3*r.chapter;
  this.pickups.push({x:e.x,y:e.y,xp,coins:e.type==='boss'?100+15*r.chapter:e.elite?40:1,life:8});
  if(e.type==='boss'){r.bosses++;if(r.bosses===1||r.bosses%3===0)r.cores++;if(r.bosses===3)r.pending.push({type:'element'});this.bossKilled=true;this.enemyBullets=[];this.bossHazards=[];this.shake=16;}
 }
 burst(x,y,color,count=12){for(let i=0;i<count&&this.particles.length<450;i++){const a=this.r.random()*Math.PI*2,speed=30+this.r.random()*150;this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:.4+this.r.random()*.5,color,size:1+this.r.random()*3});}}
 fireBullet(angle,damage,opts={}){const p=this.player,speed=(opts.speed||560)*attributes(this.r).projectile;const root=this.nextAttack++;this.attackStrengths.set(root,{power:opts.power??1,expires:this.time+8});this.bullets.push({x:p.x,y:p.y-28,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed,radius:opts.rail?7:opts.swarm?6:4,damage,life:3,source:'PRIMARY',generation:0,root,hit:new Set(),...opts});if(this.time>=(p.muzzleAt||0)){p.muzzleAt=this.time+.045;this.addVisual({type:'muzzle',x:p.x,y:p.y-30,life:.12,maxLife:.12,color:opts.color||'#a2e9fa',chargeRatio:opts.chargeRatio});}}
 projectileHit(b,e){
  this.damage(e,b.damage,b.source,b.root,b.generation);
  if(b.thunder)this.chain(e,b.damage*.7,2,b.root,'SUMMON',.7);
  if(b.generation===0){
   if(b.blast){const blast=b.blast;b.blast=0;this.addEffect({type:'ring',x:e.x,y:e.y,radius:b.blastRadius,color:b.color||'#ffa28c',life:.4,maxLife:.4});this.burst(e.x,e.y,b.color||'#ffa28c',22);for(const target of [...this.enemies])if(!target.dead&&Math.hypot(target.x-e.x,target.y-e.y)<b.blastRadius+target.radius)this.damage(target,blast*(target.id===e.id?.35:1),'EVOLUTION_BLAST',b.root,1);}
   if(b.gravity>0){b.gravity--;b.fieldHits??=new Map();this.addEffect({type:'well',x:e.x,y:e.y,radius:85,life:1.5,maxLife:1.5,fieldDamage:b.fieldDamage,fieldHits:b.fieldHits,ticks:0,elapsed:0,root:b.root,color:'#91dceb'});}
   if(b.splitSwarm>0){const count=b.splitSwarm;b.splitSwarm=0;const targets=this.enemies.filter(t=>!t.dead&&t.id!==e.id).sort((a,c)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(c.x-e.x,c.y-e.y));for(let i=0;i<count;i++){const angle=(i-(count-1)/2)*.28;this.bullets.push({x:e.x,y:e.y+e.radius+12,vx:Math.sin(angle)*430,vy:-Math.cos(angle)*430,radius:3,damage:b.childDamage,life:2.4,swarm:true,targetId:targets[i%Math.max(1,targets.length)]?.id,color:'#b4f2d3',source:'EVOLUTION_SWARM',generation:1,root:b.root,hit:new Set()});}}
   if(b.ricochets>0){const target=this.enemies.filter(t=>!t.dead&&!b.hit.has(t.id)&&Math.hypot(t.x-e.x,t.y-e.y)<300).sort((a,c)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(c.x-e.x,c.y-e.y))[0];if(target){b.ricochets--;b.damage*=.75;b.targetId=target.id;b.ricochetHoming=true;const angle=Math.atan2(target.x-b.x,b.y-target.y),speed=Math.hypot(b.vx,b.vy);b.vx=Math.sin(angle)*speed;b.vy=-Math.cos(angle)*speed;return true;}}
  }
  if(!b.rail)b.life=0;return false;
 }
 shoot(ratio=1){
  const r=this.r,p=this.player;if(r.weapon==='rail'&&chargePower(ratio)<=0)return false;const quality=clamp(ratio,0,1),power=r.weapon==='rail'?chargePower(ratio):1,railOptions={rail:true,speed:360,chargeRatio:quality,power,radius:12*(.4+.6*quality)};const empowered=(this.nextEmpowered?1+.7*has(r,'R09'):1)*power;this.nextEmpowered=false;r.stats.shots++;
  const evolution=weaponEvolution(r)?.id,synergies=new Set(activeSynergies(r).map(s=>s.id)),start=this.bullets.length;
  if(r.weapon==='pulse'){
   if(evolution==='U09')for(let i=0;i<3;i++){const shoot=()=>this.fireBullet((i-1)*.045,r.frame.attack*.4*empowered,{color:'#8ce7ef'});if(i===0)shoot();else this.scheduled.push({at:this.time+i*.05,action:shoot});}
   else this.fireBullet(0,r.frame.attack*empowered*(evolution==='U10'?.85:1),{ricochets:evolution==='U10'?2:synergies.has('B18')&&r.stats.shots%3===0?1:0,color:evolution==='U10'?'#c0a3fa':undefined});
   if(!evolution&&synergies.has('B17')&&r.stats.shots%3===0)this.scheduled.push({at:this.time+.07,action:()=>this.fireBullet(0,r.frame.attack*.35*empowered)});
  }
  if(r.weapon==='shotgun'){
   if(evolution==='U12')this.fireBullet(0,22*empowered,{radius:10,speed:430,blast:22*empowered,blastRadius:110,color:'#ffa28c'});
   else{const angles=evolution==='U11'?[-.48,-.36,-.24,-.12,0,.12,.24,.36,.48]:[-.24,-.12,0,.12,.24];for(const a of angles)this.fireBullet(a,(evolution==='U11'?4.4:7)*empowered,{color:evolution==='U11'?'#ffd095':undefined,blast:!evolution&&a===0&&synergies.has('B20')?r.frame.attack*.6*empowered:0,blastRadius:55});
    if(!evolution&&synergies.has('B19'))for(const a of[-.36,.36])this.fireBullet(a,2.8*empowered);
   }
  }
  if(r.weapon==='swarm'){
   const angles=evolution==='U15'?[-.3,-.15,0,.15,.3]:[-.12,.12],targets=this.enemies.filter(e=>!e.dead&&e.y<p.y).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
   angles.forEach((a,i)=>this.fireBullet(a,(evolution==='U15'?8.5:evolution==='U16'?11:18)*empowered,{swarm:true,targetId:(evolution==='U15'||synergies.has('B23'))?targets[i%Math.max(1,targets.length)]?.id:undefined,splitSwarm:evolution==='U16'?3:!evolution&&synergies.has('B24')&&r.stats.shots%3===0?1:0,childDamage:(evolution==='U16'?4:4.5)*empowered,radius:evolution==='U16'?8:6,color:evolution==='U15'?'#9ceab5':evolution==='U16'?'#f3c98a':undefined}));
  }
  if(r.weapon==='rail'){
   if(r.upgrades['rail-mark']){const id=this.nextAttack++;railOptions.markGroup=id;this.railMarkGroups.set(id,{damage:1.5*Math.min(3,r.upgrades['rail-mark'])*empowered,power,root:id,next:this.time+.25,hits:new Map(),expires:this.time+5});this.attackStrengths.set(id,{power,expires:this.time+5});}
   if(evolution==='U13')for(const a of[-.1,0,.1])this.fireBullet(a,38*empowered,{...railOptions,color:'#b6cafa'});
   else this.fireBullet(0,(evolution==='U14'?80:95)*empowered,{...railOptions,gravity:evolution==='U14'?3:synergies.has('B22')?1:0,fieldDamage:evolution==='U14'?4.5*empowered:0,color:evolution==='U14'?'#91dceb':undefined});
   if(!evolution&&synergies.has('B21'))for(const a of[-.08,.08])this.fireBullet(a,14.25*empowered,{...railOptions});
  }
  if(has(r,'C12')&&r.weapon!=='beam'){
   const parent=this.bullets.slice(start).filter(b=>b.generation===0).sort((a,b)=>Math.abs(a.vx)-Math.abs(b.vx))[0],count=Math.min(3,has(r,'C12'));
   if(parent){const speed=Math.hypot(parent.vx,parent.vy),baseAngle=Math.atan2(parent.vx,-parent.vy);for(let i=0;i<count;i++){const offset=count===1?.018:(i-(count-1)/2)*.06,angle=baseAngle+offset;this.bullets.push({x:parent.x+Math.sin(offset)*160,y:parent.y+16,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed,radius:Math.max(2,parent.radius*.6),damage:parent.damage*.4,life:3,source:'SPLIT',generation:1,root:parent.root,hit:new Set(),rail:parent.rail,swarm:parent.swarm,targetId:parent.targetId,power:parent.power,chargeRatio:parent.chargeRatio,color:'#b7e2fb',splitLaunch:true});}this.addVisual({type:'split-launch',x:p.x,y:p.y-28,life:.25,maxLife:.25,chargeRatio:parent.chargeRatio,color:'#b7e2fb'});}
  }
  if(has(r,'L03')&&r.stats.shots%8===0){const target=this.enemies.filter(e=>!e.dead).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];this.addEffect({type:'well',x:target?.x||p.x,y:target?.y||H/3,radius:100,life:r.evolutions.includes('U07')?2:1.2,maxLife:2,blackHole:true,power,root:this.nextAttack++});}
  if(has(r,'L04')){
   // Echo preserves the selected projectile shape, without copying its proc flags.
   const specs=this.bullets.slice(start).filter(b=>b.generation===0).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,radius:b.radius,damage:b.damage*.35,rail:b.rail,swarm:b.swarm,color:b.color,targetId:b.targetId,chargeRatio:b.chargeRatio,power:b.power}));
   if(evolution==='U09'){const first=specs[0],speed=Math.hypot(first.vx,first.vy);for(const angle of[0,.045])specs.push({...first,vx:Math.sin(angle)*speed,vy:-Math.cos(angle)*speed});}
   const origin={x:p.x,y:p.y};this.scheduled.push({at:this.time+1,action:()=>{this.addAfterimage('echo',origin.x,origin.y,.85);for(const spec of specs)this.bullets.push({...spec,source:'ECHO',generation:1,life:3,root:this.nextAttack++,hit:new Set()});if(activeSynergies(r).some(s=>s.id==='B13'))this.lastKills++;}});
  }
  r.events.push({type:'shoot'});return true;
 }
 releaseBeam(ratio=1){
  const r=this.r,p=this.player,quality=Number.isFinite(ratio)?clamp(ratio,0,1):0,power=chargePower(quality),base=beamStats(r);if(p.beam||power<=0)return false;
  const s={...base,width:base.width*(.35+.65*quality)};let multiplier=power;if(has(r,'X04')&&quality>=1-1e-7){r.hp=Math.max(1,r.hp*.97);multiplier*=1.65;}
  if(this.nextEmpowered){multiplier*=1+.7*has(r,'R09');this.nextEmpowered=false;}
  p.beam={id:this.nextAttack++,elapsed:0,ticks:0,stats:s,damage:s.damage*multiplier,chargeRatio:quality,power,angle:getPrismAngle(r),segments:[],echo:false,root:0,bossDamage:{}};p.beam.segments=this.beamSegments(p.beam);this.registerBeam(p.beam);p.charge=0;r.stats.shots++;r.events.push({type:'beam'});this.shake=5*quality;
  this.addVisual({type:'muzzle',x:p.x,y:p.y-28,life:.2,maxLife:.2,color:'#f4b2d9',chargeRatio:quality});return true;
 }
 finishBeam(beam){
  if(beam.echo)return;const r=this.r,p=this.player,power=beam.power??1;
  if(r.evolutions.includes('U01')){this.addEffect({type:'line',segment:[p.x,p.y-25,p.x,-40],color:'#ff90b7',width:beam.stats.width*1.2,life:.16,maxLife:.16});for(const e of [...this.enemies])if(!e.dead&&Math.abs(e.x-p.x)<beam.stats.width+e.radius)this.damage(e,r.frame.attack*1.6*power,'FINISHER',beam.id,1);}
  if(r.evolutions.includes('U03')){const point=beamIntersection(beam.segments);if(point){this.addEffect({type:'ring',...point,radius:88,color:'#b5dbff',life:.3,maxLife:.3});for(const e of [...this.enemies])if(!e.dead&&Math.hypot(e.x-point.x,e.y-point.y)<88+e.radius)this.damage(e,Math.min(r.frame.attack*1.8*power,e.type==='boss'?e.maxHp*.008:Infinity),'FINISHER',beam.id,1);}}
 }
 previewBeamSegments(){return this.beamSegments({stats:beamStats(this.r),angle:getPrismAngle(this.r)});}
 registerBeam(beam){this.attackStrengths.set(beam.id,{power:beam.power??1,expires:this.time+beam.stats.duration+3});this.attackBudgets.set(beam.id,{base:beam.damage*Math.ceil(beam.stats.duration/.1-1e-7),echo:beam.echo,spent:new Map(),expires:this.time+beam.stats.duration+3});}
 beamSegments(beam){
  const p=beam.origin||this.player,r=this.r,w=beam.stats.width,target=this.enemies.filter(e=>!e.dead).sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];let angle=has(r,'R03')&&target?clamp(Math.atan2(target.x-p.x,p.y-target.y),-.14,.14):0;
  if(has(r,'E02'))return[[-w*.8,1],[w*.8,1]].map(([offset])=>({line:[p.x+offset,p.y-25,p.x+(activeSynergies(r).some(s=>s.id==='B02')?-offset:offset)+Math.sin(angle)*H,-40],scale:.65,width:activeSynergies(r).some(s=>s.id==='B02')?w*1.25:w}));
  if(has(r,'E05'))return[-.4,-.2,0,.2,.4].map((a,i)=>({line:[p.x,p.y-25,p.x+Math.sin(a+(has(r,'R03')&&i>0&&i<4?angle:0))*H*.65,p.y-Math.cos(a)*H*.65],scale:.35,width:w*.6}));
  if(has(r,'E03'))return prismSegments(p.x,p.y-25,beam.angle??getPrismAngle(r),w);
  return[{line:[p.x,p.y-25,p.x+Math.sin(angle)*H,-40],scale:1,width:w}];
 }
 tickBeam(beam){
  const r=this.r,p=beam.origin||this.player;beam.segments=this.beamSegments(beam);const root=beam.id;
  if(!beam.echo&&activeSynergies(r).some(s=>s.id==='B03')&&(beam.reflections||0)<4){
   for(const s of beam.segments)if((s.line[2]<1||s.line[2]>W-1)&&(beam.reflections||0)<4){const target=this.enemies.filter(e=>!e.dead&&Math.hypot(e.x-s.line[2],e.y-s.line[3])<230&&this.time>(e.cooldowns.boundary||-1))[0];if(target){target.cooldowns.boundary=this.time+.3;beam.reflections=(beam.reflections||0)+1;const multiplier=.5;this.addEffect({type:'line',segment:[s.line[2],s.line[3],target.x,target.y],color:'#caaaff',width:3,life:.4,maxLife:.4});this.damage(target,beam.damage*multiplier,'REFLECT',root,1);}}
  }
  if(!beam.echo&&r.evolutions.includes('U02')){
   beam.wallBranches??=new Set();for(let i=0;i<Math.min(2,beam.segments.length-1);i++){if(beam.wallBranches.has(i))continue;const s=beam.segments[i],next=beam.segments[i+1],[x,y]=s.line.slice(2);if(x>1&&x<W-1)continue;beam.wallBranches.add(i);const angle=Math.atan2(next.line[2]-x,y-next.line[3]),hit=new Set();for(const offset of[-.25,.25]){const segment=[x,y,x+Math.sin(angle+offset)*220,y-Math.cos(angle+offset)*220];this.addEffect({type:'line',segment,color:'#b8a4ff',width:3,life:.22,maxLife:.22});for(const e of [...this.enemies])if(!e.dead&&!hit.has(e.id)&&pointSegmentDistance(e.x,e.y,segment)<e.radius+6){hit.add(e.id);this.damage(e,beam.damage*.4,'BRANCH',root,1);}}}
  }
  for(const e of [...this.enemies]){
   if(e.dead)continue;let overlap=0,total=0;
   if(has(r,'E04')){if(Math.abs(Math.hypot(e.x-p.x,e.y-p.y)-150)<e.radius+beam.stats.width){total=beam.damage*.75;overlap=1;}}
   else for(let i=0;i<beam.segments.length;i++){const s=beam.segments[i],key=`${root}:${beam.ticks}:${i}:${e.id}`;if(this.tickEvents.has(key))continue;if(pointSegmentDistance(e.x,e.y,s.line)<e.radius+s.width/2){this.tickEvents.add(key);total+=beam.damage*s.scale*(overlap===0?1:overlap===1?.5:.25);overlap++;if(has(r,'E03'))break;}}
   if(!overlap)continue;if(has(r,'E05'))total=Math.min(total,beam.damage*1.6);
   if(e.type==='boss'){const max=beam.damage*Math.ceil(beam.stats.duration/.1-1e-7)*2.2;total=Math.min(total,max-(beam.bossDamage[e.id]||0));beam.bossDamage[e.id]=(beam.bossDamage[e.id]||0)+total;}
   if(activeSynergies(r).some(s=>s.id==='B16')&&beam.elapsed>beam.stats.duration-.3)total*=1.2;
   if(!beam.echo)this.damage(e,total,'BEAM_TICK',root);else this.damage(e,total,'ECHO',root,1);
  }
  if(!beam.echo&&r.evolutions.includes('U04')&&beam.ticks%6===0){const hit=new Set();for(let i=0;i<8;i++){const angle=-Math.PI/2+i*Math.PI/4+beam.elapsed*.2,segment=[p.x+Math.cos(angle)*150,p.y+Math.sin(angle)*150,p.x+Math.cos(angle)*225,p.y+Math.sin(angle)*225];this.addEffect({type:'line',segment,color:'#ff9aca',width:3,life:.2,maxLife:.2});for(const e of [...this.enemies])if(!e.dead&&!hit.has(e.id)&&pointSegmentDistance(e.x,e.y,segment)<e.radius+6){hit.add(e.id);this.damage(e,r.frame.attack*.9*(beam.power??1),'FINISHER',root,1);}}}
 }
 addBossHazard(e,hazard){if(e.dead||this.bossKilled||this.bossHazards.length>=12)return;this.bossHazards.push({id:this.nextAttack++,owner:e.id,elapsed:0,fired:false,hit:false,...hazard});}
 bossAttack(e,selected=null){
  if(e.dead||this.bossKilled)return;
  const r=this.r,p=this.player,phase=clamp(e.phase,1,3),sector=(r.chapter-1)%3;
  const patterns=BOSS_PATTERNS[sector][phase-1],count=e.attackCount||0,pattern=selected||patterns[count%patterns.length];e.attackCount=count+1;e.attackName=BOSS_ATTACKS[pattern];
  const damage=(7+r.floor*.4+r.chapter*1.5)*(r.difficulty==='story'?.75:1)*endlessThreat(r.chapter).damage,aim=Math.atan2(p.y-e.y,p.x-e.x);
  const bullet=(angle,speed=150,x=e.x,y=e.y+e.radius)=>this.enemyBullets.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:6,damage,life:12,boss:true,attackerId:e.id,color:'#ff7eaa'});
  e.attackCooldown=1.3-.1*(phase-1);e.warning=0;
  if(pattern==='fan'){const spread=phase===3?4:3;for(let i=-spread;i<=spread;i++)bullet(aim+i*.14,145+phase*10);e.warning=.5;}
  if(pattern==='spiral'){const n=12+phase*2;for(let i=0;i<n;i++)bullet(i*Math.PI*2/n+count*.23,115+phase*10);}
  if(pattern==='corridor'){const gap=clamp(p.x+(count%2?90:-90),100,W-100);for(let x=40;x<W;x+=40)if(Math.abs(x-gap)>85)bullet(Math.PI/2,145+phase*8,x,e.y+e.radius);}
  if(pattern==='bombs'){
   const radius=phase===1?62:56,margin=radius+20,y=clamp(p.y,120,H-margin);let points;
   if(sector===1&&phase>=2){const safe=count%4;points=[90,270,450,630].filter((x,i)=>i!==safe).map(x=>({x,y}));}
   else points=phase===1?[{x:p.x,y}]:[{x:p.x,y},{x:p.x-160,y:y+(sector===2?95:0)},{x:p.x+160,y:y-(sector===2?95:0)}];
   const placed=[];for(const point of points){const x=clamp(point.x,margin,W-margin),yy=clamp(point.y,120,H-margin);if(placed.some(q=>Math.hypot(q.x-x,q.y-yy)<radius*2+24))continue;placed.push({x,y:yy});this.addBossHazard(e,{kind:'bomb',x,y:yy,radius,delay:1.8+(phase===3?placed.length*.12:0),duration:.35,damage:damage*1.3,source:'首领延时炸弹'});}
   e.attackCooldown=1.9-.1*(phase-1);
  }
  if(pattern==='laser'){
   const xs=phase===1?[p.x]:[p.x-100,p.x+100],placed=[];
   for(const x of xs){const xx=clamp(x,45,W-45);if(placed.some(q=>Math.abs(q-xx)<100))continue;placed.push(xx);this.addBossHazard(e,{kind:'laser',segment:[xx,55,xx,H-20],width:34,delay:1.6,duration:.45,damage:damage*1.2,source:'首领轨道光束'});}
   e.attackCooldown=2-.1*(phase-1);
  }
  r.events.push({type:'boss-attack',name:e.attackName});
 }
 bossPressure(e,dt){
  if(e.dead||this.bossKilled||!e.pressureEnabled)return;
  const phase=clamp(e.phase,1,3),interval=[.65,.48,.36][phase-1]/endlessThreat(this.r.chapter).haste*(e.status.blind?1.08:1);e.pressureClock=(e.pressureClock||0)+dt;
  if(e.age<.8)return;
  while(e.pressureClock>=interval){e.pressureClock-=interval;if(this.enemyBullets.length>=360)break;
   const r=this.r,damage=(7+r.floor*.4+r.chapter*1.5)*(r.difficulty==='story'?.75:1)*endlessThreat(r.chapter).damage,n=phase===3?5:3;
   for(const side of[-1,1]){const x=e.x+side*72,y=e.y+32,aim=Math.atan2(this.player.y-y,this.player.x-x);for(let i=0;i<n;i++){const angle=aim+(i-(n-1)/2)*.12+Math.sin(e.age*1.1)*.025;this.enemyBullets.push({x,y,vx:Math.cos(angle)*(150+phase*12),vy:Math.sin(angle)*(150+phase*12),radius:5,damage,life:7,boss:true,pressure:true,attackerId:e.id,color:'#ff9786'});}}
   e.gunFlash=.13;
  }
 }
 updateBossHazards(dt){
  if(this.bossKilled||this.over){this.bossHazards=[];return;}
  for(const h of this.bossHazards){
   h.elapsed+=dt;
   if(h.elapsed+1e-8<h.delay)continue;
   const first=!h.fired;h.fired=true;
   const inside=h.kind==='bomb'?Math.hypot(this.player.x-h.x,this.player.y-h.y)<h.radius+6:pointSegmentDistance(this.player.x,this.player.y,h.segment)<h.width/2+6;
   if(h.kind==='bomb'&&first)this.shake=Math.max(this.shake,5);
   if(inside&&!h.hit&&this.player.invincible<=0&&(h.kind==='bomb'?first:h.elapsed<h.delay+h.duration)){this.hurtPlayer(h.damage,h.source,h.owner);h.hit=true;}
  }
  this.bossHazards=this.bossHazards.filter(h=>h.elapsed<h.delay+h.duration-1e-8);
 }
 enemyShoot(e){
  if(e.type==='boss'){this.bossAttack(e);return;}
  const r=this.r,p=this.player,speed=(120+r.chapter*12)*(has(r,'X02')?1+Math.min(.5,.05*(r.chapter-1)):1),damage=(7+r.floor*.4+r.chapter*1.5)*(r.difficulty==='story'?.75:1)*endlessThreat(r.chapter).damage;
  const bullet=(a,s=speed)=>this.enemyBullets.push({x:e.x,y:e.y+e.radius,vx:Math.cos(a)*s,vy:Math.sin(a)*s,radius:e.type==='boss'?6:5,damage,life:12,boss:e.type==='boss',attackerId:e.id,color:e.type==='boss'?'#ff7eaa':'#ffbe7e'});
  const aim=Math.atan2(p.y-e.y,p.x-e.x);
  if(e.type==='sniper')bullet(aim,speed*1.5);else if(e.type==='disruptor'||e.elite)for(let i=-2;i<=2;i++)bullet(aim+i*.19);else if(e.type!=='kamikaze')bullet(aim);
 }
 update(dt,input={}){
  if(this.done||this.over)return;const r=this.r,p=this.player;this.time+=dt;r.time+=dt;
  for(const [root,strength]of this.attackStrengths)if(strength.expires<this.time)this.attackStrengths.delete(root);
  for(const [root,budget]of this.attackBudgets)if(budget.expires<this.time)this.attackBudgets.delete(root);
  if(Math.floor(this.time)!==this.procSecond){this.procBudget=0;this.procSecond=Math.floor(this.time);}
  p.invincible=Math.max(0,p.invincible-dt);p.dash=Math.max(0,p.dash-dt);this.shake=Math.max(0,this.shake-dt*20);
  const dash=dashStats(r);p.dashCharges=Math.min(p.dashCharges,dash.charges);if(!dash.charges)p.dashCD=0;else if(p.dashCharges<dash.charges){p.dashCD-=dt;while(p.dashCD<=0&&p.dashCharges<dash.charges){p.dashCharges++;p.dashCD+=dash.cooldown;}if(p.dashCharges===dash.charges)p.dashCD=0;}
  if((input.dashPressed||(input.dash&&!p.dashHeld))&&p.dashCharges>0){p.dashCharges--;p.dash=dash.duration;p.invincible=Math.max(p.invincible,dash.duration);if(p.dashCD<=0)p.dashCD=dash.cooldown;this.afterimageClock=0;this.addAfterimage('dash',p.x,p.y,.48);}p.dashHeld=Boolean(input.dash);
  const a=attributes(r),speed=a.speed*(p.dash>0?2.2:1)*(p.stored?.92:1);let dx=input.x||0,dy=input.y||0;
  if(input.pointer&&Math.hypot(input.pointer.x-p.x,input.pointer.y-p.y)>5){dx=clamp((input.pointer.x-p.x)/30,-1,1);dy=clamp((input.pointer.y-p.y)/30,-1,1);}
  const oldX=p.x,oldY=p.y,mag=Math.max(1,Math.hypot(dx,dy));p.x=clamp(p.x+dx/mag*speed*dt,25,W-25);p.y=clamp(p.y+dy/mag*speed*dt,60,H-35);
  if(p.dash>0&&Math.hypot(p.x-oldX,p.y-oldY)>.01){this.afterimageClock+=dt;if(this.afterimageClock>=.045){this.afterimageClock%=.045;this.addAfterimage('dash',oldX,oldY,.48);}}
  if(activeChallenge(r,'no-shield'))r.shield=0;
  if(!activeChallenge(r,'no-shield')&&this.time-p.lastHit>5)r.shield=Math.min(r.maxShield,r.shield+4*dt);
  const firing=Boolean(input.fire||input.auto);if(firing){this.attackTime+=dt;this.idleTime=0;}else{this.idleTime+=dt;if(this.idleTime>1.5)this.attackTime=0;}
  const manual=Boolean(input.fire),released=!input.auto&&p.manualHeld&&!manual;if(r.weapon==='beam'&&has(r,'E03')&&!input.auto)r.prismAngle=clamp(getPrismAngle(r)+clamp(input.aim||0,-1,1)*dt*1.15,-MAX_PRISM_ANGLE,MAX_PRISM_ANGLE);
  p.cooldown-=dt;
  if(r.weapon==='beam'){
   const charge=beamStats(r).charge;
   if(p.beam&&firing&&has(r,'R02')&&!p.stored){p.reserveCharge+=dt;if(p.reserveCharge>=charge){p.stored=1;p.reserveCharge=0;}}
   if(!p.beam&&p.pendingStoredRelease&&p.stored&&this.time>=p.ringDelay){p.pendingStoredRelease=false;p.stored=0;this.releaseBeam();}
   if(!p.beam&&firing&&this.time>=p.ringDelay){if(p.stored&&input.auto){p.stored=0;this.releaseBeam();}else{p.charge=p.stored?charge:Math.min(charge,p.charge+dt);if(input.auto&&p.charge>=charge-1e-7)this.releaseBeam();}}
   if(released){if(p.beam&&p.stored)p.pendingStoredRelease=true;else if(!p.beam&&this.time>=p.ringDelay){if(p.stored){p.stored=0;this.releaseBeam();}else this.releaseBeam(p.charge/charge);p.charge=0;}}
  }else if(r.weapon==='rail'){
   const full=2.2*a.rate;if(firing){p.charge=Math.min(full,p.charge+dt);if(input.auto&&p.charge>=full-1e-7){this.shoot();p.charge=0;}}
   if(released){this.shoot(p.charge/full);p.charge=0;}
  }else if(firing&&p.cooldown<=0){this.shoot();p.cooldown=(r.weapon==='pulse'?.2:r.weapon==='shotgun'?1/1.2:.9)*a.rate;}
  p.held=firing;p.manualHeld=manual&&!input.auto;
  for(const task of this.scheduled.filter(t=>t.at<=this.time))task.action();this.scheduled=this.scheduled.filter(t=>t.at>this.time);
  if(p.beam){const b=p.beam;b.elapsed+=dt;const target=Math.min(Math.floor((b.elapsed+1e-8)/.1),Math.ceil(b.stats.duration/.1-1e-7));while(b.ticks<target){b.ticks++;this.tickBeam(b);}if(b.elapsed>=b.stats.duration-1e-8){
   this.finishBeam(b);
   if(has(r,'L04')&&!b.echo){const origin={x:p.x,y:p.y};this.scheduled.push({at:this.time+1,action:()=>{const echo={...b,id:this.nextAttack++,elapsed:0,ticks:0,damage:b.damage*.35,echo:true,bossDamage:{},wallBranches:new Set(),origin};this.addAfterimage('echo',origin.x,origin.y,b.stats.duration);this.registerBeam(echo);this.echoBeams.push(echo);if(activeSynergies(r).some(s=>s.id==='B13'))this.lastKills++;}});}
   if(activeSynergies(r).some(s=>s.id==='B04')&&p.stored)p.ringDelay=this.time+.5;
   p.beam=null;this.tickEvents.clear();
  }}
  for(const echo of this.echoBeams){echo.elapsed+=dt;const target=Math.min(Math.floor((echo.elapsed+1e-8)/.1),Math.ceil(echo.stats.duration/.1-1e-7));while(echo.ticks<target){echo.ticks++;this.tickBeam(echo);}}this.echoBeams=this.echoBeams.filter(e=>e.elapsed<e.stats.duration);
  if(this.node.type!=='boss'&&this.wave<this.waves&&this.time>=this.nextWave)this.spawnWave();
  for(const e of [...this.enemies]){
   if(e.dead)continue;e.age+=dt;e.shoot-=dt;
   for(const [key,state]of Object.entries(e.status))if(state.until&&state.until<this.time)delete e.status[key];
   const slow=e.status.freeze?0:1-Math.min(.5,(e.status.ice?.stacks||0)*.05);let factor=slow*(e.status.cryotoxin?(e.type==='boss'?.95:.8):1);
   for(const effect of this.effects)if(['well','steam','miasma'].includes(effect.type)&&Math.hypot(e.x-effect.x,e.y-effect.y)<effect.radius){factor*=e.type==='boss'?.9:.65;if(effect.type==='well'&&e.type!=='boss'){e.x+=(effect.x-e.x)*dt*.4;if(activeSynergies(r).some(s=>s.id==='B08')&&e.status.ice&&this.ready(e,'wellfreeze',1)){e.status.ice.stacks=Math.min(6,e.status.ice.stacks+1);if(e.status.ice.stacks>=6)e.status.freeze={until:this.time+1};}}}
   if(e.type==='boss'){e.x=W/2+Math.sin(e.age*.45)*130;e.y=130+Math.sin(e.age*.7)*30;e.phase=e.hp/e.maxHp>.65?1:e.hp/e.maxHp>.3?2:3;e.warning=Math.max(0,e.warning-dt);e.gunFlash=Math.max(0,(e.gunFlash||0)-dt);this.bossPressure(e,dt);}
   else if(e.type==='kamikaze'){const angle=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(angle)*85*factor*dt;e.y+=Math.sin(angle)*85*factor*dt;}
   else{e.y+=e.speed*factor*dt;e.x+=Math.sin(e.age*1.5+e.id)*25*dt;}
   if(e.shoot<=0&&e.y>0&&e.y<H-50){this.enemyShoot(e);e.shoot=(e.type==='boss'?(e.attackCooldown||1.9):e.elite?1:2.5)/endlessThreat(r.chapter).haste*(e.status.blind?(e.type==='boss'?1.08:1.2):1);}
   if(Math.hypot(e.x-p.x,e.y-p.y)<e.radius+10){this.hurtPlayer((e.elite?18:12)*endlessThreat(r.chapter).damage,'与敌舰碰撞',e.id);if(e.type==='kamikaze'){e.dead=true;this.burst(e.x,e.y,'#fbb492');}}
   if(e.y>H+80)e.dead=true;
   if(!e.dead&&this.ready(e,'dot',.5)){let dot=(e.status.fire?.stacks||0)*1.5*(1+.25*has(r,'R05'))*(e.status.nightflame?1.25:1)+(e.status.poison?.stacks||0)*(e.status.cryotoxin?1.35:1);if(activeSynergies(r).some(s=>s.id==='B07')&&this.attackTime>=4)dot*=1.2;if(dot)this.damage(e,dot*(1+.15*(r.upgrades.element||0)),'DOT',0,1,false);}
  }
  for(const b of this.bullets){
   b.trailClock=(b.trailClock||0)+dt;if(b.trailClock>=.025){b.trailClock=0;b.trail??=[];b.trail.push([b.x,b.y]);if(b.trail.length>10)b.trail.shift();}
   b.life-=dt;if(b.swarm||b.ricochetHoming||(has(r,'R03')&&b.generation===0)){const target=this.enemies.find(e=>e.id===b.targetId&&!e.dead&&!b.hit.has(e.id))||this.enemies.filter(e=>!e.dead&&!b.hit.has(e.id)&&e.y<b.y+50).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];if(target){let current=Math.atan2(b.vx,-b.vy),desired=Math.atan2(target.x-b.x,b.y-target.y),delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current)),turn=b.ricochetHoming?10:b.swarm?3:1.22;current+=clamp(delta,-turn*dt,turn*dt);const v=Math.hypot(b.vx,b.vy);b.vx=Math.sin(current)*v;b.vy=-Math.cos(current)*v;}}
   const oldX=b.x,oldY=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.markGroup&&b.generation===0&&b.life>0){b.markClock=(b.markClock||0)+dt;if(b.markClock>=.05){b.markClock%=.05;const from=b.markStart||[oldX,oldY];if(this.railMarks.length>=180)this.railMarks.shift();this.railMarks.push({segment:[...from,b.x,b.y],group:b.markGroup,radius:22*(.4+.6*(b.chargeRatio??1)),life:1.5,maxLife:1.5,quality:b.chargeRatio??1});b.markStart=[b.x,b.y];}}
   for(const e of this.enemies)if(!e.dead&&b.life>0&&!b.hit.has(e.id)&&pointSegmentDistance(e.x,e.y,[oldX,oldY,b.x,b.y])<e.radius+b.radius){b.hit.add(e.id);if(this.projectileHit(b,e))break;}
  }
  for(const mark of this.railMarks)mark.life-=dt;this.railMarks=this.railMarks.filter(mark=>mark.life>0);
  for(const [id,group]of this.railMarkGroups){if(group.expires<this.time){this.railMarkGroups.delete(id);continue;}while(group.next<=this.time){group.next+=.25;const marks=this.railMarks.filter(m=>m.group===id);for(const e of this.enemies){const hits=group.hits.get(e.id)||0;if(!e.dead&&hits<6&&marks.some(m=>pointSegmentDistance(e.x,e.y,m.segment)<m.radius+e.radius)){group.hits.set(e.id,hits+1);this.damage(e,group.damage,'RAIL_MARK',group.root,1);}}}}
  this.updateBossHazards(dt);
  this.updateDefensiveWaves(dt);
  for(const b of this.enemyBullets){if(b.life<=0)continue;let slow=1;if(this.effects.some(e=>e.type==='time'))slow=b.boss?.85:.6;if(this.effects.some(e=>e.type==='crystal'&&Math.hypot(b.x-e.x,b.y-e.y)<e.radius))slow*=b.boss?.88:.7;b.x+=b.vx*dt*slow;b.y+=b.vy*dt*slow;b.life-=dt;if(Math.hypot(b.x-p.x,b.y-p.y)<b.radius+6){this.hurtPlayer(b.damage,b.boss?'首领弹幕':'敌方弹幕',b.attackerId);b.life=0;}}
  this.bullets=this.bullets.filter(b=>b.life>0&&b.x>-30&&b.x<W+30&&b.y>-30);this.enemyBullets=this.enemyBullets.filter(b=>b.life>0&&b.x>-40&&b.x<W+40&&b.y<H+40);this.enemies=this.enemies.filter(e=>!e.dead);
  for(const item of this.pickups){item.life-=dt;const d=Math.hypot(item.x-p.x,item.y-p.y),radius=140*(1+.25*has(r,'C05'));if(d<radius||item.life<3){item.x+=(p.x-item.x)*dt*6;item.y+=(p.y-item.y)*dt*6;}else item.y+=30*dt;if(d<22||item.life<=0){gainXP(r,item.xp);r.coins+=item.coins;item.life=-1;}}
  this.pickups=this.pickups.filter(i=>i.life>0);
  for(const item of this.particles){item.x+=item.vx*dt;item.y+=item.vy*dt;item.life-=dt;}this.particles=this.particles.filter(i=>i.life>0);
  for(const item of this.floaters){item.y-=25*dt;item.life-=dt;}this.floaters=this.floaters.filter(i=>i.life>0);
  for(const v of this.visualEffects)v.life-=dt;this.visualEffects=this.visualEffects.filter(v=>v.life>0);
  for(const ghost of this.afterimages)ghost.life-=dt;this.afterimages=this.afterimages.filter(ghost=>ghost.life>0);
  for(const effect of this.effects){effect.life-=dt;
   if(effect.fieldDamage){effect.elapsed+=dt;const ticks=Math.min(6,Math.floor((effect.elapsed+1e-8)/.25));while(effect.ticks<ticks){effect.ticks++;for(const e of this.enemies)if(!e.dead&&Math.hypot(e.x-effect.x,e.y-effect.y)<effect.radius+e.radius){effect.fieldHits??=new Map();const hits=effect.fieldHits.get(e.id)||0;if(hits<6){effect.fieldHits.set(e.id,hits+1);this.damage(e,effect.fieldDamage,'EVOLUTION_FIELD',effect.root,1);}}}}
   if(['steam','miasma'].includes(effect.type)&&(effect.next||0)<=this.time){effect.next=this.time+.5;for(const e of this.enemies)if(Math.hypot(e.x-effect.x,e.y-effect.y)<effect.radius){this.damage(e,effect.damage??r.frame.attack*.45,'ELEMENT_REACTION',effect.root||0,1,false);if(effect.type==='steam'&&r.evolutions.includes('U06')&&e.type!=='boss'&&this.ready(e,'steamfreeze',2))e.status.freeze={until:this.time+.6};}}
   if(effect.blackHole&&effect.life<=0){for(const e of [...this.enemies])if(Math.hypot(e.x-effect.x,e.y-effect.y)<effect.radius+e.radius)this.damage(e,r.frame.attack*(r.evolutions.includes('U07')?3.5:3)*(effect.power??1),'SINGULARITY',effect.root,1);this.burst(effect.x,effect.y,'#b7a4fa',25);if(r.evolutions.includes('U07'))this.addEffect({type:'well',x:effect.x,y:effect.y,radius:effect.radius,life:1,maxLife:1,color:'#8e90c7'});if(activeSynergies(r).some(s=>s.id==='B12'))for(const vx of[-160,160])this.bullets.push({x:effect.x,y:effect.y,vx,vy:-180,radius:4,damage:r.frame.attack*.3,life:2,source:'SPLIT',generation:1,root:effect.root,hit:new Set()});}
  }this.effects=this.effects.filter(e=>e.life>0);
  if(has(r,'R11')&&this.time>=this.nextDrone){this.droneAttacks++;this.nextDrone=this.time+(r.evolutions.includes('U05')?1.1:.8/(activeSynergies(r).some(s=>s.id==='B14')&&r.shield>0?1.12:1));const count=r.evolutions.includes('U05')?1:has(r,'R11');for(let i=0;i<count;i++){const x=p.x+(i-(count-1)/2)*45,y=p.y+20;for(const angle of(r.evolutions.includes('U05')?[-.1,0,.1]:[0]))this.bullets.push({x,y,vx:Math.sin(angle)*450,vy:-450,radius:4,damage:r.frame.attack*(r.evolutions.includes('U05')?.2*has(r,'R11'):.35)*(has(r,'L06')&&r.shield>0?1.2:1),life:3,source:'SUMMON',generation:1,root:this.nextAttack++,hit:new Set(),thunder:r.evolutions.includes('U05')});}if(activeSynergies(r).some(s=>s.id==='B09')&&this.droneAttacks%5===0){const e=this.enemies[0];if(e){this.damage(e,r.frame.attack*.35,'SUMMON',this.nextAttack++,1);this.chain(e,r.frame.attack*.245,2,this.nextAttack++,'SUMMON',.7);}}}
  if(has(r,'E11')&&this.time>=this.nextOrb){this.nextOrb=this.time+4;const e=this.enemies[0];if(e){this.damage(e,r.frame.attack*.8,'SUMMON',this.nextAttack++,1);this.chain(e,r.frame.attack*.64,4,this.nextAttack++);}}
  if(has(r,'E06')&&this.time>=this.nextWell){this.nextWell=this.time+12;const e=this.enemies[0];this.addEffect({type:'well',x:e?.x||W/2,y:e?.y||H/3,radius:130,life:3,maxLife:3});}
  if(has(r,'E10')&&this.time>=this.nextTime){this.nextTime=this.time+18;this.addEffect({type:'time',life:3,maxLife:3});}
  if(!activeChallenge(r,'no-shield')&&has(r,'L06')&&this.time>=this.nextShield){this.nextShield=this.time+10;r.shield=Math.min(r.maxShield,r.shield+r.maxHp*.15);}
  // Delayed friendly attacks (for example Eternal Echo) keep arriving during auto-fire.
  // Only unfinished waves and scheduled enemy spawns block an otherwise cleared node.
  if((this.bossKilled&&this.pickups.length===0)||(this.node.type!=='boss'&&this.time>=this.duration&&this.wave>=this.waves&&this.enemies.length===0&&!this.scheduled.some(task=>task.kind==='spawn')&&this.pickups.length===0))this.done=true;
  if(this.node.type==='rift'&&this.time>=45){this.riftSuccess=this.combo>=18;for(const item of this.pickups){gainXP(r,item.xp);r.coins+=item.coins;}this.pickups=[];this.done=true;}
  if(r.logs.length>300)r.logs.splice(0,r.logs.length-300);if(r.events.length>80)r.events.splice(0,r.events.length-80);
 }
}
