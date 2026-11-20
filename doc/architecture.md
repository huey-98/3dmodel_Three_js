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
  firstPerson.js           第一人称切换、鼠标转向和准星
  playSettings.js          移动速度和鼠标灵敏度设置
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
| Shift | 加速，约为步行的两倍。默认步行 3.5（别墅）或 3.6（荒漠迷城），加速为 7 |
| 空格 | 起跳。重力加速度 24，初速度 8 |
| V | 第一人称与第三人称切换。第一人称时鼠标转动视角，屏幕中心有准星；再按 V 回到进入前的轨道偏移 |
| 鼠标拖拽 | 第三人称下旋转轨道相机 |
| 滚轮 | 第三人称下缩放 |

方向键和空格会 `preventDefault`，避免页面滚动。窗口失焦时清空按键集合。

右上角「设置」由 [`createPlaySettings()`](./shared.md) 画出，别墅和荒漠迷城各有一个。滑杆把步行、加速和别墅自动走进门的速度一起乘上 50%–250%，并把第一人称鼠标灵敏度调到默认的 25%–300%。数值存在 `localStorage` 键 `3dmodel.playSettings`，两个场景共用。划船速度不跟着变。

第三人称时，相机每帧把 `OrbitControls.target` 设到角色头顶附近，并把相机平移同样的位移，从而保持玩家当前的轨道偏移。荒漠迷城设置了 `enablePan = false`。别墅没有关闭平移；同一套跟随会在下一帧把目标拉回角色，平移留不住。

第一人称由 [`createFirstPersonView()`](./shared.md) 提供，别墅和荒漠迷城各创建一个。按 V 进入时关掉轨道控制、隐藏角色网格，把相机放到眼睛高度，并平视角色当前面朝的方向。鼠标优先使用指针锁定的位移；按 Esc 释放鼠标后，改为使用画布上的鼠标位移，点击画面会再次请求锁定。俯仰限制在接近垂直之内。人在地面上时，身体转向水平视线。别墅在船上不改坐姿，视线的水平角随船头增量转动。屋内和棚内那套沿视线缩短距离的裁剪只在第三人称执行。退出时按进入时记下的偏移恢复轨道镜头。别墅在第一人称里触发 G 的进出门镜头时，不立刻移动相机，只把该偏移记下来，回到第三人称后再用。荒漠迷城的第一人称另外可以左键开火、R 键换弹，弹夹 30 发；这套操作不在共享模块里，别墅没有。

水平移动先试完整位移，被挡住再试只改 X、只改 Z，形成沿墙滑动。

## 碰撞模型

碰撞不是网格射线，而是一组水平 AABB：`{ minX, maxX, minZ, maxZ }`，角色半径 `PERSON_R = 0.32`。判定是角色中心落在矩形外扩该半径的范围内。

高度是另一套逻辑。荒漠迷城地面默认 0，白车顶和车旁跳板箱是可站立平台，从平台走出会落下。别墅在室内按楼层和楼梯踏步取高度，在室外按桥面坡度取高度，再叠加跳跃。

## 角色动画接口

`createPerson()` 和 `createWhaleMaid()` 都返回 `{ group, update }`。

```text
update(dt, moving, row)
```

`createWhaleMaid()` 给后两个参数写了默认值 `false` 和 `null`。`createPerson()` 没有默认值；少传时 `moving` 为 `undefined`，按停下处理。

- `moving` 为真时摆腿，幅度从 0 平滑到目标值。
- `row` 为 `{ phase, active }` 时进入划船坐姿，腿前伸，手臂随 `sin(phase)` 摆动。
- 女仆多返回 `rig`、`hair`、`tail` 和四肢枢轴；别墅主循环只用 `group` 和 `update`。调用点在别墅和女仆展示页。
- 荒漠迷城的玩家是场景内的 `createCtOperator()`，同样返回 `{ group, update }`。主循环只传入 `moving`。细节见 [bazaar.md](./bazaar.md)。
