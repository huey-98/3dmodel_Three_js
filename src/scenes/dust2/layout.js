// 炙热沙城二（Dust2）· 按 CS2 官方雷达走位。X 东、Z 南、Y 上；雷达北=z 小。
// 匪家北缘开阔自杀位正对中门；中路南高北低；A 小只从中路经小道楼梯/Xbox 上猫道；
// A 门在 A 大南端（连续两道金属门）；A 坑在 A 大东侧；B1 洞口正对中门/Xbox；B 窗在 B 门北。
export const T_Y = 3.25;
export const GARDEN_Y = 0.0;
export const B2_Y = 1.6;
export const B1_Y = -1.6;
export const B_Y = 2.0;
export const CT_Y = -1.0;
export const MID_N_Y = 0.0;
export const MID_S_Y = 1.2;
export const MID_Y = MID_N_Y;
export const A_SMALL_Y = 1.6;
export const A_PLAT_Y = 3.0;
export const GOOSE_Y = 0.8;
export const CROSS_Y = 0.4;
export const LONG_Y = 0.8;
export const PIT_Y = -2.5;
export const SIDE_PIT_Y = -1.2;
export const ROAD_Y = 0.0;
export const WALL_H = 6;
export const VOID_Y = -5.6;
export const SLAB = 0.8;

export const FLOORS = [
  { x0: -10, x1: 12, z0: 66, z1: 84, top: T_Y, kind: 'road', deep: true },
  { x0: -42, x1: -16, z0: 56, z1: 76, top: GARDEN_Y, kind: 'sand', deep: true },
  { x0: 22, x1: 56, z0: 62, z1: 78, top: ROAD_Y, kind: 'road', deep: true },
  { x0: -42, x1: -32, z0: 22, z1: 52, top: B2_Y, kind: 'cave', deep: true },
  { x0: -28, x1: -16, z0: 28, z1: 40, top: B1_Y, kind: 'cobble', deep: true },
  { x0: -36, x1: -14, z0: 4, z1: 22, top: B_Y, kind: 'cobble', deep: false, bottom: -1.0 },
  { x0: -42, x1: -36, z0: 4, z1: 20, top: B_Y, kind: 'cobble', deep: true },
  { x0: -14, x1: 10, z0: 4, z1: 26, top: CT_Y, kind: 'sand', deep: true },
  { x0: 10, x1: 21, z0: 4, z1: 16, top: CT_Y, kind: 'sand', deep: true },
  { x0: 21, x1: 26, z0: 4, z1: 24, top: CT_Y, kind: 'cobble', deep: true },
  { x0: 10, x1: 21, z0: 16, z1: 24, top: CT_Y, kind: 'cobble', deep: true },
  { x0: -10, x1: 10, z0: 26, z1: 30, top: MID_N_Y, kind: 'road', deep: true },
  { x0: -10, x1: 10, z0: 56, z1: 66, top: MID_S_Y, kind: 'road', deep: true },
  { x0: 10, x1: 22, z0: 26, z1: 50, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: -0.2 },
  { x0: 22, x1: 26, z0: 30.5, z1: 46, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: -0.2 },
  { x0: 10, x1: 22.2, z0: 24.2, z1: 26, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: -0.2 },
  { x0: 26, x1: 46, z0: 4, z1: 16, top: A_PLAT_Y, kind: 'cobble', deep: true },
  { x0: 36, x1: 46, z0: 16, z1: 22, top: A_PLAT_Y, kind: 'cobble', deep: true },
  { x0: 26, x1: 36, z0: 16, z1: 22, top: A_PLAT_Y, kind: 'cobble', deep: false, bottom: 2.7 },
  { x0: 22, x1: 26, z0: 16, z1: 24.2, top: A_PLAT_Y, kind: 'cobble', deep: false, bottom: 2.7 },
  { x0: 26, x1: 36, z0: 16, z1: 32, top: GOOSE_Y, kind: 'cobble', deep: true },
  { x0: 36, x1: 42, z0: 30, z1: 32, top: LONG_Y, kind: 'asphalt', deep: true },
  { x0: 16, x1: 22, z0: 18, z1: 20, top: CROSS_Y, kind: 'cobble', deep: false, bottom: CT_Y },
  { x0: 42, x1: 54, z0: 30, z1: 58, top: LONG_Y, kind: 'asphalt', deep: true },
  { x0: 54, x1: 56, z0: 30, z1: 58, top: LONG_Y, kind: 'cobble', deep: true },
  { x0: 46, x1: 54, z0: 16, z1: 30, top: LONG_Y, kind: 'asphalt', deep: true },
  { x0: 54, x1: 56, z0: 16, z1: 30, top: LONG_Y, kind: 'cobble', deep: true },
  { x0: 46, x1: 50, z0: 4, z1: 16, top: LONG_Y, kind: 'asphalt', deep: true },
  { x0: 45, x1: 53, z0: 58, z1: 62, top: LONG_Y, kind: 'road', deep: true },
  { x0: 56, x1: 66, z0: 20, z1: 38, top: PIT_Y, kind: 'cave', deep: true },
  { x0: 56, x1: 64, z0: 38, z1: 50, top: SIDE_PIT_Y, kind: 'cave', deep: true },
];

