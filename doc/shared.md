# 共享模块

`src/shared` 里这些文件都不依赖具体场景。别墅用鲸尾女仆和小木船；女仆展示页只用鲸尾女仆。荒漠迷城的玩家不在这里，而是场景内的 CT 干员，见 [bazaar.md](./bazaar.md)。

## 共用贴图助手 `canvasTex.js`

`canvasTex(w, h, draw)` 创建 w×h 的 `CanvasTexture`：回调拿到 (ctx, w, h)，生成后设 `SRGBColorSpace`、`anisotropy = 8`。荒漠迷城的 `operator.js` 与 `whaleMaid/textures.js` 用它；各场景自己的方形贴图助手（materials、villaMaterials、gun、combat）尺度不同，仍是独立实现。

## 鲸尾女仆 `whaleMaid.js`

`whaleMaid.js` 是编排入口，实现拆在 `whaleMaid/`：`base.js` 配色表 `C` 与 `mat` / `mesh` / `v` 基础件，`parts.js` 顶点着色 `colorAlong`、发束 `strand`、蝴蝶结 `makeBow`、尾鳍轮廓 `flukeGeo`，`textures.js` 脸、鲸鱼胸标、围裙、裙子四张 canvas 贴图。`createWhaleMaid()` 的签名与返回值不变。

`createWhaleMaid()` 按设定还原一名蓝发、海军蓝女仆装、身后带鲸尾的角色。几何体全部程序化，脸、围裙、裙子和胸前鲸鱼标记用 canvas 贴图。

主要结构：

- 头是缩放过的球体，面前一块透明平面贴脸。`drawFace` 画眉毛、眼睛高光、腮红和嘴。眨眼时把眼睛画成一条弧线并 `needsUpdate`。眨眼间隔约 2.2–5 秒，闭眼窗口很短。
- 头发是半球发冠加多条 `TubeGeometry` 发束。发束顶点色从 `C.hair`（`#3e6eb0`）插到发梢 `#9fd2f5`。侧面有蕾丝环和蓝色蝴蝶结。文件头注释说明已经去掉头侧深色鲸耳块。
- 服装：立领、白色胸巾和扣子、颈前海军蓝蝴蝶结、腰带金扣、带横纹的白色围裙、裙摆 `LatheGeometry`（金色滚边和十字纹）、两侧金蝴蝶结、白衬裙。
- 手臂默认插袋（`userData.rest` 记下休息角）。走路时手臂只被步态轻微带动。
- 腿是深色长袜加扁鞋。`footY = 0.085`，让鞋底贴地，避免脚埋进地面。
- 鲸尾在身后：一根深色茎加左右两片挤出的尾鳍，腹面是浅色条。

`update(dt, moving = false, row = null)`：

- 始终眨眼，头发有很小的左右摆动。
- 划船坐姿时手臂随相位摆、双腿前伸、鲸尾上抬，身体高度固定在 `footY`。
- 行走摆腿幅度目标 0.55。停下时身体仍有轻微呼吸起伏，鲸尾自己慢慢摆。

返回值：`{ group, update, rig, hair, tail, legL, legR, armL, armR }`。

## 小木船 `boat.js`

`createBoat()` 返回 `{ group, setRowPhase, seatPosition }`。

船体是 U 形截面沿 Z 挤出 3 米，倒角形成船首船尾。上面有内舱地板、两块座板、两侧压条。左右船桨挂在舷边枢轴上，桨架是短圆柱。

`setRowPhase(phase, active)`：划行时 `sin(phase)` 同时改桨的入水角（绕 Z）和后拉角（绕 Y）；`active` 为假时桨回到接近水平。

`seatPosition` 是船体局部坐标 `(0, 0.02, 0.6)`。`0.02` 是角色原点的高度：女仆髋大约在 0.48，座板在 0.44，原点放在这个高度时髋落在座板上。上船时场景把人物 `group` 加进船的 `group`，再把位置设到这个座位，并让人物面向船尾（局部 Y 旋转 π），背对船头 +Z。

船本身没有物理。浮沉、航向和是否可通行都由别墅主循环驱动。

## 第一人称 `firstPerson.js`

`createFirstPersonView({ camera, domElement, controls, subject, getLookScale, getFov })` 给别墅和荒漠迷城用。女仆展示页不创建它。`getLookScale` 缺省时按 1。`getFov` 缺省时不改相机视野；传入后，进入第一人称就改成这个角度，滑杆变化时跟着更新，退出时恢复进入前的视野。

返回 `{ isActive, apply, facingYaw, addYaw, setReturnOffset, setCrosshairSpread }`。模块自己监听 `KeyV`（忽略按住连发，以及 Ctrl / Alt / Meta）。

