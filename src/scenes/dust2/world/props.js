// 道具层：所有道具都带所在地面高度 y。箱堆、油桶、棕榈、灯火、旗帜、包点喷图。
// 可动件登记进 ctx.animated（棕榈摆动、旗帜波动）。
import * as THREE from 'three';
import { A_Y, B_Y, T_Y, CT_Y, PIT_Y, BRIDGE_Y, APT1_Y, APT2_Y, B_BACK_Y, TUN_UP_Y, TUN_LO_Y, MID_Y, ROAD_Y, CAT_Y, LONG_Y, A_BACK_Y } from '../layout.js';

// [x, z, y]
const PALMS = [
  [-48, 66, A_Y], [-36, 40, A_Y], [-9, -30, T_Y], [-52, -20, T_Y],
  [3, 40, ROAD_Y], [13, 3, ROAD_Y], [42, 12, ROAD_Y],
  [4, 63, CT_Y], [12, 52, CT_Y],
  [-45, 30, LONG_Y + 0.8], [-10, 26, MID_Y],
  [30, 76, B_BACK_Y], [21, 68, B_Y],
];
const BARRELS = [
  [-44.5, 30, LONG_Y + 0.8], [-33, 66, A_Y], [2, 33, ROAD_Y],
  [36, 62, TUN_LO_Y], [33.5, 12, TUN_UP_Y], [12, 63, CT_Y],
  [20.5, 50, B_Y], [-52.5, -16, T_Y],
];
const LAMPS = [
  { x: 35.5, y: 3.4, z: 3 }, { x: 35.5, y: -0.3, z: 22 }, { x: 35.5, y: -1.9, z: 55 },
  { x: 24, y: 3.8, z: 19 }, { x: -10, y: 3.9, z: 6 }, { x: -47, y: 4.4, z: 8 },
  { x: 8, y: 3.6, z: 58 }, { x: 26, y: 5.4, z: 52 }, { x: -34, y: 6.6, z: -16 },
  { x: 5, y: 3.9, z: 15 }, { x: -24, y: -0.4, z: 42 },
];

