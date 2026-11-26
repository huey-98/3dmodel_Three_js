// 警家木构拱廊：风化灰木拱门、望板顶、棚内沙地。
// 东拱门外就是 A 后巷，同一标高（-1.0），中间没有坡、墙或隧道。
// 望板顶只做檐口，不登记可站面。
import * as THREE from 'three';
import { CT_Y } from '../layout.js';

const FACE_X = 21.05;
const HALL_X0 = 10.4;
const HALL_Z0 = 6.5;
const HALL_Z1 = 15.5;
const POST_H = 3.35;
const CEIL_Y = CT_Y + 3.55;

export function buildCtSpawn(ctx) {
  eastFacade(ctx);
  hallInterior(ctx);
  barredWindows(ctx);
  hangingLamps(ctx);
  interiorDressing(ctx);
}

function eastFacade(ctx) {
  const { kit, box, solid, group } = ctx;
  const y0 = CT_Y;
  const zMid = (HALL_Z0 + HALL_Z1) / 2;
  const openW = HALL_Z1 - HALL_Z0;
  const headerBot = y0 + POST_H + 0.15;
  const headerTop = y0 + 6.45;

  box(0.7, headerTop - y0, 2.55, kit.weathered, FACE_X, (y0 + headerTop) / 2, HALL_Z0 - 1.15);
  solid(FACE_X - 0.38, FACE_X + 0.38, 4.12, HALL_Z0 + 0.08);
  box(0.55, 2.9, 0.7, kit.weathered, FACE_X + 0.15, y0 + 1.45, HALL_Z1 + 0.28);

  box(0.62, headerTop - headerBot, openW + 1.5, kit.weathered, FACE_X, (headerBot + headerTop) / 2, zMid);
  // 望板顶只作檐口：不登记 platform，警家跳不上第二层的 A 包点
  box(0.78, 0.24, openW + 1.7, kit.weathered, FACE_X + 0.04, headerTop + 0.08, zMid);
  box(0.4, 0.12, openW + 1.85, kit.mass, FACE_X + 0.12, headerTop + 0.22, zMid);

  const zL = HALL_Z1 - 0.18;
  const zR = HALL_Z0 + 0.18;
  for (const z of [zL, zR]) {
    box(0.58, POST_H, 0.58, kit.timber, FACE_X, y0 + POST_H / 2, z);
    box(0.4, POST_H - 0.15, 0.4, kit.timber, FACE_X - 0.42, y0 + (POST_H - 0.15) / 2, z);
    solid(FACE_X - 0.32, FACE_X + 0.32, z - 0.3, z + 0.3);
  }

  const archW = openW - 0.55;
  const rise = 1.28;
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const z = zMid - archW / 2 + archW * t;
    const y = y0 + POST_H - 0.12 + rise * (1 - (2 * t - 1) ** 2);
    pts.push(new THREE.Vector3(FACE_X + 0.18, y, z));
  }
  const tube = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.28, 8, false),
    kit.timber,
  );
  tube.castShadow = true;
  tube.receiveShadow = true;
  group.add(tube);

  box(0.7, 0.32, archW + 1.05, kit.timber, FACE_X + 0.08, y0 + POST_H + rise + 0.05, zMid);

  const span = ctx.archSpandrel(archW + 0.2, rise + 0.25, 0.55, kit.weathered);
  span.position.set(FACE_X + 0.32, y0 + POST_H - 0.18, zMid);
  span.rotation.y = Math.PI / 2;
  span.castShadow = true;
  span.receiveShadow = true;
  group.add(span);
}

function hallInterior(ctx) {
  const { kit, box, solid } = ctx;
  const y0 = CT_Y;
  const x0 = HALL_X0;
  const x1 = FACE_X - 0.35;
  const z0 = HALL_Z0;
  const z1 = HALL_Z1;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const spanX = x1 - x0;
  const spanZ = z1 - z0;

  box(spanX + 0.35, 0.1, spanZ + 0.3, kit.plank, cx, CEIL_Y + 0.1, cz);
  for (let x = x0 + 0.7; x < x1 - 0.2; x += 2.05) {
    box(0.28, 0.24, spanZ + 0.1, kit.timber, x, CEIL_Y - 0.04, cz);
  }
  for (let z = z0 + 1.1; z < z1 - 0.5; z += 2.35) {
    box(spanX + 0.15, 0.14, 0.18, kit.timber, cx, CEIL_Y + 0.04, z);
  }

  const cols = [12.15, 16.05];
  const rows = [z0 + 0.32, z1 - 0.32];
  for (const x of cols) {
    for (const z of rows) {
      box(0.42, POST_H, 0.42, kit.timber, x, y0 + POST_H / 2, z);
      solid(x - 0.22, x + 0.22, z - 0.22, z + 0.22);
    }
    box(0.44, 0.2, spanZ + 0.15, kit.timber, x, CEIL_Y - 0.16, cz);
  }

  box(5.1, 3.05, 0.22, kit.weathered, 12.9, y0 + 1.48, z1 + 0.1);
  solid(10.45, 15.35, z1 - 0.02, z1 + 0.3);
  box(0.2, 2.5, 2.4, kit.recess, x0 + 0.16, y0 + 1.2, z1 - 1.65);
}

function barredWindows(ctx) {
  const { kit, box } = ctx;
  const y0 = CT_Y;
  box(11.2, 5.2, 0.18, kit.weathered, 16, y0 + 2.4, 3.98);
  for (const x of [13.2, 17.6]) {
    box(1.9, 1.55, 0.14, kit.recess, x, y0 + 1.75, 4.16);
    for (let i = -2; i <= 2; i++) {
      box(0.05, 1.4, 0.05, kit.iron, x + i * 0.32, y0 + 1.75, 4.28);
    }
    for (let j = -1; j <= 1; j++) {
      box(1.7, 0.05, 0.05, kit.iron, x, y0 + 1.75 + j * 0.48, 4.28);
    }
    box(2.1, 0.12, 0.2, kit.mass, x, y0 + 0.9, 4.32);
  }
}

function hangingLamps(ctx) {
  const { kit, box, group } = ctx;
  const y0 = CT_Y;
  for (const [x, z] of [[14.6, 9.6], [17.4, 12.4]]) {
    box(0.04, 0.42, 0.04, kit.iron, x, CEIL_Y - 0.28, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), kit.lampGlow);
    bulb.position.set(x, y0 + 2.95, z);
    group.add(bulb);
    const light = new THREE.PointLight(0xffc078, 18, 11, 1.55);
    light.position.set(x, y0 + 2.75, z);
    group.add(light);
  }
}

function interiorDressing(ctx) {
  const { kit, box, solid, crate, group } = ctx;
  const y0 = CT_Y;
  crate(1.18, 13.6, 13.4, y0);
  crate(1.08, 14.75, 13.75, y0);
  crate(0.98, 13.75, 14.5, y0);
  box(0.12, 1.45, 2.2, kit.wood, 12.2, y0 + 0.8, 8.15);
  solid(12.08, 12.42, 7.15, 9.15);
  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85), kit.grate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(21.7, y0 + 0.03, 14.7);
  group.add(grate);
}
