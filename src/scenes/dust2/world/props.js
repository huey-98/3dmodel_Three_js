// 道具层：坐标对应中文点位雷达。箱堆/车/油桶/棕榈/灯火/旗帜/包点喷图。
import * as THREE from 'three';
import { A_PLAT_Y, B_Y, T_Y, CT_Y, PIT_Y, B2_Y, B1_Y, MID_Y, ROAD_Y, GARDEN_Y, LONG_Y } from '../layout.js';

const PALMS = [
  [14, 80, T_Y], [-34, 70, GARDEN_Y], [-13, 12, B_Y], [18, 10, CT_Y],
  [40, 20, A_PLAT_Y], [50, 36, LONG_Y], [-18, 10, B_Y], [14, 64, ROAD_Y],
  [28, 8, A_PLAT_Y], [42, 10, A_PLAT_Y], [11, 20, CT_Y],
];
const BARRELS = [
  [-30, 10, B_Y], [-16, 60, GARDEN_Y], [48, 44, LONG_Y], [12, 66, ROAD_Y],
  [-36, 48, B2_Y], [12, 22, CT_Y], [-24, 36, B1_Y],
  [46, 30, LONG_Y], [38, 24, A_PLAT_Y],
];
// g 有值 = 露天灯柱（立柱落地）；无值 = 吊灯（贴顶棚）
const LAMPS = [
  { x: -36, y: 4.0, z: 40 }, { x: 0, y: 2.0, z: 60 },
  { x: 11, y: -0.2, z: 30, g: CT_Y }, { x: -20, y: 5.4, z: 10, g: B_Y }, { x: 30, y: 5.4, z: 20, g: A_PLAT_Y },
  { x: -4, y: 3.9, z: 28, g: MID_Y }, { x: 48, y: 4.4, z: 50 }, { x: -30, y: 3.4, z: 62, g: GARDEN_Y },
];

export function buildProps(ctx) {
  const { kit, box, solid, crate, tarpCrate, whiteCrate, platform, group, animated } = ctx;

  const letterGeo = new THREE.PlaneGeometry(7, 7);
  const decalA = new THREE.Mesh(letterGeo, kit.letter);
  decalA.rotation.x = -Math.PI / 2; decalA.position.set(35, A_PLAT_Y + 0.03, 16); group.add(decalA);
  const decalB = new THREE.Mesh(letterGeo, kit.letterB);
  decalB.rotation.x = -Math.PI / 2; decalB.position.set(-23, B_Y + 0.03, 16); group.add(decalB);

  // B 包点：大箱/高箱/矮箱/狙位/脚手架
  crate(2.4, -28, 20, B_Y);
  crate(1.6, -26, 18, B_Y);
  crate(1.2, -24, 12, B_Y);
  crate(1.2, -30, 8, B_Y);
  box(0.4, 3.2, 0.4, kit.beam, -16, B_Y + 1.6, 8);
  box(0.4, 3.2, 0.4, kit.beam, -15, B_Y + 1.6, 10);
  box(1.6, 0.2, 2.4, kit.beam, -15.5, B_Y + 3.2, 9);
  addCar(ctx, -12.5, 22, B_Y, 0.4);         // 沙地卡车（B 门外平台）
  addCar(ctx, -20, 34, B1_Y, -0.5);         // B1 白车
  crate(1.2, -22, 30, B1_Y);
  crate(1.2, 4, 42, MID_Y);                 // 中门叉箱（跳 A 小）
  crate(1.6, -4, 48, MID_Y);                // L 位
  crate(1.2, 2, 50, MID_Y);                 // 中远
  tarpCrate(1.6, 36, 16, A_PLAT_Y);              // A 默认大箱（蓝布盖）
  tarpCrate(1.6, 38.2, 16, A_PLAT_Y);            // A 默认大箱（蓝布盖）
  tarpCrate(1.2, 34, 12, A_PLAT_Y);              // A 小箱
  crate(1.2, 30, 8, A_PLAT_Y);                   // 鹅位
  sandbagStack(ctx, 30, 24.6, A_PLAT_Y);         // 矮墙内侧沙袋
  sandbagStack(ctx, 33, 24.6, A_PLAT_Y);
  addCar(ctx, 48, 30, LONG_Y, 0.2);         // 蓝车
  crate(1.2, 48, 44, LONG_Y);              // 蓝车死点
  crate(1.6, 46, 40, LONG_Y);              // 蓝箱
  crate(1.6, 42, 50, PIT_Y);                // A 坑跳箱
  addCar(ctx, 30, 62, ROAD_Y, -0.3);        // 黄车
  addCar(ctx, -20, 72, GARDEN_Y, 0.6);      // 匪家蓝车
  crate(1.6, 2, 78, T_Y);
  crate(1.2, 4.4, 78, T_Y);
  crate(1.2, 2, 80.2, T_Y + 1.6);

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
  addFlag(ctx, 18, 8, CT_Y + 0.2, 0x3a6ea8);

  // 警家：FRAGILE 白箱堆（木拱廊下）+ 警家斜坡缓坡观感
  whiteCrate(1.4, 12, 9, CT_Y);
  whiteCrate(1.4, 13.6, 9, CT_Y);
  whiteCrate(1.2, 12, 10.6, CT_Y);
  whiteCrate(1.2, 12, 9, CT_Y + 1.4);
}

function sandbagStack(ctx, x, z, y) {
  const { kit, box, platform } = ctx;
  box(2.4, 0.6, 0.9, kit.sandbag, x, y + 0.3, z);
  platform(x - 1.2, x + 1.2, z - 0.45, z + 0.45, y + 0.6, y);
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

