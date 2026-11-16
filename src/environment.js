import * as THREE from 'three';
import { BUILDING_FOOTPRINT } from './building.js';

// ---------- 场景布局参数 ----------
export const RIVER_Z0 = 20;    // 河北岸
export const RIVER_Z1 = 36;    // 河南岸
export const WATER_Y = -0.35;  // 水面高度
export const BRIDGE_HALF = 1.8; // 桥面半宽
const GROUND = 130;
const PATH_HALF = 1.5;

// 高架木桥：南引桥 → 主桥面 → 北引桥
export const BRIDGE = {
  x0: -BRIDGE_HALF, x1: BRIDGE_HALF,
  deckY: 2.0,
  rampZ0: 15.5, deckZ0: 19.5, deckZ1: 36.5, rampZ1: 40.5,
};

// 桥墩（水下障碍，船只需从中间水道穿过）
export const PIER_RECTS = [
  { minX: -1.5, maxX: 1.5, minZ: 23.8, maxZ: 25.2 },
  { minX: -1.5, maxX: 1.5, minZ: 30.8, maxZ: 32.2 },
];

export const ENV_RECTS = [
  // 河床（桥面处留出通道）
  { minX: -GROUND, maxX: -BRIDGE_HALF, minZ: RIVER_Z0, maxZ: RIVER_Z1 },
  { minX: BRIDGE_HALF, maxX: GROUND, minZ: RIVER_Z0, maxZ: RIVER_Z1 },
  // 桥两侧栏杆，防止掉入河中
  { minX: -BRIDGE_HALF - 0.4, maxX: -BRIDGE_HALF, minZ: BRIDGE.rampZ0 - 1, maxZ: BRIDGE.rampZ1 + 1 },
  { minX: BRIDGE_HALF, maxX: BRIDGE_HALF + 0.4, minZ: BRIDGE.rampZ0 - 1, maxZ: BRIDGE.rampZ1 + 1 },
];

// 装饰物禁放区（建筑、河面、桥、小路、公路）
function isReserved(x, z) {
  const f = BUILDING_FOOTPRINT;
  if (x > f.minX - 4 && x < f.maxX + 4 && z > f.minZ - 4 && z < f.maxZ + 4) return true;
  if (z > RIVER_Z0 - 3 && z < RIVER_Z1 + 3) return true;
  if (Math.abs(x) < 5 && z > BRIDGE.rampZ0 - 3 && z < BRIDGE.rampZ1 + 3) return true;
  if (Math.abs(x) < PATH_HALF + 1.6 && z > f.maxZ && z < BRIDGE.rampZ0) return true;
  if (Math.abs(x) < 5 && z > BRIDGE.rampZ1 && z < 54) return true;
  if (z > 43 && z < 53) return true; // 公路
  return false;
}

// 水面高度（与顶点波动保持一致）
export function waterHeight(x, z, t) {
  return Math.sin(x * 0.32 + t * 1.5) * 0.09 + Math.sin(z * 0.55 - t * 1.1) * 0.05;
}

