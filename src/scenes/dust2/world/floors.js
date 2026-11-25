// 多层地面系统：FLOORS 楼板、STAIRS 自动踏步、CEILS 顶棚、MASS 楼体。
import { FLOORS, STAIRS, RAMPS, CEILS, MASS, WALL_H, VOID_Y, SLAB, B2_Y } from '../layout.js';

const KIND_MAT = { road: 'road', sand: 'dirt', cobble: 'cobble', cave: 'cave', wood: 'wood', apt: 'apt', asphalt: 'asphalt' };

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
  const { kit, box, volume, solid, platform, rampMesh, group } = ctx;
  const matFor = (kind) => kit[KIND_MAT[kind] || 'dirt'] || kit.dirt;

  box(128, 0.3, 96, kit.dirt, 12, VOID_Y + 0.15, 44);

  for (const f of FLOORS) {
    const bottom = f.bottom ?? (f.deep ? VOID_Y : f.top - SLAB);
    volume(f.x0, f.x1, bottom, f.top, f.z0, f.z1, matFor(f.kind));
    platform(f.x0, f.x1, f.z0, f.z1, f.top, bottom);
  }

  for (const s of STAIRS) {
    const along = s.dir.includes('x') ? 'x' : 'z';
    const len = along === 'x' ? s.x1 - s.x0 : s.z1 - s.z0;
    const rise = s.to - s.from;
    const n = Math.max(2, Math.ceil(Math.abs(rise) / (s.stepH || 0.34)));
    const stepD = len / n;
    const stepH = rise / n;
    const mat = s.kind === 'stone' ? kit.stone : (Math.min(s.from, s.to) < -1.5 ? kit.cave : kit.cobble);
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

  // 平滑斜坡：细踏步登记物理（走感平滑），视觉只渲染一个楔体（无台阶）。
  for (const r of RAMPS) {
    const along = r.dir.includes('x') ? 'x' : 'z';
    const len = along === 'x' ? r.x1 - r.x0 : r.z1 - r.z0;
    const rise = r.to - r.from;
    const n = Math.max(2, Math.ceil(Math.abs(rise) / 0.12));
    const stepD = len / n;
    const stepH = rise / n;
    for (let i = 0; i < n; i++) {
      const t = r.from + stepH * (i + 1);
      const off = along === 'x' ? (r.dir === 'x' ? r.x0 + i * stepD : r.x1 - (i + 1) * stepD) : 0;
      const x0 = along === 'x' ? off : r.x0;
      const x1 = along === 'x' ? off + stepD : r.x1;
      const z0 = along === 'z' ? (r.dir === 'z' ? r.z0 + i * stepD : r.z1 - (i + 1) * stepD) : r.z0;
      const z1 = along === 'z' ? z0 + stepD : r.z1;
      platform(x0, x1, z0, z1, t, VOID_Y);
    }
    const mat = Math.min(r.from, r.to) < -1.5 ? kit.cave : kit.cobble;
    group.add(rampMesh(r, mat));
  }

  for (const c of CEILS) {
    volume(c.x0, c.x1, c.bottom, c.bottom + 0.6, c.z0, c.z1, matFor(c.kind));
  }

  for (const m of MASS) {
    const top = m.top ?? maxTopNear(FLOORS, m.x0, m.x1, m.z0, m.z1) + WALL_H;
    volume(m.x0, m.x1, VOID_Y, top, m.z0, m.z1, kit.mass);
    solid(m.x0, m.x1, m.z0, m.z1);
  }

  // 下沉沿口警示石条（纯视觉，放在下落前一侧的地面上）
  box(8, 0.25, 0.7, kit.mass, -36, B2_Y + 0.12, 51.8);
}


