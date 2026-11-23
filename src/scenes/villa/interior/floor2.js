import * as THREE from 'three';
import { solid } from './data.js';
import { FLOOR_H } from '../building.js';

// 第 2 层家具摆放。
export function buildFloor2(ctx) {
  const {
    kit, root, flickers,
    walnut, walnutDark, oak, marbleMat, emerald, emeraldDeep, champagne, blush, ivory,
    linenBlue, leather, leatherDark, gold, rugLiving, rugBed, rugStudy, sheer, drapeByFloor,
    emberMat, rugMat, box, cyl,
    plant, bouquet, chandelier, art, mirror, sofa, wing, diningChair, fireplace, bookcase,
    bed, nightstand, clock, curtainsFor,
  } = ctx;

  // ---------- 二层：主卧套房 ----------
  const g1 = new THREE.Group();
  g1.position.y = FLOOR_H;
  box(4.4, 0.02, 3.5, rugBed, 0.05, 0.02, -3.35, g1);
  bed(g1, 0.05, -4.0, 1);
  nightstand(g1, -1.58, -4.55, 1);
  nightstand(g1, 1.68, -4.55, 1);
  box(1.15, 0.16, 0.38, champagne, 0.05, 0.32, -2.48, g1);
  for (const lx of [-0.42, 0.42]) cyl(0.03, 0.035, 0.28, kit.brass, lx, 0.14, -2.48, 6, g1);
  solid(1, 0.05, -2.48, 0.6, 0.22);
  bookcase(g1, -3.35, -5.28, 1, 1.15);
  box(1.15, 0.72, 0.42, walnut, 2.75, 0.38, -5.18, g1);
  box(1.22, 0.05, 0.48, marbleMat, 2.75, 0.76, -5.18, g1);
  mirror(g1, 2.75, 1.4, -5.42, 0.7, 0.85);
  solid(1, 2.75, -5.18, 0.62, 0.26);
  bouquet(g1, 2.75, 0.82, -5.12, 0.7);
  wing(g1, -2.25, 3.35, Math.PI / 2, 1, blush);
  box(1.35, 0.72, 0.42, walnut, 2.55, 0.38, 4.95, g1);
  solid(1, 2.55, 4.95, 0.7, 0.24);
  art(g1, 0.05, 2.05, -5.5, 1.2, 0.7, 0x1e4d56, 0xf3ead7);
  plant(g1, -6.9, 4.85, 1, 0.9);
  plant(g1, 6.55, -4.85, 1, 0.85);
  chandelier(g1, 0.05, -2.6, 2.8);
  curtainsFor(g1, 1);
  root.add(g1);
}
