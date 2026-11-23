// 炙热沙城二（Dust2）· 中文点位雷达 + 用户高差描述。X 东、Z 南、Y 上；雷达北=z 小。
// 中路北下坡→中门；中门西 B1→旋转楼梯上 B2；B2 南通道→后花园、北 B 洞→B 点；
// B 门在 B 点东，门外沙地往东下坡→警家；中门东叉箱上 A 小→A 小楼梯上 A 平台，A 小可跳下警家；
// 警家往东上坡→A 大；A 大接 A 斜坡（向北 uphill），坡左=A 平台。
export const T_Y = 3.25;
export const GARDEN_Y = 0.0;
export const B2_Y = 1.6;
export const B1_Y = 0.0;
export const B_Y = 2.5;
export const SAND_W_Y = 2.5;   // 沙地西端（B 门外）
export const CT_Y = -3.25;
export const LOWER_Y = -3.25;
export const MID_Y = 0.0;
export const A_SMALL_Y = 1.0;
export const A_PLAT_Y = 2.0;   // A 平台 / A 包点
export const LONG_Y = 0.8;     // A 大
export const PIT_Y = -3.0;
export const ROAD_Y = 0.0;
export const WALL_H = 6;
export const VOID_Y = -5.6;
export const SLAB = 0.8;

export const FLOORS = [
  { x0: -8, x1: 20, z0: 70, z1: 84, top: T_Y, kind: 'road', deep: true },
  { x0: -14, x1: -8, z0: 70, z1: 78, top: T_Y, kind: 'road', deep: true },   // 匪家西侧填平（原空洞）
  { x0: -8, x1: -6, z0: 64, z1: 70, top: T_Y, kind: 'road', deep: true },    // 原西墙墩改平台
  { x0: -40, x1: -14, z0: 56, z1: 78, top: GARDEN_Y, kind: 'sand', deep: true },
  { x0: 20, x1: 44, z0: 56, z1: 70, top: ROAD_Y, kind: 'road', deep: true },
  { x0: 6, x1: 20, z0: 56, z1: 70, top: ROAD_Y, kind: 'cobble', deep: true },
  // B2（西缘抬高，南端 z[52,56] 留给下后花园的台阶）+ B1 + B 点
  { x0: -40, x1: -32, z0: 26, z1: 52, top: B2_Y, kind: 'cave', deep: true },
  { x0: -26, x1: -6, z0: 26, z1: 40, top: B1_Y, kind: 'cobble', deep: true },
  { x0: -32, x1: -14, z0: 6, z1: 26, top: B_Y, kind: 'cobble', deep: false, bottom: -1.0 },
  { x0: -40, x1: -32, z0: 6, z1: 20, top: B_Y, kind: 'cobble', deep: true },  // B 包点西侧填平（原断层空洞）
  // 警家（含东上坡口）
  { x0: 10, x1: 20, z0: 6, z1: 40, top: CT_Y, kind: 'cobble', deep: true },
  // 中路（北段中门 / 南段中远 / 有顶暗道），实地
  { x0: -6, x1: 6, z0: 26, z1: 40, top: MID_Y, kind: 'road', deep: true },
  { x0: -6, x1: 6, z0: 40, z1: 56, top: MID_Y, kind: 'road', deep: true },
  { x0: -4, x1: 4, z0: 56, z1: 70, top: MID_Y, kind: 'cave', deep: true },   // 暗道（有顶，北出中路，匪家跳下）
  // 沙地西端平台（B 门外落脚）+ A 小（中门东，警家上方）/ A 平台 / A 大 / A 坑
  { x0: -14, x1: -11, z0: 10, z1: 26, top: SAND_W_Y, kind: 'sand', deep: true },
  { x0: 6, x1: 16, z0: 26, z1: 40, top: A_SMALL_Y, kind: 'cobble', deep: false, bottom: -0.2 }, // A 小道猫道（抬高）
  { x0: 6, x1: 16, z0: 44, z1: 52, top: MID_Y, kind: 'cobble', deep: true },   // A 小通道（匪口侧地面入口）
  { x0: -12, x1: -6, z0: 40, z1: 48, top: MID_Y, kind: 'cobble', deep: true }, // B1 入口通道（匪口侧地面）
  { x0: 26, x1: 44, z0: 6, z1: 26, top: A_PLAT_Y, kind: 'cobble', deep: true },
  { x0: 44, x1: 52, z0: 26, z1: 64, top: LONG_Y, kind: 'road', deep: true },
  { x0: 40, x1: 44, z0: 40, z1: 56, top: PIT_Y, kind: 'cave', deep: true },
];

