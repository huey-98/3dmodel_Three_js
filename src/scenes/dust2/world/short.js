// A 小（Short）：赭黄转角塔、Short Stairs、Lower Tunnels 拱廊。对照 CS2 从院子北望石阶。
import * as THREE from 'three';
import { A_SMALL_Y, A_PLAT_Y, CT_Y, SLAB } from '../layout.js';

export function buildShort(ctx) {
  cornerTower(ctx);
  stairCheeks(ctx);
  lowerTunnelsArcade(ctx);
  awningHouse(ctx);
  shortDressing(ctx);
}

function cornerTower(ctx) {
  const { kit, box, volume, solid } = ctx;
  const y0 = A_SMALL_Y;
  const x0 = 16.4;
  const x1 = 22.2;
  const z0 = 24.2;
  const z1 = 32.8;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const h = 8.4;

  volume(x0, x1, y0, y0 + h, z0, z1, kit.ochre);
  // 补角楼与 Lower Tunnels 之间、A 小楼板下的缝，防止走进去坠入虚空
  volume(14.6, 16.4, CT_Y, CT_Y + SLAB, 24.2, 26.0, kit.ochre);
  solid(14.6, 16.4, 24.2, 26.0);
  box((x1 - x0) + 0.22, 0.28, (z1 - z0) + 0.22, kit.ochre, cx, y0 + h + 0.12, cz);
  box((x1 - x0) + 0.08, 0.16, (z1 - z0) + 0.08, kit.mass, cx, y0 + h + 0.34, cz);

  box(0.55, h + 0.4, 0.55, kit.ochre, x0 + 0.12, y0 + h / 2, z1 - 0.12);
  box(0.7, 0.22, 0.7, kit.mass, x0 + 0.12, y0 + h + 0.28, z1 - 0.12);

  box(0.9, 0.7, 0.12, kit.recess, cx - 0.6, y0 + 2.15, z1 + 0.08);
  box(0.7, 0.5, 0.06, kit.dark, cx - 0.6, y0 + 2.15, z1 + 0.14);

  const eastFace = x1 + 0.08;
  for (const [zy, yy] of [[27.4, y0 + 5.6], [29.2, y0 + 5.4], [26.2, y0 + 6.2]]) {
    box(0.12, 0.85, 0.7, kit.recess, eastFace, yy, zy);
    box(0.06, 0.65, 0.5, kit.dark, eastFace + 0.08, yy, zy);
  }

  box(0.14, 1.5, 1.1, kit.sand, eastFace, y0 + 3.4, 28.6);
  box(0.18, 0.9, 0.9, kit.mass, x0 - 0.08, y0 + 4.8, 29.4);

  volume(17.2, 21.6, y0 + h, y0 + h + 1.7, 24.4, 27.4, kit.ochre);
  box(4.6, 0.22, 3.2, kit.mass, 19.4, y0 + h + 1.82, 25.9);

  box(0.22, 5.6, 8.4, kit.ochre, 22.06, A_PLAT_Y + 2.9, 20.2);
  box(0.28, 0.22, 8.5, kit.ochre, 22.1, A_PLAT_Y + 5.8, 20.2);
}

function stairCheeks(ctx) {
  const { kit, box, platform } = ctx;
  const y0 = A_SMALL_Y;
  box(2.15, 2.05, 2.8, kit.weathered, 25.15, y0 + 1.02, 31.35);
  box(2.35, 0.24, 3.0, kit.weathered, 25.15, y0 + 2.12, 31.3);
  box(0.72, 1.55, 6.8, kit.weathered, 25.72, y0 + 1.72, 27.7);
  box(0.88, 0.2, 6.9, kit.weathered, 25.72, y0 + 2.55, 27.65);

  platform(21.85, 22.28, 16.0, 24.2, A_PLAT_Y + 1.05, A_PLAT_Y);
  box(0.28, 1.05, 8.2, kit.ochre, 22.05, A_PLAT_Y + 0.52, 20.1);

  box(0.22, 0.95, 2.15, kit.weathered, 25.92, A_PLAT_Y + 0.48, 23.15);
  platform(25.78, 26.12, 22.2, 24.2, A_PLAT_Y + 0.95, A_PLAT_Y);
}

