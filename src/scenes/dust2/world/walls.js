// 墙体系统：WALLS 自动定高 + 城垛/假窗/过梁外立面。
import * as THREE from 'three';
import { WALLS, FLOORS, WALL_H, VOID_Y } from '../layout.js';
import { maxTopNear } from './floors.js';

export function buildWalls(ctx) {
  const { kit, box, volume, solid, platform } = ctx;
  const matFor = (kind) => (kind === 'cave' ? kit.cave : kind === 'plaster' ? kit.plaster : kit.sand);
  for (const w of WALLS) {
    const x0 = Math.min(w.x0, w.x1), x1 = Math.max(w.x0, w.x1);
    const z0 = Math.min(w.z0, w.z1), z1 = Math.max(w.z0, w.z1);
    const top = w.top ?? maxTopNear(FLOORS, x0, x1, z0, z1, 1.6) + WALL_H;
    volume(x0, x1, VOID_Y, top, z0, z1, matFor(w.kind));
    if (w.para) platform(x0, x1, z0, z1, top, VOID_Y); else solid(x0, x1, z0, z1);
    if (x1 - x0 > 0.9 && z1 - z0 < 1) box(x1 - x0, 0.3, z1 - z0 + 0.34, kit.mass, (x0 + x1) / 2, top + 0.15, (z0 + z1) / 2);
    else if (z1 - z0 > 0.9 && x1 - x0 < 1) box(x1 - x0 + 0.34, 0.3, z1 - z0, kit.mass, (x0 + x1) / 2, top + 0.15, (z0 + z1) / 2);
  }
  facadeDetails(ctx);
}

const CRENELS = [
  { axis: 'z', at: 84.3, lo: -8, hi: 20, top: 9.25, step: 3 },   // 匪家南墙（外圈楼体顶）
  { axis: 'x', at: -14.3, lo: 6, hi: 26, top: 8.5, step: 3 },    // B 点东墙
  { axis: 'x', at: 52.3, lo: 26, hi: 64, top: 6.8, step: 3 },    // A 大东墙
];

function facadeDetails(ctx) {
  const { kit, box, volume, group, archPane, archSpandrel, solid } = ctx;
  function blindWindow(axis, face, lo, hi, y, w, h, side) {
    const eps = side * 0.12;
    if (axis === 'x') {
      box(0.26, h + 0.66, w + 0.66, kit.mass, face + eps, y, (lo + hi) / 2);
      box(0.16, h, w, kit.recess, face + eps * 2.2, y, (lo + hi) / 2);
      box(0.5, 0.16, w + 0.9, kit.mass, face + side * 0.34, y - h / 2 - 0.2, (lo + hi) / 2);
    } else {
      box(w + 0.66, h + 0.66, 0.26, kit.mass, (lo + hi) / 2, y, face + eps);
      box(w, h, 0.16, kit.recess, (lo + hi) / 2, y, face + eps * 2.2);
      box(w + 0.9, 0.16, 0.5, kit.mass, (lo + hi) / 2, y - h / 2 - 0.2, face + side * 0.34);
    }
  }
  blindWindow('z', 40, -20, -18.4, 4.6, 1.5, 2.0, -1);
  blindWindow('z', 40, -12, -10.4, 4.6, 1.5, 2.0, -1);
  blindWindow('x', 6, 44, 45.6, 5.6, 1.5, 2.0, -1);
  blindWindow('x', 6, 50, 51.6, 5.6, 1.5, 2.0, -1);
  blindWindow('z', 40, 24, 25.6, 4.6, 1.5, 2.0, -1);
  blindWindow('z', 40, 30, 31.6, 4.6, 1.5, 2.0, -1);
  box(13.4, 0.6, 0.9, kit.beam, 0, 4.6, 26);                 // 中门过梁
  box(0.6, 0.7, 10.7, kit.sand, -14.3, 8.15, 15);            // B 门洞顶过梁（承城垛）
  volume(43.6, 52.4, 4.9, 5.5, 47.6, 56.4, kit.sand);        // A 大拱门楣
  aSiteFacade(ctx);
  ctSpawnArch(ctx);
  for (const c of CRENELS) {
    for (let p = c.lo; p < c.hi; p += c.step) {
      const q = Math.min(p + c.step * 0.55, c.hi);
      if (c.axis === 'x') box(q - p, 0.8, 0.9, kit.sand, (p + q) / 2, c.top + 0.4, c.at);
      else box(0.9, 0.8, q - p, kit.sand, c.at, c.top + 0.4, (p + q) / 2);
    }
  }
}

// A 包点北侧白楼：整面立面 + 真实拱窗 + 阳台，以及矮墙上的红色 A 字牌。
function aSiteFacade(ctx) {
  const { kit, box, group, archPane } = ctx;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), kit.facade);
  face.position.set(35, 5, 6.02);
  face.receiveShadow = true;
  group.add(face);
  for (const wx of [28.5, 33, 37.5, 42]) {
    const rec = archPane(1.9, 2.6, kit.recess); rec.position.set(wx, 4.9, 6.05); group.add(rec);
    const gl = archPane(1.6, 2.3, kit.teal); gl.position.set(wx, 5.0, 6.11); group.add(gl);
    box(2.1, 0.12, 0.3, kit.plaster, wx, 4.9, 6.2);
  }
  box(18, 0.18, 0.7, kit.plaster, 35, 4.7, 6.35);          // 阳台挑板
  box(18, 0.5, 0.1, kit.plaster, 35, 5.05, 6.66);         // 栏杆扶手
  for (let x = 26.5; x <= 44; x += 1.5) box(0.1, 0.5, 0.1, kit.plaster, x, 5.0, 6.66);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), kit.letter);
  sign.position.set(30, 2.7, 26.12);                      // 矮墙南面 A 字牌
  group.add(sign);
}

// 警家木构拱廊 + 北侧白楼立面。
function ctSpawnArch(ctx) {
  const { kit, box, solid, group, archSpandrel, archPane } = ctx;
  const y0 = -3.25;
  for (const px of [10.6, 19.4]) {
    box(0.5, 3.0, 0.5, kit.beam, px, y0 + 1.5, 12);
    solid(px - 0.25, px + 0.25, 11.75, 12.25);
  }
  const sp = archSpandrel(9.4, 2.2, 0.6, kit.beam);
  sp.position.set(15, y0 + 1.5, 11.7);
  sp.castShadow = true; sp.receiveShadow = true;
  group.add(sp);
  box(10, 0.2, 8, kit.wood, 15, y0 + 3.7, 10);            // 顶棚板
  for (const bz of [7, 9, 11, 13]) box(10, 0.18, 0.3, kit.beam, 15, y0 + 3.55, bz);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), kit.facade);
  face.position.set(15, 1.0, 6.02); face.receiveShadow = true; group.add(face);
  for (const wx of [12.5, 17.5]) {
    const rec = archPane(1.6, 2.2, kit.recess); rec.position.set(wx, 1.4, 6.05); group.add(rec);
    const gl = archPane(1.3, 1.9, kit.teal); gl.position.set(wx, 1.5, 6.11); group.add(gl);
  }
}
