// 荒漠迷城的水平碰撞与地面高度。玩家和敌人共用同一套 solids / platforms。

export const GRAVITY = 24;
export const JUMP_SPEED = 8.6;
export const STEP_UP = 0.35;
// 平台板底低于膝高才算挡人的实体；落地实体默认 bottom = 0，所以这个判定对它们恒不生效。
export const KNEE = 0.55;

export function boxOverlaps(x, z, box, r) {
  return x > box.minX - r && x < box.maxX + r
    && z > box.minZ - r && z < box.maxZ + r;
}

// 站在哪个平台之上，取够得着的最高顶面。没有平台时地面为 0。
// feet 是当前脚底高度：顶面比脚高出超过 STEP_UP 一点点的（悬空跳台、头顶平台）不算落脚处，
// 否则站在平台下方会被直接抬到顶面上。省略 feet 就是「取最高顶面」，给落点吸附用。
export function groundAt(world, x, z, r, feet = Infinity) {
  let y = 0;
  for (const plat of world.platforms) {
    if (plat.top > feet + STEP_UP + 0.06) continue;
    if (boxOverlaps(x, z, plat, r) && plat.top > y) y = plat.top;
  }
  return y;
}

// feet 是当前脚底高度：够高就能跨上平台，低于顶面约 STEP_UP 时当墙挡。
// 板底高于膝高的平台是头顶的东西，不挡水平移动，人可以从下面走过去。
export function blockedAt(world, x, z, r, feet) {
  for (const solid of world.solids) {
    if (boxOverlaps(x, z, solid, r)) return true;
  }
  for (const plat of world.platforms) {
    if (feet >= plat.top - STEP_UP) continue;
    if (plat.bottom > feet + KNEE) continue;
    if (boxOverlaps(x, z, plat, r)) return true;
  }
  return false;
}

// 沿 dir 从 origin 出发，在 box 内部还能走多远。用于第三人称镜头不穿墙。
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

export function roomAt(world, x, z) {
  for (const room of world.rooms) {
    if (x > room.minX && x < room.maxX && z > room.minZ && z < room.maxZ) return room;
  }
  return null;
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

// 两点之间是否有墙。射击视线和敌人索敌都用它。
export function lineOfSight(raycaster, target, from, to) {
  const dir = to.clone().sub(from);
  const dist = dir.length();
  if (dist < 1e-4) return true;
  dir.multiplyScalar(1 / dist);
  raycaster.set(from, dir);
  raycaster.far = dist;
  const hits = raycaster.intersectObject(target, true);
  return !hits.some((hit) => hit.object.visible && hit.distance > 0.05 && hit.distance < dist - 0.02);
}
