import * as THREE from 'three';
import { applyMetricUV, getVillaKit } from './villaMaterials.js';

// ---------- 尺寸参数 ----------
const W = 16;        // 外墙宽（x）
const D = 12;        // 外墙深（z）
const T = 0.3;       // 墙厚
export const FLOOR_H = 4.2; // 层高
const FLOORS = 3;    // 层数
const DOOR_W = 1.8;  // 门宽
const DOOR_H = 2.5;  // 门高
const HALF_W = W / 2;
const HALF_D = D / 2;
const TOP_Y = FLOOR_H * FLOORS;
const WALL_UV = 0.42;

// 建筑占地范围
export const BUILDING_FOOTPRINT = { minX: -HALF_W, maxX: HALF_W, minZ: -HALF_D, maxZ: HALF_D };

// 室内可活动区域
export const INTERIOR = { minX: -HALF_W + T, maxX: HALF_W - T, minZ: -HALF_D + T, maxZ: HALF_D - T };

// 楼梯：离开内墙，经梯井开口上楼，不穿楼板
export const STAIR_STEPS = 22;
const STAIR_W = 1.5;
const STAIR_CLEAR_X = 1.3;  // 与左右内墙的间距
const STAIR_CLEAR_Z = 0.9;  // 与后墙的间距
const STAIR_RUN = 6.2;
const HOLE_PAD_X = 0.28;
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

