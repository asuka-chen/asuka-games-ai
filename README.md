# asuka-games-ai
是一个用明日香的语气的辅助AI的游戏平台。

## 星渊：无限火力（PC 可玩原型）

根据《星渊游戏设计》V1.4 制作的科幻纵版弹幕 Roguelike。包含机库、五种武器、三章分支星图、升级与遗物构筑、节点服务、章节 Boss 和无尽模式。免费 CC0 飞船与音效随游戏本地打包。

Windows 玩家：解压发布压缩包，双击 `Star-Abyss-win32-x64/Star-Abyss.exe`。不需要安装开发工具。操作与存档说明见 [PLAY.md](star-abyss/PLAY.md)。

开发运行需要 Node.js 24 或更新版本：

```bash
npm ci
npm run dev
```

开发服务器默认进入 `star-abyss/` 游戏页面。也可以在仓库根目录使用 Python 静态服务器，访问 `star-abyss/index.html`。

```bash
npm run desktop       # Electron 桌面运行
npm test              # 核心规则与稳定性测试
npm run test:browser  # 浏览器交互回归（Linux 默认使用 /usr/bin/chromium）
npm run test:visual   # 六种元素与反应的 Canvas 画面验证
npm run test:boss     # Boss 预警、介绍暂停与躲避交互检查
npm run test:art      # 新模型、武器特效和专属卡面图集
npm run build:win     # 输出 releases/Star-Abyss-win32-x64
```

浏览器测试在没有现成 Chromium 的机器上先运行 `npx playwright install chromium`；也可通过 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` 指定路径。网络安装通过环境已有 HTTPS 代理工作，始终保留 TLS 和 Electron 发布校验和验证。

请查看 [素材来源与许可](star-abyss/CREDITS.md) 和 [首版实现范围、简化与测试说明](star-abyss/DEVELOPMENT.md)。V0.12.0 将未知事件改为随机揭晓实验室、挑战协议或金币屋；三张实验遗物分别绑定当前生命 20–28、最大护盾 10–18 或 111–666 档星币代价，删除独立金币房，并在对局构筑及战斗侧栏展示本局双元素反应。V0.11.0 将暗改为全来源目标易伤，新增三件暗遗物和全部 15 种双元素反应，强化无尽敌人的生命、护甲、伤害与射速；事件加入三种永久代价的禁忌实验和三场战斗挑战，战斗界面显示基础伤害/暴击率/暴击倍率。V0.10.0 新增机库动态攻击演示、金币房间、五种精细太空场景、六元素机体附着及弹幕细节。保留初始血量减半、开放无尽基础成长、调整无尽首领血量曲线，并将分裂弹改为发射触发；细化金属模型与能量特效。保留暴击聚能、三机体闪避差异、闪避遗物、轨道持续印记与有上限的元素叠层；支持两武器手动提前释放、蓄满保持、棱镜左右调角与路径预览，统一主武器进化配方规模；保留机体残影、回响分身、满成长升级补给和舰载经济服务；保留 Boss 持续攻击、开场限制、主题卡面、翻面介绍和伤害上限。53 件遗物目录、24 组共鸣和 16 项进化配方已接入，但部分复杂效果是原型实现，Windows 实机和平衡验收尚未完成。

## 手势魔法阵可视化前端
新增了一个基于浏览器的视觉识别绘制页面，支持通过手势控制来绘制带拖尾效果的魔法阵：

- 打开 `index.html` 后允许摄像头权限。
- 将手放在镜头前：
  - **食指 + 拇指捏合**：进入绘制模式，食指轨迹会形成发光拖尾；
  - **食指 + 拇指张开**：暂停绘制。
- 点击“清空魔法阵”可重置轨迹与粒子特效。

> 依赖通过 CDN 加载 MediaPipe Hands，无需本地安装包。

## 我在哪里可以体验？
你可以直接在本地启动一个静态服务器来体验：

```bash
cd /workspace/asuka-games-ai
python3 -m http.server 8080
```

然后在浏览器打开：

- `http://localhost:8080/index.html`

> 建议使用 Chrome/Edge，并允许摄像头权限；手势识别在 `localhost`（安全上下文）下可正常工作。
