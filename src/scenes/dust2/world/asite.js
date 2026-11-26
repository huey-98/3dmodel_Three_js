// A 包点立面：药房、宫殿、Goose 通道、A 后巷东口、A 大路沿。对照 CS2 从 A 大北望包点。
// 药房整体在 z[35,42]：它北面 z[26,35] 是让出来的东西向露天通道（A 后巷），东口全宽开进 A 大。
import * as THREE from 'three';
import { A_PLAT_Y, LONG_Y, GOOSE_Y } from '../layout.js';

export function buildASite(ctx) {
  pharmacyFacade(ctx);
  laneFacade(ctx);
  palaceBuilding(ctx);
  gooseTunnel(ctx);
  retainingAndDoor(ctx);
  longStreetDressing(ctx);
}

function pharmacyFacade(ctx) {
  const { kit, box, volume, group, solid } = ctx;
  const face = 42.04;
  const y0 = LONG_Y;
  const zA = 35.0;                    // 药房北界 = A 后巷南界面
  const zB = 42.0;                    // 南界与 A 门厅北墙齐平
  const shopZ = 38.5;                 // 铺面中心
  volume(36.02, 41.98, y0 + 6.4, y0 + 9.2, zA, zB, kit.weathered);

  // A 大侧立面：整段实墙挡死，铺面只是贴在墙前的装饰（药房后面是实心楼体，不是通路）
  box(0.28, 8.6, 3.1, kit.weathered, face, y0 + 4.3, 36.55);
  box(0.28, 8.6, 3.3, kit.weathered, face, y0 + 4.3, 40.35);
  box(0.28, 5.4, 1.1, kit.weathered, face, y0 + 5.9, shopZ);
  solid(41.9, 42.18, zA, zB);

  box(0.2, 0.35, 7.4, kit.mass, face + 0.08, y0 + 8.6, 38.5);
  for (let z = 35.6; z < 41.6; z += 1.5) {
    box(0.22, 0.28, 0.9, kit.mass, face + 0.12, y0 + 8.9, z);
  }

  // 券门凹面 + 门头 + 绿十字 + PHARMACIE 竖幅
  const rec = ctx.archPane(1.6, 2.9, kit.recess);
  rec.position.set(face + 0.2, y0, shopZ);
  rec.rotation.y = Math.PI / 2;
  group.add(rec);
  box(0.08, 2.6, 1.4, kit.dark, face + 0.28, y0 + 1.3, shopZ);
  box(1.9, 0.16, 0.42, kit.mass, face + 0.24, y0 + 3.0, shopZ);

  const cross = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), kit.cross);
  cross.position.set(face + 0.36, y0 + 4.9, shopZ);
  cross.rotation.y = Math.PI / 2;
  group.add(cross);

  const banner = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 3.4), kit.banner);
  banner.position.set(face + 0.36, y0 + 3.7, 36.5);
  banner.rotation.y = Math.PI / 2;
  group.add(banner);
  box(0.12, 3.5, 0.9, kit.greenPaint, face + 0.28, y0 + 3.7, 36.5);

  box(0.18, 1.1, 1.3, kit.iron, face + 0.1, y0 + 3.55, 42.4);
  for (let i = -2; i <= 2; i++) box(0.05, 1.0, 0.05, kit.iron, face + 0.18, y0 + 3.55, 42.4 + i * 0.22);
  for (let j = -1; j <= 1; j++) box(0.05, 0.05, 1.2, kit.iron, face + 0.18, y0 + 3.55 + j * 0.36, 42.4);

  box(0.28, 0.7, 0.5, kit.iron, face + 0.2, y0 + 0.7, 36.2);
  box(0.12, 2.2, 0.12, kit.iron, face + 0.22, y0 + 1.4, 37.4);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.4, 8), kit.iron);
  pipe.position.set(face + 0.2, y0 + 1.7, 41.2);
  pipe.castShadow = true;
  group.add(pipe);

  box(0.22, 1.6, 1.2, kit.recess, face + 0.1, y0 + 6.8, 36.6);
  box(0.22, 1.6, 1.2, kit.recess, face + 0.1, y0 + 6.8, 40.4);
  box(0.08, 1.4, 1.0, kit.dark, face + 0.22, y0 + 6.8, 36.6);
  box(0.08, 1.4, 1.0, kit.dark, face + 0.22, y0 + 6.8, 40.4);

  box(0.3, 6.4, 4.2, kit.sand, 42.1, y0 + 3.2, 39.6);
  box(0.5, 0.4, 4.4, kit.mass, 42.15, y0 + 6.5, 38.6);
  box(1.6, 1.8, 1.6, kit.sand, 39, y0 + 8.2, 38.6);
}

