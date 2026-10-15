// Original relic catalog extracted from the supplied design bible v1.4.
export const RELIC_CATALOG = [
  {
    "id": "C01",
    "name": "钛合金弹头",
    "rarity": "C",
    "category": "火力",
    "description": "基础武器伤害 +12%/层；同类加算",
    "restriction": "通用；上限3"
  },
  {
    "id": "C02",
    "name": "高速装填器",
    "rarity": "C",
    "category": "火力",
    "description": "攻击间隔 -8%/层；总攻击间隔最低0.12秒",
    "restriction": "非蓄力武器；蓄力武器改为蓄力时间-6%；上限3"
  },
  {
    "id": "C03",
    "name": "冷凝护甲",
    "rarity": "C",
    "category": "生存",
    "description": "最大生命 +20/层；拾取时同步回复20",
    "restriction": "通用；上限3"
  },
  {
    "id": "C04",
    "name": "机动推进器",
    "rarity": "C",
    "category": "机动",
    "description": "移速 +9%/层；最高+45%",
    "restriction": "通用；上限3"
  },
  {
    "id": "C05",
    "name": "磁力回收器",
    "rarity": "C",
    "category": "经济",
    "description": "经验吸取半径 +25%/层",
    "restriction": "通用；上限3"
  },
  {
    "id": "C06",
    "name": "精准陀螺",
    "rarity": "C",
    "category": "火力",
    "description": "暴击率 +5百分点/层；总暴击率上限75%",
    "restriction": "通用；上限3"
  },
  {
    "id": "C07",
    "name": "轻量弹仓",
    "rarity": "C",
    "category": "弹道",
    "description": "弹速 +18%/层；射线改为射线长度+8%",
    "restriction": "通用；上限3"
  },
  {
    "id": "C08",
    "name": "应急电容",
    "rarity": "C",
    "category": "生存",
    "description": "每波首次生命低于30%时回复最大生命8%/层",
    "restriction": "每波最多1次；上限3"
  },
  {
    "id": "C09",
    "name": "穿甲钻头",
    "rarity": "C",
    "category": "火力",
    "description": "对护甲目标伤害 +10%/层；护甲减免最低为0",
    "restriction": "通用；上限3"
  },
  {
    "id": "C10",
    "name": "余热散热片",
    "rarity": "C",
    "category": "射线",
    "description": "激光蓄力时间 -7%/层；最低0.45秒",
    "restriction": "仅蓄力武器；上限3"
  },
  {
    "id": "C11",
    "name": "战利品扫描器",
    "rarity": "C",
    "category": "经济",
    "description": "商店刷新价格 -10%/层，最低为原价70%",
    "restriction": "通用；上限3"
  },
  {
    "id": "C12",
    "name": "弹片回收盒",
    "rarity": "C",
    "category": "弹道",
    "description": "普通弹丸击杀后以40%概率生成1枚40%伤害弹片/层；每击杀最多3枚",
    "restriction": "非射线武器；上限3"
  },
  {
    "id": "R01",
    "name": "棱镜透镜",
    "rarity": "R",
    "category": "射线",
    "description": "射线首次击中目标后折射至附近1名敌人，折射伤害为原始射线每跳60%；每层+1跳",
    "restriction": "仅射线；每目标每0.2秒最多受1次折射；上限3"
  },
  {
    "id": "R02",
    "name": "猩红蓄电池",
    "rarity": "R",
    "category": "射线",
    "description": "硫磺火蓄满后可额外储存1次发射；储存期间移速-8%",
    "restriction": "仅硫磺火；不随层数增加储能数；上限1"
  },
  {
    "id": "R03",
    "name": "追踪晶片",
    "rarity": "R",
    "category": "弹道",
    "description": "弹丸转向速率+70°/秒；射线每0.15秒微调角度最多8°",
    "restriction": "通用；上限2"
  },
  {
    "id": "R04",
    "name": "裂变核心",
    "rarity": "R",
    "category": "弹道",
    "description": "命中精英/Boss后每1.5秒生成2枚侧向子弹，单枚继承25%面板伤害",
    "restriction": "召唤弹不触发裂变；上限2"
  },
  {
    "id": "R05",
    "name": "燃烧催化剂",
    "rarity": "R",
    "category": "元素",
    "description": "火焰持续伤害+25%；燃烧层数上限+2",
    "restriction": "需已解锁火元素；上限2"
  },
  {
    "id": "R06",
    "name": "霜晶反应器",
    "rarity": "R",
    "category": "元素",
    "description": "冰冻积累效率+25%；冰冻结束后目标减速25%持续2秒",
    "restriction": "需已解锁冰元素；上限2"
  },
  {
    "id": "R07",
    "name": "导电线圈",
    "rarity": "R",
    "category": "元素",
    "description": "雷电连锁目标数+1；每跳伤害衰减由20%改为15%",
    "restriction": "需已解锁雷元素；上限2"
  },
  {
    "id": "R08",
    "name": "光谱聚焦器",
    "rarity": "R",
    "category": "元素",
    "description": "光元素对精英/Boss伤害+12%；不增加额外触发次数",
    "restriction": "需已解锁光元素；上限2"
  },
  {
    "id": "R09",
    "name": "击杀回路",
    "rarity": "R",
    "category": "触发",
    "description": "每击杀15名敌人，下一次主武器攻击伤害+70%",
    "restriction": "触发伤害不累计击杀回路；上限2"
  },
  {
    "id": "R10",
    "name": "紧急跃迁",
    "rarity": "R",
    "category": "生存",
    "description": "受到致命伤害时保留1生命并无敌1.5秒；每10波可触发1次",
    "restriction": "通用；上限1"
  },
  {
    "id": "R11",
    "name": "无人机吊舱",
    "rarity": "R",
    "category": "召唤",
    "description": "获得1架僚机，每0.8秒发射造成主武器面板35%伤害的弹丸",
    "restriction": "最多3架；僚机不继承武器形态；上限3"
  },
  {
    "id": "R12",
    "name": "赌徒硬币",
    "rarity": "R",
    "category": "经济",
    "description": "商店有25%概率出现一件免费普通遗物；商店物品均价+8%",
    "restriction": "通用；上限1"
  },
  {
    "id": "E01",
    "name": "硫磺心脏",
    "rarity": "E",
    "category": "射线",
    "description": "硫磺火射线宽度+35%，持续时间+0.35秒，蓄力时间+15%",
    "restriction": "仅硫磺火；上限2"
  },
  {
    "id": "E02",
    "name": "双生棱镜",
    "rarity": "E",
    "category": "射线",
    "description": "射线主形态：发射两道平行光束，每束65%原伤害；不能与环形/散射形态共存",
    "restriction": "仅射线；主形态；上限1"
  },
  {
    "id": "E03",
    "name": "镜面迷宫",
    "rarity": "E",
    "category": "射线",
    "description": "射线主形态：命中屏幕边界最多反射2次，每次反射伤害×0.75",
    "restriction": "仅射线；主形态；上限1"
  },
  {
    "id": "E04",
    "name": "血色环轨",
    "rarity": "E",
    "category": "射线",
    "description": "射线主形态：蓄满后形成旋转环形射线持续2.4秒，每0.1秒命中判定",
    "restriction": "仅硫磺火；主形态；上限1"
  },
  {
    "id": "E05",
    "name": "量子散射器",
    "rarity": "E",
    "category": "射线",
    "description": "射线主形态：发射5束扇形短射线，每束35%原伤害；最大射程-35%",
    "restriction": "仅射线；主形态；上限1"
  },
  {
    "id": "E06",
    "name": "黑洞引力井",
    "rarity": "E",
    "category": "控制",
    "description": "每12秒产生吸附场持续3秒，范围内敌人减速35%；Boss仅减速10%",
    "restriction": "控制不叠加；上限1"
  },
  {
    "id": "E07",
    "name": "过载反应堆",
    "rarity": "E",
    "category": "火力",
    "description": "连续攻击4秒后伤害+35%；停止攻击1.5秒后清空",
    "restriction": "持续射线按时间计数；上限2"
  },
  {
    "id": "E08",
    "name": "元素共鸣环",
    "rarity": "E",
    "category": "元素",
    "description": "同时持有至少2元素时元素反应伤害+25%；3元素时额外+10%",
    "restriction": "反应伤害不再次触发反应；上限1"
  },
  {
    "id": "E09",
    "name": "死线协议",
    "rarity": "E",
    "category": "生存",
    "description": "生命低于35%时主武器伤害+45%，受到伤害+20%",
    "restriction": "不可由护盾生命触发；上限1"
  },
  {
    "id": "E10",
    "name": "时间减速舱",
    "rarity": "E",
    "category": "控制",
    "description": "每18秒减缓普通敌弹速度40%持续3秒；Boss弹速减缓15%",
    "restriction": "不影响波次计时；上限1"
  },
  {
    "id": "E11",
    "name": "雷暴孵化器",
    "rarity": "E",
    "category": "召唤",
    "description": "每4秒释放1颗雷球，最多弹跳5次，初始伤害为面板80%，每跳×0.8",
    "restriction": "雷球不触发召唤类遗物；上限2"
  },
  {
    "id": "E12",
    "name": "熔火冰核",
    "rarity": "E",
    "category": "元素",
    "description": "火+冰反应生成蒸汽区3秒，每秒造成面板45%伤害；同目标冷却2秒",
    "restriction": "必须已解锁火与冰；上限1"
  },
  {
    "id": "L01",
    "name": "赤色终焉",
    "rarity": "L",
    "category": "射线",
    "description": "硫磺火终极修饰：蓄满后发射贯穿光束1.8秒，每0.1秒造成面板95%伤害；蓄力2.4秒；禁用普通弹丸",
    "restriction": "仅硫磺火；覆盖基础射线参数；上限1"
  },
  {
    "id": "L02",
    "name": "万象折射",
    "rarity": "L",
    "category": "射线",
    "description": "每次射线命中精英/Boss时，每0.8秒发出3条分支射线，各为主射线40%伤害，持续0.5秒",
    "restriction": "分支不可再次分支；上限1"
  },
  {
    "id": "L03",
    "name": "奇点弹幕",
    "rarity": "L",
    "category": "弹道",
    "description": "普通弹丸每第8次攻击生成黑洞弹，吸附1.2秒后爆炸造成面板300%范围伤害",
    "restriction": "不适用纯射线武器；上限1"
  },
  {
    "id": "L04",
    "name": "永恒回响",
    "rarity": "L",
    "category": "触发",
    "description": "每次主动武器完整释放结束后留下残影，1秒后重复一次35%伤害攻击",
    "restriction": "残影不能触发残影/额外弹道；上限1"
  },
  {
    "id": "L05",
    "name": "三相熔炉",
    "rarity": "L",
    "category": "元素",
    "description": "持有3种元素时，主武器按火→冰→雷等已持有顺序轮换附魔；元素反应伤害+30%",
    "restriction": "必须3元素；不生成第四元素；上限1"
  },
  {
    "id": "L06",
    "name": "不灭护航",
    "rarity": "L",
    "category": "生存",
    "description": "每10秒生成最大生命15%的护盾，最多存储30%；护盾存在时僚机伤害+20%",
    "restriction": "不叠加同名；上限1"
  },
  {
    "id": "X01",
    "name": "恶魔契约",
    "rarity": "X",
    "category": "代价",
    "description": "永久最大生命-35%，主武器最终伤害×1.55",
    "restriction": "最大生命最低保留30；上限1"
  },
  {
    "id": "X02",
    "name": "无尽增殖",
    "rarity": "X",
    "category": "代价",
    "description": "每10波主武器伤害+8%（加算，上限+80%）；每10波敌弹速度+5%（加算，上限+50%）",
    "restriction": "不影响Boss机制时间；上限1"
  },
  {
    "id": "X03",
    "name": "破碎王冠",
    "rarity": "X",
    "category": "代价",
    "description": "暴击伤害倍率+100百分点；受到的所有伤害×1.35",
    "restriction": "暴击总倍率封顶4.0；上限1"
  },
  {
    "id": "X04",
    "name": "血祭引擎",
    "rarity": "X",
    "category": "代价",
    "description": "每次发射完整硫磺火消耗当前生命3%（不会致死），该次射线最终伤害×1.65",
    "restriction": "仅硫磺火；不受回复触发器增益；上限1"
  },
  {
    "id": "X05",
    "name": "禁域增幅器",
    "rarity": "X",
    "category": "代价",
    "description": "元素反应伤害×1.7；反应每目标内置冷却+50%",
    "restriction": "至少2元素；上限1"
  },
  {
    "id": "X06",
    "name": "失控指令",
    "rarity": "X",
    "category": "代价",
    "description": "所有主动武器攻速+35%；每波开始时玩家受到最大生命4%不可致死伤害",
    "restriction": "蓄力武器改为蓄力时间-25%；上限1"
  }
];
