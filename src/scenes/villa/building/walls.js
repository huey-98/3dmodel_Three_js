import * as THREE from 'three';
import { W, D, T, FLOOR_H, DOOR_W, HALF_W, HALF_D, TOP_Y, WALL_UV, OPENINGS } from './layout.js';

// 外墙（含门窗洞切割）、勒脚、腰线、山花与玻璃窗。
export function buildWalls(ctx) {
  const {
    kit, group, box, cyl,
    stone, marble, walnut, parquet, paver, plaster, trimWood, doorWood, doorPanel,
    runnerMat, leafMat, leafLite, lampMat, crownMat, matLeft, matRight, matBack, matFront,
  } = ctx;

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
}
