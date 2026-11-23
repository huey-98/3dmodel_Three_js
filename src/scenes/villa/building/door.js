import * as THREE from 'three';
import { T, DOOR_W, DOOR_H, HALF_D } from './layout.js';

// 正门：门套、双开门扇与门灯。返回两个门轴组给 createBuilding 的开关门动画。
export function buildDoor(ctx) {
  const {
    kit, group, box, cyl,
    stone, marble, walnut, parquet, paver, plaster, trimWood, doorWood, doorPanel,
    runnerMat, leafMat, leafLite, lampMat, crownMat, matLeft, matRight, matBack, matFront,
  } = ctx;

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
  return { leftPivot, rightPivot };
}
