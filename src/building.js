import * as THREE from 'three';

// ---------- 尺寸参数 ----------
const W = 12;        // 外墙宽（x）
const D = 9;         // 外墙深（z）
const T = 0.3;       // 墙厚
const FLOOR_H = 3.2; // 层高
const FLOORS = 3;    // 层数
const DOOR_W = 1.8;  // 门宽
const DOOR_H = 2.5;  // 门高
const HALF_W = W / 2;
const HALF_D = D / 2;
const TOP_Y = FLOOR_H * FLOORS;

// 建筑占地范围
export const BUILDING_FOOTPRINT = { minX: -HALF_W, maxX: HALF_W, minZ: -HALF_D, maxZ: HALF_D };

// 墙体碰撞矩形（与实际墙体位置对应）
export const WALL_RECTS = [
  { minX: -HALF_W, maxX: -HALF_W + T, minZ: -HALF_D, maxZ: HALF_D },           // 左墙
  { minX: HALF_W - T, maxX: HALF_W, minZ: -HALF_D, maxZ: HALF_D },             // 右墙
  { minX: -HALF_W + T, maxX: HALF_W - T, minZ: -HALF_D, maxZ: -HALF_D + T },   // 后墙
  { minX: -HALF_W + T, maxX: -DOOR_W / 2, minZ: HALF_D - T, maxZ: HALF_D },   // 前墙左
  { minX: DOOR_W / 2, maxX: HALF_W - T, minZ: HALF_D - T, maxZ: HALF_D },     // 前墙右
];

// 门口通道：门关闭时视为障碍
export const DOOR_GAP = { minX: -DOOR_W / 2, maxX: DOOR_W / 2, minZ: HALF_D - T, maxZ: HALF_D };

// 门前交互点（人物靠近此位置可按 F 开关门）
export const DOOR_ANCHOR = new THREE.Vector3(0, 0, HALF_D + 1.2);

