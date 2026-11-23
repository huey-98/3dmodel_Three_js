import * as THREE from 'three';
import { solid } from './data.js';

// 第 1 层家具摆放。
export function buildFloor1(ctx) {
  const {
    kit, root, flickers,
    walnut, walnutDark, oak, marbleMat, emerald, emeraldDeep, champagne, blush, ivory,
    linenBlue, leather, leatherDark, gold, rugLiving, rugBed, rugStudy, sheer, drapeByFloor,
    emberMat, rugMat, box, cyl,
    plant, bouquet, chandelier, art, mirror, sofa, wing, diningChair, fireplace, bookcase,
    bed, nightstand, clock, curtainsFor,
  } = ctx;

  // ---------- 一层：门厅、会客厅、餐厅 ----------
  const g0 = new THREE.Group();
  g0.position.y = 0.04;
  const med = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.03, 8, 48), kit.brass);
  med.rotation.x = Math.PI / 2;
  med.position.set(0, 0.02, 3.45);
  g0.add(med);
  box(4.8, 0.025, 3.6, rugLiving, 0.1, 0.02, -2.55, g0);
  sofa(g0, 0.12, -1.32, Math.PI, 0, emerald);
  box(1.05, 0.08, 0.62, marbleMat, 0.12, 0.42, -2.72, g0);
  for (const [lx, lz] of [[-0.32, -2.95], [0.55, -2.95], [-0.32, -2.5], [0.55, -2.5]]) {
    cyl(0.03, 0.04, 0.38, kit.brass, lx, 0.2, lz, 8, g0);
  }
  solid(0, 0.12, -2.72, 0.55, 0.34);
  box(0.28, 0.04, 0.2, walnutDark, -0.1, 0.48, -2.72, g0).castShadow = false;
  bouquet(g0, 0.28, 0.48, -2.65, 0.75);
  wing(g0, -2.35, -3.85, Math.PI / 2, 0, emeraldDeep);
  wing(g0, 2.22, -3.85, -Math.PI / 2, 0, emeraldDeep);
  for (const sx of [-1, 1]) {
    box(0.42, 0.48, 0.36, walnut, sx * 1.72, 0.26, -1.28, g0);
    cyl(0.06, 0.08, 0.22, kit.brass, sx * 1.72, 0.62, -1.28, 8, g0);
    solid(0, sx * 1.72, -1.28, 0.24, 0.2);
  }
  fireplace(g0, 0.12, -5.28, 0);
  art(g0, 0.12, 2.15, -5.5, 1.35, 0.85, 0x1e3d56, 0xc4a15a);
  clock(g0, -3.45, -5.32, 0);
  for (const sx of [-1, 1]) {
    box(1.15, 0.08, 0.38, walnut, sx * 3.85, 0.78, 5.12, g0);
    for (const lx of [-0.42, 0.42]) cyl(0.03, 0.035, 0.74, kit.brass, sx * 3.85 + lx, 0.37, 5.12, 6, g0);
    solid(0, sx * 3.85, 5.12, 0.6, 0.22);
    bouquet(g0, sx * 3.85, 0.86, 5.08, 0.9);
    mirror(g0, sx * 3.85, 1.65, 5.42, 0.7, 1.05);
  }

  box(3.4, 0.02, 2.5, rugLiving, 4.5, 0.02, -2.8, g0);
  cyl(0.16, 0.2, 0.74, walnutDark, 4.5, 0.37, -2.8, 12, g0);
  box(2.2, 0.08, 0.98, walnut, 4.5, 0.78, -2.8, g0);
  bouquet(g0, 4.5, 0.88, -2.8, 0.85);
  cyl(0.035, 0.035, 0.22, kit.brass, 4.15, 0.98, -2.8, 6, g0);
  cyl(0.035, 0.035, 0.22, kit.brass, 4.85, 0.98, -2.8, 6, g0);
  diningChair(g0, 3.95, -2.15, 0);
  diningChair(g0, 5.05, -2.15, 0);
  diningChair(g0, 3.95, -3.45, Math.PI);
  diningChair(g0, 5.05, -3.45, Math.PI);
  diningChair(g0, 3.15, -2.8, Math.PI / 2);
  solid(0, 4.5, -2.85, 1.6, 1.15);
  box(0.42, 0.82, 2.15, walnutDark, 7.22, 0.42, -0.2, g0);
  box(0.48, 0.06, 2.25, marbleMat, 7.22, 0.86, -0.2, g0);
  for (const z of [-0.85, -0.2, 0.45]) {
    cyl(0.05, 0.05, 0.2, new THREE.MeshStandardMaterial({
      color: z < 0 ? 0x7a1e2a : 0xd7b15a, roughness: 0.25, metalness: 0.15,
    }), 7.18, 1.02, z, 8, g0).castShadow = false;
  }
  solid(0, 7.22, -0.2, 0.28, 1.15);

  plant(g0, -7.05, 5.05, 0, 1.05);
  plant(g0, 7.05, 5.05, 0, 0.95);
  plant(g0, -7.05, -5.15, 0, 0.9);
  chandelier(g0, 0, 3.35, 3.6);
  chandelier(g0, 0.1, -2.3, 3.2);
  chandelier(g0, 4.5, -2.8, 2.8);
  curtainsFor(g0, 0);
  root.add(g0);
}
