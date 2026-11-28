# 3dmodel

用 Three.js 写的双场景项目。几何体、贴图和角色都在运行时生成，从同一个首页进入。

## 运行

```bash
npm install
npm run dev
```

开发服务器打开根目录首页。生产构建与本地预览：

```bash
npm run build
npm run preview
```

## 场景

| 场景 | 地址 | 说明 |
| --- | --- | --- |
| 炙热沙城（Dust2） | `/src/scenes/dust2/` | 多层跑图、有点位 HUD，可选出生点 |
| 荒漠迷城 | `/src/scenes/bazaar/` | 可探索旧街区，首页提供自由跑图和波次防守两种模式 |

两个场景都支持 WASD 相对镜头移动、方向键固定方向移动、Shift 加速、空格跳跃。按 V 切换第一人称和第三人称；第三人称可拖拽旋转镜头和滚轮缩放。右上角「设置」可调整移动速度、第一人称鼠标灵敏度和视野，荒漠迷城另有音效开关。

Dust2 可用 `?spawn=lane` 等参数切换出生点，完整列表见 [Dust2 文档](doc/dust2.md#出生点与镜头)。荒漠迷城游戏模式按 G 开始第 1 波，详见 [荒漠迷城文档](doc/bazaar.md)。

两个场景均可加 `?stats` 查看性能面板。荒漠迷城的历史采样见 [perf/baseline.md](perf/baseline.md)。

## 目录

```text
index.html           场景目录
src/shared/          共享角色、贴图、视角、设置和性能面板
src/scenes/dust2/    炙热沙城
src/scenes/bazaar/   荒漠迷城
doc/                 实现说明
perf/                性能记录
AGENTS.md            开发规范与文档检索
```

实现细节见 [doc/README.md](doc/README.md)。代理改代码前先看 [AGENTS.md](AGENTS.md)。
