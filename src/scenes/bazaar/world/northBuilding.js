import * as THREE from 'three';

// 北侧贴北墙的白楼薄条：水塔、天线等屋顶物。
export function buildNorth(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  // ---------- 后：白楼（贴北墙的薄条，北墙与棚屋之间留大片空地） ----------
  const backs = [
    { x0: -9.625, x1: -2.05, z0: -14.6, z1: -13.15, h: 9.4 },
    { x0: -2.05, x1: 3.35, z0: -14.6, z1: -13.4, h: 7.8 },
    { x0: 3.35, x1: 8.05, z0: -14.6, z1: -13.05, h: 8.9 },
  ];
  for (const bld of backs) {
    block(bld.x0, bld.x1, bld.z0, bld.z1, bld.h, kit.white);
    skirt(bld.x0, bld.x1, bld.z0, bld.z1, kit.skirtWhite);
    parapet(bld.x0, bld.x1, bld.z0, bld.z1, bld.h, kit.white);
  }
  const windows = [
    [-7.6, 1.35, -13.12, 0.75, 1.15],
    [-5.7, 3.4, -13.12, 0.82, 1.28, true],
    [-3.5, 1.25, -13.12, 0.7, 1.08],
    [-0.6, 1.45, -13.37, 0.88, 1.42, true],
    [1.3, 3.9, -13.37, 0.7, 1.05],
    [4.7, 1.35, -13.02, 0.8, 1.28],
    [6.5, 3.45, -13.02, 0.7, 1.08],
  ];
  for (const [x, y, z, w, h, arch] of windows) {
    placeWindow(x, y, z, w, h, 0, !!arch);
  }

  box(1.28, 0.68, 0.06, kit.trim, 0.4, 4.15, -13.37);
  const arrow = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.58), kit.arrow);
  arrow.position.set(0.4, 4.15, -13.32);
  add(arrow);

  volume(-7.6, -5.5, 9.4, 11.3, -14.45, -13.4, kit.white);
  placeWindow(-6.55, 9.55, -13.37, 0.55, 0.8, 0, false);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 14), kit.tank);
  tank.position.set(0.5, 8.45, -13.95);
  add(tank);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    kit.metal,
  );
  dish.position.set(5.7, 9.35, -13.75);
  dish.rotation.x = 0.7;
  dish.rotation.y = 0.6;
  add(dish);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.7, 5), kit.metal);
  antenna.position.set(3.7, 9.85, -13.75);
  add(antenna);
  box(0.95, 0.03, 0.03, kit.metal, 3.7, 10.5, -13.75);
}
