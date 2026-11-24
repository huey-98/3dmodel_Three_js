// 道具层：CS2 点位掩体。箱堆/车/集装箱/沙袋/脚手架/灯火/旗帜/包点喷图。
import * as THREE from 'three';
import { A_PLAT_Y, B_Y, T_Y, CT_Y, PIT_Y, B2_Y, MID_Y, ROAD_Y, GARDEN_Y, LONG_Y, GOOSE_Y } from '../layout.js';

const PALMS = [
  [6, 80, T_Y], [-34, 70, GARDEN_Y],
  [32, 9.2, A_PLAT_Y], [37.5, 8.6, A_PLAT_Y], [42.2, 9.5, A_PLAT_Y], [29.4, 8.4, A_PLAT_Y],
];
const BARRELS = [
  [-30, 8, B_Y], [48, 36, LONG_Y], [38, 18, A_PLAT_Y], [12, 10, CT_Y],
  [-36, 44, B2_Y],
];
const LAMPS = [
  { x: -36, y: 4.0, z: 38 },
  { x: -4, y: 3.9, z: 28, g: MID_Y },
  { x: 18, y: 2.4, z: 18, g: CT_Y },
  { x: -28, y: 5.4, z: 10, g: B_Y },
  { x: 40, y: 5.4, z: 10, g: A_PLAT_Y },
  { x: 51, y: 4.4, z: 40, g: LONG_Y },
  { x: -30, y: 3.4, z: 62, g: GARDEN_Y },
];

export function buildProps(ctx) {
  const { kit, box, solid, crate, platform, group } = ctx;

  const letterGeo = new THREE.PlaneGeometry(7, 7);
  const decalA = new THREE.Mesh(letterGeo, kit.letter);
  decalA.rotation.x = -Math.PI / 2; decalA.position.set(36, A_PLAT_Y + 0.03, 14); group.add(decalA);
  const decalB = new THREE.Mesh(letterGeo, kit.letterB);
  decalB.rotation.x = -Math.PI / 2; decalB.position.set(-24, B_Y + 0.03, 14); group.add(decalB);

  crate(1.4, -28, 18, B_Y);
  crate(1.6, -26, 16, B_Y);
  crate(1.2, -22, 8, B_Y);
  crate(1.2, -30, 7, B_Y);
  addCar(ctx, -20, 10, B_Y, 0.5);
  woodFence(ctx, -18, 18, B_Y, 6);

  box(0.3, 2.6, 0.3, kit.beam, -13.4, CT_Y + 1.3, 8.2);
  box(0.3, 2.6, 0.3, kit.beam, -11.2, CT_Y + 1.3, 8.2);
  box(2.6, 0.16, 1.4, kit.wood, -12.3, CT_Y + 1.7, 8.5);
  platform(-13.6, -11.0, 7.8, 9.2, CT_Y + 1.78, CT_Y);

  aSiteCrates(ctx);
  gooseCrates(ctx);
  addCar(ctx, 48, 34, LONG_Y, 0.15);
  crate(1.5, 45.2, 66, PIT_Y);
  addContainer(ctx, 34, 72, ROAD_Y, 0.1);
  crate(1.6, 8, 80, T_Y);
  crate(1.2, 10.2, 80, T_Y);
  crate(1.2, 8, 82.2, T_Y + 1.6);

  for (const [x, z, y] of PALMS) addPalm(ctx, x, z, y);
  for (const [x, z, y] of BARRELS) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.05, 12), kit.blue);
    barrel.position.set(x, y + 0.52, z);
    barrel.castShadow = true; barrel.receiveShadow = true; group.add(barrel);
    solid(x - 0.42, x + 0.42, z - 0.42, z + 0.42);
  }
  for (const lp of LAMPS) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), kit.lampGlow);
    lamp.position.set(lp.x, lp.y, lp.z); group.add(lamp);
    const light = new THREE.PointLight(0xffb060, 20, 13, 1.8);
    light.position.set(lp.x, lp.y - 0.4, lp.z); group.add(light);
    if (lp.g !== undefined) {
      box(0.14, lp.y - lp.g, 0.14, kit.mass, lp.x, (lp.y + lp.g) / 2, lp.z);
    } else {
      box(0.16, 0.5, 0.16, kit.mass, lp.x, lp.y + 0.42, lp.z);
    }
  }
  addFlag(ctx, 0, 82, T_Y + 0.2, 0xb0352a);
  addFlag(ctx, 12, 22, CT_Y + 0.2, 0x3a6ea8);

  box(0.18, 6.4, 0.18, kit.mass, 7.2, MID_Y + 3.2, 48);
  box(0.5, 0.12, 1.6, kit.mass, 7.2, MID_Y + 6.5, 48);
}