export const STAIRS = [
  { x0: -32, x1: -28, z0: 30, z1: 40, from: B1_Y, to: B2_Y, dir: '-x' },
  { x0: 16, x1: 22, z0: 14, z1: 18, from: CT_Y, to: CROSS_Y, dir: 'z' },
  { x0: 22.2, x1: 26.0, z0: 24.2, z1: 30.6, from: A_SMALL_Y, to: A_PLAT_Y, dir: '-z', stepH: 0.14, kind: 'stone' },
];

export const RAMPS = [
  { x0: -16, x1: -10, z0: 66, z1: 76, from: T_Y, to: GARDEN_Y, dir: '-x' },
  { x0: 12, x1: 22, z0: 66, z1: 76, from: T_Y, to: ROAD_Y, dir: 'x' },
  { x0: -42, x1: -32, z0: 52, z1: 56, from: B2_Y, to: GARDEN_Y, dir: 'z' },
  { x0: -38, x1: -32, z0: 20, z1: 24, from: B2_Y, to: B_Y, dir: '-z' },
  { x0: -14, x1: -6, z0: 12, z1: 20, from: B_Y, to: CT_Y, dir: 'x' },
  { x0: 20, x1: 28, z0: 4, z1: 14, from: CT_Y, to: A_PLAT_Y, dir: 'x' },
  { x0: 22, x1: 26, z0: 16, z1: 22, from: CT_Y, to: GOOSE_Y, dir: 'x' },
  { x0: 8, x1: 18, z0: 50, z1: 56, from: MID_S_Y, to: A_SMALL_Y, dir: '-z' },
  { x0: -18, x1: -10, z0: 28, z1: 36, from: MID_N_Y, to: B1_Y, dir: '-x' },
  { x0: -10, x1: 10, z0: 30, z1: 56, from: MID_N_Y, to: MID_S_Y, dir: 'z' },
  { x0: 36, x1: 46, z0: 22, z1: 30, from: A_PLAT_Y, to: LONG_Y, dir: 'z' },
  { x0: 56, x1: 62, z0: 16, z1: 22, from: A_PLAT_Y, to: PIT_Y, dir: 'z' },
  { x0: 54, x1: 58, z0: 48, z1: 54, from: SIDE_PIT_Y, to: LONG_Y, dir: 'z' },
  { x0: 45, x1: 53, z0: 62, z1: 66, from: LONG_Y, to: ROAD_Y, dir: 'z' },
  { x0: -4, x1: 4, z0: 22, z1: 26, from: CT_Y, to: MID_N_Y, dir: 'z' },
];

