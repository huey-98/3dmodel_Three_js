// 多层地面系统：FLOORS 楼板（含侧壁裙边）、STAIRS 自动踏步、CEILS 顶棚、MASS 楼体。
// 碰撞登记：楼板=platform(top,bottom)，楼体=solid，踏步=platform。
import { FLOORS, STAIRS, CEILS, MASS, WALL_H, VOID_Y, SLAB, CAT_Y } from '../layout.js';

const KIND_MAT = { road: 'road', sand: 'dirt', cobble: 'cobble', cave: 'cave', wood: 'wood', apt: 'apt' };

// 与矩形（外扩 pad）相交的最高地面 top，用于楼体自动定高。
export function maxTopNear(rects, x0, x1, z0, z1, pad = 1.4) {
  let best = -Infinity;
  for (const f of rects) {
    if (f.x1 < x0 - pad || f.x0 > x1 + pad) continue;
    if (f.z1 < z0 - pad || f.z0 > z1 + pad) continue;
    if (f.top > best) best = f.top;
  }
  return Number.isFinite(best) ? best : 0;
}

export function buildFloors(ctx) {
  const { kit, box, volume, solid, platform } = ctx;
  const matFor = (kind) => kit[KIND_MAT[kind] || 'dirt'] || kit.dirt;

  // —— 底层大地（防止缝隙漏空）——
  box(120, 0.3, 124, kit.dirt, -7, VOID_Y + 0.15, 27);

  // —— 楼板 ——
  for (const f of FLOORS) {
    const bottom = f.bottom ?? (f.deep ? VOID_Y : f.top - SLAB);
    volume(f.x0, f.x1, bottom, f.top, f.z0, f.z1, matFor(f.kind));
    platform(f.x0, f.x1, f.z0, f.z1, f.top, bottom);
  }

  // —— 楼梯：按 0.34 米以内一步自动切踏步 ——
  for (const s of STAIRS) {
    const along = s.dir.includes('x') ? 'x' : 'z';
    const len = along === 'x' ? s.x1 - s.x0 : s.z1 - s.z0;
    const rise = s.to - s.from;
    const n = Math.max(2, Math.ceil(Math.abs(rise) / 0.34));
    const stepD = len / n;
    const stepH = rise / n;
    const mat = Math.min(s.from, s.to) < -1.5 ? kit.cave : kit.cobble;
    for (let i = 0; i < n; i++) {
      const t = s.from + stepH * (i + 1);
      const off = (along === 'x' ? (s.dir === 'x' ? s.x0 + i * stepD : s.x1 - (i + 1) * stepD) : 0);
      const x0 = along === 'x' ? off : s.x0;
      const x1 = along === 'x' ? off + stepD : s.x1;
      const z0 = along === 'z' ? (s.dir === 'z' ? s.z0 + i * stepD : s.z1 - (i + 1) * stepD) : s.z0;
      const z1 = along === 'z' ? z0 + stepD : s.z1;
      volume(x0, x1, VOID_Y, t, z0, z1, mat);
      platform(x0, x1, z0, z1, t, VOID_Y);
    }
  }

  // —— 猫道：支柱 + 两侧木护栏（护栏登记 solid 防坠落）——
  for (let x = -32; x <= -6; x += 6) {
    box(0.5, CAT_Y - SLAB - VOID_Y, 0.5, kit.beam, x, (VOID_Y + CAT_Y - SLAB) / 2, 16.6);
    box(0.5, CAT_Y - SLAB - VOID_Y, 0.5, kit.beam, x, (VOID_Y + CAT_Y - SLAB) / 2, 21.4);
  }
  box(30, 1.0, 0.22, kit.beam, -19, CAT_Y + 0.5, 15.9);
  box(30, 1.0, 0.22, kit.beam, -19, CAT_Y + 0.5, 22.1);
  solid(-34, -4, 15.7, 16.05);
  solid(-34, -4, 21.95, 22.3);

  // —— 顶棚 ——
  for (const c of CEILS) {
    volume(c.x0, c.x1, c.bottom, c.bottom + 0.6, c.z0, c.z1, matFor(c.kind));
  }

  // —— 楼体大块 ——
  for (const m of MASS) {
    const top = maxTopNear(FLOORS, m.x0, m.x1, m.z0, m.z1) + WALL_H;
    volume(m.x0, m.x1, VOID_Y, top, m.z0, m.z1, kit.mass);
    solid(m.x0, m.x1, m.z0, m.z1);
  }

  // —— 下沉层沿口的深色警示石条（纯视觉）——
  box(11, 0.25, 0.7, kit.mass, -24.5, 0.12, 35.7);   // A 坑北沿
  box(13, 0.25, 0.7, kit.mass, -12.5, 0.12, 32.6);   // 桥洞北沿
  box(0.7, 0.25, 7, kit.mass, 32.4, 0.12, 3.2);      // 下水道入口西唇
  box(0.7, 0.25, 7, kit.mass, 38.6, 0.12, 3.2);      // 下水道入口东唇
}
