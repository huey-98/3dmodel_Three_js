# 架构

## 目录

```
README.md                  项目说明（给人看）
AGENTS.md                  开发规范与文档检索（给代理）
doc/                       按模块展开的实现说明
index.html                 场景目录页
vite.config.js             多页入口、@shared 别名
jsconfig.json              编辑器路径映射，与别名一致
src/shared/
  person.js                简易方块小人
  whaleMaid.js             鲸尾女仆
  boat.js                  小木船
src/scenes/villa/          别墅玩法场景
src/scenes/maid/           女仆展示
src/scenes/bazaar/         荒漠街区
```

每个场景是一个独立 HTML 页面，只引入自己的 `main.js`。场景之间不互相 import。共享代码只从 `@shared/...` 进来。

## 构建

`vite.config.js` 做两件事：

- `resolve.alias['@shared']` 指向 `src/shared`。`jsconfig.json` 的 `paths` 让编辑器解析同一条路径。
- `build.rollupOptions.input` 由 `sceneInputs()` 生成。固定包含根目录 `index.html`（键名 `main`）。若 `src/scenes` 存在，则扫描一级子目录，把其中的 `index.html` 以目录名作为入口键。新增场景时在 `src/scenes/` 下建文件夹并放 `index.html` 即可被构建收录；根目录首页的卡片链接需要手写。

页面都是中文界面，字体为 Microsoft YaHei。可玩场景右上角有「返回目录」，链回 `/`。

## 渲染约定

三个 `main.js` 的渲染器设置相同：

- `WebGLRenderer({ antialias: true })`
- 像素比上限 `min(devicePixelRatio, 2)`
- 阴影开启，类型 `PCFShadowMap`
- 色调映射 `ACESFilmicToneMapping`

光照都是半球光加定向光。别墅和荒漠迷城的主光投射 2048 阴影贴图；女仆展示页是 1024，并额外加了补光和轮廓光。

贴图全部用 `CanvasTexture` 在运行时绘制，并设为 `SRGBColorSpace`。没有 `public/` 资源目录，也没有 glTF 或其他模型加载。

帧循环里 `dt` 都夹到最多 `0.05` 秒，避免切回标签页后物理一步过大。窗口 `resize` 时更新相机宽高比和渲染尺寸。

## 输入约定

别墅和荒漠迷城共用同一套移动键：

| 输入 | 行为 |
| --- | --- |
| WASD | 相对当前相机朝向移动。W 朝屏幕里走 |
| 方向键 | 固定世界方向（右 +X，下 +Z）。与 WASD 同时按时，方向键优先 |
| Shift | 加速。步行约 3.5–3.6，加速为 7 |
| 空格 | 起跳。重力加速度 24，初速度 8 |
| 鼠标拖拽 | 轨道相机旋转 |
| 滚轮 | 缩放 |

方向键和空格会 `preventDefault`，避免页面滚动。窗口失焦时清空按键集合。

相机每帧把 `OrbitControls.target` 设到角色头顶附近，并把相机平移同样的位移，从而保持玩家当前的轨道偏移。平移被关掉（荒漠迷城显式 `enablePan = false`；别墅使用 OrbitControls 默认，跟随逻辑会盖掉平移结果）。

水平移动先试完整位移，被挡住再试只改 X、只改 Z，形成沿墙滑动。

## 碰撞模型

碰撞不是网格射线，而是一组水平 AABB：`{ minX, maxX, minZ, maxZ }`，角色半径 `PERSON_R = 0.32`。判定是角色中心落在矩形外扩该半径的范围内。

高度是另一套逻辑。荒漠迷城地面恒为 0，只有跳跃偏移。别墅在室内按楼层和楼梯踏步取高度，在室外按桥面坡度取高度，再叠加跳跃。

## 角色动画接口

`createPerson()` 和 `createWhaleMaid()` 都返回 `{ group, update }`。

```text
update(dt, moving = false, row = null)
```

- `moving` 为真时摆腿，幅度从 0 平滑到目标值。
- `row` 为 `{ phase, active }` 时进入划船坐姿，腿前伸，手臂随 `sin(phase)` 摆动。
- 女仆多返回 `rig`、`hair`、`tail` 和四肢枢轴，供展示或调试；别墅主循环只用 `group` 和 `update`。