// A 后巷：z[26,35] 的东西向露天通道。这里砌它的南立面、东口券梁与东段掩体。
function laneFacade(ctx) {
  const { kit, box, volume, solid, group, crate } = ctx;
  const y0 = LONG_Y;
  const face = 35.0;

  // 东口：北券腿是 x[36,42.4] z[22,26] 楼体，南券腿是药房 NW 角，头顶一道 3.0-3.8 的石过梁
  volume(41.66, 42.4, y0 + 3.0, y0 + 3.8, 25.9, 35.3, kit.sand);
  solid(41.66, 42.4, 25.9, 35.3, y0 + 3.0, y0 + 3.8);
  box(0.9, 0.16, 9.0, kit.mass, 41.65, y0 + 0.08, 30.5);

  // 南立面：MASS x[26,41.6] z[35,42]（顶 6.8）背面贴抹灰墙、连排窗与后门
  // 面板外挑 0.06，避免与 MASS 的 z=35 面共面闪烁
  box(15.6, 5.9, 0.3, kit.plaster, 33.8, y0 + 2.95, face + 0.21);
  for (const x of [28.4, 31.6, 34.8]) {
    box(1.3, 1.5, 0.14, kit.recess, x, y0 + 3.5, face + 0.34);
    box(1.1, 1.3, 0.08, kit.dark, x, y0 + 3.5, face + 0.42);
    box(1.5, 0.14, 0.3, kit.mass, x, y0 + 4.3, face + 0.36);
  }
  box(1.7, 2.7, 0.14, kit.recess, 37.4, y0 + 1.35, face + 0.34);
  box(1.5, 2.5, 0.08, kit.dark, 37.4, y0 + 1.3, face + 0.42);
  box(2.0, 0.18, 0.4, kit.mass, 37.4, y0 + 2.78, face + 0.4);
  box(2.6, 0.14, 1.1, kit.tarp, 29.9, y0 + 2.4, face + 0.7);
  box(0.14, 2.4, 0.14, kit.iron, 28.8, y0 + 1.2, face + 0.62);
  box(0.22, 3.0, 0.22, kit.iron, 33.0, y0 + 1.5, face + 0.4);

  // 壁灯两盏，通道夜里不至于全黑
  for (const lx of [30.2, 36.2]) {
    box(0.12, 0.5, 0.12, kit.iron, lx, y0 + 2.7, face + 0.36);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), kit.lampGlow);
    lamp.position.set(lx, y0 + 2.35, face + 0.5);
    group.add(lamp);
    const light = new THREE.PointLight(0xffb060, 12, 10, 1.8);
    light.position.set(lx, y0 + 2.3, face + 0.8);
    group.add(light);
  }

  // 北墙（通道以北的楼体南面 z=26）压一条石檐与落水管
  box(6.4, 0.34, 0.5, kit.mass, 39.1, y0 + 3.6, 26.16);
  box(0.22, 3.2, 0.22, kit.iron, 41.2, y0 + 1.7, 26.36);
  box(0.24, 0.3, 9.0, kit.mass, 33.8, y0 + 0.15, 26.16);

  // 东段掩体：从 A 大口进来不至于被一路射到 Goose
  crate(1.28, 38.3, 30.3, y0);
  crate(1.18, 39.5, 30.9, y0);
  crate(1.12, 38.6, 31.5, y0);
  crate(1.0, 38.9, 30.8, y0 + 1.28);

  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), kit.grate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(35.4, y0 + 0.03, 27.4);
  group.add(grate);
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
  const { kit, box, volume, solid, group } = ctx;
  volume(26.1, 35.9, 2.55, 2.72, 16.1, 21.9, kit.mass);
  box(0.45, 2.0, 6.0, kit.mass, 35.85, GOOSE_Y + 1.0, 19);
  solid(35.6, 36.1, 16, 22, GOOSE_Y, GOOSE_Y + 2.0);
  box(9.6, 0.22, 0.45, kit.mass, 31, GOOSE_Y + 0.12, 21.85);
  // 原来这里填了一块 recess 实体，等于把隧道堵成黑盒子；警家->后巷要走这里，衬成真的通道
  volume(26.2, 35.8, GOOSE_Y, GOOSE_Y + 1.7, 16.15, 16.6, kit.stone);
  for (const lx of [28.6, 33.4]) {
    box(0.12, 0.45, 0.12, kit.iron, lx, GOOSE_Y + 1.45, 16.72);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.24), kit.lampGlow);
    lamp.position.set(lx, GOOSE_Y + 1.15, 16.86);
    group.add(lamp);
    const light = new THREE.PointLight(0xffb060, 9, 8, 1.8);
    light.position.set(lx, GOOSE_Y + 1.2, 17.4);
    group.add(light);
  }
  box(0.55, 2.5, 0.55, kit.beam, 28.0, GOOSE_Y + 1.25, 22.05);
  box(0.55, 2.5, 0.55, kit.beam, 34.0, GOOSE_Y + 1.25, 22.05);
  box(6.6, 0.32, 0.55, kit.beam, 31, GOOSE_Y + 2.45, 22.05);
  const rec = ctx.archPane(6.2, 2.5, kit.recess);
  rec.position.set(31, GOOSE_Y, 22.12);
  rec.castShadow = true;
  group.add(rec);
}

function retainingAndDoor(ctx) {
  const { kit, box } = ctx;
  box(6.2, 0.28, 0.7, kit.plaster, 39, A_PLAT_Y + 0.12, 21.85);
}

function longStreetDressing(ctx) {
  const { kit, box, group, solid } = ctx;
  for (let z = 26; z < 48; z += 1.6) {
    const mat = ((z / 1.6) | 0) % 2 ? kit.curbRed : kit.curbWhite;
    box(0.22, 0.16, 1.5, mat, 53.5, LONG_Y + 0.1, z + 0.75);
  }
  box(0.18, 7.2, 0.18, kit.iron, 53.2, LONG_Y + 3.6, 40);
  box(0.7, 0.14, 1.8, kit.iron, 53.2, LONG_Y + 7.3, 40);
  const a = new THREE.Vector3(42.3, LONG_Y + 7.1, 32);
  const b = new THREE.Vector3(53.2, LONG_Y + 7.2, 40);
  const c = new THREE.Vector3(54, LONG_Y + 6.8, 46);
  addWire(group, a, b, 0.9);
  addWire(group, b, c, 1.1);
  addWire(group, new THREE.Vector3(42.3, LONG_Y + 6.7, 32), new THREE.Vector3(53.2, LONG_Y + 6.8, 40), 0.8);
  box(0.7, 0.22, 6, kit.cobble, 42.4, LONG_Y + 0.12, 39);   // 药房铺面前的石铺带，避开 A 后巷东口
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
