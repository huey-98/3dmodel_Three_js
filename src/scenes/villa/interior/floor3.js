import * as THREE from 'three';
import { solid } from './data.js';
import { FLOOR_H } from '../building.js';

// 第 3 层家具摆放。
export function buildFloor3(ctx) {
  const {
    kit, root, flickers,
    walnut, walnutDark, oak, marbleMat, emerald, emeraldDeep, champagne, blush, ivory,
    linenBlue, leather, leatherDark, gold, rugLiving, rugBed, rugStudy, sheer, drapeByFloor,
    emberMat, rugMat, box, cyl,
    plant, bouquet, chandelier, art, mirror, sofa, wing, diningChair, fireplace, bookcase,
    bed, nightstand, clock, curtainsFor,
  } = ctx;

  // ---------- 三层：书房与休息室 ----------
  const g2 = new THREE.Group();
  g2.position.y = FLOOR_H * 2;
  box(5.2, 0.02, 3.3, rugStudy, -0.2, 0.02, -3.15, g2);
  fireplace(g2, -0.15, -5.28, 2);
  art(g2, -0.15, 2.2, -5.5, 1.15, 0.72, 0x14283a, 0xc4a15a);
  bookcase(g2, -3.05, -5.28, 2, 2.05);
  bookcase(g2, 2.85, -5.28, 2, 2.05);
  sofa(g2, -0.15, -2.25, Math.PI, 2, leather, 0.92);
  box(0.9, 0.08, 0.5, walnutDark, -0.15, 0.4, -3.35, g2);
  solid(2, -0.15, -3.35, 0.48, 0.28);
  box(0.22, 0.03, 0.16, gold, -0.15, 0.46, -3.35, g2).castShadow = false;
  wing(g2, -2.45, -3.5, Math.PI / 2, 2, leatherDark);
  wing(g2, 2.05, -3.5, -Math.PI / 2, 2, leatherDark);

  box(1.4, 0.06, 0.72, walnut, -4.45, 0.76, 0.45, g2);
  for (const [lx, lz] of [[-0.55, -0.26], [0.55, -0.26], [-0.55, 0.26], [0.55, 0.26]]) {
    cyl(0.035, 0.04, 0.74, walnutDark, -4.45 + lx, 0.37, 0.45 + lz, 6, g2);
  }
  box(0.7, 0.015, 0.48, leather, -4.45, 0.8, 0.45, g2).castShadow = false;
  box(0.28, 0.04, 0.2, gold, -4.7, 0.84, 0.4, g2).castShadow = false;
  const deskShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.16, 12, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1f6a3c, emissive: 0x14381f, emissiveIntensity: 0.45, side: THREE.DoubleSide,
    }),
  );
  deskShade.position.set(-4.15, 1.05, 0.45);
  g2.add(deskShade);
  cyl(0.03, 0.04, 0.22, kit.brass, -4.15, 0.9, 0.45, 8, g2);
  const deskLight = new THREE.PointLight(0xffe6c4, 1.15, 3.2, 2);
  deskLight.position.set(-4.15, 1.0, 0.45);
  g2.add(deskLight);
  wing(g2, -3.55, 0.45, -Math.PI / 2, 2, leather);
  solid(2, -4.35, 0.45, 1.15, 0.55);

  cyl(0.12, 0.16, 0.72, walnutDark, 0.85, 0.36, 0.15, 10, g2);
  box(1.7, 0.07, 0.85, walnut, 0.7, 0.76, 0.15, g2);
  solid(2, 0.75, 0.15, 1.15, 0.7);
  diningChair(g2, 0.15, 0.7, 0);
  diningChair(g2, 1.25, 0.7, 0);
  diningChair(g2, 0.15, -0.4, Math.PI);
  diningChair(g2, 1.25, -0.4, Math.PI);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 14),
    new THREE.MeshStandardMaterial({ color: 0x1d4d62, roughness: 0.45, metalness: 0.15 }),
  );
  globe.position.set(3.25, 1.05, -1.15);
  g2.add(globe);
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 24), kit.brass);
  meridian.position.set(3.25, 1.05, -1.15);
  g2.add(meridian);
  cyl(0.05, 0.16, 0.7, walnutDark, 3.25, 0.35, -1.15, 8, g2);
  solid(2, 3.25, -1.15, 0.28, 0.28);

  box(1.25, 1.05, 0.4, walnutDark, 4.2, 0.55, 4.85, g2);
  box(1.32, 0.06, 0.46, marbleMat, 4.2, 1.1, 4.85, g2);
  for (const [lx, color] of [[-0.35, 0x7a1e2a], [0, 0xc4a15a], [0.32, 0x1d4d62]]) {
    cyl(0.045, 0.045, 0.2, new THREE.MeshStandardMaterial({
      color, roughness: 0.22, metalness: 0.2,
    }), 4.2 + lx, 1.26, 4.82, 8, g2).castShadow = false;
  }
  solid(2, 4.2, 4.85, 0.68, 0.24);
  wing(g2, -4.15, 4.45, Math.PI, 2, leatherDark);
  plant(g2, -6.85, 4.9, 2, 0.9);
  plant(g2, 6.7, -4.7, 2, 0.85);
  chandelier(g2, -0.15, -2.4, 2.7);
  chandelier(g2, 0.7, 0.2, 2.2);
  curtainsFor(g2, 2);
  root.add(g2);
}
