import * as THREE from 'three';

// 西侧蓝楼：两层带二楼阳台，可上阳台、进二楼。
export function buildWest(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  // ---------- 左：蓝楼（原红楼加高一层） ----------
  // 西贴边界墙；整体南移，北侧与北墙留空，南端给阳台和白车通道留空。
  const pink = { x0: -15.5, x1: -9.625, z0: -12.6, z1: 2.3, h: 7.35 };
  const balTop = 3.7;
  const storyH = 3.43;
  pink.h = balTop + storyH * 2;
  const pinkCx = (pink.x0 + pink.x1) / 2;
  const pinkT = 0.42;
  const f2 = balTop;
  const f3 = balTop + storyH;
  const winW = 3.05;
  const winH = 2.42;
  const winY = balTop + 0.22;
  const eastWins = [-8.85, -1.25];
  const eastHoles = eastWins.map((at) => ({ at, w: winW, y: winY, h: winH }));

  volume(pink.x0, pink.x1, 0, f2, pink.z0, pink.z1, kit.blue);
  volume(pink.x0, pink.x1, f3, pink.h, pink.z0, pink.z1, kit.blue);
  volume(pink.x0, pink.x0 + pinkT, f2, f3, pink.z0, pink.z1, kit.blue);
  volume(pink.x0, pink.x1, f2, f3, pink.z0, pink.z0 + pinkT, kit.blue);
  pierceZ(pink.x1 - pinkT, pink.x1, f2, f3, pink.z0, pink.z1, eastHoles, kit.blue);

  const southWinW = (pink.x1 - pink.x0) - 0.2;
  const southWinX0 = (pink.x0 + pink.x1) / 2 - southWinW / 2;
  const southWinX1 = southWinX0 + southWinW;
  const southWinTop = f2 + storyH - 0.14;
  volume(pink.x0, southWinX0, f2, f3, pink.z1 - pinkT, pink.z1, kit.blue);
  volume(southWinX1, pink.x1, f2, f3, pink.z1 - pinkT, pink.z1, kit.blue);
  volume(southWinX0, southWinX1, southWinTop, f3, pink.z1 - pinkT, pink.z1, kit.blue);

  const ix0b = pink.x0 + pinkT;
  const ix1b = pink.x1 - pinkT;
  const iz0b = pink.z0 + pinkT;
  const iz1b = pink.z1 - pinkT;
  volume(ix0b, ix1b, f2, f2 + 0.05, iz0b, iz1b, kit.creamFloor);
  volume(ix0b, ix1b, f3 - 0.05, f3, iz0b, iz1b, kit.cream);
  volume(ix0b, ix0b + 0.04, f2, f3, iz0b, iz1b, kit.cream);
  volume(ix0b, ix1b, f2, f3, iz0b, iz0b + 0.04, kit.cream);
  pierceZ(ix1b - 0.04, ix1b, f2, f3, iz0b, iz1b, eastHoles, kit.cream);
  volume(ix0b, southWinX0, f2, f3, iz1b - 0.04, iz1b, kit.cream);
  volume(southWinX1, ix1b, f2, f3, iz1b - 0.04, iz1b, kit.cream);
  volume(southWinX0, southWinX1, southWinTop, f3, iz1b - 0.04, iz1b, kit.cream);

  solid(pink.x0, pink.x0 + pinkT, pink.z0, pink.z1);
  solid(pink.x0, pink.x1, pink.z0, pink.z0 + pinkT);
  solidAlongZ(pink.x1 - pinkT, pink.x1, pink.z0, pink.z1, eastHoles);
  solid(pink.x0, southWinX0, pink.z1 - pinkT, pink.z1);
  solid(southWinX1, pink.x1, pink.z1 - pinkT, pink.z1);
  platform(ix0b, ix1b, iz0b, pink.z1, f2);
  rooms.push({
    minX: ix0b,
    maxX: ix1b,
    minZ: iz0b,
    maxZ: iz1b,
    minY: f2 - 0.15,
    maxY: f3 - 0.15,
  });

  {
    const roomCx = (ix0b + ix1b) / 2;
    const roomCz = (iz0b + iz1b) / 2;
    box(1.55, 0.08, 0.82, kit.wood, roomCx, f2 + 0.76, roomCz - 1.4);
    box(0.08, 0.72, 0.08, kit.beam, roomCx - 0.68, f2 + 0.36, roomCz - 1.72);
    box(0.08, 0.72, 0.08, kit.beam, roomCx + 0.68, f2 + 0.36, roomCz - 1.72);
    box(0.08, 0.72, 0.08, kit.beam, roomCx - 0.68, f2 + 0.36, roomCz - 1.08);
    box(0.08, 0.72, 0.08, kit.beam, roomCx + 0.68, f2 + 0.36, roomCz - 1.08);
    box(1.8, 1.15, 0.42, kit.beam, ix0b + 0.55, f2 + 0.58, roomCz + 2.2);
    box(0.7, 0.42, 0.55, kit.wood, roomCx + 0.9, f2 + 0.24, iz0b + 1.4);
    solid(roomCx - 0.78, roomCx + 0.78, roomCz - 1.4 - 0.41, roomCz - 1.4 + 0.41);
    solid(ix0b + 0.55 - 0.9, ix0b + 0.55 + 0.9, roomCz + 2.2 - 0.21, roomCz + 2.2 + 0.21);
    const roomLamp = new THREE.PointLight(0xfff4d2, 4.2, 14, 2);
    roomLamp.position.set(roomCx, f3 - 0.35, roomCz);
    add(roomLamp);
    box(0.55, 0.05, 0.55, kit.cream, roomCx, f3 - 0.12, roomCz);
  }

  skirt(pink.x0, pink.x1, pink.z0, pink.z1, kit.skirtBlue);
  parapet(pink.x0, pink.x1, pink.z0, pink.z1, pink.h, kit.blue);
  volume(pink.x0 - 0.06, pink.x1 + 0.06, pink.h - 0.08, pink.h + 0.08, pink.z0 - 0.06, pink.z1 + 0.06, kit.trim);

  const balX0 = pink.x0;
  const balX1 = pink.x1;
  const SOUTH_WALL_Z = 12.4;
  const vanHalf = 2.06;
  const balD = 3.5;
  const vanGap = 1.15;
  const vanZ = pink.z1 + balD + vanHalf + vanGap;
  volume(balX0, balX1, 0, balTop, pink.z1 - 0.05, pink.z1 + balD, kit.blue);
  platform(balX0, balX1, pink.z1 - 0.05, pink.z1 + balD, balTop);
  placeWindow(
    (balX0 + balX1) / 2,
    balTop,
    pink.z1 + 0.03,
    southWinW,
    storyH - 0.14,
    0,
    false,
    true,
  );

  // 二楼东立面两扇开口大窗，可看见浅黄室内；三楼实墙无窗。
  for (const z of eastWins) {
    placeWindow(pink.x1 + 0.03, winY, z, winW, winH, Math.PI / 2, false, true);
  }
  box(0.34, 0.36, 0.7, kit.ac, pink.x1 + 0.18, 3.55, -0.2);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, pink.h, 6), kit.metalDark);
  spout.position.set(pink.x1 + 0.08, pink.h / 2, pink.z1 - 0.2);
  add(spout);
  return { pink, pinkCx, SOUTH_WALL_Z, balD, vanZ };
}