export const WALLS = [
  { x0: -44.6, x1: -44, z0: 0, z1: 88 },
  { x0: 68, x1: 68.6, z0: 0, z1: 88 },
  { x0: -44, x1: 68, z0: -0.6, z1: 0 },
  { x0: -44, x1: 68, z0: 88, z1: 88.6 },
  { x0: -42.6, x1: -42, z0: 4, z1: 76 },
  { x0: -14.6, x1: -14, z0: 4, z1: 6 },
  { x0: -14.6, x1: -14, z0: 11, z1: 12 },
  { x0: -14.6, x1: -14, z0: 20, z1: 22 },
  { x0: -10.6, x1: -10, z0: 26, z1: 28 },
  { x0: -10.6, x1: -10, z0: 36, z1: 56 },
  { x0: -10, x1: -4, z0: 25.4, z1: 26.2 },
  { x0: 4, x1: 10, z0: 25.4, z1: 26.2 },
  { x0: 25.4, x1: 26, z0: 8, z1: 16 },
  { x0: 36, x1: 46, z0: 21.4, z1: 22, top: A_PLAT_Y + 1.15, para: true, kind: 'plaster' },
  { x0: 45.7, x1: 46.3, z0: 4, z1: 22, top: A_PLAT_Y + 0.45, para: true, kind: 'plaster' },
  { x0: 66, x1: 66.6, z0: 20, z1: 50 },
];

export const MASS = [
  { x0: -32, x1: -28, z0: 24, z1: 30 },
  { x0: -32, x1: -28, z0: 40, z1: 56 },
  { x0: -28, x1: -16, z0: 40, z1: 56 },
  { x0: -16, x1: -10, z0: 36, z1: 56 },
  { x0: -16, x1: -10, z0: 22, z1: 28 },
  { x0: 10, x1: 42, z0: 56.6, z1: 62 },
  { x0: 10, x1: 21.6, z0: 62, z1: 66 },
  { x0: -16, x1: -10, z0: 56, z1: 66 },
  { x0: 18.4, x1: 42, z0: 50, z1: 56.6 },
  { x0: 22, x1: 26, z0: 46, z1: 50 },
  { x0: 16.4, x1: 22.2, z0: 24.2, z1: 32.8 },
  { x0: 10.0, x1: 14.6, z0: 24.2, z1: 27.8 },
  { x0: 10.0, x1: 11.5, z0: 33.2, z1: 38.0 },
  { x0: 26, x1: 42, z0: 32, z1: 50 },
  { x0: 42, x1: 45, z0: 56, z1: 64 },
  { x0: 53, x1: 56, z0: 56, z1: 64 },
  { x0: -44, x1: 68, z0: 0, z1: 4 },
  { x0: -44, x1: 68, z0: 84, z1: 88 },
  { x0: -44, x1: -10, z0: 76, z1: 84 },
  { x0: 22, x1: 68, z0: 78, z1: 84 },
  { x0: -32, x1: -14, z0: 22, z1: 24 },
  { x0: 50, x1: 56, z0: 4, z1: 16 },
];

export const CEILS = [
  { x0: -42, x1: -32, z0: 28, z1: 52, bottom: B2_Y + 2.4, kind: 'cave', room: true },
  { x0: 45, x1: 53, z0: 56, z1: 62, bottom: 4.9, kind: 'sand', room: true },
];

export const ROOMS = [
  { x0: -42, x1: -32, z0: 28, z1: 52, y0: GARDEN_Y, y1: B2_Y + 2.4 },
  { x0: 45, x1: 53, z0: 56, z1: 62, y0: LONG_Y, y1: 4.9 },
  { x0: 10, x1: 21.2, z0: 4, z1: 16.2, y0: CT_Y, y1: CT_Y + 3.8 },
  { x0: 26, x1: 36, z0: 16, z1: 22, y0: GOOSE_Y, y1: 2.85 },
];

export const SPAWNS = {
  t: { x: 2, y: T_Y, z: 76, yaw: Math.PI, label: '匪家' },
  garden: { x: -28, y: GARDEN_Y, z: 66, yaw: Math.PI, label: '后花园' },
  b2: { x: -37, y: B2_Y, z: 38, yaw: Math.PI, label: 'B2' },
  b: { x: -24, y: B_Y, z: 14, yaw: 0, label: 'B 包点' },
  b1: { x: -22, y: B1_Y, z: 34, yaw: 0, label: 'B1' },
  mid: { x: 0, y: MID_N_Y, z: 28, yaw: Math.PI, label: '中路' },
  midfar: { x: 0, y: MID_S_Y, z: 60, yaw: Math.PI, label: '中远' },
  ct: { x: 16, y: CT_Y, z: 12, yaw: Math.PI / 2, label: '警家' },
  a: { x: 34, y: A_PLAT_Y, z: 14, yaw: 0, label: 'A 平台' },
  asmall: { x: 19.4, y: A_SMALL_Y, z: 39.2, yaw: Math.PI, label: 'A 小' },
  long: { x: 49, y: LONG_Y, z: 44, yaw: Math.PI, label: 'A 大' },
  pit: { x: 60, y: PIT_Y, z: 30, yaw: Math.PI, label: 'A 坑' },
};

