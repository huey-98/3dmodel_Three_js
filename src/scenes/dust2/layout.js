// 炙热沙城二（Dust2）多层布局。单位米：X 向东、Z 向南（俯视图 +Z 朝下）、Y 向上。
// 结构按 de_dust2 经典地图（GoldSrc BSP 实测高度）还原：整张地图自匪家逐级下降——
// 匪家平台 +3.25，A 大 0.8~0，A 包点 0，A 坑/桥洞 -3.0（下沉层），警家 -1.0，
// B 包点是架高平台 +2.4，B 后 +3.2，下水道在街面之下 -1.6/-3.2，公寓两层（0 / +4.0），
// 猫道是 +2.0 的架空木栈道。FLOORS 可站地面、STAIRS 自动生成踏步、WALLS 墙体、
// MASS 实心楼体、CEILS 顶棚。矩形之间不重叠（叠加层除外，如公寓二层在一层之上），
// 上下层遮挡由 physics.groundAt 的“脚底高度感知”处理。

// ---------- 层高常量 ----------
export const T_Y = 3.25;      // 匪家平台 / A 大上段 / 中门上段
export const LONG_Y = 0.0;    // A 大上段街面
export const LONG2_Y = 0.8;   // A 大下段
export const A_Y = 0.0;       // A 包点
export const A_BACK_Y = 1.0;  // A 点后条（backless）
export const PIT_Y = -3.0;    // A 坑（下沉）
export const MID_Y = 0.0;     // 中路
export const BRIDGE_Y = -3.0; // 中下 / 桥洞（下沉）
export const CT_Y = -1.0;     // 警家
export const B_Y = 2.4;       // B 包点（架高平台）
export const B_BACK_Y = 3.2;  // B 后
export const ROAD_Y = 0.0;    // 东北街 / 90° / B 门外
export const TUN_UP_Y = -1.6; // 上水道
export const TUN_LO_Y = -3.2; // 下水道
export const CAT_Y = 2.0;     // 猫道（架空木栈道）
export const APT1_Y = 0.0;    // 公寓一层
export const APT2_Y = 4.0;    // 公寓二层（窗口层）

export const WALL_H = 6;      // 墙顶 = 相邻最高地面 + 6
export const VOID_Y = -4.6;     // 一切板/墙的最低底面（低于所有下沉层）
export const SLAB = 0.8;      // 楼板厚

