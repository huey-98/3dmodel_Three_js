// 道具层：CS2 点位掩体。箱堆/车/集装箱/沙袋/脚手架/灯火/旗帜/包点喷图。
import * as THREE from 'three';
import { A_PLAT_Y, B_Y, T_Y, CT_Y, PIT_Y, B2_Y, B1_Y, MID_Y, ROAD_Y, GARDEN_Y, LONG_Y } from '../layout.js';

const PALMS = [
  [6, 80, T_Y], [-34, 70, GARDEN_Y],
  // 桥上（24.6,18.4）与 A 包点箱堆旁（46,11）那两棵按要求去掉
  [36, 6.2, A_PLAT_Y], [50.5, 12.4, A_PLAT_Y],
];
const BARRELS = [
  [-25, 8, B_Y], [48, 36, LONG_Y], [12, 10, CT_Y],
  [-31, 44, B2_Y], [-19, 30.6, B1_Y], [-20.2, 31.2, B1_Y],
];
const LAMPS = [
  { x: -30, y: 6.2, z: 38 },            // B2 顶板下吊灯（顶板底 B2_Y+4.6 = 6.2）
  { x: -16, y: 2.55, z: 33 },          // B1 顶板下吊灯（顶板底 2.8）
  { x: -20.5, y: 2.55, z: 37.5 },
  { x: -4, y: 3.9, z: 28, g: MID_Y },
  { x: 18, y: 2.4, z: 18, g: CT_Y },
  { x: -23, y: 5.4, z: 10, g: B_Y },
  { x: 40, y: A_PLAT_Y + 2.4, z: 10, g: A_PLAT_Y },
  { x: 51, y: 4.4, z: 40, g: LONG_Y },
  { x: -30, y: 3.4, z: 62, g: GARDEN_Y },
];

export function buildProps(ctx) {
  const { kit, box, solid, crate, platform, group } = ctx;

  const letterGeo = new THREE.PlaneGeometry(7, 7);
  const decalA = new THREE.Mesh(letterGeo, kit.letter);
  decalA.rotation.x = -Math.PI / 2; decalA.position.set(48, A_PLAT_Y + 0.03, 12); group.add(decalA);
  const decalB = new THREE.Mesh(letterGeo, kit.letterB);
  decalB.rotation.x = -Math.PI / 2; decalB.position.set(-19, B_Y + 0.03, 14); group.add(decalB);

  crate(1.4, -23, 18, B_Y);
  crate(1.6, -21, 16, B_Y);
  crate(1.2, -17, 8, B_Y);
  crate(1.2, -25, 7, B_Y);
  addCar(ctx, -15, 10, B_Y, 0.5);
  woodFence(ctx, -13, 18, B_Y, 6);

  // B1 底层掩体：从中门沿通道望进去有东西读深度，靠旋转楼梯一侧留出通路
  crate(1.4, -14.4, 38.6, B1_Y);
  crate(1.1, -15.9, 38.9, B1_Y);
  box(0.3, 2.2, 0.3, kit.beam, -21.6, B1_Y + 1.1, 29.2);

  box(0.3, 2.6, 0.3, kit.beam, -8.4, CT_Y + 1.3, 8.2);
  box(0.3, 2.6, 0.3, kit.beam, -6.2, CT_Y + 1.3, 8.2);
  box(2.6, 0.16, 1.4, kit.wood, -7.3, CT_Y + 1.7, 8.5);
  platform(-8.6, -6.0, 7.8, 9.2, CT_Y + 1.78, CT_Y);

  aSiteCrates(ctx);
  addCar(ctx, 48, 34, LONG_Y, 0.15);
  crate(1.5, 45.2, 66, PIT_Y);
  addContainer(ctx, 34, 72, ROAD_Y, 0.1);
  crate(1.6, 8, 80, T_Y);
  crate(1.2, 10.2, 80, T_Y);
  crate(1.2, 8, 80, T_Y + 1.6);

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
  addFlag(ctx, 0, 82, T_Y, 0xb0352a);
  addFlag(ctx, 12, 22, CT_Y, 0x3a6ea8);

  // 中路电线杆：街宽收到 10 m 后东缘在 x=5（猫道西沿），杆子挪到街内免得顶穿猫道
  box(0.18, 6.4, 0.18, kit.mass, 2.4, MID_Y + 3.2, 48);
  box(0.5, 0.12, 1.6, kit.mass, 2.4, MID_Y + 6.5, 48);
}

function aSiteCrates(ctx) {
  const { kit, box, platform } = ctx;
  const y = A_PLAT_Y;
  function put(size, x, z, lift = 0) {
    box(size, size, size, kit.aCrate, x, y + lift + size / 2, z);
    platform(x - size / 2, x + size / 2, z - size / 2, z + size / 2, y + lift + size, y + lift);
  }
  put(1.55, 46.2, 12.4);
  put(1.55, 47.8, 13.1);
  put(1.2, 46.8, 13.6);
  put(1.15, 46.4, 12.5, 1.55);
  put(1.35, 48.6, 11.6);
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
  const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw));
  solid(x - (1.2 * c + 3.1 * s), x + (1.2 * c + 3.1 * s), z - (1.2 * s + 3.1 * c), z + (1.2 * s + 3.1 * c));
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
  const c = Math.abs(Math.cos(yaw)), s = Math.abs(Math.sin(yaw));
  const hx = 0.95 * c + 2.2 * s;
  const hz = 0.95 * s + 2.2 * c;
  solid(x - hx, x + hx, z - hz, z + hz);
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
  nut.position.y = -0.1; crown.add(nut); palm.add(crown);
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
