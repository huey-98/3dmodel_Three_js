// 炙热沙城二（Dust2）· 按 CS2 官方雷达走位。X 东、Z 南、Y 上；雷达北=z 小。
// 雷达上的黑色区域是封闭楼体。三条主路：后花园→B2→B；暗道→中路→中门→沙地；A 门→A 大→A 包点。
// 匪家往西下后花园；往东是缓下坡，坡起点北侧可跳进暗道，坡终点是空地。
// 空地往北分叉：西进中路，东到 A 门。进门后向右（东）才是 A 大通道，通道南端是 A 坑。
// A 小只从中路经小道楼梯/Xbox 上猫道。猫道南延到 z=56，小道楼梯在 z[56,62]。
// 中路街宽 10 m（x[-5,5]）：西缘是 B1 洞口，东缘是架空猫道 x[5,22]，猫道底下填实到 -1.05。
// B1 洞口正对中门/Xbox；B 窗在 B 门北。
// A 侧分两层，向南看：西侧是 A 小楼梯连到 A 平台的高架通道(+5，x[22,30] z[16,24.2])，
// 东侧（A 大方向）没有高地板，跳下去就是 A 后巷。通道西侧是实楼，走不过去。
// 警家东拱门外是同一层(-1.0)的露天广场，往南绕过通道东缘进后巷，中间没有墙、坡、桥或隧道。
// A 包点与药房之间（x[26,42] z[26,35]）填了一栋 12 米高的楼，后巷只剩楼北一条巷子 z[16,26]。
// A 后坡靠 A 斜坡，从东包点南缘降到后巷，可走回第二层。
export const T_Y = 3.25;
export const GARDEN_Y = 0.0;
export const B2_Y = 1.6;
export const B1_Y = -1.6;
export const B_Y = 2.0;
export const CT_Y = -1.0;
export const MID_N_Y = -1.0;
export const MID_S_Y = 1.2;
export const MID_Y = MID_N_Y;
export const A_SMALL_Y = 1.6;
export const A_PLAT_Y = 5.0;
export const LONG_Y = 0.8;
export const PIT_Y = -2.5;
export const ROAD_Y = 0.0;
export const WALL_H = 6;
export const VOID_Y = -5.6;
export const SLAB = 0.8;