export const ZONES = [
  { name: '匪家', x0: -10, x1: 12, z0: 66, z1: 84, y0: 2.4, y1: 4.4 },
  { name: '自杀位', x0: -10, x1: 10, z0: 62, z1: 66, y0: 0.4, y1: 4.4 },
  { name: '后花园', x0: -42, x1: -16, z0: 56, z1: 76, y0: -0.8, y1: 1.2 },
  { name: 'B2/B 通', x0: -42, x1: -32, z0: 22, z1: 56, y0: 0, y1: 2.4 },
  { name: '旋转楼梯', x0: -32, x1: -28, z0: 30, z1: 40, y0: -2.4, y1: 2.4 },
  { name: 'B1', x0: -28, x1: -16, z0: 28, z1: 40, y0: -2.4, y1: -0.4 },
  { name: 'B1 入口', x0: -18, x1: -10, z0: 28, z1: 36, y0: -2.4, y1: 1.2 },
  { name: 'B 洞', x0: -38, x1: -32, z0: 20, z1: 24, y0: 0.8, y1: 3.4 },
  { name: 'B 包点', x0: -36, x1: -14, z0: 4, z1: 22, y0: 1.2, y1: 3.4 },
  { name: 'B 门', x0: -16, x1: -10, z0: 12, z1: 20, y0: -1.4, y1: 3.4 },
  { name: 'B 窗', x0: -16, x1: -10, z0: 6, z1: 11, y0: -1.4, y1: 3.4 },
  { name: '沙地', x0: -14, x1: 10, z0: 4, z1: 26, y0: -1.8, y1: 0.4 },
  { name: '警家', x0: 10, x1: 26, z0: 4, z1: 24, y0: -1.8, y1: 0.2 },
  { name: '电梯位', x0: 20, x1: 28, z0: 4, z1: 14, y0: -1.8, y1: 3.8 },
  { name: 'Boost', x0: 20, x1: 26, z0: 6, z1: 14, y0: -1.8, y1: 3.8 },
  { name: 'Cross', x0: 16, x1: 22, z0: 14, z1: 20, y0: -1.8, y1: 1.6 },
  { name: 'Goose', x0: 26, x1: 36, z0: 16, z1: 32, y0: 0.2, y1: 2.6 },
  { name: 'A 小楼梯', x0: 22, x1: 26, z0: 22, z1: 31, y0: 1.0, y1: 3.8 },
  { name: 'A 小道', x0: 10, x1: 26, z0: 26, z1: 50, y0: 0.8, y1: 2.2 },
  { name: '小道楼梯', x0: 8, x1: 18, z0: 50, z1: 56, y0: 0.4, y1: 2.2 },
  { name: '中门', x0: -4, x1: 4, z0: 24, z1: 30, y0: -0.8, y1: 1.2 },
  { name: '中路', x0: -10, x1: 10, z0: 26, z1: 56, y0: -0.8, y1: 1.8 },
  { name: '中远', x0: -10, x1: 10, z0: 56, z1: 66, y0: 0.4, y1: 1.8 },
  { name: '匪口', x0: 22, x1: 45, z0: 62, z1: 78, y0: -0.8, y1: 1.2 },
  { name: 'A 平台', x0: 22, x1: 46, z0: 4, z1: 24, y0: 2.2, y1: 3.8 },
  { name: 'A 斜坡', x0: 36, x1: 46, z0: 22, z1: 30, y0: 0, y1: 3.8 },
  { name: 'A 大', x0: 42, x1: 56, z0: 30, z1: 58, y0: 0, y1: 1.6 },
  { name: 'A 门', x0: 45, x1: 53, z0: 56, z1: 66, y0: 0, y1: 1.6 },
  { name: 'A 坑', x0: 56, x1: 66, z0: 20, z1: 38, y0: -3.2, y1: -1.6 },
  { name: 'A 大坑', x0: 56, x1: 64, z0: 38, z1: 50, y0: -2.0, y1: -0.4 },
];
