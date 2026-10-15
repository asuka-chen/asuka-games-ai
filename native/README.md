# 星渊 V0.14.0 手机原生应用

Android 使用原生 Activity + Android WebView，iOS 使用 UIKit + WKWebView。游戏、音效与原创图形全部内置，无需网络或本地服务器。两平台共享同一套战斗规则，支持竖屏及横屏，多指移动/射击/闪避，保留本机检查点。手机存档不与 Windows 同步。

## 安装

- Android 9 及以上，需较新的 Android System WebView（Chromium 100+）：下载 `Star-Abyss-Android-v0.14.0.apk`，允许此次下载来源安装应用后打开。这是自签名测试 APK，未上架应用商店；后续使用同一签名密钥更新可保留存档。不要卸载旧版来更新。密钥保留在构建机器的 `.cache/android-signing/`，不包含在源码或下载包中。
- iOS / iPadOS 16 及以上：`Star-Abyss-iOS-v0.14.0-unsigned.ipa` 是已编译的 ARM64 真机应用，**尚未 Apple 签名，不能直接点开安装，也不是 TestFlight 链接**。可用自己的 Apple ID 在电脑通过 AltStore 等工具签名侧载，或用 Apple Developer 团队在 Xcode 中签名并导出适用设备的安装包。普通个人免费签名通常 7 天后需要续签，具体限制以 Apple 为准。仅在官方软件或安全配置中输入账号和签名凭据，不在聊天中发送密码、证书或私钥。

若需要 TestFlight / App Store 或可直接安装的团队签名包，还需有效 Apple Developer 团队、证书与描述文件。项目没有内置或冒用第三方企业证书。

## 手机操作

左侧摇杆或拖动战场移动，右侧“射击”按住蓄力，松开后释放；未蓄满也能发射，蓄满后可以继续保持。普通武器按住连续射击。手动按射击会关闭自动火力，点“自动”恢复。闪避每按一次消耗一段；棱镜装备后显示左右调角键。构筑卡点击翻面查看，详情期间暂停作战。切换后台、屏幕旋转或 Android 返回键会暂停，恢复后手动继续。

## 构建

Node.js 24+、Python 3、Java 21（包含 `jdk.compiler` 和 `keytool`）。原生构建依赖独立锁文件，不需要安装 Electron。

```bash
npm --prefix native ci --ignore-scripts --cache .cache/npm
node scripts/build-mobile.mjs
python3 scripts/setup-android.py
python3 scripts/build-android.py
```

Android SDK 从 Google 官方源下载，并核验大小及官方 SHA-1；产物还会验证 APK 签名、ZIP 完整性并输出 SHA-256。源码与游戏资源更新后重新运行 `build-mobile.mjs` 再构建安装包。不要删除或公开 `.cache/android-signing`；丢失密钥将无法覆盖更新已有安装。此测试密钥不用于生产应用商店发布。

iOS 必须在装有 Xcode 的 Mac 上构建：

```bash
npm --prefix native ci --ignore-scripts
bash scripts/build-ios.sh
```

输出在 `releases/`，包括未签名 IPA 及 SHA-256。在 Xcode 打开 `native/ios/StarAbyss.xcodeproj`，进入 Signing & Capabilities 选择自己的 Team，以已连接 iPhone 运行或 Archive / Distribute App。使用团队实际配置签名，不要把证书、描述文件或密码提交到仓库。

GitHub Actions 的 `Build Star Abyss iOS` 工作流可构建未签名 IPA，并启动 iPhone Simulator；Android 任务在 Android 35 模拟器中安装、进入战斗并保存截图。CI 使用开启调试、软件绘制的独立 QA 包，以避开虚拟 GPU 兼容问题；触控测试直接连接实际 Android WebView。正式 APK 禁用调试并使用硬件加速。CI 临时密钥与本地发布密钥不同，QA 包不用于玩家安装。

## 验证

```bash
npm test
npm run test:mobile
npm run test:controls
npm run test:browser
```

浏览器检查使用 Playwright + Chromium，覆盖五种横竖屏尺寸、多点触控、弱蓄力/满蓄力、闪避次数、触摸中断、暂停、转屏、棱镜调角及原生离线资源包。它们不替代不同实体手机的性能验收。