export const FLOORS = [
  { x0: -10, x1: 12, z0: 68, z1: 84, top: T_Y, kind: 'road', deep: true },
  { x0: 12, x1: 13, z0: 78, z1: 84, top: T_Y, kind: 'road', deep: true },
  { x0: -42, x1: -18, z0: 56, z1: 80, top: GARDEN_Y, kind: 'sand', deep: true },
  { x0: -18, x1: -16, z0: 56, z1: 60, top: GARDEN_Y, kind: 'sand', deep: true },
  { x0: 0, x1: 5, z0: 58, z1: 64, top: ROAD_Y, kind: 'cave', deep: true },
  { x0: 0, x1: 22, z0: 64, z1: 70, top: ROAD_Y, kind: 'cave', deep: true },
  { x0: 5, x1: 21.6, z0: 63, z1: 64, top: ROAD_Y, kind: 'cave', deep: true },
  { x0: 24, x1: 42, z0: 63, z1: 78, top: ROAD_Y, kind: 'road', deep: true },
  { x0: -5, x1: 5, z0: 50, z1: 53, top: MID_S_Y, kind: 'road', deep: true },
  { x0: -5, x1: 0, z0: 53, z1: 60, top: MID_S_Y, kind: 'road', deep: true },
  { x0: 5, x1: 8, z0: 50, z1: 57, top: MID_S_Y, kind: 'road', deep: true },
  { x0: 5, x1: 8, z0: 57, z1: 63, top: MID_S_Y, kind: 'road', deep: true },
  { x0: 8, x1: 10, z0: 53, z1: 56, top: MID_S_Y, kind: 'road', deep: true },
  { x0: 8, x1: 24, z0: 62, z1: 63, top: MID_S_Y, kind: 'road', deep: true },
  { x0: 26, x1: 42, z0: 42, z1: 50, top: LONG_Y, kind: 'asphalt', deep: true },
  { x0: -33, x1: -27, z0: 22, z1: 52, top: B2_Y, kind: 'cave', deep: true },
  { x0: -23, x1: -11, z0: 28, z1: 40, top: B1_Y, kind: 'cobble', deep: true },
  { x0: -31, x1: -9, z0: 4, z1: 22, top: B_Y, kind: 'cobble', deep: false, bottom: -1.0 },
  { x0: -37, x1: -31, z0: 4, z1: 20, top: B_Y, kind: 'cobble', deep: true },
  { x0: -37, x1: -33, z0: 20, z1: 22, top: B_Y, kind: 'cobble', deep: true },
  { x0: -9, x1: 10, z0: 4, z1: 26, top: CT_Y, kind: 'sand', deep: true },
  { x0: 10, x1: 21, z0: 4, z1: 16, top: CT_Y, kind: 'sand', deep: true },
  { x0: 10, x1: 15, z0: 16, z1: 24, top: CT_Y, kind: 'cobble', deep: true },
  // 警家东拱门外的露天广场，往南在通道东缘（x>30）接上后巷，全程没有顶
  { x0: 21, x1: 26, z0: 6, z1: 16, top: CT_Y, kind: 'cobble', deep: true },
  { x0: 26, x1: 37.2, z0: 8, z1: 16, top: CT_Y, kind: 'cobble', deep: true },
  // 后巷收到楼北：x 从 26 起，把楼梯东缘与 A 大西墙之间原来会掉出去的坑补平
  { x0: 26, x1: 37.2, z0: 16, z1: 35, top: CT_Y, kind: 'cobble', deep: true },
  // 后坡低端以南，接到药房北墙
  { x0: 37.2, x1: 42, z0: 24, z1: 35, top: CT_Y, kind: 'cobble', deep: true },
  { x0: -5, x1: 5, z0: 26, z1: 30, top: MID_N_Y, kind: 'road', deep: true },
  { x0: 5, x1: 22, z0: 26, z1: 56, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: CT_Y },
  { x0: 22, x1: 26, z0: 30.5, z1: 46, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: -0.2 },
  { x0: 5, x1: 22.2, z0: 24.2, z1: 26, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: CT_Y },
  // 猫道加宽后底下的填实：顶面比警家地面低 5 cm（防共面），深填所以不挡猫道上的走位
  { x0: 5, x1: 22.2, z0: 24.2, z1: 50, top: CT_Y - 0.05, kind: 'cave', deep: true },
  // 北侧宫殿。南缘 z=8，下面是警家广场
  { x0: 26, x1: 54, z0: 4, z1: 8, top: A_PLAT_Y, kind: 'cobble', deep: true },
  // 东侧包点，南缘接 A 斜坡；西段收到后坡北端，不伸进广场
  { x0: 42, x1: 54, z0: 8, z1: 16, top: A_PLAT_Y, kind: 'cobble', deep: true },
  { x0: 37.2, x1: 42, z0: 8, z1: 15.7, top: A_PLAT_Y, kind: 'cobble', deep: true },
  // 小楼梯 ↔ A 平台。只占西侧；东缘 x=30 以外没有第二层，往 A 大跳下去是后巷
  { x0: 22, x1: 30, z0: 16, z1: 24.2, top: A_PLAT_Y, kind: 'cobble', deep: true },
  { x0: 42, x1: 54, z0: 24, z1: 50, top: LONG_Y, kind: 'asphalt', deep: true },
  { x0: 42, x1: 54, z0: 58, z1: 70, top: PIT_Y, kind: 'cave', deep: true },
];

export const STAIRS = [
  { x0: -27, x1: -23, z0: 30, z1: 40, from: B1_Y, to: B2_Y, dir: '-x' },
  { x0: 22.2, x1: 26.0, z0: 24.2, z1: 30.6, from: A_SMALL_Y, to: A_PLAT_Y, dir: '-z', stepH: 0.14, kind: 'stone' },
];