function lowerTunnelsArcade(ctx) {
  const { kit, box, volume, group, archPane, darkOpening } = ctx;
  const y0 = A_SMALL_Y;
  const face = 27.82;
  volume(10.0, 14.6, y0, y0 + 7.2, 24.2, 27.8, kit.weathered);
  box(4.8, 0.28, 3.8, kit.weathered, 12.3, y0 + 7.34, 26.0);
  box(5.0, 0.16, 0.55, kit.mass, 12.3, y0 + 7.58, 27.7);

  for (let x = 10.4; x < 14.4; x += 0.95) {
    box(0.42, 0.55, 0.42, kit.weathered, x, y0 + 7.85, 27.55);
  }

  const bays = [11.15, 12.35, 13.55];
  for (const bx of bays) {
    const rec = archPane(1.05, 1.7, kit.recess);
    rec.position.set(bx, y0 + 4.35, face);
    group.add(rec);
    const gl = archPane(0.82, 1.42, kit.plaster);
    gl.position.set(bx, y0 + 4.42, face + 0.04);
    group.add(gl);
    box(1.15, 0.1, 0.22, kit.mass, bx, y0 + 6.15, face + 0.06);
  }

  darkOpening(12.3, 26.1, 2.6, 2.2, 2.4, y0);
  const door = archPane(2.4, 2.45, kit.recess);
  door.position.set(12.3, y0, face);
  group.add(door);
  box(2.7, 0.18, 0.35, kit.mass, 12.3, y0 + 2.55, face + 0.08);
  box(0.22, 2.5, 0.22, kit.mass, 11.05, y0 + 1.25, face + 0.1);
  box(0.22, 2.5, 0.22, kit.mass, 13.55, y0 + 1.25, face + 0.1);

  box(3.4, 0.55, 0.28, kit.weathered, 12.3, y0 + 0.28, 28.15);
  box(0.22, 0.7, 0.22, kit.weathered, 10.7, y0 + 0.35, 28.15);
  box(0.22, 0.7, 0.22, kit.weathered, 13.9, y0 + 0.35, 28.15);
}

function awningHouse(ctx) {
  const { kit, box, volume } = ctx;
  const y0 = A_SMALL_Y;
  volume(10.0, 11.5, y0, y0 + 6.4, 33.2, 38.0, kit.plaster);
  box(1.7, 0.12, 4.9, kit.greenPaint, 10.85, y0 + 3.55, 35.6);
  box(1.9, 0.08, 5.1, kit.greenPaint, 10.9, y0 + 3.62, 35.6);
  box(0.12, 1.35, 0.9, kit.shutter, 11.52, y0 + 4.55, 35.2);
  box(0.12, 1.35, 0.9, kit.shutter, 11.52, y0 + 4.55, 36.4);
  box(0.18, 0.12, 2.2, kit.mass, 11.5, y0 + 5.28, 35.8);
}

function shortDressing(ctx) {
  const { kit, box, group } = ctx;
  const y0 = A_SMALL_Y;

  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.7), kit.grate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(20.4, y0 + 0.025, 35.6);
  group.add(grate);

  box(0.16, 6.8, 0.16, kit.iron, 13.2, y0 + 3.4, 39.4);
  box(0.55, 0.12, 1.4, kit.iron, 13.2, y0 + 6.9, 39.4);
  addWire(group, new THREE.Vector3(13.2, y0 + 6.75, 39.4), new THREE.Vector3(22.1, y0 + 8.6, 28.4), 1.1);
  addWire(group, new THREE.Vector3(13.2, y0 + 6.55, 39.4), new THREE.Vector3(22.2, A_PLAT_Y + 5.4, 20.5), 1.4);
  addWire(group, new THREE.Vector3(11.2, y0 + 6.2, 35.8), new THREE.Vector3(13.2, y0 + 6.75, 39.4), 0.5);

}

function addWire(group, p0, p1, sag) {
  const curve = new THREE.QuadraticBezierCurve3(
    p0,
    new THREE.Vector3((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - sag, (p0.z + p1.z) / 2),
    p1,
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 10, 0.022, 4, false),
    new THREE.MeshStandardMaterial({ color: 0x2a2824, roughness: 0.8 }),
  );
  group.add(mesh);
}
