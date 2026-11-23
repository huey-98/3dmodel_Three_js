import * as THREE from 'three';

// ---------- 尺寸参数 ----------
export const W = 16;        // 外墙宽（x）
export const D = 12;        // 外墙深（z）
export const T = 0.3;       // 墙厚
export const FLOOR_H = 4.2; // 层高
export const FLOORS = 3;    // 层数
export const DOOR_W = 1.8;  // 门宽
export const DOOR_H = 2.5;  // 门高
export const HALF_W = W / 2;
export const HALF_D = D / 2;
export const TOP_Y = FLOOR_H * FLOORS;
export const WALL_UV = 0.42;

// 建筑占地范围
export const BUILDING_FOOTPRINT = { minX: -HALF_W, maxX: HALF_W, minZ: -HALF_D, maxZ: HALF_D };

// 室内可活动区域
export const INTERIOR = { minX: -HALF_W + T, maxX: HALF_W - T, minZ: -HALF_D + T, maxZ: HALF_D - T };

// 楼梯：离开内墙，经梯井开口上楼，不穿楼板
export const STAIR_STEPS = 22;
export const STAIR_W = 1.5;
export const STAIR_CLEAR_X = 1.3;  // 与左右内墙的间距
export const STAIR_CLEAR_Z = 0.9;  // 与后墙的间距
export const STAIR_RUN = 6.2;
export const HOLE_PAD_X = 0.28;
const HOLE_PAD_Z0 = 0.18;
const HOLE_PAD_Z1 = 0.35;

const STAIR_Z0 = INTERIOR.minZ + STAIR_CLEAR_Z;
const STAIR_Z1 = STAIR_Z0 + STAIR_RUN;

// 楼梯段：沿 z 从 z0(y0) 升到 z1(y1)；from/to 为连接楼层（0 = 一层）
export const STAIRS = [
  {
    xMin: INTERIOR.minX + STAIR_CLEAR_X,
    xMax: INTERIOR.minX + STAIR_CLEAR_X + STAIR_W,
    z0: STAIR_Z0, z1: STAIR_Z1,
    y0: 0, y1: FLOOR_H, from: 0, to: 1,
  },
  {
    xMin: INTERIOR.maxX - STAIR_CLEAR_X - STAIR_W,
    xMax: INTERIOR.maxX - STAIR_CLEAR_X,
    z0: STAIR_Z0, z1: STAIR_Z1,
    y0: FLOOR_H, y1: FLOOR_H * 2, from: 1, to: 2,
  },
];

export function stairWell(s) {
  const zLo = Math.min(s.z0, s.z1);
  const zHi = Math.max(s.z0, s.z1);
  const span = zHi - zLo;
  // 只在踏步接近上层楼板处开口，避免整段楼梯把楼板划穿
  const openStart = zLo + span * 0.36;
  return {
    minX: s.xMin - HOLE_PAD_X,
    maxX: s.xMax + HOLE_PAD_X,
    minZ: openStart,
    maxZ: zHi + HOLE_PAD_Z1,
  };
}

export const STAIR_WELLS = STAIRS.map(stairWell);

export function stairSurfaceY(s, z) {
  const span = s.z1 - s.z0;
  const t = Math.max(0, Math.min(1, (z - s.z0) / span));
  const i = Math.min(STAIR_STEPS - 1, Math.floor(t * STAIR_STEPS));
  return s.y0 + (i + 1) * (s.y1 - s.y0) / STAIR_STEPS;
}

// 两侧栏杆碰撞（底部/顶部留出入口）；上层梯井由 STAIR_WELLS 挡住
export const STAIR_RAILS = STAIRS.flatMap((s) => {
  const minZ = Math.min(s.z0, s.z1) + 0.85;
  const maxZ = Math.max(s.z0, s.z1) - 0.35;
  return [
    { minX: s.xMin - 0.1, maxX: s.xMin + 0.1, minZ, maxZ, from: s.from, to: s.to },
    { minX: s.xMax - 0.1, maxX: s.xMax + 0.1, minZ, maxZ, from: s.from, to: s.to },
  ];
});

