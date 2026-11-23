import * as THREE from 'three';
import { FLOOR_H, FLOORS, TOP_Y, INTERIOR, STAIR_STEPS, STAIRS, STAIR_WELLS } from './layout.js';

// 室内地面、墙裙、楼板（留梯井）、楼梯踏步与吊灯灯光。返回 innerLight 给呼吸动画。
export function buildFloors(ctx) {
  const {
    kit, group, box, cyl,
    stone, marble, walnut, parquet, paver, plaster, trimWood, doorWood, doorPanel,
    runnerMat, leafMat, leafLite, lampMat, crownMat, matLeft, matRight, matBack, matFront,
  } = ctx;

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
  return { innerLight };
}
