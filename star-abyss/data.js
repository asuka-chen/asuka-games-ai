import { RELIC_CATALOG } from './relic-catalog.js';
export const RARITIES = { C: { name:'普通', color:'#92b0c9', price:100, max:3 }, R:{name:'稀有',color:'#52cced',price:190,max:3}, E:{name:'史诗',color:'#b59aff',price:340,max:2}, L:{name:'传说',color:'#efc883',price:620,max:1}, X:{name:'禁忌',color:'#f77e96',price:0,max:1} };
const beamOnly = ['C10','R01','R02','E01','E02','E03','E04','E05','L01','L02','X04'];
const bulletOnly = ['C12','L03'];
const elements = {R05:['fire'],R06:['ice'],R07:['lightning'],R08:['light'],R14:['dark'],E14:['dark'],E15:['dark'],E11:['lightning'],E12:['fire','ice']};
const maxOverrides = {R02:1,R03:2,R04:2,R05:2,R06:2,R07:2,R08:2,R09:2,R10:1,R12:1,R13:3,R14:2,E14:1,E15:1,E16:1,E17:3,E02:1,E03:1,E04:1,E05:1,E06:1,E08:1,E09:1,E10:1,E12:1,E13:1};
const mobilityRelics=[
 {id:'R13',name:'相位延展器',rarity:'R',category:'生存',description:'每层闪避持续时间 +0.1 秒，最多三层；最终持续时间不超过 1.2 秒。',restriction:'所有机体；不会增加闪避次数。'},
 {id:'E13',name:'锚定装甲',rarity:'E',category:'生存',description:'最大闪避次数 -1（可降至 0），受到的弹幕、碰撞与首领技能伤害降低 35%。',restriction:'所有机体，最多一层。单段闪避机体装备后无法闪避；不降低血祭或契约的生命代价。'},
 {id:'R14',name:'蚀刻符印',rarity:'R',category:'元素',description:'每层使暗元素每层易伤额外 +1 个百分点，最多两层；放大目标受到的主武器、持续伤害、召唤与元素反应伤害。',restriction:'需要觉醒暗元素。'},
 {id:'E14',name:'深渊烙印',rarity:'E',category:'元素',description:'暗元素持续时间延长 2 秒，最长 7 秒；命中至少 5 层暗的目标时释放一次面板 ×0.7 的蚀影脉冲，冷却 1.5 秒。',restriction:'需要暗元素，最多一层；脉冲继承蓄力，不再触发遗物。'},
 {id:'E15',name:'噬影结晶',rarity:'E',category:'元素',description:'暗元素叠层上限从 5 提高至 7，使易伤与持续时间继续成长。目标受到伤害的总易伤上限为 50%。',restriction:'需要暗元素，最多一层。'},
 {id:'E16',name:'断层屏障',rarity:'E',category:'生存',conflicts:['E17'],description:'护盾被敌方攻击击破时，抵挡这一次攻击溢出到生命的全部伤害。',restriction:'与「震荡净场器」互斥，最多一层；必须有剩余护盾，无盾时不提供保护；不抵扣生命代价。'},
 {id:'E17',name:'震荡净场器',rarity:'E',category:'生存',conflicts:['E16'],description:'实际受到生命或护盾伤害时，从受击位置释放扩散冲击波，消除范围内的敌方弹丸。半径 140 / 195 / 250，最多三层；冲击波不造成伤害。',restriction:'与「断层屏障」互斥；重复获得或锻造可升级范围。闪避和受击无敌期间不触发，支付代价不触发。'},
 {id:'R15',name:'逆棘装甲',rarity:'R',category:'生存',description:'受击时将本次实际损失的生命与护盾的 150% / 300% / 450% 作为基础伤害反击来源；来源已离场时反击最近敌舰。',restriction:'最多三层；单次基础反伤不超过机体攻击面板的 6 倍。受目标护甲与易伤影响，不暴击、不附着元素、不触发其他遗物；支付代价不触发。'}
];
export const RELICS = [...RELIC_CATALOG,...mobilityRelics].map(r=>({...r,name:({C12:'弹片增殖盒',E01:'星蚀心脏',E03:'万象棱镜'}[r.id]||r.name),description:r.id==='C12'?'每次主武器发射分裂每层一枚 40% 中央主弹伤害的弹片，最多三枚，继承蓄力；无需击杀，分裂与回响不会再分裂':r.description.replaceAll('硫磺火','星蚀射线'),restriction:({X01:'最大生命至少保留 1；上限 1',X06:'主武器射速与蓄力速度均为 ×1.2；上限 1'}[r.id]||r.restriction).replaceAll('硫磺火','星蚀射线'), max:maxOverrides[r.id]||RARITIES[r.rarity].max, weapon:beamOnly.includes(r.id)?'beam':bulletOnly.includes(r.id)?'bullet':null, elements:elements[r.id]||[], shape:['E02','E03','E04','E05'].includes(r.id), minElements:r.id==='L05'?3:r.id==='X05'||r.id==='E08'?2:0, tag:r.category==='射线'?'beam':r.category==='召唤'?'drone':r.category==='生存'?'survival':r.category==='元素'?'element':r.category==='经济'?'economy':'attack'}));
export const RELIC_BY_ID = Object.fromEntries(RELICS.map(r=>[r.id,r]));
export const ELEMENTS = [
  {id:'fire',name:'火',label:'赤焰',color:'#ff946a',desc:'每层提高灼烧伤害与持续时间；基础上限 5 层，余烬最多升至 9 层，最长 8 秒'},
  {id:'ice',name:'冰',label:'霜晶',color:'#88d8ff',desc:'每层主武器命中增伤 +1%、加强减速与持续时间，满 6 层冻结普通敌舰；持续最长 5 秒，冻结最长 2.5 秒'},
  {id:'lightning',name:'雷',label:'雷霆',color:'#b5a0ff',desc:'3 层起触发雷链，叠层越高雷链越强；最多 6 层，持续最长 5 秒'},
  {id:'poison',name:'毒',label:'腐蚀',color:'#9be29d',desc:'每层提高持续毒伤与持续时间；最多 8 层，持续最长 9 秒'},
  {id:'light',name:'光',label:'辉光',color:'#ffdb99',desc:'每层增加 2% 主武器命中伤害；最多 5 层，持续最长 5 秒，与暗形成湮灭'},
  {id:'dark',name:'暗',label:'虚蚀',color:'#e092ef',desc:'每层使目标受到所有来源伤害 +2%；基础 5 层，暗遗物可提高易伤、层数与时长；总易伤上限 50%，与光形成湮灭'}
];
export const ELEMENT_LIMITS={fire:{cap:5,base:4,step:.5,max:8},ice:{cap:6,base:3,step:.3,max:5},lightning:{cap:6,base:3,step:.4,max:5},poison:{cap:8,base:6,step:.4,max:9},light:{cap:5,base:3,step:.4,max:5},dark:{cap:5,base:3,step:.4,max:5}};
// Every unordered elemental pair has an automatic reaction; relics enhance, never gate it.
export const ELEMENT_REACTIONS=[
 {id:'Q01',name:'热震',elements:['fire','ice'],cd:1.5,scale:1.8,flat:30,effect:'steam',shape:'shock',color:'#ffb07c',desc:'产生蒸汽区域，持续伤害并减速；蒸汽核心扩大并延长区域，永冻蒸汽可短暂冻结普通敌舰。'},
 {id:'Q02',name:'等离子',elements:['fire','lightning'],cd:1.2,scale:1.5,flat:20,effect:'arc',shape:'arc',color:'#d5adff',desc:'电离爆发后向两个附近目标传导，后续伤害逐次衰减。'},
 {id:'Q03',name:'腐蚀燃爆',elements:['fire','poison'],cd:2,scale:2.2,flat:35,effect:'blast',min:{poison:3},consume:{poison:3},shape:'bloom',color:'#b0f28a',desc:'至少三层毒时消耗三层，在半径 90 内引发腐蚀爆炸。'},
 {id:'Q04',name:'焚星',elements:['fire','light'],cd:2,scale:1.4,flat:18,effect:'flare',shape:'flare',color:'#ffcc75',desc:'辉光点燃星火，形成半径 100 的灼光冲击，附近目标受到 50% 反应伤害。'},
 {id:'Q05',name:'冥火',elements:['fire','dark'],cd:2.5,scale:.8,flat:12,effect:'nightflame',shape:'spiral',color:'#ee83c6',desc:'暗焰使目标额外易伤 8%，并提高灼烧伤害 25%，持续四秒。'},
 {id:'Q06',name:'超导',elements:['ice','lightning'],cd:2,scale:1.2,flat:15,effect:'superconduct',shape:'arc',color:'#9eeaff',desc:'寒电爆发，目标护甲降低 20%，持续时间随叠层增加，最长五秒。'},
 {id:'Q07',name:'冰毒',elements:['ice','poison'],cd:2.5,scale:.6,flat:10,effect:'cryotoxin',shape:'crystal',color:'#a1efc6',desc:'毒伤增加 35%，额外减速普通敌舰 20%（首领 5%），持续四秒。'},
 {id:'Q08',name:'晶辉',elements:['ice','light'],cd:3,scale:.8,flat:12,effect:'crystal',shape:'crystal',color:'#d4f6ff',desc:'留下半径 95、持续 2.5 秒的晶辉领域，使范围内普通敌弹减速 30%，首领弹减速 12%。'},
 {id:'Q09',name:'霜蚀',elements:['ice','dark'],cd:3,scale:.6,flat:8,effect:'frailty',shape:'crystal',color:'#c2a0ff',desc:'使目标额外易伤 10%，持续四秒；首领仍可受到易伤，但不能冻结。'},
 {id:'Q10',name:'毒电',elements:['lightning','poison'],cd:2,scale:1,flat:15,effect:'toxic-chain',shape:'arc',color:'#b8dd7f',desc:'向附近两个目标传导腐蚀电流，伤害逐次衰减；衍生电流不会再次附着元素。'},
 {id:'Q11',name:'雷耀',elements:['lightning','light'],cd:2.5,scale:1.2,flat:18,effect:'blind',shape:'flare',color:'#eee0ff',desc:'闪电耀斑让目标的射击间隔增加 20%（首领 8%），持续四秒。'},
 {id:'Q12',name:'暗雷',elements:['lightning','dark'],cd:2.5,scale:1,flat:18,effect:'delayed',shape:'spiral',color:'#b689ee',desc:'雷蚀命中后，0.8 秒后对同一存活目标追加一次 55% 反应伤害。'},
 {id:'Q13',name:'净蚀',elements:['poison','light'],cd:2.5,scale:1.6,flat:24,effect:'purge',min:{poison:2},consume:{poison:2},shape:'bloom',color:'#e0ed9c',desc:'至少两层毒时消耗两层，净化毒层引发半径 110 的范围腐蚀爆发。'},
 {id:'Q14',name:'瘴渊',elements:['poison','dark'],cd:3,scale:.6,flat:10,effect:'miasma',shape:'spiral',color:'#ba9ad4',desc:'留下半径 95 的暗毒领域，持续三秒，造成持续伤害并减速普通敌舰。'},
 {id:'Q15',name:'湮灭',elements:['light','dark'],cd:3,scale:3,flat:45,effect:'annihilation',min:{light:3,dark:3},consume:{light:3,dark:3},shape:'eclipse',color:'#fce6b6',desc:'光暗各至少三层时各消耗三层，引发湮灭冲击，附近目标承受 50% 反应伤害。'}
];
export const UNKNOWN_EVENTS=[
 {id:'laboratory',name:'禁忌实验室',icon:'E08',color:'#f77e96',desc:'三件高品质遗物，各自绑定一种随机代价'},
 {id:'challenge',name:'接受挑战协议',icon:'challenge-no-dash',color:'#c4a5ff',desc:'接受三场战斗的限制，完成后选择遗物'},
 {id:'treasure',name:'金币屋',icon:'upgrade-coins',color:'#efc883',desc:'回收无人货舱，免费领取星币'}
];
export const CHALLENGES=[
 {id:'no-dash',name:'闭锁跃迁',desc:'接下来三场战斗禁用闪避。机体移动与受击保护保留。',color:'#b6a5ff'},
 {id:'no-shield',name:'裸装试炼',desc:'接下来三场战斗暂停所有护盾与护盾恢复；每场结束恢复战前护盾。',color:'#ffb185'},
 {id:'weak-weapon',name:'火力封锁',desc:'接下来三场战斗主武器伤害降低 25%，持续伤害和召唤保持原效果。',color:'#ef94bd'}
];
export const FRAMES = [
  {id:'falcon',name:'苍穹隼',code:'FALCON / MK.Ⅰ',role:'均衡突击机',hp:50,shield:30,speed:260,attack:10,dashCharges:1,dashDuration:.65,dashCooldown:8,sprite:'playerShip1_blue.png',accent:'#71d6ef',desc:'均衡型：50 生命，一段 0.65 秒闪避；每段恢复需 8 秒。',stats:[70,70,75]},
  {id:'spectre',name:'幽灵翼',code:'SPECTRE / MK.Ⅱ',role:'灵巧截击机',hp:35,shield:20,speed:330,attack:11,dashCharges:2,dashDuration:.35,dashCooldown:6,sprite:'playerShip1_green.png',accent:'#9ee8c2',desc:'灵巧型：35 生命，两段各 0.35 秒闪避；每段依次恢复需 6 秒。',stats:[78,40,95]},
  {id:'titan',name:'泰坦卫',code:'TITAN / MK.Ⅲ',role:'稳重护卫机',hp:80,shield:45,speed:220,attack:9,dashCharges:1,dashDuration:.9,dashCooldown:9,sprite:'playerShip3_orange.png',accent:'#f0be83',desc:'稳重型：80 生命，一段 0.9 秒闪避；每段恢复需 9 秒。',stats:[65,95,50]}
];
export const WEAPONS = [
  {id:'beam',name:'星蚀射线',icon:'╎',desc:'长按蓄力，松开释放贯穿光束',detail:'1.2 秒满蓄力 / 可提前释放 / 0.8 秒贯穿'},
  {id:'pulse',name:'脉冲机炮',icon:'≋',desc:'连续射击，稳定的正面火力',detail:'5 发/秒 / 精准弹道 / 稳定单体'},
  {id:'shotgun',name:'散射霰弹',icon:'⋔',desc:'五路散射，近距覆盖与爆发',detail:'5 弹丸 / 1.2 次/秒 / 扇形覆盖'},
  {id:'rail',name:'轨道炮',icon:'↟',desc:'长按蓄力，松开释放贯穿弹',detail:'2.2 秒满蓄力 / 慢速宽弹道 / 蚀刻弹道升级留下持续伤害印记'},
  {id:'swarm',name:'追踪蜂群',icon:'⌁',desc:'追踪导弹，边移动边清扫敌机',detail:'2 导弹 / 0.9 秒间隔 / 自动寻敌'}
];
export const BOSS_ATTACKS={fan:'扇形瞄射',spiral:'螺旋弹幕',corridor:'通道封锁',bombs:'延时轰炸',laser:'轨道光束'};
export const BOSS_PATTERNS=[
 [['fan','bombs','corridor'],['spiral','bombs','laser','corridor'],['bombs','spiral','laser','fan','corridor']],
 [['laser','fan','bombs'],['bombs','corridor','laser','spiral'],['laser','bombs','corridor','spiral','fan']],
 [['bombs','corridor','fan'],['spiral','bombs','fan','laser'],['corridor','laser','bombs','spiral','fan']]
];
export const REGIONS=[{name:'赤红星云',en:'CRIMSON NEBULA',color:'#dc8a85',tag:'beam',boss:'赫利俄斯 · 猩红审判'},{name:'极寒废墟',en:'FROZEN REMNANTS',color:'#83cdea',tag:'survival',boss:'忒弥斯 · 永冻棱镜'},{name:'雷暴禁区',en:'THUNDER EXCLUSION',color:'#b4a4eb',tag:'drone',boss:'克洛诺斯 · 雷霆之眼'},{name:'虚空裂谷',en:'VOID FRACTURE',color:'#e19abe',tag:'attack',boss:'厄瑞玻斯 · 虚空意志'},{name:'机械坟场',en:'MACHINE GRAVEYARD',color:'#a8c0ad',tag:'drone',boss:'阿特拉斯 · 钢铁墓碑'}];
export const NODES={combat:{name:'普通战斗',icon:'⌁',color:'#80bed5',risk:'标准威胁',desc:'穿越敌方巡逻区 · 经验与星币'},elite:{name:'精英战斗',icon:'✦',color:'#ecb37b',risk:'高危 · 强化装甲',desc:'精英舰队 · 保底稀有遗物候选'},boss:{name:'章节首领',icon:'♛',color:'#f28194',risk:'极高威胁 · 三阶段',desc:'突破封锁 · 章节奖励与核心'},shop:{name:'星际商店',icon:'▱',color:'#c7b98d',risk:'安全节点',desc:'购买遗物 · 星币刷新 · 定向重铸'},repair:{name:'维修站',icon:'✚',color:'#92d6b9',risk:'安全节点',desc:'付费维修或强化 · 二选一'},forge:{name:'锻造站',icon:'⬡',color:'#ae9eea',risk:'安全节点',desc:'强化已有遗物 · 推进构筑'},event:{name:'未知事件',icon:'?',color:'#b2bfd1',risk:'风险可选',desc:'随机揭晓实验室、挑战协议或金币屋'},rift:{name:'星渊裂隙',icon:'⟐',color:'#d990de',risk:'高危 · 限时挑战',desc:'45 秒裂隙作战 · 高品质遗物'}};
const synergyRows=[
 ['B01','棱镜追猎',['R01','R03'],'beam',[], '折射追猎未命中目标'],['B02','双星汇聚',['E02','E01'],'beam',[],'双束交汇，扩大覆盖'],['B03','回廊光镜',['E03','R01'],'beam',[],'反射形成额外折射'],['B04','血环电池',['E04','R02'],'beam',[],'储能衔接旋转血环'],['B05','扇面制导',['E05','R03'],'beam',[],'中心散射束追踪敌人'],['B06','红莲冷却',['E01','C10'],'beam',[],'更快蓄力，更长持续'],['B07','余烬过载',['E07','R05'],null,['fire'],'过载期间强化灼烧'],['B08','冰霜囚笼',['E06','R06'],null,['ice'],'引力井加速冻结'],['B09','雷云编队',['R11','E11'],null,['lightning'],'僚机周期释放雷球'],['B10','蒸汽熔炉',['E12','R05'],null,['fire','ice'],'扩大蒸汽区'],['B11','三相共鸣',['E08','L05'],null,[],'三元素轮换强化反应'],['B12','奇点碎弹',['L03','R04'],'bullet',[],'黑洞爆炸产生弹片'],['B13','残影连奏',['L04','R09'],null,[],'回响推进击杀回路'],['B14','不灭机群',['L06','R11'],null,[],'护盾强化僚机射速'],['B15','孤注一掷',['X01','E09'],null,[],'低血高伤，承担额外风险'],['B16','血色终曲',['L01','X04'],'beam',[],'末段射线扩大并强化'],
 ['B17','疾速点射',['C02','R04'],'pulse',[],'每第三次机炮攻击追加一发 35% 伤害子弹'],
 ['B18','追踪弹链',['R03','C07'],'pulse',[],'每第三发机炮弹可弹射一次，伤害衰减 25%'],
 ['B19','扩散弹仓',['C12','C07'],'shotgun',[],'霰弹增加两枚侧翼弹丸，各造成 40% 基础弹丸伤害'],
 ['B20','爆破回路',['C09','R04'],'shotgun',[],'中央霰弹命中产生一次小型爆破，衍生伤害不触发遗物'],
 ['B21','贯穿弹幕',['C07','C09'],'rail',[],'轨道炮追加两条侧翼贯穿弹，各为主弹伤害的 15%'],
 ['B22','引力弹仓',['E06','C02'],'rail',[],'轨道炮首次命中留下短暂引力场'],
 ['B23','多目标锁定',['R03','C05'],'swarm',[],'导弹独立锁定敌舰，优先分散目标'],
 ['B24','蜂群裂殖',['R04','R11'],'swarm',[],'每第三次齐射的母弹命中分裂一枚 25% 伤害追踪弹']
];
export const SYNERGIES=synergyRows.map(([id,name,relics,weapon,elements,desc])=>({id,name,relics,weapon,elements,desc,minElements:id==='B11'?3:0}));
export const EVOLUTIONS=[
 {id:'U01',name:'猩红天罚',synergy:'B06',weapon:'beam',slot:'primary',bosses:1,desc:'射线宽度 ×1.5、单跳伤害 ×1.05、持续 +0.1 秒，蓄力 ×1.15；结束时释放一次终结脉冲。提前释放时所有伤害随蓄力降低',conflicts:['E02','E03','E04','E05']},
 {id:'U02',name:'无尽光廊',synergy:'B03',weapon:'beam',slot:'primary',bosses:1,desc:'手动调角的镜面射线在侧墙衍生两条短分支，每条为单跳伤害的 40%；每次释放至多在两处边界触发，分支不再次分支',conflicts:[]},
 {id:'U03',name:'双星湮灭',synergy:'B02',weapon:'beam',slot:'primary',bosses:1,desc:'每次双束释放结束，在真实交点产生一次半径 88 的湮灭冲击，伤害为机体面板 ×1.8；Boss 冲击至多为其最大生命的 0.8%，并共享本次射线预算',conflicts:[]},
 {id:'U04',name:'绯红日冕',synergy:'B04',weapon:'beam',slot:'primary',bosses:1,desc:'血环每 0.6 秒向外发射八条短射线，命中造成面板 ×0.9 伤害；同一轮不重复命中，衍生射线共享预算且不触发新遗物链',conflicts:[]},
 {id:'U05',name:'雷霆机神',synergy:'B09',extra:'L06',bosses:3,desc:'僚机合体，连锁雷弹',conflicts:[]},
 {id:'U06',name:'永冻蒸汽',synergy:'B10',extra:'R06',bosses:3,desc:'蒸汽持续冻结普通敌人',conflicts:[]},
 {id:'U07',name:'奇点坍缩',synergy:'B12',extra:'E06',bosses:3,desc:'更强黑洞与坍缩减速场',conflicts:[]},
 {id:'U08',name:'末日赌约',synergy:'B15',extra:'X03',bosses:6,desc:'残血暴击，代价式致命保护',conflicts:[]},
 {id:'U09',name:'风暴加特林',synergy:'B17',weapon:'pulse',slot:'primary',bosses:1,icon:'≋',desc:'每次攻击改为三发快速点射，每发 40% 伤害；稳定压制单体与密集舰群',conflicts:[]},
 {id:'U10',name:'棱镜弹链',synergy:'B18',weapon:'pulse',slot:'primary',bosses:1,icon:'⌁',desc:'机炮弹造成 85% 伤害，可在三个不同敌人间弹射，每次弹射伤害 ×0.75',conflicts:[]},
 {id:'U11',name:'霰星风暴',synergy:'B19',weapon:'shotgun',slot:'primary',bosses:1,icon:'⋔',desc:'改为九路广域霰弹，每枚伤害 4.4；扩大正面覆盖，适合清杂',conflicts:[]},
 {id:'U12',name:'破城重炮',synergy:'B20',weapon:'shotgun',slot:'primary',bosses:1,icon:'◉',desc:'改为单发重型爆破弹：直击 22，爆炸范围 110、伤害 22，直击目标只受 35% 爆炸伤害',conflicts:[]},
 {id:'U13',name:'裂空钉枪',synergy:'B21',weapon:'rail',slot:'primary',bosses:1,icon:'↟',desc:'蓄力后发射三枚贯穿弹，每枚伤害 38，覆盖三条攻击航线',conflicts:[]},
 {id:'U14',name:'引力穿甲弹',synergy:'B22',weapon:'rail',slot:'primary',bosses:1,icon:'⟐',desc:'贯穿伤害 80，沿命中路径留下至多三个引力场；每场持续 1.5 秒造成六次 4.5 伤害，同一发攻击的场对同一目标不重复叠加',conflicts:[]},
 {id:'U15',name:'猎杀号角',synergy:'B23',weapon:'swarm',slot:'primary',bosses:1,icon:'⌘',desc:'每次发射五枚独立锁定的导弹，每枚伤害 8.5，优先分散猎杀目标',conflicts:[]},
 {id:'U16',name:'蜂巢母舰',synergy:'B24',weapon:'swarm',slot:'primary',bosses:1,icon:'✦',desc:'发射两枚 11 伤害母弹；各分裂三枚 4 伤害微型追踪弹，子弹不会继续分裂',conflicts:[]}
];
export const WEAPON_NAMES=Object.fromEntries(WEAPONS.map(w=>[w.id,w.name]));
export function weaponLabel(tag){return !tag?'通用武器':tag==='bullet'?'普通弹丸武器':WEAPON_NAMES[tag]||tag;}
export const UPGRADES=[
 {id:'attack',name:'增幅线圈',desc:'主武器伤害 +12%',max:5,rarity:'C'},
 {id:'rate',name:'快速充能',desc:'射击间隔 -6.5%，射线蓄力 -6.5%；与遗物分别计算，总攻速至多两倍',max:4,rarity:'R'},
 {id:'health',name:'强化机身',desc:'生命上限 +20，回复 20',max:5,rarity:'C'},
 {id:'shield',name:'屏障发生器',desc:'护盾上限 +15，回复 15',max:4,rarity:'R'},
 {id:'speed',name:'矢量推进',desc:'移动速度 +8%',max:4,rarity:'C'},
 {id:'crit',name:'精密校准',desc:'暴击率 +4 个百分点，上限 40%',max:5,rarity:'R'},
 {id:'crit-conversion',name:'暴击聚能',desc:'每层将实际暴击率的 50% 转为主武器增伤；三层最多 +60%，计入条件增伤总上限 +200%',max:3,rarity:'E'},
 {id:'duration',name:'延时灼束',desc:'射线持续 +0.1 秒',max:3,rarity:'E',weapon:'beam'},
 {id:'width',name:'宽域核心',desc:'射线宽度 +20%',max:3,rarity:'R',weapon:'beam'},
 {id:'projectile',name:'加速弹道',desc:'弹速 +15%',max:3,rarity:'C',weapon:'bullet'},
 {id:'element',name:'元素精通',desc:'元素伤害 +15%',max:5,rarity:'E',minElements:1},
 {id:'rail-mark',name:'蚀刻弹道',desc:'轨道炮沿路径留下 1.5 秒印记，宽度 44；每 0.25 秒造成每层 1.5 伤害。同次齐射对同敌至多六跳，提前释放伤害随蓄力降低，回响不留印记',max:3,rarity:'E',weapon:'rail'}
];
export const SUPPLY_REWARDS=[
 {id:'supply-coins',name:'星币储备',desc:'获得 120 星币，可用于遗物、配方补全或舰载补给',icon:'upgrade-coins'},
 {id:'supply-repair',name:'战地修复',desc:'回复最大生命的 20% 和最大护盾的 50%，不提高属性上限',icon:'upgrade-repair'},
 {id:'supply-logistics',name:'定向重铸补给',desc:'获得 1 张定向重铸券，用于商店替换候选；最多储存 9 张',icon:'upgrade-logistics'}
];