export function createEnvironment() {
  const group = new THREE.Group();

  // ---------- 材质 ----------
  const matGrass = new THREE.MeshStandardMaterial({ color: 0x7cb35c, roughness: 1 });
  const matSoil = new THREE.MeshStandardMaterial({ color: 0x8a7f63, roughness: 1 });
  const matBank = new THREE.MeshStandardMaterial({ color: 0x9c8a63, roughness: 1 });
  const matPath = new THREE.MeshStandardMaterial({ color: 0xa39a8c, roughness: 0.95 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.8 });
  const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x6a4423, roughness: 0.85 });
  const matStone = new THREE.MeshStandardMaterial({ color: 0x9a958c, roughness: 0.95 });
  const matTrunk = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.95 });
  const matRock = new THREE.MeshStandardMaterial({ color: 0x8d8d87, roughness: 0.95 });
  const matRoad = new THREE.MeshStandardMaterial({ color: 0x3c3c44, roughness: 0.95 });
  const matLine = new THREE.MeshStandardMaterial({ color: 0xe8e2c8, roughness: 0.9 });

  // ---------- 地面（挖出河道） ----------
  const shape = new THREE.Shape();
  shape.moveTo(-GROUND, -GROUND);
  shape.lineTo(GROUND, -GROUND);
  shape.lineTo(GROUND, GROUND);
  shape.lineTo(-GROUND, GROUND);
  shape.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-GROUND, -RIVER_Z1);
  hole.lineTo(GROUND, -RIVER_Z1);
  hole.lineTo(GROUND, -RIVER_Z0);
  hole.lineTo(-GROUND, -RIVER_Z0);
  hole.closePath();
  shape.holes.push(hole);
  const groundGeo = new THREE.ShapeGeometry(shape);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, matGrass);
  ground.receiveShadow = true;
  group.add(ground);

  // 河床与河岸
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(GROUND * 2, RIVER_Z1 - RIVER_Z0),
    matSoil
  );
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(0, -1.3, (RIVER_Z0 + RIVER_Z1) / 2);
  bed.receiveShadow = true;
  group.add(bed);
  group.add(new THREE.Mesh(new THREE.BoxGeometry(GROUND * 2, 1.3, 0.5), matBank)
    .translateY(-0.65).translateZ(RIVER_Z0 - 0.25));
  group.add(new THREE.Mesh(new THREE.BoxGeometry(GROUND * 2, 1.3, 0.5), matBank)
    .translateY(-0.65).translateZ(RIVER_Z1 + 0.25));

  // ---------- 河水（带波动动画） ----------
  const waterGeo = new THREE.PlaneGeometry(GROUND * 2, RIVER_Z1 - RIVER_Z0, 120, 10);
  waterGeo.rotateX(-Math.PI / 2);
  const waterBase = Float32Array.from(waterGeo.attributes.position.array);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({
      color: 0x3aa0c8, roughness: 0.15, metalness: 0.25,
      transparent: true, opacity: 0.85,
    })
  );
  water.position.set(0, WATER_Y, (RIVER_Z0 + RIVER_Z1) / 2);
  group.add(water);

  function updateWater(t) {
    const attr = waterGeo.attributes.position;
    for (let i = 0; i < attr.count; i++) {
      const x = waterBase[i * 3];
      const z = waterBase[i * 3 + 2];
      attr.setY(i, waterHeight(x, z, t));
    }
    attr.needsUpdate = true;
  }

  // ---------- 小路 ----------
  const pathLen = BRIDGE.rampZ0 - 6.5;
  const pathN = new THREE.Mesh(new THREE.BoxGeometry(PATH_HALF * 2, 0.06, pathLen), matPath);
  pathN.position.set(0, 0.03, 6.5 + pathLen / 2);
  pathN.receiveShadow = true;
  group.add(pathN);

  // ---------- 高架木桥 ----------
  const bridge = new THREE.Group();
  const b = BRIDGE;
  const deckLen = b.deckZ1 - b.deckZ0;
  // 桥墩
  for (const z of [24.5, 31.5]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.3, 1.4), matStone);
    pier.position.set(0, 0.35, z);
    pier.castShadow = true;
    bridge.add(pier);
  }
  // 主桥面
  const deck = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, 0.26, deckLen), matWoodDark);
  deck.position.set(0, b.deckY - 0.13, (b.deckZ0 + b.deckZ1) / 2);
  deck.castShadow = true;
  deck.receiveShadow = true;
  bridge.add(deck);
  for (let z = b.deckZ0 + 0.4; z < b.deckZ1; z += 0.62) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, 0.12, 0.5), matWood);
    plank.position.set(0, b.deckY + 0.02, z);
    plank.castShadow = true;
    plank.receiveShadow = true;
    bridge.add(plank);
  }
  // 南北引桥
  const rampAngle = Math.atan2(b.deckY, b.deckZ0 - b.rampZ0);
  const rampLen = Math.hypot(b.deckZ0 - b.rampZ0, b.deckY);
  const rampN = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, 0.24, rampLen), matWoodDark);
  rampN.position.set(0, b.deckY / 2 - 0.06, (b.rampZ0 + b.deckZ0) / 2);
  rampN.rotation.x = -rampAngle;
  rampN.castShadow = true;
  rampN.receiveShadow = true;
  bridge.add(rampN);
  const rampS = new THREE.Mesh(new THREE.BoxGeometry(b.x1 - b.x0, 0.24, rampLen), matWoodDark);
  rampS.position.set(0, b.deckY / 2 - 0.06, (b.deckZ1 + b.rampZ1) / 2);
  rampS.rotation.x = rampAngle;
  rampS.castShadow = true;
  rampS.receiveShadow = true;
  bridge.add(rampS);
  // 引桥支撑柱
  for (const [mz, my] of [[(b.rampZ0 + b.deckZ0) / 2, b.deckY / 2], [(b.deckZ1 + b.rampZ1) / 2, b.deckY / 2]]) {
    for (const x of [-1.2, 1.2]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, my, 0.3), matWoodDark);
      post.position.set(x, my / 2, mz);
      post.castShadow = true;
      bridge.add(post);
    }
  }
  // 栏杆（桥面立柱 + 引桥斜扶手）
  for (const x of [b.x0 + 0.08, b.x1 - 0.08]) {
    for (let z = b.deckZ0; z <= b.deckZ1; z += 1.6) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.13, 1.05, 0.13), matWoodDark);
      post.position.set(x, b.deckY + 0.52, z);
      post.castShadow = true;
      bridge.add(post);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, deckLen), matWood);
    top.position.set(x, b.deckY + 1.0, (b.deckZ0 + b.deckZ1) / 2);
    bridge.add(top);
    for (const [mz, sign] of [[(b.rampZ0 + b.deckZ0) / 2, -1], [(b.deckZ1 + b.rampZ1) / 2, 1]]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.12, rampLen), matWood);
      rail.position.set(x, b.deckY / 2 + 1.0, mz);
      rail.rotation.x = sign * rampAngle;
      bridge.add(rail);
    }
  }
  group.add(bridge);

  // ---------- 公路 ----------
  const roadZ = 48;
  const road = new THREE.Mesh(new THREE.BoxGeometry(170, 0.1, 7), matRoad);
  road.position.set(0, 0.05, roadZ);
  road.receiveShadow = true;
  group.add(road);
  const spur = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, b.rampZ1 - 40.5 + 0.5), matRoad);
  spur.position.set(0, 0.05, (b.rampZ1 + 44.5) / 2);
  spur.receiveShadow = true;
  group.add(spur);
  for (let x = -80; x < 80; x += 5) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.03, 0.22), matLine);
    dash.position.set(x, 0.11, roadZ);
    group.add(dash);
  }
  for (const dz of [-3.2, 3.2]) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(170, 0.03, 0.18), matLine);
    line.position.set(0, 0.11, roadZ + dz);
    group.add(line);
  }

  // ---------- 石头 ----------
  const rockGeo = new THREE.IcosahedronGeometry(0.6, 0);
  const rpos = rockGeo.attributes.position;
  for (let i = 0; i < rpos.count; i++) {
    const k = 0.75 + Math.random() * 0.5;
    rpos.setXYZ(i, rpos.getX(i) * k, rpos.getY(i) * k * 0.7, rpos.getZ(i) * k);
  }
  rockGeo.computeVertexNormals();

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const ROCKS = 42;
  const rocks = new THREE.InstancedMesh(rockGeo, matRock, ROCKS);
  let placed = 0;
  let guard = 0;
  while (placed < ROCKS && guard++ < 3000) {
    const x = (Math.random() * 2 - 1) * 70;
    const z = (Math.random() * 2 - 1) * 70;
    if (isReserved(x, z)) continue;
    const s = 0.4 + Math.random() * 1.3;
    dummy.position.set(x, s * 0.28, z);
    dummy.rotation.set(Math.random() * 0.6, Math.random() * Math.PI * 2, Math.random() * 0.6);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    rocks.setMatrixAt(placed, dummy.matrix);
    rocks.setColorAt(placed, color.setHSL(0.12, 0.05, 0.42 + Math.random() * 0.16));
    placed++;
  }
  rocks.count = placed;
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  group.add(rocks);

  for (let i = 0; i < 8; i++) {
    const r = new THREE.Mesh(rockGeo, matRock);
    const s = 0.35 + Math.random() * 0.7;
    r.position.set((Math.random() * 2 - 1) * 40, -0.9 + s * 0.2, RIVER_Z0 + 2 + Math.random() * 10);
    r.rotation.set(Math.random(), Math.random() * 6, Math.random());
    r.scale.setScalar(s);
    r.castShadow = true;
    group.add(r);
  }

  // ---------- 草丛 ----------
  const tuftGeo = new THREE.ConeGeometry(0.16, 0.55, 4);
  const GRASS = 340;
  const grass = new THREE.InstancedMesh(
    tuftGeo, new THREE.MeshStandardMaterial({ color: 0x5fa03f, roughness: 1 }), GRASS
  );
  placed = 0;
  guard = 0;
  while (placed < GRASS && guard++ < 8000) {
    const x = (Math.random() * 2 - 1) * 65;
    const z = (Math.random() * 2 - 1) * 65;
    if (isReserved(x, z)) continue;
    const s = 0.7 + Math.random() * 1.1;
    dummy.position.set(x, 0.24 * s, z);
    dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    grass.setColorAt(placed, color.setHSL(0.26 + Math.random() * 0.06, 0.5, 0.36 + Math.random() * 0.18));
    placed++;
  }
  grass.count = placed;
  grass.receiveShadow = true;
  group.add(grass);

  // ---------- 小花 ----------
  const FLOWERS = 110;
  const headGeo = new THREE.SphereGeometry(0.09, 6, 5);
  const stemGeo = new THREE.CylinderGeometry(0.012, 0.016, 0.26, 4);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4f8f43, roughness: 1 });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const heads = new THREE.InstancedMesh(headGeo, flowerMat, FLOWERS);
  const stems = new THREE.InstancedMesh(stemGeo, stemMat, FLOWERS);
  placed = 0;
  guard = 0;
  while (placed < FLOWERS && guard++ < 6000) {
    const x = (Math.random() * 2 - 1) * 60;
    const z = (Math.random() * 2 - 1) * 60;
    if (isReserved(x, z)) continue;
    const s = 0.8 + Math.random() * 0.6;
    dummy.position.set(x, 0.24 * s, z);
    dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    heads.setMatrixAt(placed, dummy.matrix);
    const hue = [0.95, 0.13, 0.08][placed % 3];
    heads.setColorAt(placed, color.setHSL(hue, 0.75, 0.68));
    dummy.position.set(x, 0.13 * s, z);
    dummy.updateMatrix();
    stems.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  heads.count = placed;
  stems.count = placed;
  group.add(heads, stems);

  // ---------- 树木 ----------
  const leafColors = [0x3e7c3a, 0x4d8f43, 0x356b34, 0x569a4a];
  function createTree(x, z, s = 1) {
    const t = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, 1.7, 8), matTrunk);
    trunk.position.y = 0.85;
    trunk.castShadow = true;
    const leafMat = new THREE.MeshStandardMaterial({
      color: leafColors[Math.floor(Math.random() * leafColors.length)], roughness: 0.9,
    });
    const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.45, 2.7, 8), leafMat);
    c1.position.y = 2.5;
    c1.castShadow = true;
    const c2 = new THREE.Mesh(new THREE.ConeGeometry(1.05, 2.1, 8), leafMat);
    c2.position.y = 3.6;
    c2.castShadow = true;
    t.add(trunk, c1, c2);
    t.position.set(x, 0, z);
    t.scale.setScalar(s);
    t.rotation.y = Math.random() * Math.PI * 2;
    return t;
  }
  let treeCount = 0;
  guard = 0;
  while (treeCount < 20 && guard++ < 2000) {
    const x = (Math.random() * 2 - 1) * 70;
    const z = (Math.random() * 2 - 1) * 70;
    if (isReserved(x, z)) continue;
    group.add(createTree(x, z, 0.85 + Math.random() * 0.6));
    treeCount++;
  }

  // ---------- 灌木 ----------
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x4f8f43, roughness: 0.9 });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = 9 + Math.random() * 4;
    const bush = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const s = 0.45 + Math.random() * 0.45;
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), bushMat);
      m.position.set((Math.random() - 0.5) * 0.9, s * 0.7, (Math.random() - 0.5) * 0.9);
      m.castShadow = true;
      bush.add(m);
    }
    bush.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 1);
    group.add(bush);
  }

  return { group, updateWater };
}
