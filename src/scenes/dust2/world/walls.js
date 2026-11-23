// 墙体系统：读取 WALLS 自动定高（底 -4.6，顶 = 相邻最高地面 + WALL_H），
// 登记 solid；再补 CS2 风格的压顶石、城垛、假窗等外立面细节。
import { WALLS, FLOORS, WALL_H, VOID_Y } from '../layout.js';
import { maxTopNear } from './floors.js';

export function buildWalls(ctx) {
  const { kit, box, volume, solid, platform } = ctx;
  const matFor = (kind) => (kind === 'cave' ? kit.cave : kit.sand);

  for (const w of WALLS) {
    const x0 = Math.min(w.x0, w.x1);
    const x1 = Math.max(w.x0, w.x1);
    const z0 = Math.min(w.z0, w.z1);
    const z1 = Math.max(w.z0, w.z1);
    const top = w.top ?? maxTopNear(FLOORS, x0, x1, z0, z1, 1.6) + WALL_H;
    const mat = matFor(w.kind);
    volume(x0, x1, VOID_Y, top, z0, z1, mat);
    if (w.para) {
      // 矮女儿墙：登记为平台而不是 solid——低于脚底时可跨过（公寓窗口跳出）
      platform(x0, x1, z0, z1, top, VOID_Y);
    } else {
      solid(x0, x1, z0, z1);
    }
    // 压顶石：地面以上部分顶端一圈深灰檐口
    const above = Math.max(top, 0);
    if (x1 - x0 > 0.9 && z1 - z0 < 1) {
      box(x1 - x0, 0.3, z1 - z0 + 0.34, kit.mass, (x0 + x1) / 2, top + 0.15, (z0 + z1) / 2);
    } else if (z1 - z0 > 0.9 && x1 - x0 < 1) {
      box(x1 - x0 + 0.34, 0.3, z1 - z0, kit.mass, (x0 + x1) / 2, top + 0.15, (z0 + z1) / 2);
    }
  }

  facadeDetails(ctx);
}

// 城垛段：A 点东墙、B 点东墙、匪家平台南墙 —— CS2 沙城标志性锯齿女墙
const CRENELS = [
  { axis: 'z', at: -6.3, lo: -44, hi: -20, top: 9.25, step: 3 },  // 匪家平台南墙（两门洞之间）
  { axis: 'x', at: -30.3, lo: 46, hi: 72, top: 6.0, step: 3 },    // A 点东墙南段
  { axis: 'x', at: 34.3, lo: 48, hi: 70, top: 8.4, step: 3 },     // B 点东墙
];

function facadeDetails(ctx) {
  const { kit, box, volume } = ctx;

  // 假窗：朝 A 大/中路街面的楼体上排布深色窗洞 + 百叶
  function blindWindow(axis, face, lo, hi, y, w, h, side) {
    const eps = side * 0.12;
    if (axis === 'x') {
      box(0.26, h + 0.66, w + 0.66, kit.mass, face + eps, y, (lo + hi) / 2);
      box(0.16, h, w, kit.recess, face + eps * 2.2, y, (lo + hi) / 2);
      box(0.5, 0.16, w + 0.9, kit.mass, face + side * 0.34, y - h / 2 - 0.2, (lo + hi) / 2);
    } else {
      box(w + 0.66, h + 0.66, 0.26, kit.mass, (lo + hi) / 2, y, face + eps);
      box(w, h, 0.16, kit.recess, (lo + hi) / 2, y, face + eps * 2.2);
      box(w + 0.9, 0.16, 0.5, kit.mass, (lo + hi) / 2, y - h / 2 - 0.2, face + side * 0.34);
    }
  }

  // 中路西侧楼体（朝中路街面 x=-13.6 面，空气在 +x？楼体在 -x 侧）
  for (let i = 0; i < 3; i++) blindWindow('x', -14.2, 0 + i * 6, 1.6 + i * 6, 5.6, 1.5, 2.1, 1);
  // A 大东墙朝 A 大（x=-41.4 面，空气在 -x 侧）
  for (let i = 0; i < 3; i++) blindWindow('x', -42, 2 + i * 9, 3.6 + i * 9, 5.8, 1.6, 2.2, -1);
  // 匪家平台南墙朝 A 大/中路（z=-6 面，空气在 +z 侧）
  blindWindow('z', -6, -49, -47.4, 5.6, 1.5, 2.0, 1);
  blindWindow('z', -6, -19, -17.4, 5.6, 1.5, 2.0, 1);
  // 公寓北墙朝公寓北门前（z=8 面，空气在 -z 侧）：二层假窗一排
  for (let i = 0; i < 3; i++) blindWindow('z', 7.4, 17.5 + i * 5, 19 + i * 5, APT2WIN_Y, 1.4, 1.9, -1);
  // 警家北楼朝 B 门外院（z=46 面，空气在 +z 侧）
  for (let i = 0; i < 2; i++) blindWindow('z', 46, 1.5 + i * 5, 3 + i * 5, 2.6, 1.3, 1.8, 1);
  // B 点东墙朝东侧街（x=34.6 面，空气在 +x 侧）
  for (let i = 0; i < 3; i++) blindWindow('x', 34.6, 50 + i * 6, 51.5 + i * 6, 7.6, 1.5, 2.0, 1);

  // 猫道门/中路门框过梁
  box(1.4, 0.6, 8.6, kit.beam, -6.3, 4.6, 16);          // 猫道门过梁
  volume(-52.4, -41.6, 4.9, 5.5, 27.4, 35.4, kit.sand); // A 大拱门楣（顶棚已在 CEILS）

  // 城垛
  for (const c of CRENELS) {
    const topY = c.top;
    for (let p = c.lo; p < c.hi; p += c.step) {
      const q = Math.min(p + c.step * 0.55, c.hi);
      if (c.axis === 'x') box(q - p, 0.8, 0.9, kit.sand, (p + q) / 2, topY + 0.4, c.at);
      else box(0.9, 0.8, q - p, kit.sand, c.at, topY + 0.4, (p + q) / 2);
    }
  }
}
const APT2WIN_Y = 6.2;