export function buildProps(ctx) {
  const { kit, box, volume, solid, crate, group, animated, platform } = ctx;

  // —— 包点喷图（红圈字母）——
  const letterGeo = new THREE.PlaneGeometry(7, 7);
  const decalA = new THREE.Mesh(letterGeo, kit.letter);
  decalA.rotation.x = -Math.PI / 2;
  decalA.position.set(-39, A_Y + 0.03, 68);
  group.add(decalA);
  const decalB = new THREE.Mesh(letterGeo, kit.letterB);
  decalB.rotation.x = -Math.PI / 2;
  decalB.position.set(29, B_Y + 0.03, 62);
  group.add(decalB);

  // —— A 包点：箱堆 + 旧车 + 蓝斗 ——
  crate(2.4, -40, 58, A_Y);
  crate(1.2, -38, 60.6, A_Y);
  crate(1.2, -40.4, 55, A_Y);
  crate(2.4, -36, 47, A_Y);
  crate(1.2, -47, 47, A_Y);
  addCar(ctx, -49, 42, A_Y, 0.5);
  box(2.6, 1.5, 4.6, kit.blue, -33.4, A_Y + 0.75, 66);
  solid(-34.7, -32.1, 63.7, 68.3);
  // A 后条沙袋
  crate(0.8, -50, 66, A_BACK_Y);
  crate(0.8, -49.2, 67.6, A_BACK_Y);

  // —— A 坑：出坑跳箱 ——
  crate(1.6, -27, 44, PIT_Y);
  crate(1.2, -23.5, 38.5, PIT_Y);

  // —— A 大 ——
  crate(1.6, -46, 20, LONG_Y + 0.8);
  crate(1.2, -44.4, 22.2, LONG_Y + 0.8);
  crate(1.2, -49, 6, LONG_Y);

  // —— 匪家平台 ——
  crate(1.6, -33, -19, T_Y);
  crate(1.2, -30.6, -19, T_Y);
  crate(1.2, -33, -21.2, T_Y + 1.6);
  crate(1.2, -16, -10, T_Y);

  // —— 中路 ——
  crate(2.4, -9, 12, MID_Y);
  crate(1.2, -11.4, 14.2, MID_Y);
  crate(1.6, -12.2, 3, MID_Y);
  crate(1.2, -8, 26, MID_Y);

  // —— 桥洞 ——
  crate(1.6, -15, 38, PIT_Y);
  crate(1.2, -8, 55, BRIDGE_Y);
  crate(1.2, -12, 60, BRIDGE_Y);

  // —— 90° / 东北街 ——
  crate(1.6, 2, 26, ROAD_Y);
  crate(1.2, 4, 24, ROAD_Y);
  crate(1.2, 10, -6, ROAD_Y);
  // 木围栏（B 门外院）
  box(8, 1.6, 0.3, kit.beam, 24, ROAD_Y + 0.8, 34);
  solid(20, 28, 33.8, 34.3);

  // —— 公寓一层 / 二层 ——
  crate(1.4, 20, 25, APT1_Y);
  crate(1.2, 27, 12, APT1_Y);
  crate(1.6, 28, 25, APT2_Y);
  crate(1.2, 19, 25, APT2_Y);
  crate(1.2, 20, 15, APT2_Y);

  // —— B 包点 ——
  crate(2.4, 24, 54, B_Y);
  crate(2.4, 24, 56.5, B_Y);
  crate(1.2, 26.6, 55, B_Y + 2.4);
  crate(1.6, 21, 65, B_Y);
  crate(1.2, 31, 63, B_Y);
  addCar(ctx, 30, 51, B_Y, -0.6);

  // —— B 后 / 下水道 ——
  crate(1.2, 30, 74, B_BACK_Y);
  crate(1.2, 35, 20, TUN_UP_Y);
  crate(1.4, 34, 45, TUN_LO_Y);
  crate(1.2, 36.5, 47, TUN_LO_Y);

  // —— 警家 ——
  crate(1.6, 4, 60, CT_Y);
  crate(1.2, 6.2, 62, CT_Y);
  crate(1.2, 13, 53, CT_Y);

  // —— 猫道：横板条 ——
  for (let x = -33; x <= -5; x += 2) box(1.7, 0.12, 6, kit.beam, x, CAT_Y + 0.06, 19);

  // —— 棕榈 / 油桶 / 灯火 / 旗帜 ——
  for (const [x, z, y] of PALMS) addPalm(ctx, x, z, y);
  for (const [x, z, y] of BARRELS) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.05, 12), kit.blue);
    barrel.position.set(x, y + 0.52, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);
    solid(x - 0.42, x + 0.42, z - 0.42, z + 0.42);
  }
  for (const lp of LAMPS) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.5), kit.lampGlow);
    lamp.position.set(lp.x, lp.y, lp.z);
    group.add(lamp);
    const light = new THREE.PointLight(0xffb060, 20, 13, 1.8);
    light.position.set(lp.x, lp.y - 0.4, lp.z);
    group.add(light);
    box(0.16, 0.5, 0.16, kit.mass, lp.x, lp.y + 0.42, lp.z);
  }
  addFlag(ctx, -40, -21, T_Y + 0.2, 0xb0352a);
  addFlag(ctx, 14, 64, CT_Y + 0.2, 0x3a6ea8);
}

function addCar(ctx, x, z, y, yaw) {
  const { kit, group, solid } = ctx;
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c4, roughness: 0.6, metalness: 0.25 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 4.4), bodyMat);
  body.position.y = 0.62;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.62, 2.2), bodyMat);
  cabin.position.set(0, 1.22, -0.2);
  car.add(body, cabin);
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x241f1a, roughness: 1 });
  for (const [wx, wz] of [[-0.95, 1.4], [0.95, 1.4], [-0.95, -1.4], [0.95, -1.4]]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.4, wz);
    car.add(wheel);
  }
  car.position.set(x, y, z);
  car.rotation.y = yaw;
  group.add(car);
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
    seg.rotation.z = Math.sin(i * 0.9) * 0.05;
    seg.castShadow = true;
    palm.add(seg);
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
    pivot.add(frond);
    crown.add(pivot);
  }
  const nut = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), kit.trunk);
  nut.position.y = ty - 0.1;
  crown.add(nut);
  palm.add(crown);
  group.add(palm);
  animated.push({ kind: 'palm', obj: crown, seed: Math.random() * Math.PI * 2 });
  solid(x - 0.4, x + 0.4, z - 0.4, z + 0.4);
}

function addFlag(ctx, x, z, y, color) {
  const { group, animated, kit } = ctx;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 7, 8), kit.mass);
  pole.position.set(x, y + 3.5, z);
  pole.castShadow = true;
  group.add(pole);
  const clothMat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.3, 6, 1), clothMat);
  cloth.position.set(x + 1.3, y + 6.2, z);
  group.add(cloth);
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
