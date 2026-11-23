import * as THREE from 'three';

// 东门外通道：穿过东边界墙，通到东侧空地。
export function buildPassage(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { blue, eastDoorZ0, eastDoorZ1, eastDoorH, ix1 } = ctx;
  // ---------- 东门外通道：穿过东边界墙，通到东侧空地 ----------
  const passage = {
    x0: blue.x1,
    x1: blue.x1 + 1.62,
    z0: eastDoorZ0,
    z1: eastDoorZ1,
    h: eastDoorH,
    t: 0.3,
  };
  volume(passage.x0, passage.x1, 0, passage.h + 0.2, passage.z0 - passage.t, passage.z0, kit.sand);
  volume(passage.x0, passage.x1, 0, passage.h + 0.2, passage.z1, passage.z1 + passage.t, kit.sand);
  solid(passage.x0, passage.x1, passage.z0 - passage.t, passage.z0);
  solid(passage.x0, passage.x1, passage.z1, passage.z1 + passage.t);
  volume(passage.x0 - 0.02, passage.x1 + 0.06, passage.h, passage.h + 0.2, passage.z0 - passage.t, passage.z1 + passage.t, kit.concrete);
  volume(ix1, passage.x1, 0.015, 0.04, passage.z0, passage.z1, kit.concrete);
  // 通道算封闭房间：第三人称镜头不穿墙，敌人也不会走进来。
  rooms.push({
    minX: ix1,
    maxX: passage.x1,
    minZ: passage.z0,
    maxZ: passage.z1,
    minY: 0.2,
    maxY: passage.h - 0.1,
  });
  return { passage };
}
