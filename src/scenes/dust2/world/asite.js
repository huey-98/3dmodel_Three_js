// A 包点立面：药房、宫殿、Goose 通道、A 大路沿。对照 CS2 从 A 大北望包点。
import * as THREE from 'three';
import { A_PLAT_Y, LONG_Y, GOOSE_Y } from '../layout.js';

export function buildASite(ctx) {
  pharmacyFacade(ctx);
  palaceBuilding(ctx);
  gooseTunnel(ctx);
  retainingAndDoor(ctx);
  longStreetDressing(ctx);
}

function pharmacyFacade(ctx) {
  const { kit, box, volume, group, archPane, darkOpening } = ctx;
  const face = 42.04;
  const y0 = LONG_Y;
  volume(36, 42, y0 + 6.4, y0 + 9.2, 26, 40, kit.weathered);
  box(0.28, 8.6, 12.2, kit.weathered, face, y0 + 4.3, 33);
  box(0.2, 0.35, 12.4, kit.mass, face + 0.08, y0 + 8.6, 33);
  for (let z = 27; z < 40; z += 1.6) {
    box(0.22, 0.28, 0.9, kit.mass, face + 0.12, y0 + 8.9, z);
  }

  const doorZ = 33.2;
  darkOpening(face - 0.4, doorZ, 0.5, 1.9, 2.7, y0);
  const rec = archPane(1.9, 2.8, kit.recess);
  rec.position.set(face + 0.02, y0, doorZ);
  rec.rotation.y = Math.PI / 2;
  group.add(rec);
  box(0.12, 2.5, 1.5, kit.door, face + 0.08, y0 + 1.25, doorZ);
  box(1.4, 0.18, 2.2, kit.mass, 41.2, y0 + 0.1, doorZ);

  box(0.18, 1.1, 1.3, kit.iron, face + 0.1, y0 + 3.55, 42.4);
  for (let i = -2; i <= 2; i++) box(0.05, 1.0, 0.05, kit.iron, face + 0.18, y0 + 3.55, 42.4 + i * 0.22);
  for (let j = -1; j <= 1; j++) box(0.05, 0.05, 1.2, kit.iron, face + 0.18, y0 + 3.55 + j * 0.36, 42.4);

  const cross = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), kit.cross);
  cross.position.set(face + 0.16, y0 + 4.6, 31);
  cross.rotation.y = Math.PI / 2;
  group.add(cross);

  const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 3.4), kit.banner);
  banner.position.set(face + 0.14, y0 + 3.6, 29.2);
  banner.rotation.y = Math.PI / 2;
  group.add(banner);
  box(0.12, 3.5, 0.9, kit.greenPaint, face + 0.08, y0 + 3.6, 29.2);

  box(0.28, 0.7, 0.5, kit.iron, face + 0.2, y0 + 0.7, 36.2);
  box(0.12, 2.2, 0.12, kit.iron, face + 0.22, y0 + 1.4, 37.4);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), kit.iron);
  pipe.position.set(face + 0.2, y0 + 1.7, 38.2);
  pipe.castShadow = true;
  group.add(pipe);

  box(0.22, 1.6, 1.2, kit.recess, face + 0.1, y0 + 6.8, 30);
  box(0.22, 1.6, 1.2, kit.recess, face + 0.1, y0 + 6.8, 36.5);
  box(0.08, 1.4, 1.0, kit.dark, face + 0.22, y0 + 6.8, 30);
  box(0.08, 1.4, 1.0, kit.dark, face + 0.22, y0 + 6.8, 36.5);

  box(0.3, 6.4, 4.2, kit.sand, 42.1, y0 + 3.2, 34);
  box(0.5, 0.4, 4.4, kit.mass, 42.15, y0 + 6.5, 34);
  box(1.6, 1.8, 1.6, kit.sand, 39, y0 + 8.2, 33.2);
  box(6.2, 7.2, 0.28, kit.weathered, 39, y0 + 3.6, 32.04);
  box(6.2, 0.3, 0.4, kit.mass, 39, y0 + 7.3, 32.1);
}

