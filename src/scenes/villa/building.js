import * as THREE from 'three';
import { getVillaKit } from './villaMaterials.js';
import {
  W, D, T, FLOOR_H, FLOORS, DOOR_W, DOOR_H, HALF_W, HALF_D, TOP_Y, WALL_UV,
  BUILDING_FOOTPRINT, INTERIOR, STAIR_STEPS, STAIR_W, STAIR_CLEAR_X, STAIR_CLEAR_Z,
  STAIR_RUN, HOLE_PAD_X, STAIRS, stairWell, STAIR_WELLS, stairSurfaceY, STAIR_RAILS,
  WALL_RECTS, COL_XS, COL_Z, DOOR_GAP, DOOR_ANCHOR, INSIDE_POINT, OUTSIDE_POINT,
  buildOpenings, OPENINGS,
} from './building/layout.js';
export {
  FLOOR_H, BUILDING_FOOTPRINT, INTERIOR, STAIR_STEPS, STAIRS, stairWell, STAIR_WELLS,
  stairSurfaceY, STAIR_RAILS, WALL_RECTS, DOOR_GAP, DOOR_ANCHOR, INSIDE_POINT,
  OUTSIDE_POINT, OPENINGS,
} from './building/layout.js';
import { createBuildingParts } from './building/parts.js';
import { buildWalls } from './building/walls.js';
import { buildDoor } from './building/door.js';
import { buildPorch } from './building/porch.js';
import { buildRoof } from './building/roof.js';
import { buildFloors } from './building/floors.js';

export function createBuilding() {
  const kit = getVillaKit();
  const group = new THREE.Group();
  const ctx = { kit, group };
  Object.assign(ctx, createBuildingParts(ctx));

  buildWalls(ctx);
  Object.assign(ctx, buildDoor(ctx));
  buildPorch(ctx);
  buildRoof(ctx);
  Object.assign(ctx, buildFloors(ctx));

  const { leftPivot, rightPivot, innerLight } = ctx;

  let doorCur = 0;
  let doorTarget = 0;

  function update(dt) {
    doorCur += (doorTarget - doorCur) * Math.min(dt * 3.4, 1);
    leftPivot.rotation.y = -doorCur * 1.38;
    rightPivot.rotation.y = doorCur * 1.38;
    const glow = 1.4 + doorCur * 1.5;
    innerLight.intensity += (glow - innerLight.intensity) * Math.min(dt * 4, 1);
  }

  return {
    group,
    update,
    setDoorOpen: (open) => { doorTarget = open ? 1 : 0; },
    isDoorOpen: () => doorTarget === 1,
    doorAnchor: DOOR_ANCHOR,
  };
}
