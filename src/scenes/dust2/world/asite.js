// A 包点立面：药房、宫殿、A 平台沿口、楼北巷的新楼与巷内掩体、A 后坡旁的大箱、A 大路沿。
// 向南看：西侧高架通道连着 A 小楼梯和 A 平台，往东跳下去是与警家同层的 A 后巷（只剩楼北一条）。
import * as THREE from 'three';
import { A_PLAT_Y, LONG_Y, CT_Y } from '../layout.js';

export function buildASite(ctx) {
  pharmacyFacade(ctx);
  backBlock(ctx);
  palaceBuilding(ctx);
  platformEdge(ctx);
  bigBoxes(ctx);
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

// A 后巷南侧的新楼：原来 x[26,42] z[26,35] 是一片空地，现在填成一栋 12 米高的楼体。
// 后巷因此收到楼北一条巷子（z 16..26）：警家↔后巷直连、从通道东沿跳下来的落点、
// 以及后坡脚下那条东西向的窄带都还留着。南面贴药房北脸，东面贴 A 大西墙，都留 6 cm 防共面。
function backBlock(ctx) {
  const { kit, box, block, crate, group } = ctx;
  const x0 = 26.0, x1 = 41.94, z0 = 26.0, z1 = 34.94;
  const top = 12.0;
  const y0 = CT_Y;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;

  block(x0, x1, z0, z1, top, kit.ochre);
  box(x1 - x0 + 0.2, 0.3, z1 - z0 + 0.2, kit.mass, cx, top + 0.15, cz);
  box(x1 - x0 - 1.6, 0.45, 0.5, kit.mass, cx, top + 0.5, z0 + 0.1);

  // 北立面（朝楼北巷）：抹灰墙皮 + 三层连排窗
  const nz = z0 - 0.18;
  box(x1 - x0 - 0.6, top - y0 - 1.2, 0.24, kit.plaster, cx, (y0 + top) / 2 + 0.2, nz);
  for (const wx of [28.2, 30.8, 33.4, 36.0, 38.6]) {
    for (const wy of [y0 + 4.9, y0 + 8.3]) {
      box(1.3, 1.6, 0.14, kit.recess, wx, wy, nz - 0.12);
      box(1.1, 1.4, 0.08, kit.dark, wx, wy, nz - 0.2);
      box(1.5, 0.14, 0.3, kit.mass, wx, wy + 0.95, nz - 0.14);
    }
  }

  // 底层铺面：券门 + 绿雨棚 + 竖幅
  const shopX = 34.6;
  const rec = ctx.archPane(2.2, 3.0, kit.recess);
  rec.position.set(shopX, y0, nz - 0.1);
  rec.rotation.y = Math.PI;
  group.add(rec);
  box(2.0, 2.8, 0.08, kit.dark, shopX, y0 + 1.4, nz - 0.16);
  box(2.5, 0.18, 0.4, kit.mass, shopX, y0 + 3.05, nz - 0.14);
  box(3.4, 0.12, 1.5, kit.greenPaint, shopX, y0 + 3.5, nz - 0.85);
  box(0.9, 3.2, 0.12, kit.banner, shopX - 2.6, y0 + 3.4, nz - 0.2);

  // 西立面（朝 A 小楼梯与巷口）
  const wx0 = x0 - 0.18;
  for (const wz of [28.4, 31.0]) {
    for (const wy of [y0 + 4.9, y0 + 8.3]) {
      box(0.14, 1.6, 1.3, kit.recess, wx0, wy, wz);
      box(0.08, 1.4, 1.1, kit.dark, wx0 - 0.06, wy, wz);
      box(0.3, 0.14, 1.5, kit.mass, wx0 - 0.08, wy + 0.95, wz);
    }
  }

  // 巷子里的灯火、掩体与篦子（原来贴药房北墙的那批挪到楼北脸）
  for (const lx of [30.5, 37.5]) {
    box(0.12, 0.5, 0.12, kit.iron, lx, y0 + 2.7, z0 - 0.36);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), kit.lampGlow);
    lamp.position.set(lx, y0 + 2.35, z0 - 0.5);
    group.add(lamp);
    const light = new THREE.PointLight(0xffb060, 12, 10, 1.8);
    light.position.set(lx, y0 + 2.3, z0 - 0.8);
    group.add(light);
  }

  crate(1.28, 31.0, 24.6, y0);
  crate(1.18, 32.2, 25.0, y0);
  crate(1.12, 31.3, 25.4, y0);
  crate(1.0, 31.6, 24.8, y0 + 1.28);

  const grate = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), kit.grate);
  grate.rotation.x = -Math.PI / 2;
  grate.position.set(39.8, y0 + 0.03, 24.9);
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

// 平台北沿矮墙。东沿朝 A 大敞开，从这里跳进后巷。
function platformEdge(ctx) {
  const { kit, box, platform } = ctx;
  const y = A_PLAT_Y;
  box(8, 0.28, 0.22, kit.plaster, 26, y + 0.14, 16.12);
  platform(22, 30, 16.0, 16.24, y + 0.28, y);
}

// 楼北巷里的水泥台 + 两只蓝桶：顶面可站，原来在水泥台压在旧后巷南墙前，新楼落地后挪到巷北口。
function bigBoxes(ctx) {
  const { kit, box, platform, group } = ctx;
  const pad = CT_Y + 0.9;
  box(3.6, 0.9, 2.6, kit.cobble, 34.0, CT_Y + 0.45, 18.6);
  platform(32.2, 35.8, 17.3, 19.9, pad, CT_Y);
  for (const [x, z] of [[33.1, 18.3], [34.8, 18.9]]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 1.28, 14), kit.blue);
    barrel.position.set(x, pad + 0.64, z);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);
    platform(x - 0.62, x + 0.62, z - 0.62, z + 0.62, pad + 1.28, pad);
  }
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