export const RAMPS = [
  { x0: -18, x1: -10, z0: 68, z1: 80, from: T_Y, to: GARDEN_Y, dir: '-x' },
  { x0: 12, x1: 36, z0: 68, z1: 78, from: T_Y, to: ROAD_Y, dir: 'x' },
  { x0: -33, x1: -27, z0: 52, z1: 56, from: B2_Y, to: GARDEN_Y, dir: 'z' },
  { x0: -33, x1: -27, z0: 20, z1: 24, from: B2_Y, to: B_Y, dir: '-z' },
  { x0: -9, x1: -1, z0: 12, z1: 20, from: B_Y, to: CT_Y, dir: 'x' },
  { x0: 8, x1: 18, z0: 56, z1: 62, from: MID_S_Y, to: A_SMALL_Y, dir: '-z' },
  { x0: -13, x1: -5, z0: 28, z1: 36, from: MID_N_Y, to: B1_Y, dir: '-x' },
  { x0: -5, x1: 5, z0: 30, z1: 52, from: MID_N_Y, to: MID_S_Y, dir: 'z' },
  { x0: 0, x1: 5, z0: 52, z1: 64, from: ROAD_Y, to: MID_S_Y, dir: '-z' },
  { x0: 24, x1: 38, z0: 62, z1: 66, from: ROAD_Y, to: MID_S_Y, dir: '-x' },
  { x0: 30, x1: 42, z0: 50, z1: 64, from: LONG_Y, to: ROAD_Y, dir: 'z' },
  { x0: 42, x1: 54, z0: 16, z1: 24, from: A_PLAT_Y, to: LONG_Y, dir: 'z' },
  // A 后坡：东包点西南缘降到后巷。北高南低，低端接后巷
  { x0: 37.2, x1: 42.4, z0: 15.7, z1: 24, from: A_PLAT_Y, to: CT_Y, dir: 'z' },
  { x0: 42, x1: 54, z0: 50, z1: 58, from: LONG_Y, to: PIT_Y, dir: 'z' },
];

export const WALLS = [
  { x0: -44.6, x1: -44, z0: 0, z1: 88 },
  { x0: 68, x1: 68.6, z0: 0, z1: 88 },
  { x0: -44, x1: 68, z0: -0.6, z1: 0 },
  { x0: -44, x1: 68, z0: 88, z1: 88.6 },
  { x0: -42.6, x1: -42, z0: 4, z1: 80 },
  { x0: -9.6, x1: -9.02, z0: 4, z1: 6 },
  { x0: -9.6, x1: -9.02, z0: 11, z1: 12 },
  { x0: -9.6, x1: -9.02, z0: 20, z1: 22 },
  { x0: -5, x1: -4, z0: 25.4, z1: 26.2 },
  { x0: 4, x1: 5, z0: 25.4, z1: 26.2 },
  { x0: 66, x1: 66.6, z0: 20, z1: 50 },
  { x0: -10.2, x1: 11.5, z0: 67.6, z1: 68.3 },
  { x0: 20.4, x1: 38, z0: 67.6, z1: 68.3 },
  { x0: 21.6, x1: 24.2, z0: 63, z1: 67.6 },
  { x0: 41.3, x1: 42.1, z0: 50.5, z1: 74 },
];

