# AGENTS.md

本文件是代理在本仓库里动手前的入口。行为以当前代码为准；`doc/` 是按代码整理的说明。代码和文档不一致时，先相信代码，改完后同步对应文档。

## 先查哪份文档

按任务打开一份，不必通读全部。

| 要做的事 | 打开 |
| --- | --- |
| 确认项目是什么、怎么运行、三个场景各做什么 | [doc/overview.md](doc/overview.md) |
| 改目录结构、Vite 入口、渲染器、键位、碰撞或角色动画接口 | [doc/architecture.md](doc/architecture.md) |
| 改简易小人、鲸尾女仆或小木船 | [doc/shared.md](doc/shared.md) |
| 改别墅的建筑、室内、河桥、行走、上楼、开门或划船 | [doc/villa.md](doc/villa.md) |
| 改女仆展示页的灯光、镜头或站立动画 | [doc/maid.md](doc/maid.md) |
| 改荒漠迷城的街区、贴图、碰撞、棚内镜头、CT 干员或武器 | [doc/bazaar.md](doc/bazaar.md) |
| 看文档目录 | [doc/README.md](doc/README.md) |

场景之间不互相引用。改某个场景时只读该场景文档和它用到的共享模块；共享模块的签名被两个场景使用时，同时看 [doc/shared.md](doc/shared.md) 和调用方。

## 仓库分层

```
README.md          给人看的项目说明
AGENTS.md          本文件：规范与文档检索
doc/               按模块展开的实现说明
index.html         场景目录页
src/shared/        跨场景代码
src/scenes/<name>/ 单个场景的页面和逻辑（内部可再分子文件夹拆分模块，子文件夹不放 index.html）
```

## 开发规范

规范来自现有实现。新代码沿用这些约定，而不是另起一套框架或资源管线。

### 语言与依赖

- 使用 JavaScript ESM（`package.json` 的 `"type": "module"`）。不引入 TypeScript、UI 框架或状态库。
- 运行时依赖保持为 `three`。新增 npm 包前先确认现有 Three.js API 做不到。
- import 写明 `.js` 后缀。共享代码用别名：`import { createWhaleMaid } from '@shared/whaleMaid.js'`。`@shared` 由 `vite.config.js` 和 `jsconfig.json` 一起指向 `src/shared`。
- 场景只 import 自己的模块和 `@shared`。不要让 `villa`、`maid`、`bazaar` 互相引用。

### 场景怎么加

1. 在 `src/scenes/<name>/` 放 `index.html` 和 `main.js`。页面用 `<script type="module" src="./main.js">`。
2. `vite.config.js` 的 `sceneInputs()` 会扫描一级子目录里的 `index.html`，构建入口不用手改。
3. 根目录 `index.html` 的卡片链接要手写，地址形如 `/src/scenes/<name>/`。
4. 可交互页面右上角放「返回目录」，链到 `/`。界面文案用中文，字体 `"Microsoft YaHei", sans-serif`。

### 画面怎么做

- 几何体、角色和贴图在运行时用代码生成。用 `CanvasTexture`，并设置 `THREE.SRGBColorSpace`。不加载 glTF，不新增 `public/` 模型目录。
- 渲染器与现有 `main.js` 对齐：抗锯齿、`pixelRatio` 上限 `min(devicePixelRatio, 2)`、`PCFShadowMap`、`ACESFilmicToneMapping`。
- 帧间隔夹到最多 `0.05` 秒。`resize` 时更新相机宽高比和 `renderer.setSize`。
- 单位按米。Y 轴向上。角色朝向用 `rotation.y = atan2(move.x, move.z)`，面朝世界 +Z。船头局部轴也是 +Z。

### 操作与碰撞

可走动场景沿用同一套输入。速度、重力和角色半径见 [doc/architecture.md](doc/architecture.md)。

- WASD 相对相机，方向键是世界方向且优先于 WASD。
- Shift 加速，空格跳跃。方向键和空格要 `preventDefault`。窗口失焦时清空按键。
- 水平碰撞是 AABB：`{ minX, maxX, minZ, maxZ }`。先试整步，再试只改 X、只改 Z。
- 高度单独计算。荒漠迷城地面默认 0，白车、车旁跳板箱、西楼二楼阳台和小卖部窗台可站立；别墅的楼层、踏步和桥面见 [doc/villa.md](doc/villa.md)。

### 角色与船

`createWhaleMaid()` 提供：

```text
update(dt, moving, row)
```

`createWhaleMaid()` 的 `moving` 和 `row` 默认是 `false` 和 `null`。`row` 为 `{ phase, active }` 时是划船坐姿。改这个签名时同时改实现，以及别墅和女仆展示页里的调用。船的接口是 `createBoat()` 返回的 `{ group, setRowPhase, seatPosition }`。

### 改完代码之后

- 行为有变化时，更新上表里对应的 `doc/*.md`，让文档继续描述当前代码。
- 只写已经实现的行为。计划中的功能不要写进 `doc/`。
- 别墅开窗时先看 [doc/villa.md](doc/villa.md) 的「实现注意」：洞数据字段是 `along`，挖墙代码读的是 `at`，重叠高度上的整条墙网格会缺失。