// 旋转楼梯保留台阶；其余坡道见 RAMPS（平滑斜坡）。
export const STAIRS = [
  { x0: -32, x1: -26, z0: 30, z1: 40, from: B1_Y, to: B2_Y, dir: '-x' },     // 旋转楼梯 B1 上 B2
];

export const RAMPS = [
  { x0: -14, x1: -8, z0: 64, z1: 70, from: T_Y, to: GARDEN_Y, dir: '-x' },   // 匪家西下后花园
  { x0: -40, x1: -32, z0: 52, z1: 56, from: B2_Y, to: GARDEN_Y, dir: 'z' },  // B2 南通道下后花园
  { x0: -36, x1: -30, z0: 20, z1: 26, from: B2_Y, to: B_Y, dir: '-z' },      // B 洞上 B 点
  { x0: -11, x1: 10, z0: 10, z1: 26, from: SAND_W_Y, to: CT_Y, dir: 'x' },   // 沙地往东下坡到警家
  { x0: 20, x1: 26, z0: 6, z1: 14, from: CT_Y, to: A_PLAT_Y, dir: 'x' },     // 警家斜坡上 A 平台
  { x0: 16, x1: 26, z0: 20, z1: 26, from: A_SMALL_Y, to: A_PLAT_Y, dir: '-z' }, // A 小楼梯上 A 平台
  { x0: 6, x1: 16, z0: 40, z1: 44, from: MID_Y, to: A_SMALL_Y, dir: '-z' },  // 小道楼梯：A 小通道上 A 小道猫道
  { x0: 20, x1: 44, z0: 34, z1: 40, from: CT_Y, to: LONG_Y, dir: 'x' },      // 警家往东上坡接 A 大
  { x0: 34, x1: 44, z0: 26, z1: 34, from: LONG_Y, to: A_PLAT_Y, dir: '-z' }, // A 大斜坡向北 uphill
  { x0: 40, x1: 44, z0: 56, z1: 60, from: PIT_Y, to: LONG_Y, dir: 'z' },     // A 坑回 A 大
  { x0: 42, x1: 44, z0: 56, z1: 64, from: ROAD_Y, to: LONG_Y, dir: 'x' },    // A 门内上 A 大
];

export const WALLS = [
  { x0: -44.6, x1: -44, z0: 0, z1: 88 },
  { x0: 56, x1: 56.6, z0: 0, z1: 88 },
  { x0: -44, x1: 56, z0: -0.6, z1: 0 },
  { x0: -44, x1: 56, z0: 88, z1: 88.6 },
  { x0: -40.6, x1: -40, z0: 6, z1: 78 },    // 西缘内墙（B2/后花园西侧封边）
  { x0: -26, x1: -16, z0: 25.4, z1: 26 },   // B1 北墙肩
  { x0: -14.6, x1: -14, z0: 6, z1: 10 },    // B 点东墙北段（B 门洞 z[10,20]）
  { x0: -14.6, x1: -14, z0: 20, z1: 26 },   // B 点东墙南段
  { x0: 6, x1: 16, z0: 25.4, z1: 26 },      // A 小北墙肩（A 小楼梯洞 x[16,26]）
  { x0: 25.4, x1: 26, z0: 14, z1: 20 },     // A 平台西墙肩（电梯位洞 z[6,14]）
  { x0: 39.4, x1: 40, z0: 40, z1: 56 },     // A 坑西墙
  { x0: 26, x1: 34, z0: 25.4, z1: 26, top: A_PLAT_Y + 1.1, para: true, kind: 'plaster' }, // A 平台南缘矮墙（留 x[34,44] 斜坡上口）
  { x0: 52, x1: 52.6, z0: 26, z1: 64 },     // A 大东墙
  { x0: -6.6, x1: -6, z0: 56, z1: 64 },     // 中路南段西墙肩
  { x0: -6.6, x1: -6, z0: 40, z1: 44 },     // B1 门北肩（门洞 z[44,48]）
  { x0: 5.4, x1: 6, z0: 40, z1: 44 },       // A 小缺口北肩（缺口 z[44,52]）
];

