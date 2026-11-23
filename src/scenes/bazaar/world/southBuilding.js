import * as THREE from 'three';

// 南侧沙黄楼，中心向南开露天凹槽（游戏模式主攻口）。
export function buildSouth(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { pink, blue } = ctx;
  // ---------- 南：沙黄楼，中心向南开露天凹槽 ----------
  // 凹槽口的墙与东楼南沿齐平，略高于人物；左右各留通道。
  const south = {
    x0: pink.x0,
    x1: blue.x1,
    z0: blue.z1,
    z1: blue.z1 + 8.2,
    h: 7.05,
  };
  const recCx = (pink.x1 + blue.x0) / 2;
  const recW = 11.4;
  const recX0 = recCx - recW / 2;
  const recX1 = recCx + recW / 2;
  const recDepth = 6.5;
  const recZ1 = south.z0 + recDepth;
  const gapW = 0.64 * 4.5;
  const wallT = 0.52;
  const screenH = 2.25;
  const wallX0 = recX0 + gapW;
  const wallX1 = recX1 - gapW;
  const wallZ0 = blue.z1;
  const wallZ1 = wallZ0 + wallT;

  block(south.x0, recX0, south.z0, south.z1, south.h, kit.sand);
  block(recX1, south.x1, south.z0, south.z1, south.h, kit.sand);
  block(recX0, recX1, recZ1, south.z1, south.h, kit.sand);
  block(wallX0, wallX1, wallZ0, wallZ1, screenH, kit.sand);

  skirt(south.x0, recX0, south.z0, south.z1, kit.skirtSand);
  skirt(recX1, south.x1, south.z0, south.z1, kit.skirtSand);
  skirt(recX0, recX1, recZ1, south.z1, kit.skirtSand);
  skirt(wallX0, wallX1, wallZ0, wallZ1, kit.skirtSand);

  parapet(south.x0, recX0, south.z0, south.z1, south.h, kit.sand);
  parapet(recX1, south.x1, south.z0, south.z1, south.h, kit.sand);
  parapet(recX0, recX1, recZ1, south.z1, south.h, kit.sand);
  return { south };
}