export function createBuilding() {
  const group = new THREE.Group();

  // ---------- 材质 ----------
  const matWall = new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.92 });
  const matTrim = new THREE.MeshStandardMaterial({ color: 0xd6c5a2, roughness: 0.85 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0xb0a797, roughness: 0.95 });
  const matSlab = new THREE.MeshStandardMaterial({ color: 0xcdb894, roughness: 0.9 });
  const matFrame = new THREE.MeshStandardMaterial({ color: 0xfaf7f0, roughness: 0.6 });
  const matGlass = new THREE.MeshStandardMaterial({ color: 0x3f6b85, roughness: 0.12, metalness: 0.5 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.75 });
  const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x6a4423, roughness: 0.8 });
  const matRoof = new THREE.MeshStandardMaterial({ color: 0x9c4f3c, roughness: 0.85 });
  const matRoofDark = new THREE.MeshStandardMaterial({ color: 0x7d3f30, roughness: 0.9 });
  const matStone = new THREE.MeshStandardMaterial({ color: 0xa39c92, roughness: 0.95 });
  const matMetal = new THREE.MeshStandardMaterial({ color: 0xd9c27a, roughness: 0.3, metalness: 0.85 });
  const matLamp = new THREE.MeshStandardMaterial({
    color: 0xffe9b0, emissive: 0xffcc70, emissiveIntensity: 1.4,
  });
  const matLeaf = new THREE.MeshStandardMaterial({ color: 0x4f8f43, roughness: 0.9 });

  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // ---------- 墙体 ----------
  const wallH = TOP_Y;
  group.add(box(T, wallH, D, matWall, -HALF_W + T / 2, wallH / 2, 0));              // 左墙
  group.add(box(T, wallH, D, matWall, HALF_W - T / 2, wallH / 2, 0));               // 右墙
  group.add(box(W - 2 * T, wallH, T, matWall, 0, wallH / 2, -HALF_D + T / 2));      // 后墙
  group.add(box(DOOR_W / 2 + HALF_W - T, wallH, T, matWall,
    (-HALF_W + T - DOOR_W / 2) / 2, wallH / 2, HALF_D - T / 2));                    // 前墙左
  group.add(box(HALF_W - T - DOOR_W / 2, wallH, T, matWall,
    (DOOR_W / 2 + HALF_W - T) / 2, wallH / 2, HALF_D - T / 2));                    // 前墙右
  group.add(box(DOOR_W, wallH - DOOR_H, T, matWall,
    0, DOOR_H + (wallH - DOOR_H) / 2, HALF_D - T / 2));                             // 门上过梁

  // 墙角装饰柱
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      group.add(box(0.6, wallH, 0.6, matTrim, sx * (HALF_W - 0.15), wallH / 2, sz * (HALF_D - 0.15)));
    }
  }

  // 勒脚
  group.add(box(W + 0.3, 0.45, 0.24, matBase, 0, 0.22, HALF_D + 0.06));
  group.add(box(W + 0.3, 0.45, 0.24, matBase, 0, 0.22, -HALF_D - 0.06));
  group.add(box(0.24, 0.45, D + 0.3, matBase, HALF_W + 0.06, 0.22, 0));
  group.add(box(0.24, 0.45, D + 0.3, matBase, -HALF_W - 0.06, 0.22, 0));

  // 层间楼板线脚
  for (let i = 1; i <= FLOORS; i++) {
    group.add(box(W + 0.26, 0.22, D + 0.26, matSlab, 0, i * FLOOR_H, 0));
  }
  // 屋顶檐口
  group.add(box(W + 0.9, 0.3, D + 0.9, matSlab, 0, TOP_Y + 0.15, 0));

  // ---------- 窗户 ----------
  const addWindow = (x, y, z, rotY, w = 1.25, h = 1.6) => {
    const win = new THREE.Group();
    win.add(box(w + 0.18, h + 0.18, 0.12, matFrame, 0, 0, 0));
    const glass = matGlass.clone();
    if (Math.random() < 0.28) {
      glass.color.set(0xffd98a);
      glass.emissive = new THREE.Color(0xffb347);
      glass.emissiveIntensity = 0.9;
    }
    win.add(box(w, h, 0.14, glass, 0, 0, 0.01));
    win.add(box(0.07, h, 0.16, matFrame, 0, 0, 0.02));      // 竖窗棂
    win.add(box(w, 0.07, 0.16, matFrame, 0, 0, 0.02));      // 横窗棂
    win.add(box(w + 0.36, 0.12, 0.3, matTrim, 0, -h / 2 - 0.12, 0.07)); // 窗台
    win.add(box(w + 0.36, 0.14, 0.22, matTrim, 0, h / 2 + 0.1, 0.05));  // 窗楣
    win.position.set(x, y, z);
    win.rotation.y = rotY;
    group.add(win);
  };

  for (let f = 0; f < FLOORS; f++) {
    const y = f * FLOOR_H + 1.7;
    for (const x of [-4.2, -2.1, 2.1, 4.2]) {
      addWindow(x, y, HALF_D + 0.06, 0);
      addWindow(x, y, -HALF_D - 0.06, Math.PI);
    }
    for (const x of [0]) addWindow(x, y, -HALF_D - 0.06, Math.PI);
    for (const z of [-3, -1, 1, 3]) {
      addWindow(HALF_W + 0.06, y, z, Math.PI / 2);
      addWindow(-HALF_W - 0.06, y, z, -Math.PI / 2);
    }
  }

  // ---------- 阳台（二三层前侧） ----------
  const addBalcony = (deckY) => {
    const w = 7;
    group.add(box(w, 0.18, 1.4, matSlab, 0, deckY, HALF_D + 0.7));
    group.add(box(w, 0.12, 0.16, matTrim, 0, deckY + 1.0, HALF_D + 1.32));
    group.add(box(w, 0.1, 0.12, matTrim, 0, deckY + 0.55, HALF_D + 1.32));
    for (let i = 0; i <= 14; i++) {
      group.add(box(0.09, 0.92, 0.09, matTrim, -w / 2 + 0.3 + i * ((w - 0.6) / 14), deckY + 0.55, HALF_D + 1.32));
    }
    // 侧栏杆
    for (const sx of [-1, 1]) {
      group.add(box(0.12, 0.1, 1.4, matTrim, sx * (w / 2 - 0.06), deckY + 1.0, HALF_D + 0.7));
      group.add(box(0.1, 0.92, 0.1, matTrim, sx * (w / 2 - 0.06), deckY + 0.55, HALF_D + 1.32));
    }
    // 阳台花箱
    for (const sx of [-1, 1]) {
      const x = sx * 2.4;
      group.add(box(1.1, 0.34, 0.3, matWood, x, deckY + 0.26, HALF_D + 1.24));
      for (let i = 0; i < 4; i++) {
        const bush = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), matLeaf);
        bush.position.set(x - 0.4 + i * 0.26, deckY + 0.52, HALF_D + 1.24);
        bush.castShadow = true;
        group.add(bush);
      }
    }
  };
  addBalcony(FLOOR_H);
  addBalcony(FLOOR_H * 2);

  // ---------- 门廊 ----------
  group.add(box(4.6, 0.22, 1.7, matRoofDark, 0, 2.9, HALF_D + 0.8));   // 雨棚
  for (const sx of [-1, 1]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 2.85, 12), matStone);
    col.position.set(sx * 1.85, 1.43, HALF_D + 1.4);
    col.castShadow = true;
    group.add(col);
    group.add(box(0.5, 0.14, 0.5, matStone, sx * 1.85, 2.78, HALF_D + 1.4));
  }
  group.add(box(3.2, 0.18, 0.55, matStone, 0, 0.09, HALF_D + 1.35));   // 台阶
  group.add(box(3.8, 0.12, 0.6, matStone, 0, 0.06, HALF_D + 1.95));
  group.add(box(1.5, 0.05, 0.9, matWoodDark, 0, 0.03, HALF_D + 0.65)); // 门垫

  // ---------- 门 ----------
  // 门框
  for (const sx of [-1, 1]) {
    group.add(box(0.18, DOOR_H, 0.4, matTrim, sx * (DOOR_W / 2 + 0.09), DOOR_H / 2, HALF_D + 0.05));
  }
  group.add(box(DOOR_W + 0.36, 0.2, 0.4, matTrim, 0, DOOR_H + 0.1, HALF_D + 0.05));

  // 门轴（左边缘为旋转中心）
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-DOOR_W / 2, 0, HALF_D + 0.03);
  const leafW = DOOR_W - 0.04;
  doorPivot.add(box(leafW, DOOR_H - 0.06, 0.09, matWood, leafW / 2, DOOR_H / 2, 0));
  // 门板凹格
  for (const [px, py, pw, ph] of [
    [leafW / 2, DOOR_H * 0.74, leafW - 0.3, DOOR_H * 0.32],
    [leafW / 2, DOOR_H * 0.26, leafW - 0.3, DOOR_H * 0.32],
  ]) {
    doorPivot.add(box(pw, ph, 0.03, matWoodDark, px, py, 0.05));
  }
  // 门把手
  doorPivot.add(box(0.16, 0.05, 0.05, matMetal, leafW - 0.16, 1.05, 0.1));
  doorPivot.add(box(0.06, 0.06, 0.06, matMetal, leafW - 0.16, 1.05, 0.07));
  // 合页
  for (const hy of [0.45, DOOR_H - 0.45]) {
    doorPivot.add(box(0.1, 0.22, 0.12, matMetal, 0.03, hy, 0));
  }
  group.add(doorPivot);

  // 门旁壁灯
  const lantern = box(0.26, 0.34, 0.26, matLamp, 1.55, 2.1, HALF_D + 0.2);
  group.add(lantern);
  group.add(box(0.34, 0.08, 0.34, matRoofDark, 1.55, 2.31, HALF_D + 0.2));
  const porchLight = new THREE.PointLight(0xffd08a, 2.2, 9, 2);
  porchLight.position.set(1.55, 2.05, HALF_D + 0.5);
  group.add(porchLight);

  // ---------- 屋顶 ----------
  const roofGeo = new THREE.ConeGeometry(9.05, 2.9, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, matRoof);
  roof.scale.set(1, 1, (D + 0.9) / (W + 0.9));
  roof.position.y = TOP_Y + 0.3 + 1.45;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  // 烟囱
  group.add(box(0.8, 1.7, 0.8, matRoofDark, -3.6, TOP_Y + 1.6, -1.4));
  group.add(box(1.0, 0.22, 1.0, matStone, -3.6, TOP_Y + 2.5, -1.4));
  // 空调外机
  for (const [ax, az] of [[HALF_W + 0.28, -1.8], [HALF_W + 0.28, 1.2]]) {
    group.add(box(0.5, 0.62, 0.9, matStone, ax, 4.6, az));
  }

  // ---------- 室内 ----------
  group.add(box(W - 2 * T - 0.1, 0.08, D - 2 * T - 0.1, matWoodDark, 0, 0.04, 0)); // 一层地面
  for (let i = 1; i < FLOORS; i++) {
    group.add(box(W - 2 * T, 0.18, D - 2 * T, matSlab, 0, i * FLOOR_H - 0.09, 0)); // 楼板
  }
  // 楼梯
  for (let i = 0; i < 10; i++) {
    const h = (i + 1) * (FLOOR_H / 10);
    group.add(box(1.6, h, 0.5, matWood, -4.2, h / 2, -2.5 + i * 0.5));
  }
  // 接待台与地毯
  group.add(box(2.6, 1.0, 0.65, matWood, 3.2, 0.5, 1.4));
  group.add(box(2.8, 0.04, 1.6, matRoofDark, 3.2, 0.07, 2.6));
  const innerLight = new THREE.PointLight(0xffcf8a, 0, 14, 2);
  innerLight.position.set(0, 2.4, 1.2);
  group.add(innerLight);

  // ---------- 门动画 ----------
  let doorCur = 0;    // 0 关闭 / 1 全开
  let doorTarget = 0;

  function update(dt) {
    doorCur += (doorTarget - doorCur) * Math.min(dt * 4, 1);
    doorPivot.rotation.y = -doorCur * 1.9;
    innerLight.intensity += ((doorCur > 0.05 ? 2.4 : 0) - innerLight.intensity) * Math.min(dt * 4, 1);
  }

  return {
    group,
    update,
    setDoorOpen: (open) => { doorTarget = open ? 1 : 0; },
    isDoorOpen: () => doorTarget === 1,
    doorAnchor: DOOR_ANCHOR,
  };
}
