// 炙热沙城世界组装：地面/楼梯/顶棚/楼体、墙、门、道具、远景。
// 返回 group / solids / platforms / rooms 和动画钩子。
import * as THREE from 'three';
import { createDust2Kit } from './materials.js';
import { createWorldHelpers } from './world/helpers.js';
import { buildFloors } from './world/floors.js';
import { buildWalls } from './world/walls.js';
import { buildASite } from './world/asite.js';
import { buildCtSpawn } from './world/ctspawn.js';
import { buildMid } from './world/mid.js';
import { buildShort } from './world/short.js';
import { buildDoors } from './world/doors.js';
import { buildProps, updateProps } from './world/props.js';
import { buildBackdrop } from './world/backdrop.js';
import { ROOMS } from './layout.js';

export function createDust2World() {
  const kit = createDust2Kit();
  const group = new THREE.Group();
  const solids = [];
  const platforms = [];
  const rooms = ROOMS.map((r) => ({
    minX: r.x0, maxX: r.x1, minY: r.y0, maxY: r.y1, minZ: r.z0, maxZ: r.z1,
  }));
  const animated = [];
  const geoCache = new Map();
  const ctx = { kit, group, solids, platforms, rooms, animated, geoCache };
  Object.assign(ctx, createWorldHelpers(ctx));

  buildFloors(ctx);
  buildWalls(ctx);
  buildASite(ctx);
  buildCtSpawn(ctx);
  buildMid(ctx);
  buildShort(ctx);
  buildDoors(ctx);
  buildProps(ctx);
  buildBackdrop(ctx);

  return {
    group,
    solids,
    platforms,
    rooms,
    update(elapsed) {
      updateProps(animated, elapsed);
    },
  };
}
