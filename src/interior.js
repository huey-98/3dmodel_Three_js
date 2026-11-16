import * as THREE from 'three';
import { FLOOR_H } from './building.js';

// 室内家具布置：客厅 / 卧室 / 书房
export function createInterior() {
  const root = new THREE.Group();

  const matSofa = new THREE.MeshStandardMaterial({ color: 0x4a6f8a, roughness: 0.9 });
  const matCushion = new THREE.MeshStandardMaterial({ color: 0x5f89a5, roughness: 0.95 });
  const matWood = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.8 });
  const matWoodDark = new THREE.MeshStandardMaterial({ color: 0x6a4423, roughness: 0.85 });
  const matWhite = new THREE.MeshStandardMaterial({ color: 0xf3efe6, roughness: 0.85 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: 0.5, metalness: 0.3 });
  const matRug = new THREE.MeshStandardMaterial({ color: 0xa8564a, roughness: 1 });
  const matRug2 = new THREE.MeshStandardMaterial({ color: 0x5b6f8c, roughness: 1 });
  const matLeaf = new THREE.MeshStandardMaterial({ color: 0x4f8f43, roughness: 0.9 });
  const matPot = new THREE.MeshStandardMaterial({ color: 0xb4674a, roughness: 0.9 });
  const matLamp = new THREE.MeshStandardMaterial({
    color: 0xfff0c8, emissive: 0xffd489, emissiveIntensity: 1.6,
  });

  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  const cyl = (r1, r2, h, mat, x, y, z, seg = 12) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // 盆栽
  const plant = (x, z, s = 1) => {
    const g = new THREE.Group();
    g.add(cyl(0.22 * s, 0.16 * s, 0.36 * s, matPot, 0, 0.18 * s, 0));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.34 * s, 10, 8), matLeaf).translateY(0.62 * s));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.24 * s, 10, 8), matLeaf).translateY(0.95 * s).translateX(0.14 * s));
    g.position.set(x, 0, z);
    return g;
  };

  // 吊灯
  const ceilingLamp = (x, z) => {
    const g = new THREE.Group();
    g.add(cyl(0.02, 0.02, 0.45, matWoodDark, 0, FLOOR_H - 0.22, 0, 6));
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.3, 14, 1, true), matLamp);
    shade.position.y = FLOOR_H - 0.55;
    g.add(shade);
    const light = new THREE.PointLight(0xffdca8, 1.6, 9, 2);
    light.position.set(0, FLOOR_H - 0.7, 0);
    g.add(light);
    g.position.set(x, 0, z);
    return g;
  };

  // ---------- 一层：客厅 + 餐厅 ----------
  const g0 = new THREE.Group();
  g0.add(box(4.8, 0.03, 3.6, matRug, 0.6, 0.02, 0.2));
  // 沙发
  g0.add(box(2.4, 0.42, 1.0, matSofa, 1.2, 0.21, -2.4));
  g0.add(box(2.4, 0.75, 0.22, matSofa, 1.2, 0.62, -2.85));
  g0.add(box(0.22, 0.5, 1.0, matSofa, 0.05, 0.45, -2.4));
  g0.add(box(0.22, 0.5, 1.0, matSofa, 2.35, 0.45, -2.4));
  g0.add(box(1.05, 0.18, 0.85, matCushion, 0.6, 0.5, -2.35));
  g0.add(box(1.05, 0.18, 0.85, matCushion, 1.8, 0.5, -2.35));
  // 茶几
  g0.add(box(1.5, 0.1, 0.8, matWood, 1.2, 0.42, -0.9));
  for (const [lx, lz] of [[0.55, -1.2], [1.85, -1.2], [0.55, -0.6], [1.85, -0.6]]) {
    g0.add(box(0.08, 0.4, 0.08, matWoodDark, lx, 0.2, lz));
  }
  // 电视柜 + 电视
  g0.add(box(2.0, 0.55, 0.45, matWoodDark, 1.2, 0.28, 1.7));
  g0.add(box(1.7, 0.95, 0.08, matDark, 1.2, 1.05, 1.78));
  g0.add(box(0.3, 0.12, 0.3, matDark, 1.2, 0.6, 1.7));
  // 书架
  g0.add(box(1.8, 2.1, 0.35, matWoodDark, -1.6, 1.05, -3.95));
  const bookColors = [0xb5533f, 0x3f6b85, 0xc9a227, 0x4f8f43, 0x8a5a2e];
  for (let r = 0; r < 4; r++) {
    for (let b = 0; b < 6; b++) {
      const m = new THREE.MeshStandardMaterial({ color: bookColors[(r + b) % bookColors.length], roughness: 0.9 });
      g0.add(box(0.18, 0.3, 0.28, m, -2.35 + b * 0.28, 0.35 + r * 0.5, -3.9));
    }
  }
  // 餐桌 + 椅子
  g0.add(cyl(0.95, 0.95, 0.1, matWood, 4.4, 0.75, -2.6, 16));
  g0.add(cyl(0.12, 0.3, 0.72, matWoodDark, 4.4, 0.36, -2.6));
  for (const [cx, cz, rot] of [[4.4, -1.45, 0], [4.4, -3.75, 0], [3.25, -2.6, Math.PI / 2], [5.55, -2.6, -Math.PI / 2]]) {
    const chair = new THREE.Group();
    chair.add(box(0.45, 0.08, 0.45, matWood, 0, 0.45, 0));
    chair.add(box(0.45, 0.55, 0.08, matWood, 0, 0.72, -0.2));
    for (const [lx, lz] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
      chair.add(box(0.06, 0.45, 0.06, matWoodDark, lx, 0.22, lz));
    }
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rot;
    g0.add(chair);
  }
  g0.add(plant(-2.8, 3.2, 1.1));
  g0.add(plant(2.7, 3.3, 0.9));
  g0.add(ceilingLamp(1.2, -0.4));
  root.add(g0);

  // ---------- 二层：卧室 ----------
  const g1 = new THREE.Group();
  g1.position.y = FLOOR_H;
  g1.add(box(4.2, 0.03, 3.2, matRug2, -1.0, 0.02, 0.2));
  // 床
  g1.add(box(2.2, 0.4, 2.8, matWoodDark, -1.0, 0.2, -0.6));
  g1.add(box(2.0, 0.3, 2.6, matWhite, -1.0, 0.55, -0.6));
  g1.add(box(2.05, 0.14, 1.6, matRug2, -1.0, 0.72, -1.5));
  g1.add(box(1.7, 0.2, 0.5, matWhite, -1.0, 0.76, 0.45));
  g1.add(box(2.3, 1.1, 0.15, matWood, -1.0, 0.55, 0.85));
  // 床头柜与台灯
  for (const nx of [-2.6, 0.6]) {
    g1.add(box(0.6, 0.6, 0.5, matWood, nx, 0.3, 0.55));
    g1.add(cyl(0.1, 0.14, 0.22, matLamp, nx, 0.72, 0.55, 10));
  }
  // 衣柜
  g1.add(box(2.0, 2.3, 0.6, matWhite, -1.0, 1.15, -3.95));
  g1.add(box(0.06, 2.2, 0.04, matWoodDark, -1.0, 1.15, -3.63));
  // 书桌
  g1.add(box(1.8, 0.08, 0.8, matWood, 2.4, 0.75, 2.4));
  for (const [lx, lz] of [[1.6, 2.1], [3.2, 2.1], [1.6, 2.7], [3.2, 2.7]]) {
    g1.add(box(0.07, 0.75, 0.07, matWoodDark, lx, 0.37, lz));
  }
  g1.add(box(0.5, 0.45, 0.5, matSofa, 2.4, 0.22, 1.5));
  g1.add(box(0.5, 0.5, 0.08, matSofa, 2.4, 0.6, 1.28));
  g1.add(plant(-4.4, 3.3, 0.9));
  g1.add(ceilingLamp(-1.0, 0));
  root.add(g1);

  // ---------- 三层：书房 ----------
  const g2 = new THREE.Group();
  g2.position.y = FLOOR_H * 2;
  g2.add(box(4.0, 0.03, 3.0, matRug, -1.6, 0.02, 0.4));
  // 书桌
  g2.add(box(2.4, 0.1, 1.0, matWood, -2.6, 0.75, -2.6));
  for (const [lx, lz] of [[-3.6, -3.0], [-1.6, -3.0], [-3.6, -2.2], [-1.6, -2.2]]) {
    g2.add(box(0.08, 0.75, 0.08, matWoodDark, lx, 0.37, lz));
  }
  g2.add(box(0.6, 0.45, 0.6, matSofa, -2.6, 0.22, -1.7));
  g2.add(box(0.6, 0.55, 0.08, matSofa, -2.6, 0.62, -1.97));
  g2.add(box(0.5, 0.06, 0.35, matDark, -2.9, 0.83, -2.6));
  // 书架
  g2.add(box(2.0, 2.2, 0.4, matWoodDark, 1.2, 1.1, -3.95));
  for (let r = 0; r < 4; r++) {
    for (let b = 0; b < 6; b++) {
      const m = new THREE.MeshStandardMaterial({ color: bookColors[(r * 2 + b) % bookColors.length], roughness: 0.9 });
      g2.add(box(0.18, 0.3, 0.3, m, 0.45 + b * 0.28, 0.35 + r * 0.52, -3.9));
    }
  }
  // 休闲区
  g2.add(box(1.6, 0.4, 0.8, matSofa, 2.2, 0.2, 1.6));
  g2.add(box(1.6, 0.65, 0.2, matSofa, 2.2, 0.55, 1.9));
  g2.add(cyl(0.55, 0.55, 0.08, matWood, 2.2, 0.42, 0.4, 14));
  g2.add(cyl(0.1, 0.2, 0.4, matWoodDark, 2.2, 0.2, 0.4));
  g2.add(plant(-4.6, 3.4, 1.0));
  g2.add(plant(0.4, 3.5, 0.85));
  g2.add(ceilingLamp(-1.0, 0.6));
  root.add(g2);

  return root;
}
