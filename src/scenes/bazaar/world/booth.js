import * as THREE from 'three';
import { MAP_SCALE } from '../constants.js';

// 地面铺装 + 中央敞开棚（四柱、绿篷、红 B 标记）。
const BOOTH = { x0: -4.95, x1: 5.25, z0: -4.2, z1: 5.05, h: 5.25 };

export function buildBooth(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  // ---------- 地面 ----------
  kit.cobble.map.repeat.set(22 * MAP_SCALE, 22 * MAP_SCALE);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), kit.cobble);
  ground.rotation.x = -Math.PI / 2;
  ground.userData.noShadow = true;
  add(ground);
  for (const [x, z, rx, rz] of [[5.4, 5.1, 0.9, 0.55], [-5.6, 1.4, 0.7, 0.9]]) {
    const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), kit.sandPile);
    pile.scale.set(rx, 0.07, rz);
    pile.position.set(x, 0.04, z);
    pile.userData.noShadow = true;
    add(pile);
  }

  // ---------- 敞开棚：四根柱子 + 顶棚 ----------
  const B = BOOTH;
  const cx = (B.x0 + B.x1) / 2;
  const cz = (B.z0 + B.z1) / 2;
  const post = 0.42;

  for (const [x, z] of [[B.x0, B.z0], [B.x1, B.z0], [B.x0, B.z1], [B.x1, B.z1]]) {
    box(post, B.h, post, kit.beam, x, B.h / 2, z);
    solid(x - post / 2, x + post / 2, z - post / 2, z + post / 2);
  }

  const bMark = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), kit.markB);
  bMark.rotation.x = -Math.PI / 2;
  bMark.position.set(cx, 0.045, cz);
  bMark.userData.noShadow = true;
  add(bMark);

  // 右下角（朝向广场的右前柱）内侧的大箱子
  const bw = 2.05;
  const bh = 1.65;
  const bd = 1.75;
  crate(B.x1 - post / 2 - bw / 2 + 0.04, B.z1 - post / 2 - bd / 2 + 0.04, bw, bh, bd, 0xc99555);

  const tarpW = (B.x1 - B.x0) + 1.35;
  const tarpD = (B.z1 - B.z0) + 1.35;
  const tarpY = B.h + 0.16;
  const tarp = new THREE.Mesh(sagGeo(tarpW, tarpD, 28, 20, 1.45), kit.tarp);
  tarp.position.set(cx, tarpY, cz);
  add(tarp);
  animated.push({
    mode: 'tarp',
    geo: tarp.geometry,
    base: Float32Array.from(tarp.geometry.attributes.position.array),
  });
  const patch = new THREE.Mesh(sagGeo(5.2, 3.6, 12, 8, 1.2), kit.tarpPatch);
  patch.position.set(cx - 1.6, tarpY + 0.06, cz - 0.8);
  add(patch);

  const slats = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), kit.wood);
  slats.rotation.x = -Math.PI / 2;
  slats.position.set(cx + 1.4, tarpY - 0.28, cz + 0.7);
  const slatUv = slats.geometry.attributes.uv;
  for (let i = 0; i < slatUv.count; i++) {
    slatUv.setXY(i, slatUv.getX(i) * 3 * MAP_SCALE, slatUv.getY(i) * 2 * MAP_SCALE);
  }
  add(slats);

  const beamY = B.h - 0.08;
  volume(B.x0 - 0.12, B.x1 + 0.12, beamY, beamY + 0.16, B.z0 - 0.22, B.z0 + 0.06, kit.beam);
  volume(B.x0 - 0.12, B.x1 + 0.12, beamY, beamY + 0.16, B.z1 - 0.06, B.z1 + 0.22, kit.beam);
  volume(B.x0 - 0.22, B.x0 + 0.06, beamY, beamY + 0.16, B.z0, B.z1, kit.beam);
  volume(B.x1 - 0.06, B.x1 + 0.22, beamY, beamY + 0.16, B.z0, B.z1, kit.beam);
  volume(B.x0, B.x1, beamY, beamY + 0.12, cz - 0.08, cz + 0.08, kit.beam);
  // open: true 表示只有顶篷、没有墙，敌人可以走进去。
  rooms.push({ minX: -4.55, maxX: 4.85, minZ: -3.8, maxZ: 4.65, minY: 0.4, maxY: 4.9, open: true });
}