// ---------- 可站地面 ----------
// kind: road 柏油路 / sand 沙土 / cobble 石板 / cave 洞内 / wood 木板 / apt 公寓地砖
// deep=true：板下按实体处理（侧壁在任何高度挡人）；否则侧壁只在身体高度范围挡。
export const FLOORS = [
  // —— 匪家平台层 ——
  { x0: -55, x1: -6, z0: -23, z1: -6, top: T_Y, kind: 'road', deep: true },
  // —— A 大 ——
  { x0: -52, x1: -42, z0: 0, z1: 13, top: LONG_Y, kind: 'road', deep: true },
  { x0: -52, x1: -42, z0: 13, z1: 35, top: LONG2_Y, kind: 'road', deep: true },
  // —— A 包点 ——
  { x0: -54, x1: -30, z0: 35, z1: 72, top: A_Y, kind: 'cobble', deep: true },
  { x0: -54, x1: -44, z0: 62, z1: 72, top: A_BACK_Y, kind: 'sand', deep: true },
  { x0: -42, x1: -34, z0: 16, z1: 35, top: A_Y, kind: 'cobble', deep: true },
  // —— 下沉层：A 坑 / 桥洞 ——
  { x0: -30, x1: -19, z0: 36, z1: 48, top: PIT_Y, kind: 'cave', deep: true },
  { x0: -19, x1: -6, z0: 33, z1: 44, top: BRIDGE_Y, kind: 'cave', deep: true },
  { x0: -19, x1: 0, z0: 44, z1: 64, top: BRIDGE_Y, kind: 'cave', deep: true },
  // —— 中路 ——
  { x0: -14, x1: -6, z0: -6, z1: 30, top: MID_Y, kind: 'road', deep: true },
  // —— 警家 ——
  { x0: 0, x1: 18, z0: 50, z1: 66, top: CT_Y, kind: 'cobble', deep: true },
  // —— 东北街 / 90° / 公寓周边 ——
  { x0: -6, x1: 40, z0: -22, z1: 0, top: ROAD_Y, kind: 'road', deep: true },
  { x0: -6, x1: 16, z0: 0, z1: 44, top: ROAD_Y, kind: 'cobble', deep: true },
  { x0: 0, x1: 20, z0: 44, z1: 46, top: ROAD_Y, kind: 'cobble', deep: true },
  { x0: 16, x1: 32, z0: 30, z1: 46, top: ROAD_Y, kind: 'cobble', deep: true },
  { x0: 16, x1: 32, z0: 0, z1: 8, top: ROAD_Y, kind: 'road', deep: true },
  { x0: 39, x1: 46, z0: -22, z1: 46, top: ROAD_Y, kind: 'road', deep: true },
  // —— 猫道（架空）——
  { x0: -34, x1: -4, z0: 16, z1: 22, top: CAT_Y, kind: 'wood', deep: false },
  // —— 公寓一层 ——
  { x0: 16, x1: 32, z0: 8, z1: 30, top: APT1_Y, kind: 'apt', deep: true },
  // —— 公寓二层（中间留地板洞 x[22,25] z[18,22]）——
  { x0: 16, x1: 32, z0: 8, z1: 18, top: APT2_Y, kind: 'apt', deep: false },
  { x0: 16, x1: 22, z0: 18, z1: 30, top: APT2_Y, kind: 'apt', deep: false },
  { x0: 25, x1: 32, z0: 18, z1: 30, top: APT2_Y, kind: 'apt', deep: false },
  { x0: 22, x1: 25, z0: 22, z1: 30, top: APT2_Y, kind: 'apt', deep: false },
  // —— B 包点平台（大门梯口 x[20,28]、警家梯口 z[54,60] 处断开）——
  { x0: 18, x1: 34, z0: 48, z1: 70, top: B_Y, kind: 'cobble', deep: false, bottom: -1.0 },
  { x0: 18, x1: 20, z0: 46, z1: 48, top: B_Y, kind: 'cobble', deep: false, bottom: -1.0 },
  { x0: 28, x1: 34, z0: 46, z1: 48, top: B_Y, kind: 'cobble', deep: false, bottom: -1.0 },
  // —— B 后（梯道 x[33,38] 之外）——
  { x0: 24, x1: 33, z0: 70, z1: 78, top: B_BACK_Y, kind: 'sand', deep: true },
  { x0: 38, x1: 40, z0: 70, z1: 78, top: B_BACK_Y, kind: 'sand', deep: true },
  { x0: 33, x1: 38, z0: 76, z1: 78, top: B_BACK_Y, kind: 'sand', deep: true },
  // —— 下水道 ——
  { x0: 32, x1: 39, z0: 7, z1: 38, top: TUN_UP_Y, kind: 'cave', deep: true },
  { x0: 32, x1: 39, z0: 38, z1: 70, top: TUN_LO_Y, kind: 'cave', deep: true },
];

