# 3dmodel

用 Three.js 写的场景集合。几何体、贴图和角色都在运行时生成，三个场景共用同一份依赖，从首页进入。

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
| 荒漠迷城 | `/src/scenes/bazaar/` | 在绿篷棚子和周围旧楼之间走动 |

别墅和荒漠迷城可以走动：WASD 相对镜头，方向键为固定方向，Shift 加速，空格跳跃，V 在第一人称和第三人称之间切换。第一人称时鼠标转向，屏幕中心有准星。右上角「设置」可调节移动速度和鼠标灵敏度。女仆页用鼠标拖拽旋转、滚轮缩放。别墅另有 F（开门 / 上下船）和 G（进屋 / 出门）。第三人称下三个场景都可以拖拽旋转镜头、滚轮缩放。

## 目录

```
index.html           场景目录
src/shared/          小人、鲸尾女仆、小木船
src/scenes/villa/    别墅
src/scenes/maid/     女仆展示
src/scenes/bazaar/   荒漠迷城
doc/                 实现说明
AGENTS.md            开发规范与文档检索
```

实现细节见 [doc/README.md](doc/README.md)。代理改代码前先看 [AGENTS.md](AGENTS.md)。