export const MASS = [
  { x0: -27, x1: -23, z0: 24, z1: 30 },
  { x0: -37, x1: -33, z0: 22, z1: 56 },
  { x0: -27, x1: -23, z0: 40, z1: 56 },
  { x0: -23, x1: -11, z0: 40, z1: 56 },
  { x0: -11, x1: -5, z0: 36, z1: 56 },
  { x0: -11, x1: -5, z0: 22, z1: 28 },
  { x0: -11, x1: -5, z0: 56, z1: 66 },
  { x0: -18, x1: 0, z0: 60, z1: 68 },
  { x0: 26, x1: 41.6, z0: 35, z1: 42 },
  { x0: 22, x1: 30.02, z0: 50, z1: 56 }, // 猫道南延后贴在 x=22 东侧；东缘收 2cm，避开 A 门西门柱
  { x0: 18, x1: 30.02, z0: 56, z1: 62 }, // 小道楼梯东墙，随楼梯南移
  { x0: 22, x1: 26, z0: 46, z1: 50 },
  // 转角塔 / 拱廊 / 绿棚楼的地下部分并进了上面那条猫道填实，
  // 楼体本身的挡人改由 world/short.js 按可见高度登记。
  { x0: -44, x1: 68, z0: 0, z1: 4 },
  { x0: -44, x1: 68, z0: 84, z1: 88 },
  { x0: -44, x1: -18, z0: 80, z1: 84 },
  { x0: -18, x1: -10, z0: 80, z1: 84 },
  { x0: 13, x1: 68, z0: 78, z1: 84 },
  { x0: 42, x1: 56, z0: 70, z1: 78 },
  { x0: -27, x1: -11, z0: 22, z1: 24 },
  { x0: -23, x1: -11, z0: 24, z1: 28 },
  { x0: 54, x1: 68, z0: 4, z1: 78 },
];

export const CEILS = [
  { x0: -33, x1: -27, z0: 28, z1: 52, bottom: B2_Y + 4.6, kind: 'cave', room: true },
  { x0: 0, x1: 5, z0: 54, z1: 63, bottom: 2.7, kind: 'cave', room: true },
  // B1 入口通道顶与 B1 顶板：把中门到 B1 的下行段封成室内，视线和灯一路照进底层
  { x0: -11.1, x1: -4.66, z0: 27.98, z1: 36.02, bottom: MID_N_Y + 3.8, kind: 'cave', room: true },
  { x0: -23, x1: -11.0, z0: 27.9, z1: 40.1, bottom: MID_N_Y + 3.8, kind: 'cave', room: true },
];

export const ROOMS = [
  { x0: -33, x1: -27, z0: 28, z1: 52, y0: GARDEN_Y, y1: B2_Y + 4.6 },
  { x0: 0, x1: 5, z0: 54, z1: 63, y0: ROAD_Y, y1: 2.7 },
  { x0: 10, x1: 21.4, z0: 4, z1: 16.4, y0: CT_Y, y1: CT_Y + 4.05 },
  { x0: -11.1, x1: -4.6, z0: 27.9, z1: 36.1, y0: B1_Y, y1: MID_N_Y + 3.8 },   // B1 入口通道
  { x0: -23, x1: -11, z0: 28, z1: 40, y0: B1_Y, y1: MID_N_Y + 3.8 },          // B1
];

export const SPAWNS = {
  t: { x: 2, y: T_Y, z: 76, yaw: Math.PI, label: '匪家' },
  garden: { x: -28, y: GARDEN_Y, z: 66, yaw: Math.PI, label: '后花园' },
  b2: { x: -30, y: B2_Y, z: 38, yaw: Math.PI, label: 'B2' },
  b: { x: -19, y: B_Y, z: 14, yaw: 0, label: 'B 包点' },
  b1: { x: -17, y: B1_Y, z: 34, yaw: 0, label: 'B1' },
  mid: { x: 0, y: MID_N_Y, z: 28, yaw: Math.PI, label: '中路' },
  midfar: { x: 16, y: ROAD_Y, z: 66, yaw: Math.PI, label: '暗道' },
  ct: { x: 16, y: CT_Y, z: 12, yaw: Math.PI / 2, label: '警家' },
  a: { x: 26, y: A_PLAT_Y, z: 20, yaw: 0, label: 'A 平台' },
  asmall: { x: 19.4, y: A_SMALL_Y, z: 43, yaw: Math.PI, label: 'A 小' },
  long: { x: 48, y: LONG_Y, z: 40, yaw: Math.PI, label: 'A 大' },
  lane: { x: 31.0, y: CT_Y, z: 17.5, yaw: Math.PI, label: 'A 后巷' },
  pit: { x: 48, y: PIT_Y, z: 64, yaw: Math.PI, label: 'A 坑' },
};