// ---------- 楼梯 / 台阶（自动生成踏步实体） ----------
// dir 为“上升方向”：'x' 越往 +x 越高，'-z' 越往 -z 越高，以此类推。
export const STAIRS = [
  { x0: -50, x1: -44, z0: -6, z1: 0, from: T_Y, to: LONG_Y, dir: 'z' },     // A 大门内下 A 大
  { x0: -14, x1: -6, z0: -6, z1: 0, from: T_Y, to: MID_Y, dir: 'z' },      // 中门阶梯
  { x0: -6, x1: 0, z0: -20, z1: -10, from: T_Y, to: ROAD_Y, dir: 'x' },     // 匪家东通道下东北街
  { x0: -30, x1: -26, z0: 40, z1: 46, from: PIT_Y, to: A_Y, dir: '-x' },    // A 坑上 A 点
  { x0: -13, x1: -6, z0: 30, z1: 33, from: MID_Y, to: BRIDGE_Y, dir: 'z' }, // 中路南端下桥洞
  { x0: -0.6, x1: 3, z0: 54, z1: 60, from: BRIDGE_Y, to: CT_Y, dir: 'x' },  // 桥洞上警家
  { x0: 14, x1: 18, z0: 54, z1: 60, from: CT_Y, to: B_Y, dir: 'x' },        // 警家上 B 点
  { x0: 20, x1: 28, z0: 44, z1: 48, from: ROAD_Y, to: B_Y, dir: '-z' },     // B 大门上平台
  { x0: 33, x1: 38, z0: -1, z1: 7, from: ROAD_Y, to: TUN_UP_Y, dir: 'z' },  // 东北街下下水道
  { x0: 32, x1: 39, z0: 34, z1: 42, from: TUN_UP_Y, to: TUN_LO_Y, dir: 'z' },// 上水道大下行梯
  { x0: 33, x1: 38, z0: 66, z1: 78, from: TUN_LO_Y, to: B_BACK_Y, dir: 'z' },  // 下水道出 B 后（南向上行）
  { x0: -4, x1: -2, z0: 16, z1: 22, from: ROAD_Y, to: CAT_Y, dir: '-x' },   // 90° 上猫道
  { x0: -38, x1: -34, z0: 17, z1: 21, from: A_Y, to: CAT_Y, dir: 'x' },     // A 东北角上猫道
  { x0: 28, x1: 34, z0: 70, z1: 72, from: B_Y, to: B_BACK_Y, dir: 'z' },    // B 点上 B 后
  { x0: 10, x1: 16, z0: 46, z1: 50, from: ROAD_Y, to: CT_Y, dir: 'z' },     // B 门外院下警家（南向下）
  { x0: 26, x1: 31, z0: 9, z1: 15, from: APT1_Y, to: APT2_Y, dir: '-z' },   // 公寓室内一层上二层
  { x0: 12, x1: 16, z0: 12, z1: 20, from: ROAD_Y, to: APT2_Y, dir: 'x' },   // 90° 上公寓二层外梯
];

