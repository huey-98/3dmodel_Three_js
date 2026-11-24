// 墙体系统：WALLS 自动定高 + 城垛/假窗/过梁外立面。
import { WALLS, FLOORS, WALL_H, VOID_Y, B_Y } from '../layout.js';
import { maxTopNear } from './floors.js';

export function buildWalls(ctx) {
  const { kit, box, volume, solid, platform } = ctx;
  const matFor = (kind) => (kind === 'cave' ? kit.cave : kind === 'plaster' ? kit.plaster : kit.sand);
  for (const w of WALLS) {
    const x0 = Math.min(w.x0, w.x1), x1 = Math.max(w.x0, w.x1);
    const z0 = Math.min(w.z0, w.z1), z1 = Math.max(w.z0, w.z1);
    const top = w.top ?? maxTopNear(FLOORS, x0, x1, z0, z1, 1.6) + WALL_H;
    volume(x0, x1, VOID_Y, top, z0, z1, matFor(w.kind));
    if (w.para) platform(x0, x1, z0, z1, top, VOID_Y); else solid(x0, x1, z0, z1);
    if (x1 - x0 > 0.9 && z1 - z0 < 1) box(x1 - x0, 0.3, z1 - z0 + 0.34, kit.mass, (x0 + x1) / 2, top + 0.15, (z0 + z1) / 2);
    else if (z1 - z0 > 0.9 && x1 - x0 < 1) box(x1 - x0 + 0.34, 0.3, z1 - z0, kit.mass, (x0 + x1) / 2, top + 0.15, (z0 + z1) / 2);
  }
  facadeDetails(ctx);
}

const CRENELS = [
  { axis: 'z', at: 84.3, lo: -10, hi: 12, top: 9.25, step: 3 },
  { axis: 'x', at: -14.3, lo: 20, hi: 22, top: 8.0, step: 3 },
];

function facadeDetails(ctx) {
  const { kit, box } = ctx;
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
  blindWindow('x', 22, 42, 43.6, 4.6, 1.5, 2.0, 1);
  blindWindow('x', 22, 46, 47.6, 4.6, 1.5, 2.0, 1);
  blindWindow('z', 56.7, 24, 25.6, 4.6, 1.5, 2.0, 1);
  blindWindow('z', 56.7, 32, 33.6, 4.6, 1.5, 2.0, 1);
  box(10.4, 0.6, 0.9, kit.beam, 0, 4.6, 26);
  box(0.6, 0.7, 16.2, kit.sand, -14.3, B_Y + 5.6, 13);
  for (const c of CRENELS) {
    for (let p = c.lo; p < c.hi; p += c.step) {
      const q = Math.min(p + c.step * 0.55, c.hi);
      if (c.axis === 'x') box(q - p, 0.8, 0.9, kit.sand, (p + q) / 2, c.top + 0.4, c.at);
      else box(0.9, 0.8, q - p, kit.sand, c.at, c.top + 0.4, (p + q) / 2);
    }
  }
}
