// 炙热沙城的碰撞与地面高度。多层结构的关键是“脚底高度感知”：
// groundAt 只认不高于脚底 + 台阶余量的地面，站在楼板上不会被更高的楼板抬走；
// blockedAt 里 solid 默认全高，带 bottom/top 的只在对应高度段挡人；
// platform 只在“高于脚底 + 余量、且底面低于膝盖”时挡人，
// 这样架空猫道、楼上地板、洞顶都不会拦住楼下通道，而实心板（deep）侧壁全程挡人。

import { STEP_UP, EYE_HEIGHT } from './constants.js';
import { ZONES } from './layout.js';

export function boxOverlaps(x, z, box, r) {
  return x > box.minX - r && x < box.maxX + r
    && z > box.minZ - r && z < box.maxZ + r;
}

// 脚底在 feet 时，(x,z) 处可站立的最高地面；没有则返回 -Infinity（继续下坠）。
export function groundAt(world, x, z, r, feet) {
  let y = -Infinity;
  for (const plat of world.platforms) {
    if (plat.top > feet + STEP_UP + 0.06) continue;
    if (!boxOverlaps(x, z, plat, r)) continue;
    if (plat.top > y) y = plat.top;
  }
  return y;
}

export function blockedAt(world, x, z, r, feet) {
  for (const solid of world.solids) {
    if (solid.top <= feet + STEP_UP) continue;        // 顶面在脚下：从上面跨过
    if (solid.bottom >= feet + EYE_HEIGHT) continue;  // 底面高过头顶：从下面穿过
    if (boxOverlaps(x, z, solid, r)) return true;
  }
  for (const plat of world.platforms) {
    if (plat.top <= feet + STEP_UP) continue;      // 可以踩上去的高度不算墙
    if (plat.bottom >= feet + 0.55) continue;      // 底面在膝盖以上：从下方穿过没问题
    if (boxOverlaps(x, z, plat, r)) return true;
  }
  return false;
}

// 水平移动一次：先试整步，再试只改 X、只改 Z，贴着墙滑过去。
export function slideMove(world, position, dx, dz, r) {
  const feet = position.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dz)) return false;
  if (!blockedAt(world, position.x + dx, position.z + dz, r, feet)) {
    position.x += dx;
    position.z += dz;
    return true;
  }
  let moved = false;
  if (!blockedAt(world, position.x + dx, position.z, r, feet)) {
    position.x += dx;
    moved = true;
  }
  if (!blockedAt(world, position.x, position.z + dz, r, feet)) {
    position.z += dz;
    moved = true;
  }
  return moved;
}

// 当前在哪个点位：区域要同时框住平面点和脚底高度，取面积最小者。
export function zoneAt(x, z, feet) {
  let best = null;
  let bestArea = Infinity;
  for (const zone of ZONES) {
    if (x < zone.x0 || x > zone.x1 || z < zone.z0 || z > zone.z1) continue;
    if (Number.isFinite(feet) && (feet < zone.y0 || feet > zone.y1)) continue;
    const area = (zone.x1 - zone.x0) * (zone.z1 - zone.z0);
    if (area < bestArea) {
      best = zone;
      bestArea = area;
    }
  }
  return best ? best.name : '沙城外圈';
}

// 第三人称镜头不穿楼：从目标沿 dir 还能在盒子内走多远。
export function maxRayInside(origin, dir, box) {
  let tExit = Infinity;
  const axes = [
    ['x', box.minX, box.maxX],
    ['y', box.minY, box.maxY],
    ['z', box.minZ, box.maxZ],
  ];
  for (const [axis, min, max] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return 0;
      continue;
    }
    tExit = Math.min(tExit, Math.max((min - o) / d, (max - o) / d));
  }
  return Number.isFinite(tExit) ? Math.max(0, tExit) : 0;
}

export function roomAt(world, x, z, y) {
  for (const room of world.rooms) {
    if (x > room.minX && x < room.maxX && z > room.minZ && z < room.maxZ
      && y >= room.minY && y <= room.maxY) return room;
  }
  return null;
}