export const MASS = [
  { x0: -32, x1: -26, z0: 26, z1: 30 },
  { x0: -32, x1: -26, z0: 40, z1: 56 },
  { x0: -26, x1: -12, z0: 40, z1: 56 },
  { x0: -12, x1: -6, z0: 48, z1: 56 },
  { x0: -14, x1: -6, z0: 56, z1: 64 },
  { x0: -6, x1: -4, z0: 56, z1: 70 },       // 暗道西墙
  { x0: 4, x1: 6, z0: 56, z1: 70 },         // 暗道东墙
  { x0: 16, x1: 20, z0: 40, z1: 56 },
  { x0: 6, x1: 20, z0: 52, z1: 56 },
  { x0: 20, x1: 26, z0: 14, z1: 20 },
  { x0: 20, x1: 36, z0: 40, z1: 56 },
  { x0: 36, x1: 40, z0: 40, z1: 56 },
  { x0: 44, x1: 52, z0: 64, z1: 70 },
  { x0: -44, x1: 56, z0: 0, z1: 6 },
  { x0: -44, x1: 56, z0: 84, z1: 88 },
  { x0: -44, x1: -8, z0: 78, z1: 84 },
  { x0: -40, x1: -36, z0: 22, z1: 26 },     // B 洞西肩（洞口 x[-36,-30]）
  { x0: -30, x1: -14, z0: 22, z1: 26 },     // B 洞东肩
  { x0: -14, x1: 10, z0: 6, z1: 10 },       // 沙地北缘楼体
  { x0: 20, x1: 56, z0: 70, z1: 84 },       // 匪家东侧楼体
  { x0: 16, x1: 34, z0: 26, z1: 34 },       // A 平台南缘楼体（A 小楼梯东、警家东上坡北）
  { x0: 44, x1: 56, z0: 6, z1: 26 },        // 东北角楼体（A 大北端封边）
];

export const CEILS = [
  { x0: -40, x1: -32, z0: 26, z1: 56, bottom: B2_Y + 2.4, kind: 'cave', room: true },
  { x0: -4, x1: 4, z0: 56, z1: 70, bottom: 4.0, kind: 'cave', room: true },   // 暗道顶棚（加高）
  { x0: 44, x1: 52, z0: 48, z1: 56, bottom: 4.9, kind: 'sand', room: true },
];

export const ROOMS = [
  { x0: -40, x1: -32, z0: 26, z1: 56, y0: GARDEN_Y, y1: B2_Y + 2.4 },
  { x0: -4, x1: 4, z0: 56, z1: 70, y0: MID_Y, y1: 4.0 },
  { x0: 44, x1: 52, z0: 48, z1: 56, y0: LONG_Y, y1: 4.9 },
];

export const SPAWNS = {
  t: { x: 6, y: T_Y, z: 77, yaw: Math.PI, label: '匪家' },
  garden: { x: -26, y: GARDEN_Y, z: 66, yaw: Math.PI, label: '后花园' },
  b2: { x: -36, y: B2_Y, z: 40, yaw: Math.PI, label: 'B2' },
  b: { x: -23, y: B_Y, z: 16, yaw: 0, label: 'B 包点' },
  b1: { x: -16, y: B1_Y, z: 33, yaw: 0, label: 'B1' },
  mid: { x: 0, y: MID_Y, z: 32, yaw: Math.PI, label: '中路' },
  midfar: { x: 0, y: MID_Y, z: 48, yaw: Math.PI, label: '中远' },
  ct: { x: 15, y: CT_Y, z: 18, yaw: Math.PI, label: '警家' },
  a: { x: 31, y: A_PLAT_Y, z: 18, yaw: 0, label: 'A 平台' },
  asmall: { x: 11, y: A_SMALL_Y, z: 33, yaw: 0, label: 'A 小道' },
  long: { x: 48, y: LONG_Y, z: 50, yaw: Math.PI, label: 'A 大' },
  pit: { x: 42, y: PIT_Y, z: 48, yaw: Math.PI, label: 'A 坑' },
};