function aSiteCrates(ctx) {
  const { kit, box, platform } = ctx;
  const y = A_PLAT_Y;
  function put(size, x, z, lift = 0) {
    box(size, size, size, kit.aCrate, x, y + lift + size / 2, z);
    platform(x - size / 2, x + size / 2, z - size / 2, z + size / 2, y + lift + size, y + lift);
  }
  put(1.55, 40.4, 18.2);
  put(1.55, 42.1, 18.4);
  put(1.2, 41.2, 16.8);
  put(1.15, 40.6, 18.2, 1.55);
  put(1.35, 38.6, 17.6);
}

function gooseCrates(ctx) {
  const { kit, box, platform } = ctx;
  const y = GOOSE_Y;
  box(1.3, 1.3, 1.3, kit.crate, 30.2, y + 0.65, 21.2);
  platform(29.55, 30.85, 20.55, 21.85, y + 1.3, y);
  box(1.1, 1.1, 1.1, kit.crate, 31.5, y + 0.55, 21.0);
  platform(30.95, 32.05, 20.45, 21.55, y + 1.1, y);
  box(1.1, 1.1, 1.1, kit.crate, 30.4, y + 1.85, 21.15);
  platform(29.85, 30.95, 20.6, 21.7, y + 2.4, y + 1.3);
}

function sandbagStack(ctx, x, z, y) {
  const { kit, box, platform } = ctx;
  box(2.4, 0.6, 0.9, kit.sandbag, x, y + 0.3, z);
  platform(x - 1.2, x + 1.2, z - 0.45, z + 0.45, y + 0.6, y);
}

function woodFence(ctx, x, z, y, len) {
  const { kit, box, solid } = ctx;
  box(len, 1.1, 0.16, kit.wood, x, y + 0.55, z);
  solid(x - len / 2, x + len / 2, z - 0.2, z + 0.2);
}

function addContainer(ctx, x, z, y, yaw) {
  const { kit, group, solid } = ctx;
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 6.2), kit.blue);
  body.position.set(x, y + 1.2, z);
  body.rotation.y = yaw;
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);
  solid(x - 3.2, x + 3.2, z - 1.4, z + 1.4);
}

function addCar(ctx, x, z, y, yaw) {
  const { kit, group, solid } = ctx;
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c4, roughness: 0.6, metalness: 0.25 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 4.4), bodyMat);
  body.position.y = 0.62;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, 2.2), bodyMat);
  cabin.position.set(0, 1.2, -0.3);
  car.add(body, cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 1 });
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2; wheel.position.set(wx, 0.4, wz); car.add(wheel);
  }
  car.position.set(x, y, z); car.rotation.y = yaw; group.add(car);
  car.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  solid(x - 1.1, x + 1.1, z - 2.4, z + 2.4);
}

function addPalm(ctx, x, z, y) {
  const { kit, group, animated, solid } = ctx;
  const palm = new THREE.Group();
  palm.position.set(x, y, z);
  const trunkH = 4.6 + Math.random() * 1.6;
  let ty = 0;
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.26 - i * 0.03, 0.3 - i * 0.03, trunkH / 5, 8), kit.trunk);
    seg.position.set(Math.sin(i * 0.7) * 0.1, ty + trunkH / 10, 0);
    seg.rotation.z = Math.sin(i * 0.9) * 0.05; seg.castShadow = true; palm.add(seg);
    ty += trunkH / 5;
  }
  const crown = new THREE.Group();
  crown.position.y = ty + 0.1;
  for (let i = 0; i < 7; i++) {
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), kit.leaf);
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / 7) * Math.PI * 2;
    frond.position.set(0, 0.12, 1.3);
    frond.rotation.x = -Math.PI / 2 + 0.5 + Math.random() * 0.25;
    pivot.add(frond); crown.add(pivot);
  }
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), kit.trunk);
  nut.position.y = ty - 0.1; crown.add(nut); palm.add(crown);
  group.add(palm);
  animated.push({ kind: 'palm', obj: crown, seed: Math.random() * Math.PI * 2 });
  solid(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
}

function addFlag(ctx, x, z, y, color) {
  const { group, animated, kit } = ctx;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 7, 8), kit.mass);
  pole.position.set(x, y + 3.5, z); pole.castShadow = true; group.add(pole);
  const clothMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3, 6, 1), clothMat);
  cloth.position.set(x + 1.3, y + 6.2, z); group.add(cloth);
  animated.push({ kind: 'flag', obj: cloth, seed: x * 0.7 });
}

export function updateProps(animated, t) {
  for (const item of animated) {
    if (item.kind === 'palm') {
      item.obj.rotation.z = Math.sin(t * 0.9 + item.seed) * 0.06;
      item.obj.rotation.x = Math.cos(t * 0.7 + item.seed) * 0.05;
    } else if (item.kind === 'flag') {
      const pos = item.obj.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const px = pos.getX(i);
        pos.setZ(i, Math.sin(t * 3 + px * 2.4 + item.seed) * 0.16 * (px + 1.2));
      }
      pos.needsUpdate = true;
    }
  }
}