// ---------- 墙体 ----------
// 自动从 -4.5 立到“相邻最高地面 + WALL_H”；门洞 = 相邻墙段之间的缺口。
export const WALLS = [
  // —— 外圈界墙 ——
  { x0: -60.6, x1: -60, z0: -28, z1: 82 },
  { x0: 46, x1: 46.6, z0: -28, z1: 82 },
  { x0: -60, x1: 46, z0: -28.6, z1: -28 },
  { x0: -60, x1: 46, z0: 82, z1: 82.6 },

  // —— 匪家平台南墙 z=-6：门洞 A 大 x[-50,-44]、中门 x[-20,-14] ——
  { x0: -55, x1: -50, z0: -6.6, z1: -6 },
  { x0: -44, x1: -14, z0: -6.6, z1: -6 },
  // 匪家东墙 x=-6：门洞 z[-18,-10] 通东北街东阶
  { x0: -6.6, x1: -6, z0: -23, z1: -18 },
  { x0: -6.6, x1: -6, z0: -10, z1: -6 },

  // —— A 大走廊 ——
  { x0: -55, x1: -52, z0: -6, z1: 35 },                  // A 大西墙
  { x0: -42, x1: -41.4, z0: -6, z1: 15 },                // A 大东墙北段
  { x0: -42, x1: -41.4, z0: 23, z1: 35 },                // A 大东墙南段（猫道缺口 z[15,23]）
  { x0: -52, x1: -50, z0: -0.6, z1: 0 },                 // 大台阶西侧肩墙
  { x0: -44, x1: -42, z0: -0.6, z1: 0 },                 // 大台阶东侧肩墙

  // —— A 包点 ——
  { x0: -30.6, x1: -30, z0: 35, z1: 40 },                // A 东墙北段（坑口以北）
  { x0: -30.6, x1: -30, z0: 46, z1: 72 },                // A 东墙南段（坑口 z[40,46]）
  { x0: -34.6, x1: -34, z0: 22, z1: 35 },                // A 东北角东墙
  { x0: -42.6, x1: -42, z0: 35, z1: 40 },                // A 东北角西墙北段
  { x0: -42.6, x1: -42, z0: 46, z1: 50 },                // A 东北角西墙南段（缺口 z[40,46] 通 A 点）

  // —— A 坑 ——
  { x0: -19.6, x1: -19, z0: 36, z1: 38 },                // 坑东墙北小段（门洞 z[38,44]）
  { x0: -19.6, x1: -19, z0: 44, z1: 48 },                // 坑东墙南段
  { x0: -30, x1: -19, z0: 48, z1: 48.6 },                // 坑南墙
  { x0: -30, x1: -19, z0: 35.4, z1: 36 },                // 坑北墙

  // —— 中路 ——
  { x0: -14.6, x1: -14, z0: -6, z1: 33.6 },             // 中路西墙（含下桥洞段）
  { x0: -6.6, x1: -6, z0: -6, z1: 12 },                  // 中路东墙北段
  { x0: -6.6, x1: -6, z0: 20, z1: 44 },                  // 中路东墙南段（猫道门 z[12,20]，南到桥洞）

  // —— 桥洞 ——
  { x0: -19.6, x1: -19, z0: 44, z1: 64 },                // 桥洞西墙
  { x0: -0.6, x1: 0, z0: 44, z1: 54 },                   // 桥洞东墙北段（警家梯口 z[54,60]）
  { x0: -0.6, x1: 0, z0: 60, z1: 64 },                   // 桥洞东墙南段
  { x0: -19, x1: 0, z0: 64, z1: 64.6 },                  // 桥洞南墙

  // —— 警家 ——
  { x0: 0, x1: 10, z0: 49.4, z1: 50 },                   // 警家北墙（门洞 x[10,16] 通 B 门外梯）
  { x0: 0, x1: 16, z0: 66, z1: 66.6 },                   // 警家南墙

  // —— 公寓 ——
  { x0: 16, x1: 20, z0: 7.4, z1: 8 },                    // 公寓北墙西段（正门洞 x[20,26]）
  { x0: 26, x1: 32, z0: 7.4, z1: 8 },                    // 公寓北墙东段
  { x0: 15.4, x1: 16, z0: 8, z1: 12, top: 3.2, para: true },    // 公寓西墙北段：二层窗台矮墙，可跨出跳窗
  { x0: 15.4, x1: 16, z0: 20, z1: 30 },                  // 公寓西墙南段（二层门洞 z[12,20]）
  { x0: 32, x1: 32.6, z0: 8, z1: 30 },                   // 公寓东墙
  { x0: 16, x1: 32, z0: 30, z1: 30.6 },                  // 公寓南墙

  // —— 下水道 ——
  { x0: 31.4, x1: 32, z0: 0, z1: 70, kind: 'cave' },     // 水道西墙
  { x0: 39, x1: 39.6, z0: 0, z1: 70, kind: 'cave' },     // 水道东墙
  { x0: 32, x1: 33, z0: -0.6, z1: 0, kind: 'cave' },     // 入口西肩
  { x0: 38, x1: 39, z0: -0.6, z1: 0, kind: 'cave' },     // 入口东肩

  // —— B 包点 ——
  { x0: 16, x1: 18, z0: 44.4, z1: 45 },
  { x0: 18, x1: 20, z0: 45.4, z1: 46 },                  // B 大门西肩
  { x0: 28, x1: 34, z0: 45.4, z1: 46 },                  // B 大门东肩
  { x0: 34, x1: 34.6, z0: 48, z1: 70 },                  // B 点东墙
  { x0: 18, x1: 24, z0: 70, z1: 70.6 },                  // B 点南墙西段（B 后连接带 x[24,40]）

  // —— 东侧 ——
  { x0: 40, x1: 40.6, z0: 70, z1: 78 },                  // B 后东墙
];