export const ZONES = [
  { name: '匪家', x0: -14, x1: 20, z0: 64, z1: 84, y0: 2.4, y1: 4.4 },
  { name: '后花园', x0: -40, x1: -14, z0: 56, z1: 78, y0: -0.8, y1: 1.2 },
  { name: 'B2/B 通', x0: -40, x1: -32, z0: 26, z1: 56, y0: 0, y1: 2.4 },
  { name: '旋转楼梯', x0: -32, x1: -26, z0: 30, z1: 40, y0: -0.8, y1: 2.4 },
  { name: 'B1', x0: -26, x1: -6, z0: 26, z1: 40, y0: -0.8, y1: 1.2 },
  { name: 'B 洞', x0: -36, x1: -30, z0: 20, z1: 26, y0: 0.8, y1: 3.4 },
  { name: 'B 包点', x0: -32, x1: -14, z0: 6, z1: 26, y0: 1.6, y1: 3.4 },
  { name: 'B 门', x0: -16, x1: -12, z0: 10, z1: 20, y0: 1.6, y1: 3.4 },
  { name: '沙地', x0: -14, x1: 10, z0: 10, z1: 26, y0: -4.4, y1: 3.4 },
  { name: '警家', x0: 10, x1: 20, z0: 6, z1: 40, y0: -4.4, y1: -2.2 },
  { name: '警家斜坡', x0: 20, x1: 26, z0: 6, z1: 14, y0: -4.4, y1: 2.8 },
  { name: 'A 小楼梯', x0: 16, x1: 26, z0: 20, z1: 26, y0: 0.4, y1: 2.8 },
  { name: 'A 小道', x0: 6, x1: 16, z0: 26, z1: 40, y0: 0.4, y1: 1.8 },
  { name: 'A 小', x0: 6, x1: 16, z0: 40, z1: 52, y0: -0.8, y1: 1.6 },
  { name: 'B1 入口', x0: -12, x1: -6, z0: 40, z1: 48, y0: -0.8, y1: 1.2 },
  { name: '中门', x0: -6, x1: 6, z0: 36, z1: 40, y0: -0.8, y1: 1.2 },
  { name: '中路', x0: -6, x1: 6, z0: 26, z1: 56, y0: -0.8, y1: 1.2 },
  { name: '中远', x0: -6, x1: 6, z0: 44, z1: 56, y0: -0.8, y1: 1.2 },
  { name: '匪口', x0: 6, x1: 20, z0: 56, z1: 70, y0: -0.8, y1: 1.2 },
  { name: '暗道', x0: -4, x1: 4, z0: 56, z1: 70, y0: -0.8, y1: 4.0 },
  { name: 'A 平台', x0: 26, x1: 44, z0: 6, z1: 26, y0: 1.2, y1: 2.8 },
  { name: 'A 斜坡', x0: 34, x1: 44, z0: 26, z1: 34, y0: 0, y1: 2.8 },
  { name: '警家东上坡', x0: 20, x1: 44, z0: 34, z1: 40, y0: -4.4, y1: 1.6 },
  { name: 'A 大', x0: 44, x1: 52, z0: 26, z1: 64, y0: 0, y1: 1.6 },
  { name: 'A 门', x0: 44, x1: 52, z0: 56, z1: 64, y0: 0, y1: 1.6 },
  { name: 'A 坑', x0: 40, x1: 44, z0: 40, z1: 56, y0: -4.2, y1: -2 },
  { name: '黄车', x0: 20, x1: 44, z0: 56, z1: 70, y0: -0.8, y1: 1.2 },
];