// 墙体碰撞矩形（与实际墙体位置对应）
export const WALL_RECTS = [
  { minX: -HALF_W, maxX: -HALF_W + T, minZ: -HALF_D, maxZ: HALF_D },           // 左墙
  { minX: HALF_W - T, maxX: HALF_W, minZ: -HALF_D, maxZ: HALF_D },             // 右墙
  { minX: -HALF_W + T, maxX: HALF_W - T, minZ: -HALF_D, maxZ: -HALF_D + T },   // 后墙
  { minX: -HALF_W + T, maxX: -DOOR_W / 2, minZ: HALF_D - T, maxZ: HALF_D },   // 前墙左
  { minX: DOOR_W / 2, maxX: HALF_W - T, minZ: HALF_D - T, maxZ: HALF_D },     // 前墙右
  // 墙角装饰柱略伸入室内
  { minX: -HALF_W, maxX: -HALF_W + 0.45, minZ: -HALF_D, maxZ: -HALF_D + 0.45 },
  { minX: HALF_W - 0.45, maxX: HALF_W, minZ: -HALF_D, maxZ: -HALF_D + 0.45 },
  { minX: -HALF_W, maxX: -HALF_W + 0.45, minZ: HALF_D - 0.45, maxZ: HALF_D },
  { minX: HALF_W - 0.45, maxX: HALF_W, minZ: HALF_D - 0.45, maxZ: HALF_D },
];

export const COL_XS = [-3.35, -1.85, 1.85, 3.35];
export const COL_Z = HALF_D + 2.05;
for (const x of COL_XS) {
  WALL_RECTS.push({ minX: x - 0.26, maxX: x + 0.26, minZ: COL_Z - 0.26, maxZ: COL_Z + 0.26 });
}
for (const x of [-4.7, 4.7]) {
  WALL_RECTS.push({ minX: x - 0.36, maxX: x + 0.36, minZ: 7.15, maxZ: 7.9 });
}
WALL_RECTS.push({ minX: -7.6, maxX: -5.2, minZ: 9.0, maxZ: 11.2 });
WALL_RECTS.push({ minX: 5.5, maxX: 7.9, minZ: 9.0, maxZ: 11.2 });

// 门口通道：门关闭时视为障碍
export const DOOR_GAP = { minX: -DOOR_W / 2, maxX: DOOR_W / 2, minZ: HALF_D - T, maxZ: HALF_D };

// 门前交互点（人物靠近此位置可按 F 开关门、按 G 进屋）
export const DOOR_ANCHOR = new THREE.Vector3(0, 0, HALF_D + 1.2);
// 门内停留点（自动进屋的终点）
export const INSIDE_POINT = new THREE.Vector3(0, 0, HALF_D - 1.8);
// 门外停留点（自动出门的终点）
export const OUTSIDE_POINT = new THREE.Vector3(0, 0, HALF_D + 2.6);

// 墙洞：玻璃窗、落地窗、门。室内装饰按同一份坐标对齐。
export function buildOpenings() {
  const list = [];
  const push = (wall, floor, along, y, w, h, kind) => {
    list.push({ wall, floor, along, y, w, h, kind });
  };
  const sideZ = [-3.9, -1.95, 0, 1.95, 3.9];
  for (let f = 0; f < FLOORS; f++) {
    const base = f * FLOOR_H;
    if (f === 0) {
      const sill = 1.16;
      const h = 1.96;
      const y = sill + h / 2;
      for (const x of [-5.55, 5.55]) push('back', f, x, y, 1.24, h, 'window');
      for (const x of [-5.85, 5.85]) push('front', f, x, y, 1.16, h, 'window');
      for (const z of sideZ) {
        push('left', f, z, y, 1.02, h, 'window');
        push('right', f, z, y, 1.02, h, 'window');
      }
    } else {
      const sill = 1.24;
      const h = 1.68;
      const y = base + sill + h / 2;
      for (const x of [-5.55, 5.55]) push('back', f, x, y, 1.2, h, 'window');
      for (const x of [-5.85, -2.7, 2.7, 5.85]) push('front', f, x, y, 1.08, h, 'window');
      for (const z of sideZ) {
        push('left', f, z, y, 1.02, h, 'window');
        push('right', f, z, y, 1.02, h, 'window');
      }
      const frBottom = base + 0.1;
      const frTop = base + 2.4;
      push('front', f, 0, (frBottom + frTop) / 2, 1.26, frTop - frBottom, 'french');
    }
  }
  push('front', 0, 0, DOOR_H / 2, DOOR_W, DOOR_H, 'door');
  push('front', 0, 0, 2.86, DOOR_W, 0.42, 'transom');
  for (const x of [-1.32, 1.32]) push('front', 0, x, 1.5, 0.36, 1.9, 'sidelight');
  return list;
}

export const OPENINGS = buildOpenings();