// ---------- 楼体（实心大块） ----------
export const MASS = [
  { x0: -44, x1: -14.6, z0: -6, z1: 15 },                // A 大与中路之间的街区（含门洞下地面空隙）
  { x0: -34, x1: -13.6, z0: 23, z1: 33 },                // 猫道以南街区
  { x0: -30, x1: -19, z0: 33, z1: 36 },                  // 坑北楼体
  { x0: -60, x1: -54, z0: 35, z1: 62 },                  // A 点西楼带
  { x0: -60, x1: -54, z0: 62, z1: 78 },                  // A 后西楼
  { x0: -54, x1: -30, z0: 72, z1: 78 },                  // A 点南楼
  { x0: -60, x1: -55, z0: -6, z1: 35 },                 // A 大西楼带
  { x0: -30, x1: -19, z0: 48, z1: 64 },                 // 坑南与 A 点东南楼体
  { x0: 0, x1: 10, z0: 46, z1: 49.4 },                   // 警家北楼
  { x0: 40, x1: 46, z0: 46, z1: 70 },                    // B 点东楼
  { x0: 24, x1: 40, z0: 78, z1: 82 },                    // B 后南楼
  { x0: -60, x1: -55, z0: -28, z1: -6 },                 // 匪家西楼
  { x0: -60, x1: 46, z0: -28, z1: -23 },                 // 北侧沿街楼带
  { x0: -60, x1: -30, z0: 78, z1: 82 },                  // 南侧沿街楼带
  { x0: -30, x1: 24, z0: 64, z1: 82 },                   // 警家西南大地块
  { x0: 16, x1: 24, z0: 70, z1: 82 },                    // B 点西南地块
  { x0: 40, x1: 46, z0: 70, z1: 82 },                    // 东南角地块
];

// ---------- 顶棚 ----------
export const CEILS = [
  { x0: -52, x1: -42, z0: 27, z1: 35, bottom: 4.9, kind: 'sand', room: true },
  { x0: -13, x1: -6, z0: -6, z1: 4, bottom: 4.1, kind: 'sand', room: true },
  { x0: -19, x1: -6, z0: 33, z1: 44, bottom: 0.8, kind: 'sand', room: true },
  { x0: 32, x1: 39, z0: 0, z1: 70, bottom: 0.9, kind: 'cave', room: true },
  { x0: 16, x1: 32, z0: 8, z1: 18, bottom: APT2_Y - SLAB, kind: 'apt', room: false },
  { x0: 16, x1: 22, z0: 18, z1: 30, bottom: APT2_Y - SLAB, kind: 'apt', room: false },
  { x0: 25, x1: 32, z0: 18, z1: 30, bottom: APT2_Y - SLAB, kind: 'apt', room: false },
  { x0: 22, x1: 25, z0: 22, z1: 30, bottom: APT2_Y - SLAB, kind: 'apt', room: false },
  { x0: 15, x1: 33, z0: 7, z1: 31, bottom: APT2_Y + 0.1, kind: 'sand', room: false },
  { x0: 0, x1: 16, z0: 50, z1: 66, bottom: 5.0, kind: 'sand', room: true },
];

// ---------- 室内体积（第三人称相机收距） ----------
export const ROOMS = [
  { x0: 16, x1: 32, z0: 8, z1: 30, y0: APT1_Y, y1: APT2_Y - SLAB },
  { x0: 16, x1: 32, z0: 8, z1: 30, y0: APT2_Y, y1: APT2_Y + 3.2 },
  { x0: 32, x1: 39, z0: 0, z1: 38, y0: TUN_UP_Y, y1: 0.9 },
  { x0: 32, x1: 39, z0: 38, z1: 70, y0: TUN_LO_Y, y1: 0.9 },
  { x0: -19, x1: -6, z0: 33, z1: 44, y0: BRIDGE_Y, y1: 0.8 },
  { x0: -52, x1: -42, z0: 27, z1: 35, y0: LONG2_Y, y1: 4.9 },
  { x0: -13, x1: -6, z0: -6, z1: 4, y0: MID_Y, y1: 4.1 },
];