function palaceBuilding(ctx) {
  const { kit, box, volume, solid, group, archPane } = ctx;
  const y0 = A_PLAT_Y;
  volume(27.5, 44.5, y0, y0 + 7.6, 4.0, 6.6, kit.plaster);
  solid(27.5, 44.5, 4.0, 6.6);
  volume(30, 42, y0 + 7.6, y0 + 9.4, 4.0, 6.2, kit.plaster);
  box(17.4, 0.28, 0.7, kit.plaster, 36, y0 + 7.7, 6.7);
  box(17.4, 0.12, 0.9, kit.tealRail, 36, y0 + 3.55, 7.15);
  for (let x = 28; x <= 44; x += 1.15) {
    box(0.08, 0.7, 0.08, kit.tealRail, x, y0 + 3.85, 7.15);
  }
  box(17.2, 0.22, 1.15, kit.plaster, 36, y0 + 3.4, 6.95);

  const bays = [29.2, 32.4, 35.6, 38.8, 42.0];
  for (const wx of bays) {
    for (const [yy, ww, hh] of [[y0 + 1.7, 2.0, 2.4], [y0 + 5.3, 1.8, 2.1]]) {
      const rec = archPane(ww, hh, kit.recess);
      rec.position.set(wx, yy - hh * 0.15, 6.62);
      group.add(rec);
      const gl = archPane(ww - 0.3, hh - 0.3, kit.teal);
      gl.position.set(wx, yy - hh * 0.12, 6.72);
      group.add(gl);
      box(ww + 0.15, 0.1, 0.28, kit.plaster, wx, yy + hh * 0.55, 6.8);
    }
  }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), kit.letter);
  sign.position.set(31.2, y0 + 2.4, 6.78);
  group.add(sign);
  box(0.55, 7.2, 0.55, kit.plaster, 27.8, y0 + 3.6, 6.4);
  box(0.55, 7.2, 0.55, kit.plaster, 44.2, y0 + 3.6, 6.4);
  box(0.4, 2.2, 0.4, kit.plaster, 36, y0 + 8.8, 5.4);
}

function gooseTunnel(ctx) {
  const { kit, box, volume, solid, darkOpening } = ctx;
  volume(26.1, 35.9, 2.55, 2.72, 16.1, 21.9, kit.mass);
  box(0.45, 2.0, 6.0, kit.mass, 35.85, GOOSE_Y + 1.0, 19);
  solid(35.6, 36.1, 16, 22);
  box(9.6, 0.22, 0.45, kit.mass, 31, GOOSE_Y + 0.12, 21.85);
  darkOpening(31, 19, 8.6, 5.2, 1.9, GOOSE_Y);
  box(0.55, 2.5, 0.55, kit.beam, 28.0, GOOSE_Y + 1.25, 22.05);
  box(0.55, 2.5, 0.55, kit.beam, 34.0, GOOSE_Y + 1.25, 22.05);
  box(6.6, 0.32, 0.55, kit.beam, 31, GOOSE_Y + 2.45, 22.05);
  const rec = ctx.archPane(6.2, 2.5, kit.recess);
  rec.position.set(31, GOOSE_Y, 22.12);
  rec.castShadow = true;
  ctx.group.add(rec);
}

function retainingAndDoor(ctx) {
  const { kit, box, group } = ctx;
  const y0 = LONG_Y;
  const top = A_PLAT_Y;
  box(6, top - y0, 0.55, kit.plaster, 39, (y0 + top) / 2, 21.72);
  box(6.2, 0.28, 0.7, kit.plaster, 39, top + 0.12, 21.85);
  box(1.15, 2.15, 0.12, kit.greenPaint, 39.4, y0 + 1.15, 22.05);
  const doorA = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), kit.letter);
  doorA.position.set(39.4, y0 + 1.55, 22.14);
  group.add(doorA);
  box(0.35, 0.9, 0.35, kit.iron, 37.6, y0 + 0.45, 22.0);
}

function longStreetDressing(ctx) {
  const { kit, box, group, solid } = ctx;
  for (let z = 26; z < 48; z += 1.6) {
    const mat = ((z / 1.6) | 0) % 2 ? kit.curbRed : kit.curbWhite;
    box(0.22, 0.16, 1.5, mat, 53.5, LONG_Y + 0.1, z + 0.75);
  }
  box(0.18, 7.2, 0.18, kit.iron, 53.2, LONG_Y + 3.6, 40);
  box(0.7, 0.14, 1.8, kit.iron, 53.2, LONG_Y + 7.3, 40);
  const a = new THREE.Vector3(46, LONG_Y + 7.1, 32);
  const b = new THREE.Vector3(53.2, LONG_Y + 7.2, 40);
  const c = new THREE.Vector3(53.2, LONG_Y + 6.8, 46);
  addWire(group, a, b, 0.9);
  addWire(group, b, c, 1.1);
  addWire(group, new THREE.Vector3(46, LONG_Y + 6.7, 32), new THREE.Vector3(53.2, LONG_Y + 6.8, 40), 0.8);
  box(0.7, 0.22, 6, kit.cobble, 42.4, LONG_Y + 0.12, 36);
  solid(53.1, 53.3, 39.9, 40.1);
}

function addWire(group, p0, p1, sag) {
  const curve = new THREE.QuadraticBezierCurve3(
    p0,
    new THREE.Vector3((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - sag, (p0.z + p1.z) / 2),
    p1,
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 12, 0.025, 4, false),
    new THREE.MeshStandardMaterial({ color: 0x2a2824, roughness: 0.8 }),
  );
  group.add(mesh);
}
