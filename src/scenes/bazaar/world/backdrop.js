import * as THREE from 'three';

// 电线、橙布与远处街区剪影。
export function buildBackdrop(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { pinkCx, pink, blue } = ctx;
  // ---------- 电线、橙布 ----------
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 8.4, 6), kit.beam);
  mast.position.set(-5.72, 4.2, -4.85);
  add(mast);
  solid(-5.86, -5.58, -5.0, -4.7);
  box(0.7, 0.06, 0.06, kit.beam, -5.72, 8.15, -4.85);

  wire(pinkCx, pink.h + 0.3, (pink.z0 + pink.z1) / 2, -6.2, 9.8, -13.9, 0.75);
  wire(-6.2, 9.7, -13.9, 0.6, 8.3, -14.0, 0.4);
  wire(0.6, 8.2, -14.0, blue.x0 + 3.15, blue.h + 0.35, 1.6, 0.9);
  wire(-5.72, 8.35, -4.85, pinkCx, pink.h + 0.25, pink.z1 - 2.1, 0.55);
  wire(-5.72, 8.3, -4.85, 4.4, 9.2, -13.5, 1.15);
  wire(-6.1, 7.6, -1.5, blue.x0 + 1.15, blue.h + 0.25, 5.5, 1.25);
  wire(2.2, 8.5, -13.3, blue.x0 + 4.45, blue.h + 0.35, -0.2, 0.8);

  hangCloth(
    new THREE.Vector3(-0.5, 5.45, -4.18),
    new THREE.Vector3(3.5, 5.35, -4.18),
    1.05,
  );

  // ---------- 远处街区 ----------
  const farSpecs = [
    [-26, 9, 8, 6], [-17, 14, 6, 7], [-9, 10, 7, 5], [-1, 16, 5, 6],
    [6, 11, 7, 5], [14, 13, 6, 7], [22, 8, 7, 5], [30, 12, 6, 6],
  ];
  farSpecs.forEach(([x, h, w, d], i) => {
    const mesh = box(w, h, d, kit.far[i % kit.far.length], x, h / 2 - 0.2, -36);
    mesh.userData.noShadow = true;
    mesh.userData.noReceive = true;
  });
}
