// 射线与 AABB 的纯数学工具：相机避墙用（别墅第一/三人称共用）。
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
    const tFar = Math.max((min - o) / d, (max - o) / d);
    tExit = Math.min(tExit, tFar);
  }
  return Number.isFinite(tExit) ? Math.max(0, tExit) : 0;
}

export function rayHitT(origin, dir, box) {
  let tmin = 0;
  let tmax = Infinity;
  const axes = [
    ['x', box.minX, box.maxX],
    ['y', box.minY, box.maxY],
    ['z', box.minZ, box.maxZ],
  ];
  for (const [axis, min, max] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return Infinity;
      continue;
    }
    let t1 = (min - o) / d;
    let t2 = (max - o) / d;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}
