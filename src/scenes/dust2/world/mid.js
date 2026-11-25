// 中路与警家衔接：中门石框、Xbox、猫道沿口、B1 洞口、沙地广场。
import * as THREE from 'three';
import { A_SMALL_Y, CT_Y, MID_N_Y, MID_S_Y, MID_Y } from '../layout.js';

export function buildMid(ctx) {
  midDoorsFrame(ctx);
  catwalkEdge(ctx);
  xbox(ctx);
  lowerTunnelsMouth(ctx);
  ctMidPlaza(ctx);
  midStreetDressing(ctx);
}

function midDoorsFrame(ctx) {
  const { kit, box, volume } = ctx;
  const z = 26.0;
  const y0 = MID_N_Y;
  box(6.4, 5.6, 0.7, kit.sand, -7.15, y0 + 2.7, z);
  box(6.4, 5.6, 0.7, kit.sand, 7.15, y0 + 2.7, z);
  box(16.4, 0.55, 0.95, kit.mass, 0, y0 + 5.15, z);
  box(16.8, 0.22, 1.15, kit.beam, 0, y0 + 5.52, z);
  volume(-4.2, 4.2, y0 + 4.35, y0 + 5.05, z - 0.42, z + 0.42, kit.sand);
  box(0.55, 4.8, 0.55, kit.mass, -4.35, y0 + 2.4, z);
  box(0.55, 4.8, 0.55, kit.mass, 4.35, y0 + 2.4, z);
}

function catwalkEdge(ctx) {
  const { kit, box } = ctx;
  const y = A_SMALL_Y;
  box(0.18, 0.22, 10.4, kit.mass, 10.08, y + 0.1, 44.6);
  box(0.18, 0.22, 1.6, kit.mass, 10.08, y + 0.1, 32.2);
  for (const z of [31.6, 39.4, 43.2, 47.2]) {
    box(0.16, y - MID_Y + 0.15, 0.16, kit.timber, 10.12, (MID_Y + y) / 2, z);
  }
  box(0.14, 0.85, 10.2, kit.weathered, 10.06, y + 0.48, 44.7);
}

function xbox(ctx) {
  const { crate } = ctx;
  crate(1.42, 9.18, 29.35, MID_Y);
  crate(1.05, 8.15, 30.25, MID_Y);
  crate(0.95, 9.05, 30.4, MID_Y + 1.42);
}

function lowerTunnelsMouth(ctx) {
  const { kit, box, group, archPane, darkOpening } = ctx;
  const face = -10.08;
  const y0 = MID_N_Y;
  box(0.42, 4.6, 1.1, kit.sand, face, y0 + 2.3, 27.55);
  box(0.42, 4.6, 1.1, kit.sand, face, y0 + 2.3, 36.45);
  box(0.5, 0.55, 9.4, kit.sand, face, y0 + 4.55, 32);
  darkOpening(face - 0.4, 32, 0.8, 7.6, 3.6, y0);
  const rec = archPane(7.4, 3.7, kit.recess);
  rec.position.set(face + 0.02, y0, 32);
  rec.rotation.y = Math.PI / 2;
  group.add(rec);
  box(0.22, 0.18, 7.8, kit.mass, face + 0.12, y0 + 3.85, 32);
}

function ctMidPlaza(ctx) {
  const { kit, box, crate, group } = ctx;
  const y0 = CT_Y;
  crate(1.28, 6.35, 22.55, y0);
  crate(1.18, 7.55, 23.15, y0);
  crate(1.12, 6.55, 23.55, y0 + 1.28);
  crate(0.98, 7.35, 22.7, y0 + 1.18);

  box(0.16, 4.8, 0.16, kit.iron, -6.4, y0 + 2.4, 18.5);
  box(0.45, 0.1, 1.3, kit.iron, -6.4, y0 + 4.9, 18.5);

  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), kit.grate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(2.4, y0 + 0.03, 16.8);
  group.add(grate);
}

function midStreetDressing(ctx) {
  const { kit, box, group } = ctx;
  const y0 = MID_N_Y;
  for (const [z, h] of [[42, 2.2], [48, 2.4], [38.5, 1.9]]) {
    box(0.22, h + 0.7, 1.5, kit.mass, -10.22, y0 + h / 2 + 0.2, z);
    box(0.16, h, 1.2, kit.recess, -10.38, y0 + h / 2 + 0.15, z);
    box(1.4, 0.12, 1.7, kit.mass, -10.5, y0 + 0.7, z);
  }
  box(0.2, 1.1, 18, kit.mass, -10.15, MID_S_Y + 0.4, 46);

  const a = new THREE.Vector3(-6.4, CT_Y + 4.75, 18.5);
  const b = new THREE.Vector3(7.2, MID_Y + 6.35, 48);
  addWire(group, a, b, 1.6);
  addWire(group, new THREE.Vector3(7.2, MID_Y + 6.35, 48), new THREE.Vector3(13.2, A_SMALL_Y + 6.7, 39.4), 0.9);
}

function addWire(group, p0, p1, sag) {
  const curve = new THREE.QuadraticBezierCurve3(
    p0,
    new THREE.Vector3((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 - sag, (p0.z + p1.z) / 2),
    p1,
  );
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 12, 0.022, 4, false),
    new THREE.MeshStandardMaterial({ color: 0x2a2824, roughness: 0.8 }),
  );
  group.add(mesh);
}