export const ZONES = [
  { name: '匪家', x0: -10, x1: 12, z0: 68, z1: 84, y0: 2.4, y1: 4.4 },
  { name: '东斜坡', x0: 12, x1: 36, z0: 68, z1: 78, y0: 0.2, y1: 4.2 },
  { name: '后花园', x0: -42, x1: -16, z0: 56, z1: 80, y0: -0.8, y1: 1.2 },
  { name: 'B2/B 通', x0: -33, x1: -27, z0: 22, z1: 56, y0: 0, y1: 2.4 },
  { name: '旋转楼梯', x0: -27, x1: -23, z0: 30, z1: 40, y0: -2.4, y1: 2.4 },
  { name: 'B1', x0: -23, x1: -11, z0: 28, z1: 40, y0: -2.4, y1: -0.4 },
  { name: 'B1 入口', x0: -13, x1: -5, z0: 28, z1: 36, y0: -2.4, y1: 1.2 },
  { name: 'B 洞', x0: -33, x1: -27, z0: 20, z1: 24, y0: 0.8, y1: 3.4 },
  { name: 'B 包点', x0: -31, x1: -9, z0: 4, z1: 22, y0: 1.2, y1: 3.4 },
  { name: 'B 门', x0: -11, x1: -5, z0: 12, z1: 20, y0: -1.4, y1: 3.4 },
  { name: 'B 窗', x0: -11, x1: -5, z0: 6, z1: 11, y0: -1.4, y1: 3.4 },
  { name: '沙地', x0: -9, x1: 10, z0: 4, z1: 26, y0: -1.8, y1: 0.4 },
  { name: '警家', x0: 10, x1: 21.2, z0: 4, z1: 16, y0: -1.8, y1: 2.4 },
  // 与警家同一层、露天相接的楼北巷。新楼（asite.backBlock）压掉 z>26 那一片后只剩北侧一条。
  { name: 'A 后巷', x0: 18, x1: 42, z0: 6, z1: 26, y0: -1.8, y1: 2.6 },
  { name: 'A 后坡', x0: 37.2, x1: 42.6, z0: 15.5, z1: 24.2, y0: -1.2, y1: 5.4 },
  { name: 'A 小楼梯', x0: 22, x1: 26, z0: 22, z1: 31, y0: 1.0, y1: 5.2 },
  { name: 'A 小道', x0: 5, x1: 26, z0: 26, z1: 56, y0: 0.8, y1: 2.2 },
  { name: '小道楼梯', x0: 8, x1: 18, z0: 56, z1: 62, y0: 0.4, y1: 2.2 },
  { name: '中门', x0: -4, x1: 4, z0: 24, z1: 30, y0: -1.4, y1: 1.2 },
  { name: '中路', x0: -5, x1: 5, z0: 26, z1: 60, y0: -1.4, y1: 1.8 },
  { name: '暗道', x0: 0, x1: 24, z0: 54, z1: 70, y0: -0.8, y1: 1.0 },
  { name: '空地', x0: 24, x1: 42, z0: 63, z1: 78, y0: -0.6, y1: 1.2 },
  { name: 'A 平台', x0: 22, x1: 54, z0: 4, z1: 24.2, y0: 4.2, y1: 7.2 },
  { name: 'A 斜坡', x0: 42, x1: 54, z0: 16, z1: 24, y0: 0.4, y1: 6.2 },
  { name: 'A 门', x0: 28, x1: 42, z0: 42, z1: 52, y0: 0.1, y1: 1.8 },
  { name: 'A 大', x0: 42, x1: 54, z0: 24, z1: 50, y0: 0.0, y1: 1.6 },
  { name: 'A 坑', x0: 42, x1: 54, z0: 50, z1: 70, y0: -3.3, y1: 0.6 },
];
