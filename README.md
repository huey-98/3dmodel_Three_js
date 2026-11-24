# 3dmodel

用 Three.js 写的场景集合。几何体、贴图和角色都在运行时生成，四个场景共用同一份依赖，从首页进入。

## 运行

```bash
npm install
npm run dev
```

开发服务器打开根目录首页。生产构建：

```bash
npm run build
npm run preview
```

## 场景

| 场景 | 地址 | 说明 |
| --- | --- | --- |
| 豪华别墅 | `/src/scenes/villa/` | 进屋、上楼、开门、在河边划船 |
| 鲸尾女仆 | `/src/scenes/maid/` | 旋转查看角色 |
| 荒漠迷城 | `/src/scenes/bazaar/` | 在绿篷棚子和周围旧楼之间走动，可选自由跑图或波次防守 |
| 炙热沙城 | `/src/scenes/dust2/` | CS2 Dust2 可跑图：后花园进 B、暗道进中路、A 门右转进 A 大，A 坑在 A 大最南端 |

点「荒漠迷城」卡片会先弹窗选择进入方式：**自由跑图**没有敌人，**游戏模式**是波次防守，按 G 开始第 1 波，敌人从南凹槽和北面进场，清光一波回血回甲再来下一波，阵亡后从当前波重开。

别墅、荒漠迷城和炙热沙城可以走动：WASD 相对镜头，方向键为固定方向，Shift 加速，空格跳跃，V 在第一人称和第三人称之间切换。第一人称时鼠标转向，视野默认 90°，屏幕中心有绿色准星。右上角「设置」可调节移动速度、鼠标灵敏度、第一人称视野，荒漠迷城另有音效开关（默认关闭）；炙热沙城地址栏可加 `?spawn=t / garden / b2 / b / b1 / mid / midfar / ct / a / asmall / long / pit` 从对应点位出生。女仆页用鼠标拖拽旋转、滚轮缩放。别墅另有 F（开门 / 上下船）和 G（进屋 / 出门）。荒漠迷城第一人称用 1 / 2 / 3 切换步枪、手枪、匕首，左键使用，R 换弹。第三人称下四个场景都可以拖拽旋转镜头、滚轮缩放。

任一场景地址后加 `?stats` 会显示性能面板；已采集的性能基线在 [perf/baseline.md](perf/baseline.md)。

## 目录

```
index.html           场景目录
src/shared/          小人、鲸尾女仆、小木船
src/scenes/villa/    别墅
src/scenes/maid/     女仆展示
src/scenes/bazaar/   荒漠迷城
src/scenes/dust2/    炙热沙城
doc/                 实现说明
perf/                性能基线记录
AGENTS.md            开发规范与文档检索
```

实现细节见 [doc/README.md](doc/README.md)。代理改代码前先看 [AGENTS.md](AGENTS.md)。
