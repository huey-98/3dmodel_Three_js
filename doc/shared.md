# 共享模块

`src/shared` 中的模块不依赖场景。Dust2 的玩家角色和荒漠迷城游戏模式中的非玩家角色使用共享的 CS T 方；荒漠迷城的玩家使用场景内的 CT 干员。

## 共用贴图助手 `canvasTex.js`

`canvasTex(w, h, draw)` 创建宽 `w`、高 `h` 的 `CanvasTexture`，把 `(ctx, w, h)` 传给绘制回调，并设置 `SRGBColorSpace` 与 `anisotropy = 8`。调用方包括 `csT.js`、荒漠迷城的 `operator.js`、Dust2 的 `materials.js` 与 `world/backdrop.js`。荒漠迷城的材质包仍有自己的方形贴图助手。

## CS T 方 `csT.js`

`createCsT()` 创建程序化角色，面朝局部 +Z，原点在脚底。`group` 可直接加入场景；`update(dt, moving = false)` 提供待机呼吸与行走动画。`createTerrorist` 是同一工厂的别名。Dust2 使用默认外观，荒漠迷城的非玩家角色传入 `{ armed: true }` 取得场景所用的造型。

## 第一人称 `firstPerson.js`

两个场景都调用 `createFirstPersonView({ camera, domElement, controls, subject, getLookScale, getFov })`。`getLookScale` 缺省时为 1；`getFov` 缺省时不改相机视野。返回 `{ isActive, apply, facingYaw, setCrosshairSpread }`。模块监听 V，忽略按住连发以及 Ctrl / Alt / Meta 组合键。

- 进入时保存相机相对轨道目标的偏移（过短时用 `(3.5, 2.2, 5)`）。有 `subject` 时按它的世界朝向设水平角，俯仰归零；否则从轨道偏移计算角度。随后关闭轨道控制、隐藏角色、显示准星并请求指针锁定。
- 锁定时用 `movementX/Y`；未锁定时只接收画布上的鼠标位移。基础灵敏度是 `0.0026` 弧度/像素，再乘 `getLookScale()`。俯仰限制为 `±(π/2 - 0.02)`。锁定变化附近丢弃约 90 毫秒内的鼠标事件，切换移动来源时重建坐标基准；单轴锁定位移夹到 110 像素，未锁定且任一轴跳变超过该值时丢弃事件。
- `apply(eyeWorld)` 设置相机世界坐标及视线方向。未处于第一人称时直接返回 `false`。`facingYaw()` 返回水平视线对应的角色 Y 轴旋转角。
- `setCrosshairSpread(px)` 将绿色准星四条线向外推，最多 40 像素，中心圆点不动。荒漠迷城调用它，Dust2 的准星保持合拢。
- Esc 只释放指针锁定，不退出第一人称；点击画布可再次请求锁定。按 V 退出时，恢复轨道视野与相对目标的偏移，恢复角色可见性并隐藏准星。

## 游玩设置 `playSettings.js`

`createPlaySettings({ withSound = true } = {})` 在「返回目录」旁添加「设置」按钮。打开面板时会释放指针锁定。炙热沙城传 `withSound: false` 隐藏音效开关，荒漠迷城使用默认值。音效本身默认关闭。

| 设置 | 范围 | 默认 | 步进 |
| --- | --- | --- | --- |
| 移动速度倍率 | 50%–250% | 100% | 5% |
| 第一人称鼠标灵敏度倍率 | 25%–300% | 100% | 5% |
| 第一人称视野 | 70°–110° | 90° | 1° |

返回 `{ moveScale, lookScale, fov, sound }`，各属性都是读取当前值的函数。两个场景共用 `localStorage` 键 `3dmodel.playSettings`。无法读取或解析时用默认值；数值非有限用默认值，有限但越界则夹到边界。只有显式保存 `sound: true` 才开启音效。存储写入失败不影响当前页操作。

## 性能面板 `perfStats.js`

`createPerfStats({ renderer, name = '' })` 返回 `{ beginFrame, endFrame }`，用于包住每帧。标题名为 `dust2`、`bazaar-free` 或 `bazaar-game`。未带 `?stats` 时不创建 DOM，两个方法为空。

开启时把 `renderer.info.autoReset` 设为 `false`。`beginFrame()` 重置渲染统计并记下 JS 起点，`endFrame(now)` 记录 JS 耗时与帧间隔；同帧多次 `render` 的绘制统计会累加。

- 用最近 120 帧的环形缓冲；帧间隔只计大于 0 且小于 300 毫秒的值，JS 耗时不受此过滤。攒够 8 帧后约每 250 毫秒刷新左上角的 `#perf-stats`。
- 面板包含帧率、平均 / P95 / 最大帧时间、JS 平均 / P95、调用数、三角面、几何体、贴图、像素比及绘制缓冲尺寸。
- 最后一次渲染的场景、相机及渲染器挂在 `window.__perfScene`、`window.__perfCamera`、`window.__perfRenderer`；`window.__perf.snapshot()` 返回当前统计数值。历史采样见 [perf/baseline.md](../perf/baseline.md)。
