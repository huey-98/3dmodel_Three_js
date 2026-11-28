# 项目概述

`3dmodel` 是纯前端的 Three.js 场景项目。没有后端或外部模型文件，几何体、贴图和角色都在浏览器里生成。炙热沙城和荒漠迷城共用 `three`，从根目录首页进入，各自可返回首页。

版本 `0.1.0`，`"type": "module"`。运行时依赖是 `three`（`^0.187.0`），开发依赖是 `vite`（`^8.3.8`）。

## 运行

```bash
npm install
npm run dev
```

开发服务器打开根目录 `index.html`，标题为「3D 场景」。两个入口：

| 卡片 | 开发地址 | 说明 |
| --- | --- | --- |
| 炙热沙城（Dust2） | `/src/scenes/dust2/` | 多层跑图，可按点位出生 |
| 荒漠迷城 | `/src/scenes/bazaar/` | 旧街区，可选自由跑图或波次防守 |

生产构建与本地预览：

```bash
npm run build
npm run preview
```

`vite.config.js` 自动发现 `src/scenes/<name>/index.html`。两个场景和首页都是独立的构建入口。

## 场景在做什么

**炙热沙城**是 Dust2 多层跑图场景，底部 HUD 随位置显示点位名。`?spawn=` 可选择 13 个出生点（含 `lane`，即 A 通道）。详见 [dust2.md](./dust2.md)。

**荒漠迷城**是围绕绿篷搭建的旧街区，包含可进入的小卖部、带顶通道和室外高台。从首页进入时可选择**自由跑图**或**游戏模式**，两种模式共用同一街区。详见 [bazaar.md](./bazaar.md)。

任一场景地址后加 `?stats` 可开启性能面板，见 [architecture.md](./architecture.md)。荒漠迷城的历史性能采样见 [perf/baseline.md](../perf/baseline.md)。

## 单位与朝向

场景单位按米使用，Y 轴向上。角色正面是局部 +Z；面向移动方向时，`rotation.y = atan2(move.x, move.z)`。