const COL_XS = [-3.35, -1.85, 1.85, 3.35];
const COL_Z = HALF_D + 2.05;
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
function buildOpenings() {
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

export function createBuilding() {
  const kit = getVillaKit();
  const group = new THREE.Group();

  const stone = kit.mapped(kit.maps.stone, 1, 1, { roughness: 0.9 });
  const marble = kit.mapped(kit.maps.marble, 1, 1, { roughness: 0.2, metalness: 0.05 });
  const walnut = kit.mapped(kit.maps.walnut, 1, 1, { roughness: 0.52, metalness: 0.03 });
  const parquet = kit.mapped(kit.maps.parquet, 1, 1, { roughness: 0.48, metalness: 0.04 });
  const paver = kit.mapped(kit.maps.paver, 1, 1, { roughness: 0.9 });
  const plaster = kit.plaster;
  const trimWood = kit.wood(0x5c3d28, 0.5);
  const doorWood = kit.wood(0x4e3018, 0.42);
  const doorPanel = kit.wood(0x3a2414, 0.5);
  const runnerMat = kit.velvet(0x6e2430);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6a3c, roughness: 0.9 });
  const leafLite = new THREE.MeshStandardMaterial({ color: 0x4e9454, roughness: 0.86 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d8, emissive: 0xffc56e, emissiveIntensity: 1.7,
  });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf4ecdf, roughness: 0.62 });

  // +x -x +y -y +z -z。外立面石材，室内一侧是石膏。
  const matLeft = [plaster, stone, stone, stone, stone, stone];
  const matRight = [stone, plaster, stone, stone, stone, stone];
  const matBack = [stone, stone, stone, stone, plaster, stone];
  const matFront = [stone, stone, stone, stone, stone, plaster];

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, uvScale = 0, parent = group) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    if (uvScale > 0) applyMetricUV(geo, x, y, z, uvScale);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const cyl = (r1, r2, h, mat, x, y, z, seg = 16, parent = group) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  function addPiercedWall(horizontal, fixed, from, to, mat, wallName) {
    const holes = OPENINGS.filter((op) => op.wall === wallName);
    const ys = [0, TOP_Y];
    for (const h of holes) {
      ys.push(Math.max(0, h.y - h.h / 2), Math.min(TOP_Y, h.y + h.h / 2));
    }
    ys.sort((a, b) => a - b);
    const bands = [];
    for (const y of ys) {
      if (!bands.length || y - bands[bands.length - 1] > 0.012) bands.push(y);
    }
    for (let i = 0; i < bands.length - 1; i++) {
      const ya = bands[i];
      const yb = bands[i + 1];
      const yMid = (ya + yb) / 2;
      const cuts = [];
      for (const h of holes) {
        if (yMid > h.y - h.h / 2 + 0.001 && yMid < h.y + h.h / 2 - 0.001) {
          cuts.push([h.at - h.w / 2, h.at + h.w / 2]);
        }
      }
      cuts.sort((a, b) => a[0] - b[0]);
      let cursor = from;
      const spans = [];
      for (const [a, b] of cuts) {
        const lo = Math.max(a, from);
        const hi = Math.min(b, to);
        if (hi <= cursor) continue;
        if (lo > cursor + 0.02) spans.push([cursor, Math.min(lo, to)]);
        cursor = Math.max(cursor, hi);
      }
      if (to > cursor + 0.02) spans.push([cursor, to]);
      for (const [a, b] of spans) {
        const mid = (a + b) / 2;
        const len = b - a;
        if (horizontal === 'x') box(len, yb - ya, T, mat, mid, yMid, fixed, WALL_UV);
        else box(T, yb - ya, len, mat, fixed, yMid, mid, WALL_UV);
      }
    }
  }

  addPiercedWall('z', -(HALF_W - T / 2), -HALF_D, HALF_D, matLeft, 'left');
  addPiercedWall('z', HALF_W - T / 2, -HALF_D, HALF_D, matRight, 'right');
  addPiercedWall('x', -(HALF_D - T / 2), -HALF_W + T, HALF_W - T, matBack, 'back');
  addPiercedWall('x', HALF_D - T / 2, -HALF_W + T, HALF_W - T, matFront, 'front');

  // 墙角交替石块
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const courses = 28;
      const ch = TOP_Y / courses;
      for (let i = 0; i < courses; i++) {
        const proud = i % 2 === 0 ? 0.16 : 0.05;
        const stoneMat = i % 2 === 0 ? kit.stoneSmooth : kit.stoneDark;
        const mesh = box(
          0.5 + proud, ch - 0.012, 0.5 + proud, stoneMat,
          sx * (HALF_W - 0.02), i * ch + ch / 2, sz * (HALF_D - 0.02), 0,
        );
        mesh.castShadow = false;
      }
    }
  }

  // 勒脚（正门留出入口）
  const plinthH = 0.48;
  const plinthY = 0.03 + plinthH / 2;
  const portal = 1.15;
  const frontLeftW = (-portal) - (-HALF_W - 0.08);
  box(frontLeftW, plinthH, 0.22, kit.stoneDark, (-HALF_W - 0.08 - portal) / 2, plinthY, HALF_D + 0.08, 0);
  box(frontLeftW, plinthH, 0.22, kit.stoneDark, (portal + HALF_W + 0.08) / 2, plinthY, HALF_D + 0.08, 0);
  box(DOOR_W + 0.5, 0.06, 0.36, kit.stoneSmooth, 0, 0.05, HALF_D + 0.02, 0);
  box(W + 0.24, plinthH, 0.22, kit.stoneDark, 0, plinthY, -HALF_D - 0.08, 0);
  box(0.22, plinthH, D + 0.2, kit.stoneDark, HALF_W + 0.08, plinthY, 0, 0);
  box(0.22, plinthH, D + 0.2, kit.stoneDark, -HALF_W - 0.08, plinthY, 0, 0);

  const belt = (y, h, jut) => {
    const t = 0.14 + jut;
    box(W + jut * 2, h, t, kit.stoneSmooth, 0, y, HALF_D + t * 0.35, 0).castShadow = false;
    box(W + jut * 2, h, t, kit.stoneSmooth, 0, y, -HALF_D - t * 0.35, 0).castShadow = false;
    box(t, h, D + jut * 2, kit.stoneSmooth, HALF_W + t * 0.35, y, 0, 0).castShadow = false;
    box(t, h, D + jut * 2, kit.stoneSmooth, -HALF_W - t * 0.35, y, 0, 0).castShadow = false;
  };
  belt(FLOOR_H - 0.1, 0.14, 0.06);
  belt(FLOOR_H * 2 - 0.1, 0.14, 0.06);
  belt(TOP_Y - 0.02, 0.14, 0.1);
  belt(TOP_Y + 0.16, 0.18, 0.28);
  const copperRing = (y) => {
    box(W + 0.85, 0.06, 0.1, kit.copper, 0, y, HALF_D + 0.4, 0).castShadow = false;
    box(W + 0.85, 0.06, 0.1, kit.copper, 0, y, -HALF_D - 0.4, 0).castShadow = false;
    box(0.1, 0.06, D + 0.85, kit.copper, HALF_W + 0.4, y, 0, 0).castShadow = false;
    box(0.1, 0.06, D + 0.85, kit.copper, -HALF_W - 0.4, y, 0, 0).castShadow = false;
  };
  copperRing(TOP_Y + 0.28);

  function poseOf(op) {
    if (op.wall === 'front') return { x: op.along, z: HALF_D - T / 2, rot: 0 };
    if (op.wall === 'back') return { x: op.along, z: -(HALF_D - T / 2), rot: Math.PI };
    if (op.wall === 'left') return { x: -(HALF_W - T / 2), z: op.along, rot: Math.PI / 2 };
    return { x: HALF_W - T / 2, z: op.along, rot: -Math.PI / 2 };
  }

  function addPediment(parent, w, h, depth, y) {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(0, h);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geo, kit.stoneSmooth);
    mesh.position.set(0, y, 0.08);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  function addGlazing(op) {
    if (op.kind === 'door') return;
    const pose = poseOf(op);
    const win = new THREE.Group();
    win.position.set(pose.x, op.y, pose.z);
    win.rotation.y = pose.rot;
    const { w, h, kind } = op;
    const bar = kind === 'sidelight' || kind === 'transom' ? 0.055 : 0.075;
    const overlap = 0.018;
    const placeBar = (bw, bh, x, y) => {
      const mesh = box(bw, bh, 0.2, kit.bronze, x, y, 0, 0, win);
      mesh.castShadow = false;
      return mesh;
    };
    placeBar(bar, h + bar, -(w / 2 + bar / 2 - overlap), 0);
    placeBar(bar, h + bar, w / 2 + bar / 2 - overlap, 0);
    placeBar(w + bar, bar, 0, h / 2 + bar / 2 - overlap);
    placeBar(w + bar, bar, 0, -(h / 2 + bar / 2 - overlap));
    const glass = box(w, h, 0.03, kit.glass, 0, 0, 0, 0, win);
    glass.castShadow = false;
    glass.receiveShadow = false;
    if (kind !== 'transom') {
      const muntin = box(0.035, h - 0.08, 0.045, kit.bronze, 0, 0, 0.04, 0, win);
      muntin.castShadow = false;
    }
    if (kind === 'window' || kind === 'french') {
      const rail = box(w - 0.08, 0.035, 0.045, kit.bronze, 0, kind === 'french' ? -h * 0.12 : 0, 0.04, 0, win);
      rail.castShadow = false;
    }
    if (kind === 'transom') {
      for (const x of [-w * 0.22, w * 0.22]) {
        const m = box(0.03, h - 0.04, 0.04, kit.bronze, x, 0, 0.04, 0, win);
        m.castShadow = false;
      }
    }
    if (kind === 'window') {
      box(w + 0.34, 0.09, 0.2, kit.stoneSmooth, 0, -h / 2 - 0.02, 0.12, 0, win).castShadow = false;
      box(w + 0.28, 0.1, 0.16, kit.stoneSmooth, 0, h / 2 + 0.07, 0.08, 0, win).castShadow = false;
      if (op.wall === 'front' || op.wall === 'back') addPediment(win, w + 0.5, 0.32, 0.16, h / 2 + 0.1);
    }
    if (kind === 'french') {
      box(w + 0.2, 0.08, 0.16, kit.stoneSmooth, 0, -h / 2 - 0.02, 0.1, 0, win).castShadow = false;
      box(0.04, 0.16, 0.06, kit.brass, w * 0.28, -h * 0.15, 0.06, 0, win).castShadow = false;
    }
    const bloom = (op.wall === 'back' || op.wall === 'front')
      && kind === 'window' && op.floor === 0;
    if (bloom) {
      box(w * 0.62, 0.14, 0.16, kit.stoneDark, 0, -h / 2 + 0.02, 0.18, 0, win).castShadow = false;
      for (let i = 0; i < 3; i++) {
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), [
          new THREE.MeshStandardMaterial({ color: 0xd4577a, roughness: 0.7 }),
          new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.7 }),
          new THREE.MeshStandardMaterial({ color: 0xe7b34a, roughness: 0.7 }),
        ][i]);
        flower.position.set(-w * 0.18 + i * w * 0.18, -h / 2 + 0.16, 0.22);
        flower.castShadow = false;
        win.add(flower);
      }
    }
    group.add(win);
  }
  for (const op of OPENINGS) addGlazing(op);

  // 门头三角楣
  addPediment(group, 3.5, 0.52, 0.26, 3.22);
  // addPediment parents a mesh at local position; the group itself is not rotated.
  // The helper positions the mesh at y and local z 0.08, so move it onto the facade.
  const ped = group.children[group.children.length - 1];
  ped.position.set(0, 3.22, HALF_D + 0.12);

  // ---------- 门 ----------
  const casingZ = HALF_D - T / 2;
  box(0.12, DOOR_H, 0.22, kit.stoneSmooth, -DOOR_W / 2 - 0.02, DOOR_H / 2, casingZ, 0).castShadow = false;
  box(0.12, DOOR_H, 0.22, kit.stoneSmooth, DOOR_W / 2 + 0.02, DOOR_H / 2, casingZ, 0).castShadow = false;
  box(DOOR_W + 0.28, 0.12, 0.22, kit.stoneSmooth, 0, DOOR_H + 0.02, casingZ, 0).castShadow = false;

  function buildLeaf(dir, parent) {
    const w = DOOR_W / 2 - 0.02;
    const h = DOOR_H - 0.08;
    const y0 = 0.04;
    const stile = 0.11;
    const rail = 0.12;
    const mid = dir * (w / 2);
    const hinge = dir > 0 ? stile / 2 : -stile / 2;
    const far = dir > 0 ? w - stile / 2 : -(w - stile / 2);
    const innerW = w - stile * 2;
    box(stile, h, 0.07, doorWood, hinge, y0 + h / 2, 0, 0, parent);
    box(stile, h, 0.07, doorWood, far, y0 + h / 2, 0, 0, parent);
    box(innerW, rail, 0.07, doorWood, mid, y0 + rail / 2, 0, 0, parent);
    box(innerW, rail, 0.07, doorWood, mid, y0 + h * 0.46, 0, 0, parent);
    box(innerW, rail, 0.07, doorWood, mid, y0 + h - rail / 2, 0, 0, parent);
    box(innerW - 0.04, h * 0.34, 0.045, doorPanel, mid, y0 + h * 0.24, 0.012, 0, parent);
    const glassH = h * 0.42;
    const glass = box(innerW - 0.02, glassH, 0.028, kit.glass, mid, y0 + h * 0.72, 0, 0, parent);
    glass.castShadow = false;
    glass.receiveShadow = false;
    box(0.035, 0.22, 0.07, kit.brass, far - dir * 0.07, 1.05, 0.05, 0, parent).castShadow = false;
    box(0.11, 0.035, 0.05, kit.brass, far - dir * 0.02, 1.05, 0.055, 0, parent).castShadow = false;
  }

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-DOOR_W / 2, 0, casingZ);
  buildLeaf(1, leftPivot);
  group.add(leftPivot);
  const rightPivot = new THREE.Group();
  rightPivot.position.set(DOOR_W / 2, 0, casingZ);
  buildLeaf(-1, rightPivot);
  group.add(rightPivot);

  function carriageLantern(x, y, z) {
    box(0.2, 0.34, 0.2, lampMat, x, y, z, 0).castShadow = false;
    box(0.28, 0.05, 0.28, kit.bronze, x, y + 0.2, z, 0).castShadow = false;
    box(0.08, 0.16, 0.08, kit.bronze, x, y + 0.34, z, 0).castShadow = false;
    const light = new THREE.PointLight(0xffc98a, 2.4, 8, 2);
    light.position.set(x, y, z + 0.15);
    group.add(light);
  }
  carriageLantern(-2.15, 1.72, HALF_D + 0.22);
  carriageLantern(2.15, 1.72, HALF_D + 0.22);

  // ---------- 门前石铺地、柱廊、露台 ----------
  box(12.2, 0.05, 2.55, paver, 0, 0.025, 7.22, 0.38);

  for (const x of COL_XS) {
    box(0.5, 0.14, 0.5, kit.stoneDark, x, 0.1, COL_Z, 0);
    box(0.4, 0.1, 0.4, kit.stoneSmooth, x, 0.22, COL_Z, 0);
    cyl(0.16, 0.2, 3.42, kit.stoneSmooth, x, 1.98, COL_Z, 18);
    box(0.42, 0.1, 0.42, kit.stoneSmooth, x, 3.74, COL_Z, 0);
    box(0.56, 0.12, 0.56, kit.stoneDark, x, 3.84, COL_Z, 0);
  }
  const beamZ = (6.2 + 8.5) / 2;
  box(7.5, 0.22, 2.35, kit.stoneSmooth, 0, 3.96, beamZ, 0);
  box(7.7, 0.08, 0.16, kit.stoneDark, 0, 3.82, 8.52, 0).castShadow = false;
  for (let i = 0; i < 28; i++) {
    const x = -3.45 + i * (6.9 / 27);
    box(0.09, 0.08, 0.1, kit.stoneSmooth, x, 3.74, 8.46, 0).castShadow = false;
  }

  function addBalcony(deckY, z0, z1, width) {
    const depth = z1 - z0;
    const zc = (z0 + z1) / 2;
    box(width, 0.12, depth, kit.stoneSmooth, 0, deckY - 0.06, zc, 0);
    box(width + 0.08, 0.1, 0.1, kit.stoneDark, 0, deckY - 0.12, z1 - 0.02, 0).castShadow = false;
    const postH = 0.92;
    const yPost = deckY + postH / 2;
    const yRail = deckY + postH;
    const glassH = 0.62;
    const posts = [];
    const step = 0.78;
    for (let x = -width / 2; x <= width / 2 + 0.01; x += step) posts.push([x, z1]);
    for (let z = z0 + 0.35; z < z1 - 0.2; z += step) {
      posts.push([-width / 2, z]);
      posts.push([width / 2, z]);
    }
    for (const [x, z] of posts) {
      cyl(0.03, 0.035, postH, kit.brassDark, x, yPost, z, 8).castShadow = false;
    }
    const frontRail = box(width, 0.05, 0.05, kit.brass, 0, yRail, z1, 0);
    frontRail.castShadow = false;
    box(0.05, 0.05, depth, kit.brass, -width / 2, yRail, zc, 0).castShadow = false;
    box(0.05, 0.05, depth, kit.brass, width / 2, yRail, zc, 0).castShadow = false;
    const pane = (pw, pz, x, z, rot) => {
      const g = box(pw, glassH, 0.02, kit.railGlass, x, deckY + 0.42, z, 0);
      g.castShadow = false;
      g.receiveShadow = false;
      if (rot) g.rotation.y = rot;
      if (pz) {
        g.scale.z = pz / 0.02;
      }
    };
    pane(width - 0.12, 0, 0, z1 - 0.03, 0);
    const sidePane = box(0.02, glassH, depth - 0.2, kit.railGlass, -width / 2 + 0.03, deckY + 0.42, zc, 0);
    sidePane.castShadow = false;
    const sidePaneR = box(0.02, glassH, depth - 0.2, kit.railGlass, width / 2 - 0.03, deckY + 0.42, zc, 0);
    sidePaneR.castShadow = false;
    for (const x of [-width * 0.28, width * 0.28]) {
      box(0.7, 0.22, 0.32, kit.stoneDark, x, deckY + 0.16, z1 - 0.38, 0).castShadow = false;
      for (let i = 0; i < 3; i++) {
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), i === 1 ? leafLite : leafMat);
        shrub.position.set(x - 0.2 + i * 0.2, deckY + 0.36, z1 - 0.38);
        shrub.castShadow = false;
        group.add(shrub);
      }
    }
  }
  addBalcony(FLOOR_H, 6.05, 8.32, 7.6);
  addBalcony(FLOOR_H * 2, 6.05, 7.25, 6.2);

  function urn(x, z) {
    cyl(0.22, 0.3, 0.14, kit.stoneDark, x, 0.1, z);
    cyl(0.18, 0.14, 0.32, kit.stoneSmooth, x, 0.32, z);
    cyl(0.26, 0.18, 0.08, kit.stoneDark, x, 0.5, z);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), leafMat);
    ball.position.set(x, 0.78, z);
    ball.castShadow = true;
    group.add(ball);
    const ball2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), leafLite);
    ball2.position.set(x + 0.05, 1.0, z);
    group.add(ball2);
  }
  urn(-4.7, 7.5);
  urn(4.7, 7.5);

  function hedge(x, z, w, d) {
    box(w, 0.72, d, leafMat, x, 0.4, z, 0);
    box(w - 0.1, 0.16, d - 0.1, leafLite, x, 0.84, z, 0).castShadow = false;
  }
  hedge(-6.4, 10.1, 2.4, 2.2);
  hedge(6.7, 10.1, 2.4, 2.2);

  // ---------- 屋顶 ----------
  const roofGeo = new THREE.ConeGeometry(HALF_W * 1.2, 2.85, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, kit.slate);
  roof.scale.set(1, 1, (D + 1.15) / (W + 1.15));
  roof.position.y = TOP_Y + 0.42 + 1.42;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);
  cyl(0.05, 0.09, 0.38, kit.copper, 0, TOP_Y + 3.15, 0, 10);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), kit.copper);
  finial.position.y = TOP_Y + 3.4;
  group.add(finial);

  function chimney(x, z) {
    box(0.72, 3.4, 0.72, kit.stoneDark, x, TOP_Y + 2.05, z, 0);
    box(0.9, 0.12, 0.9, kit.stoneSmooth, x, TOP_Y + 3.8, z, 0);
    cyl(0.09, 0.12, 0.22, kit.slateDark, x - 0.16, TOP_Y + 3.96, z - 0.14, 8);
    cyl(0.09, 0.12, 0.22, kit.slateDark, x + 0.16, TOP_Y + 3.96, z + 0.14, 8);
  }
  chimney(-2.5, -1.15);
  chimney(2.7, 0.85);

  // ---------- 室内地面、墙裙、楼板、楼梯 ----------
  const inX0 = INTERIOR.minX;
  const inX1 = INTERIOR.maxX;
  const inZ0 = INTERIOR.minZ;
  const inZ1 = INTERIOR.maxZ;
  const slabT = 0.18;

  box(inX1 - inX0, 0.04, inZ1 - inZ0, marble, (inX0 + inX1) / 2, 0.02, (inZ0 + inZ1) / 2, 0.1);

  function floorMats(top) {
    return [trimWood, trimWood, top, plaster, trimWood, trimWood];
  }

  function addSlabWithHole(yTop, hole, topMat, uvScale) {
    const yC = yTop - slabT / 2;
    const mats = floorMats(topMat);
    const parts = [
      { w: hole.minX - inX0, d: inZ1 - inZ0, x: (inX0 + hole.minX) / 2, z: (inZ0 + inZ1) / 2 },
      { w: inX1 - hole.maxX, d: inZ1 - inZ0, x: (hole.maxX + inX1) / 2, z: (inZ0 + inZ1) / 2 },
      { w: hole.maxX - hole.minX, d: hole.minZ - inZ0, x: (hole.minX + hole.maxX) / 2, z: (inZ0 + hole.minZ) / 2 },
      { w: hole.maxX - hole.minX, d: inZ1 - hole.maxZ, x: (hole.minX + hole.maxX) / 2, z: (hole.maxZ + inZ1) / 2 },
    ];
    for (const p of parts) {
      if (p.w > 0.05 && p.d > 0.05) box(p.w, slabT, p.d, mats, p.x, yC, p.z, uvScale);
    }
    const lipH = 0.045;
    const lipY = yTop + lipH / 2;
    const lipT = 0.07;
    box(hole.maxX - hole.minX + lipT * 2, lipH, lipT, trimWood, (hole.minX + hole.maxX) / 2, lipY, hole.minZ, 0);
    box(hole.maxX - hole.minX + lipT * 2, lipH, lipT, trimWood, (hole.minX + hole.maxX) / 2, lipY, hole.maxZ, 0);
    box(lipT, lipH, hole.maxZ - hole.minZ, trimWood, hole.minX, lipY, (hole.minZ + hole.maxZ) / 2, 0);
    box(lipT, lipH, hole.maxZ - hole.minZ, trimWood, hole.maxX, lipY, (hole.minZ + hole.maxZ) / 2, 0);
  }

  function addHoleRails(hole, yFloor, gapMinX, gapMaxX) {
    const postH = 0.92;
    const yPost = yFloor + postH / 2;
    const x0 = hole.minX;
    const x1 = hole.maxX;
    const z0 = hole.minZ;
    const z1 = hole.maxZ;
    const post = (x, z) => {
      cyl(0.032, 0.032, postH, kit.brassDark, x, yPost, z, 8).castShadow = false;
    };
    const n = 5;
    for (let i = 0; i <= n; i++) {
      const z = z0 + (i / n) * (z1 - z0);
      post(x0, z);
      post(x1, z);
    }
    for (let i = 1; i <= 3; i++) post(x0 + (i / 4) * (x1 - x0), z0);
    if (gapMinX - x0 > 0.25) post((x0 + gapMinX) / 2, z1);
    if (x1 - gapMaxX > 0.25) post((gapMaxX + x1) / 2, z1);
    const rail = (xA, zA, xB, zB) => {
      const len = Math.hypot(xB - xA, zB - zA);
      if (len < 0.12) return;
      const mesh = box(len, 0.055, 0.055, trimWood, (xA + xB) / 2, yFloor + postH, (zA + zB) / 2, 0);
      mesh.rotation.y = Math.atan2(zB - zA, xB - xA);
      mesh.castShadow = false;
    };
    rail(x0, z0, x0, z1);
    rail(x1, z0, x1, z1);
    rail(x0, z0, x1, z0);
    if (gapMinX - x0 > 0.16) rail(x0, z1, gapMinX, z1);
    if (x1 - gapMaxX > 0.16) rail(gapMaxX, z1, x1, z1);
  }

  addSlabWithHole(FLOOR_H, STAIR_WELLS[0], walnut, 0.34);
  addHoleRails(STAIR_WELLS[0], FLOOR_H, STAIRS[0].xMin, STAIRS[0].xMax);
  addSlabWithHole(FLOOR_H * 2, STAIR_WELLS[1], parquet, 0.55);
  addHoleRails(STAIR_WELLS[1], FLOOR_H * 2, STAIRS[1].xMin, STAIRS[1].xMax);
  box(inX1 - inX0, 0.14, inZ1 - inZ0, plaster, (inX0 + inX1) / 2, TOP_Y - 0.07, (inZ0 + inZ1) / 2, 0);

  function addCrown(y) {
    const t = 0.07;
    const spanX = inX1 - inX0 - 0.08;
    const spanZ = inZ1 - inZ0 - 0.08;
    box(spanX, 0.08, t, crownMat, 0, y, inZ0 + 0.04, 0).castShadow = false;
    box(spanX, 0.08, t, crownMat, 0, y, inZ1 - 0.04, 0).castShadow = false;
    box(t, 0.08, spanZ, crownMat, inX0 + 0.04, y, 0, 0).castShadow = false;
    box(t, 0.08, spanZ, crownMat, inX1 - 0.04, y, 0, 0).castShadow = false;
  }
  addCrown(FLOOR_H - 0.28);
  addCrown(FLOOR_H * 2 - 0.28);
  addCrown(TOP_Y - 0.2);

  const panel = kit.wood(0x6b4b32, 0.58);
  for (let f = 0; f < FLOORS; f++) {
    const base = f === 0 ? 0.04 : f * FLOOR_H;
    const h = 0.96;
    const y = base + h / 2;
    const t = 0.04;
    const sideLen = (inZ1 - inZ0) - 0.14;
    box(t, h, sideLen, panel, inX0 + t / 2 + 0.012, y, 0, 0).castShadow = false;
    box(t, h, sideLen, panel, inX1 - t / 2 - 0.012, y, 0, 0).castShadow = false;
    box((inX1 - inX0) - 0.14, h, t, panel, 0, y, inZ0 + t / 2 + 0.012, 0).castShadow = false;
    const gap = f === 0 ? 1.62 : 0.82;
    const frontZ = inZ1 - t / 2 - 0.012;
    const leftLen = -gap - (inX0 + 0.06);
    const rightLen = (inX1 - 0.06) - gap;
    if (leftLen > 0.2) {
      box(leftLen, h, t, panel, (inX0 + 0.06 - gap) / 2, y, frontZ, 0).castShadow = false;
    }
    if (rightLen > 0.2) {
      box(rightLen, h, t, panel, (inX1 - 0.06 + gap) / 2, y, frontZ, 0).castShadow = false;
    }
    const yRail = base + h;
    box(t + 0.015, 0.035, sideLen, kit.brass, inX0 + 0.03, yRail, 0, 0).castShadow = false;
    box(t + 0.015, 0.035, sideLen, kit.brass, inX1 - 0.03, yRail, 0, 0).castShadow = false;
  }

  const STEPS = STAIR_STEPS;
  for (const s of STAIRS) {
    const dz = (s.z1 - s.z0) / STEPS;
    const rise = (s.y1 - s.y0) / STEPS;
    const treadW = s.xMax - s.xMin;
    const midX = (s.xMin + s.xMax) / 2;
    const run = s.z1 - s.z0;
    const riseTotal = s.y1 - s.y0;
    const len = Math.hypot(run, riseTotal);
    const angle = -Math.atan2(riseTotal, run);
    const stringerLen = Math.max(1, len - 0.5);
    const cZ = (s.z0 + s.z1) / 2;
    const cY = (s.y0 + s.y1) / 2 + 0.14;

    for (const x of [s.xMin + 0.07, s.xMax - 0.07]) {
      const stringer = box(0.1, 0.28, stringerLen, trimWood, x, cY, cZ, 0);
      stringer.rotation.x = angle;
    }

    for (let i = 0; i < STEPS; i++) {
      const z = s.z0 + (i + 0.5) * dz;
      const yTop = s.y0 + (i + 1) * rise;
      box(treadW, 0.06, Math.abs(dz) + 0.02, trimWood, midX, yTop - 0.03, z, 0);
      box(treadW, rise, 0.04, doorPanel, midX, yTop - rise / 2, s.z0 + i * dz + Math.sign(dz) * 0.02, 0);
      box(treadW * 0.56, 0.02, Math.abs(dz) * 0.92, runnerMat, midX, yTop + 0.012, z, 0).castShadow = false;
    }

    for (const x of [s.xMin, s.xMax]) {
      const railLen = Math.max(1, len - 0.55);
      const rail = box(0.06, 0.06, railLen, kit.brass, x, (s.y0 + s.y1) / 2 + 0.86, (s.z0 + s.z1) / 2, 0);
      rail.rotation.x = angle;
      rail.castShadow = false;
      for (let i = 0; i < STEPS - 2; i += 2) {
        const z = s.z0 + (i + 0.5) * dz;
        const top = s.y0 + (i + 1) * rise;
        cyl(0.028, 0.028, 0.84, kit.brassDark, x, top + 0.42, z, 8).castShadow = false;
      }
    }
  }

  const innerLight = new THREE.PointLight(0xffd8ae, 1.5, 12, 2);
  innerLight.position.set(0, 2.6, 3.2);
  group.add(innerLight);

  let doorCur = 0;
  let doorTarget = 0;

  function update(dt) {
    doorCur += (doorTarget - doorCur) * Math.min(dt * 3.4, 1);
    leftPivot.rotation.y = -doorCur * 1.38;
    rightPivot.rotation.y = doorCur * 1.38;
    const glow = 1.4 + doorCur * 1.5;
    innerLight.intensity += (glow - innerLight.intensity) * Math.min(dt * 4, 1);
  }

  return {
    group,
    update,
    setDoorOpen: (open) => { doorTarget = open ? 1 : 0; },
    isDoorOpen: () => doorTarget === 1,
    doorAnchor: DOOR_ANCHOR,
  };
}