export const RELIC_EFFECTS={
 E12:'火冰热震无需遗物即可产生蒸汽区。本遗物将基础区域从 75 扩至 90，基础持续从 2 延长至 3 秒；与余烬增幅器共鸣后半径为 110，持续冻结进化可控制普通敌舰。持续反应伤害计入首领每秒预算。',
 C12:'每次发射主武器时，从炮口分裂每层一枚子弹，最多三枚；每枚为本次中央主弹 40% 基础伤害，继承蓄力强度。无需击杀或命中，对首领也生效；分裂弹和回响不再次分裂。',
 R02:'射线释放期间蓄满可额外储存 1 次完整发射，储存期间移速 -8%。手动模式仍须按住并松开射击键释放，不会蓄满自动发射。',
 E01:'星蚀射线每层宽度 +35%、持续 +0.35 秒、蓄力时间 +15%。提前松开也可发射，威力按蓄力比例平方降低。',
 E03:'星蚀射线主形态：手动模式用 ←/→ 调整发射角度，最多反射两次，每次反射伤害 ×0.75。淡色辅助线预览真实路径；自动模式沿用手动设置的角度。WASD 用于移动。',
 E04:'星蚀射线主形态：释放后形成半径 150 的环形射线，持续 2.4 秒，每 0.1 秒命中判定。未蓄满可提前释放，环宽、亮度及伤害随蓄力降低。',
 L01:'星蚀射线终极修饰：满蓄力 2.4 秒，贯穿光束持续 1.8 秒，每 0.1 秒造成机体面板 95% 的基础伤害。手动可提前释放，也可蓄满继续保持到松开。',
 X04:'仅星蚀射线：完整蓄力释放时消耗当前生命 3%（不会致死），该次射线伤害 ×1.65。未蓄满释放不扣生命，也不获得血祭增伤。',
 C02:'每层射击间隔 -6.5%、射线蓄力 -5%。与升级分别计算，弹丸总攻速至多两倍。',
 C10:'每层射线蓄力时间 -5%。与其他加速分别计算，最终蓄力至少 0.6 秒。',
 E07:'持续攻击 4 秒后，每层获得 35% 条件增伤。与其他条件增伤相加，总条件增伤至多 200%。',
 E09:'生命低于 35% 时，条件增伤 +45%，受到伤害 +20%。条件增伤与其他同类效果相加。',
 X01:'最大生命减少 35%，条件增伤 +55%。条件增伤与其他同类效果相加，总条件增伤至多 200%。',
 X02:'每深入一章，条件增伤 +8%，最多 +80%；敌弹速度随章节提升。条件增伤与同类效果相加。',
 X03:'暴击倍率 +0.8，受到伤害 +35%。暴击率最多 40%，暴击倍率最多 2.6。',
 X06:'射击与蓄力速度 ×1.2，进入战斗损失最大生命的 4%。弹丸总攻速至多两倍。'
};
