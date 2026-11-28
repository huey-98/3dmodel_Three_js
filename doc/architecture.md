# 架构

## 目录

```text
README.md                  项目说明
AGENTS.md                  开发规范与文档检索
doc/                       按模块展开的实现说明
perf/baseline.md           历史性能记录
index.html                 场景目录页
vite.config.js             多页入口、@shared 别名
jsconfig.json              编辑器路径映射，与别名一致
src/shared/
  canvasTex.js             共用的 CanvasTexture 助手
  csT.js                   公共角色与动画
  firstPerson.js           第一人称切换、鼠标转向和准星
  playSettings.js          移动速度、鼠标灵敏度、第一人称视野和音效开关
  perfStats.js             ?stats 性能面板
src/scenes/bazaar/
  main.js                  页面入口：模式、玩家、镜头、输入和碰撞
  world.js / world/        街区组装入口及分节
  materials.js / materials/ 程序化贴图与材质包
  physics.js               AABB 碰撞、地面高度与视线检测
  gun.js / gun/            第一人称界面及状态管理
  combat.js / combat/      波次防守及其界面
  enemy.js / operator.js   场景内非玩家角色逻辑 / CT 玩家角色
src/scenes/dust2/
  main.js                  页面入口：出生点、输入、碰撞、镜头和点位 HUD
  layout.js                楼板、楼梯、坡道、墙体、房间、出生点和区域数据
  physics.js               AABB 碰撞、脚底感知地面高度、区域与镜头射线
  materials.js             贴图与材质包
  world.js / world/        世界组装入口及分节
```

场景各有独立的 HTML 页面和 `main.js`，互不导入。共享代码从 `@shared/...` 导入。

## 构建

`vite.config.js` 把 `@shared` 指向 `src/shared`；`jsconfig.json` 提供相同的编辑器路径映射。`sceneInputs()` 固定收录根目录 `index.html`，再扫描 `src/scenes/` 的一级子目录并收录其中的 `index.html`。当前生成首页、Dust2 和荒漠迷城三个独立页面；首页卡片链接需手动维护。两个场景页面的右上角都有「返回目录」。

## 渲染约定

两个场景都使用有抗锯齿的 `WebGLRenderer`，像素比最高 2，阴影类型为 `PCFShadowMap`，色调映射为 `ACESFilmicToneMapping`。光照为半球光加定向光，主光使用 2048×2048 阴影贴图。贴图运行时用 `CanvasTexture` 绘制，颜色贴图使用 `SRGBColorSpace`。帧间隔 `dt` 的上限为 0.05 秒；窗口 `resize` 时更新相机宽高比和渲染尺寸。

## 性能面板

场景地址加 `?stats`（例如 `/src/scenes/dust2/?stats`）会开启左上角的性能面板，标题对应 `dust2`、`bazaar-free` 或 `bazaar-game`。面板统计帧率、帧时间、JS 耗时、绘制调用、几何体、贴图与绘制缓冲尺寸。一帧内的多次 `render` 都计入同一帧；完整接口见 [shared.md](./shared.md)，荒漠迷城的历史采样见 [perf/baseline.md](../perf/baseline.md)。

## 输入约定

| 输入 | 行为 |
| --- | --- |
| WASD | 相对当前相机朝向移动。W 朝屏幕里走 |
| 方向键 | 固定世界方向（右 +X，下 +Z），优先于 WASD |
| Shift | 加速。荒漠迷城基准步行 3.6、加速 7；Dust2 基准步行 3.8、加速 7.2 |
| 空格 | 起跳。两个场景的起跳速度均为 8.6，重力加速度为 24 |
| V | 在第一人称和第三人称之间切换 |
| 鼠标拖拽 / 滚轮 | 第三人称旋转或缩放轨道相机 |

方向键和空格调用 `preventDefault`，窗口失焦时清空按键。右上角设置可把移动速度调到 50%–250%、第一人称鼠标灵敏度调到 25%–300%、第一人称视野调到 70°–110°（默认 90°）。第三人称视野不变。音效开关只在荒漠迷城显示，默认关闭。两个场景共用 `localStorage` 键 `3dmodel.playSettings`。

第三人称每帧把轨道目标设到角色附近，相机跟着平移。荒漠迷城关闭轨道平移；Dust2 未关闭，但跟随逻辑会重新把目标设到角色附近。两者都只对已登记的房间执行第三人称相机裁剪，具体规则见各场景文档。

第一人称由 `createFirstPersonView()` 实现：进入时隐藏角色、显示准星，请求指针锁定，并把相机置于眼位。按 Esc 只释放鼠标，点击画面可再次锁定；按 V 退出并恢复轨道镜头。角色身体跟随水平视线转向，包括跳跃时。荒漠迷城另有场景专属的控制和波次界面，见 [bazaar.md](./bazaar.md)。

## 碰撞与高度

水平碰撞使用 AABB `{ minX, maxX, minZ, maxZ }`，角色半径为荒漠迷城 `0.32 × 0.9`、Dust2 `0.34`。移动先试完整位移，被挡再按轴滑动。荒漠迷城先试 X，成功后不再试 Z；Dust2 试完 X 仍以更新后的位置继续试 Z。

脚底高度分开计算。荒漠迷城默认地面高度为 0，平台顶面只有在脚底够得到时才可站立，板底高于膝盖的悬空平台允许从下方穿过。Dust2 的楼板、楼梯和坡道各自登记平台；部分障碍只在指定高度段挡人，避免低层通道与上层互相阻挡。见 [bazaar.md](./bazaar.md) 和 [dust2.md](./dust2.md)。

## 角色动画

荒漠迷城的玩家使用场景内的 `createCtOperator()`。游戏模式的非玩家角色和 Dust2 的玩家共用 `createCsT()`。场景通过 `update(dt, moving)` 驱动待机或行走动画，见 [shared.md](./shared.md)。