// ---------- 出生点：?spawn= ----------
export const SPAWNS = {
  t: { x: -30, y: T_Y, z: -15, yaw: 0, label: '匪家' },
  long: { x: -47, y: LONG_Y, z: 5, yaw: 0, label: 'A 大' },
  a: { x: -44, y: A_Y, z: 55, yaw: 0, label: 'A 包点' },
  pit: { x: -24, y: PIT_Y, z: 42, yaw: 0, label: 'A 坑' },
  mid: { x: -9, y: MID_Y, z: 8, yaw: 0, label: '中路' },
  bridge: { x: -10, y: BRIDGE_Y, z: 52, yaw: 0, label: '桥洞' },
  corner: { x: 5, y: ROAD_Y, z: 20, yaw: Math.PI / 2, label: '90 度' },
  apartments: { x: 24, y: APT2_Y, z: 24, yaw: Math.PI, label: '公寓二层' },
  b: { x: 26, y: B_Y, z: 58, yaw: 0, label: 'B 包点' },
  bback: { x: 28, y: B_BACK_Y, z: 74, yaw: Math.PI, label: 'B 后' },
  tunnels: { x: 35.5, y: TUN_LO_Y, z: 50, yaw: Math.PI, label: '下水道' },
  ct: { x: 8, y: CT_Y, z: 58, yaw: Math.PI, label: '警家' },
};

// ---------- 区域（HUD 点位名）：zoneAt 取 y 区间内面积最小的区域 ----------
export const ZONES = [
  { name: '匪家', x0: -55, x1: -13, z0: -23, z1: -6, y0: 2.4, y1: 4.4 },
  { name: '匪家东通道', x0: -13, x1: -6, z0: -22, z1: -8, y0: 2.4, y1: 4.4 },
  { name: 'A 大', x0: -52, x1: -42, z0: -6, z1: 35, y0: -0.8, y1: 1.8 },
  { name: 'A 包点', x0: -54, x1: -30, z0: 35, z1: 72, y0: -0.8, y1: 1.9 },
  { name: 'A 坑', x0: -30, x1: -19, z0: 36, z1: 48, y0: -4.2, y1: -2 },
  { name: 'A 东北角', x0: -42, x1: -34, z0: 16, z1: 35, y0: -0.8, y1: 1.2 },
  { name: '猫道', x0: -34, x1: -4, z0: 16, z1: 22, y0: 1.4, y1: 3 },
  { name: '中路', x0: -14, x1: -6, z0: -6, z1: 30, y0: -0.8, y1: 1.2 },
  { name: '桥洞', x0: -19, x1: 0, z0: 33, z1: 64, y0: -4.2, y1: -2 },
  { name: '警家', x0: 0, x1: 16, z0: 50, z1: 66, y0: -2.2, y1: 0 },
  { name: '90 度', x0: -6, x1: 16, z0: 0, z1: 44, y0: -0.8, y1: 1.2 },
  { name: '东北街', x0: -6, x1: 40, z0: -22, z1: 0, y0: -0.8, y1: 1.2 },
  { name: '公寓一层', x0: 16, x1: 32, z0: 8, z1: 30, y0: -0.8, y1: 3.2 },
  { name: '公寓二层', x0: 16, x1: 32, z0: 8, z1: 30, y0: 3.2, y1: 5.5 },
  { name: '公寓南巷', x0: 16, x1: 32, z0: 30, z1: 46, y0: -0.8, y1: 1.2 },
  { name: 'B 门外', x0: 0, x1: 46, z0: 30, z1: 46, y0: -0.8, y1: 1.2 },
  { name: '东侧街', x0: 39, x1: 46, z0: -22, z1: 30, y0: -0.8, y1: 1.2 },
  { name: '中路', x0: -14, x1: -6, z0: -6, z1: 30, y0: -0.8, y1: 1.2 },
  { name: 'B 包点', x0: 16, x1: 34, z0: 46, z1: 70, y0: 1.5, y1: 3.4 },
  { name: 'B 后', x0: 24, x1: 40, z0: 70, z1: 78, y0: 2.3, y1: 4.2 },
  { name: '上水道', x0: 32, x1: 39, z0: 0, z1: 38, y0: -2.6, y1: -0.6 },
  { name: '下水道', x0: 32, x1: 39, z0: 38, z1: 70, y0: -4.4, y1: -2.2 },
];
