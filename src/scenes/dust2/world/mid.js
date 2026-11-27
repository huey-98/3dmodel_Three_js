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
  // 街宽收到 10 m 后，门洞两侧的壁体只剩 1 m 肩墙，不得探进猫道
  box(1.0, 5.6, 0.7, kit.sand, -4.5, y0 + 2.7, z);
  box(1.0, 5.6, 0.7, kit.sand, 4.5, y0 + 2.7, z);
  box(10.4, 0.55, 0.95, kit.mass, 0, y0 + 5.15, z);
  box(10.8, 0.22, 1.15, kit.beam, 0, y0 + 5.52, z);
  volume(-4.2, 4.2, y0 + 4.35, y0 + 5.05, z - 0.42, z + 0.42, kit.sand);
  box(0.55, 4.8, 0.55, kit.mass, -4.35, y0 + 2.4, z);
  box(0.55, 4.8, 0.55, kit.mass, 4.35, y0 + 2.4, z);
}

function catwalkEdge(ctx) {
  const { kit, box } = ctx;
  const y = A_SMALL_Y;
  box(0.18, 0.22, 16.4, kit.mass, 5.08, y + 0.1, 47.6);
  box(0.18, 0.22, 1.6, kit.mass, 5.08, y + 0.1, 32.2);
  for (const z of [31.6, 39.4, 43.2, 47.2, 51.2, 55.2]) {
    box(0.16, y - MID_Y + 0.15, 0.16, kit.timber, 5.12, (MID_Y + y) / 2, z);
  }
  box(0.14, 0.85, 16.2, kit.weathered, 5.06, y + 0.48, 47.7);
}

function xbox(ctx) {
  const { crate } = ctx;
  crate(1.42, 4.18, 29.35, MID_Y);
  crate(1.05, 3.15, 30.25, MID_Y);
  crate(0.95, 4.05, 30.4, MID_Y + 1.42);
}

// B1 入口原来被一张 recess 拱形面片加一块 0.8 米厚的近黑实体堵死，站在中门只看得见一个黑方块。
// 改成真正的下行通道：拱肩只填拱上方墙角、洞内贴石砌内衬和壁灯，顶板走 CEILS，视线一路到 B1 底层。
function lowerTunnelsMouth(ctx) {
  const { kit, box, volume, group, archSpandrel } = ctx;
  const face = -5.08;      // 洞口立面（中路西墙外皮）
  const back = -11.05;     // 通道内接 B1 地面
  const y0 = MID_N_Y;       // 中路北段标高
  const head = y0 + 3.8;    // 洞内净空顶（与 CEILS 的通道顶板齐平）
  const zA = 27.98, zB = 36.02;  // 通道内侧

  box(0.42, 4.6, 1.1, kit.sand, face, y0 + 2.3, 27.55);
  box(0.42, 4.6, 1.1, kit.sand, face, y0 + 2.3, 36.45);
  box(0.5, 0.55, 9.4, kit.sand, face, y0 + 4.55, 32);

  // 拱肩：拱以内留空，只填拱上方的墙角，从洞口直接看进通道。
  const sp = archSpandrel(7.4, 4.0, 0.42, kit.sand);
  sp.position.set(face, y0, 32);
  sp.rotation.y = Math.PI / 2;
  group.add(sp);

  // 通道内衬：两侧石壁与洞口过梁，替掉原来的黑色填充体
  volume(back, face + 0.42, y0 - 0.6, head, zA, zA + 0.2, kit.stone);
  volume(back, face + 0.42, y0 - 0.6, head, zB - 0.2, zB, kit.stone);
  box(0.3, 0.34, 7.9, kit.beam, face + 0.2, head + 0.15, 32);

  // 两盏壁灯贴通道南壁（内壁面 z=28.18）：洞口一盏、中段一盏，里面看得见层次而不是剪影
  for (const lx of [-6.6, -9.8]) {
    box(0.12, 0.5, 0.12, kit.iron, lx, head - 1.0, 28.42);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), kit.lampGlow);
    lamp.position.set(lx, head - 1.35, 28.56);
    group.add(lamp);
    const light = new THREE.PointLight(0xffb060, 14, 10, 1.8);
    light.position.set(lx, head - 1.5, 28.9);
    group.add(light);
  }
}

function ctMidPlaza(ctx) {
  const { kit, box, crate, group } = ctx;
  const y0 = CT_Y;
  crate(1.28, 6.35, 22.55, y0);
  crate(1.18, 7.55, 23.15, y0);
  crate(1.12, 6.55, 23.55, y0 + 1.28);
  crate(0.98, 7.35, 22.7, y0 + 1.18);

  box(0.16, 4.8, 0.16, kit.iron, -1.4, y0 + 2.4, 18.5);
  box(0.45, 0.1, 1.3, kit.iron, -1.4, y0 + 4.9, 18.5);

  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), kit.grate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(2.4, y0 + 0.03, 16.8);
  group.add(grate);
}

function midStreetDressing(ctx) {
  const { kit, box, group } = ctx;
  const y0 = MID_N_Y;
  for (const [z, h] of [[42, 2.2], [48, 2.4], [38.5, 1.9]]) {
    box(0.22, h + 0.7, 1.5, kit.mass, -4.93, y0 + h / 2 + 0.2, z);
    box(0.16, h, 1.2, kit.recess, -4.81, y0 + h / 2 + 0.15, z);
    box(1.4, 0.12, 1.7, kit.mass, -4.98, y0 + 0.7, z);
  }
  box(0.2, 1.1, 18, kit.mass, -5.15, MID_S_Y + 0.4, 46);

  const a = new THREE.Vector3(-1.4, CT_Y + 4.75, 18.5);
  const b = new THREE.Vector3(2.4, MID_Y + 6.35, 48);
  addWire(group, a, b, 1.6);
  addWire(group, new THREE.Vector3(2.4, MID_Y + 6.35, 48), new THREE.Vector3(8.2, A_SMALL_Y + 6.7, 39.4), 0.9);
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