- 进入时记下相机相对 `controls.target` 的偏移，供退出时还原；偏移过短时改记成 `(3.5, 2.2, 5)`。水平角对齐 `subject` 局部 +Z 的世界朝向，俯仰为 0，不沿用轨道镜头的俯角。然后 `controls.enabled = false`，`subject.visible = false`，显示 `#crosshair`，并请求指针锁定。
- `#crosshair` 是加到 `document.body` 的固定定位绿色十字，四条线和中心圆点都带深色描边，不接收指针事件。`setCrosshairSpread(px)` 把四条线再向外推，最大 40 像素，中心圆点不动。荒漠迷城用它表现移动、跳跃和开火；别墅不调用，十字保持合拢。
- 指针锁定时用 `movementX/Y` 转向，基础灵敏度 `0.0026` 弧度/像素，再乘 `getLookScale()`。未锁定时只用落在 `domElement` 上的鼠标位移，单次超过 150 像素的跳变忽略。俯仰限制为 `±(π/2 - 0.02)`。鼠标右移增加朝右的水平角，鼠标下移降低俯仰。
- `apply(eyeWorld)` 把相机放到该世界坐标，并看向由水平角和俯仰组成的方向。未处于第一人称时直接返回 `false`。
- `facingYaw()` 是水平视线对应的角色 `rotation.y`（角色局部 +Z 为面朝方向）。
- `addYaw(delta)` 在此基础上再转一个水平角。别墅用它把船头的航向增量加进视线。
- `setReturnOffset(px, py, pz, tx, ty, tz)` 改写退出时要恢复的相机偏移，不移动当前相机。
- 退出时先清掉轨道控制上未完成的拖拽和残余旋转，把相机放到当前 `target` 加上记下的偏移，调用一次 `controls.update()`，再解开指针锁定、隐藏准星、显示角色。Esc 只释放鼠标，不退出第一人称；光标在未锁定时为 `crosshair`，锁定后由浏览器隐藏。

## 走动设置 `playSettings.js`

`createPlaySettings({ withSound })` 在页面右上角放入「设置」按钮，并把它和已有的「返回目录」排在同一行。点开后面板里有三条滑杆：

- 移动速度：50%–250%，步进 5%，默认 100%。场景把步行、加速，以及别墅自动走进门的速度乘上这个比例。
- 鼠标灵敏度：25%–300%，步进 5%，默认 100%。第一人称用它作为 `getLookScale()`。
- 视野：70°–110°，步进 1°，默认 90°。第一人称用它作为 `getFov()`。第三人称仍用各场景原来的视野。

`withSound` 默认为真，此时面板里还有一个「音效」开关，用于荒漠迷城的开火、挥刀、换弹提示音和敌人的枪声（切枪没有音效）。别墅没有音效，传 `false` 不显示这个开关。

返回 `{ moveScale, lookScale, fov, sound }`，都是读取当前数值的函数。改滑杆或开关时写入 `localStorage` 的 `3dmodel.playSettings`（`{ moveScale, lookScale, fov, sound }`）。读不到或数值超出范围时，比例回到 1，视野回到 90；`sound` 默认关闭，只有存过 `true` 才打开。面板打开时如果鼠标还被锁定，会先释放锁定。

## 性能面板 `perfStats.js`

`createPerfStats({ renderer, name = '' })` 三个场景都创建，`name` 分别是 `villa`、`maid`、`bazaar-free` / `bazaar-game`。URL 不带 `?stats` 时不创建任何 DOM，返回的两个方法都是空的，主循环不用写分支。

返回 `{ beginFrame, endFrame }`，在主循环里包住一帧：`beginFrame()` 重置 `renderer.info` 并记下 JS 起点，`endFrame(now)` 记录本帧 JS 耗时和与上一帧的间隔。开启时 `renderer.info.autoReset` 置为 `false`，一帧里的多次 `render` 都累加进同一帧。

- 统计窗口是最近 120 帧的环形缓冲；超过 300 毫秒的帧间隔（切后台、重新聚焦）不计入帧时间。
- 面板是左上角固定的 `#perf-stats`，不接收指针事件，攒够 8 帧后约每 250 毫秒刷一次 DOM。内容为帧率、平均 / P95 / 最大帧时间、JS 平均 / P95、绘制调用、三角面、几何体、贴图数量、像素比和绘制缓冲尺寸。
- 包一层 `renderer.render`，把最后一次渲染的场景和相机挂到 `window.__perfScene`、`window.__perfCamera`，渲染器本身挂到 `window.__perfRenderer`。
- `window.__perf.snapshot()` 返回当前统计的数值对象（fps、帧时间和 JS 时间的均值 / P95、调用数、三角面、几何体、贴图、像素比和缓冲尺寸），供控制台 A/B 测量。[perf/baseline.md](../perf/baseline.md) 里的基线就是这样采集的。
