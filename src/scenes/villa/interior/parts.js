import * as THREE from 'three';

// 室内材质包与 rugMat / box / cyl 助手。只依赖 ctx 里的 kit 与 root。
export function createInteriorParts(ctx) {
  const { kit, root } = ctx;

  const walnut = kit.wood(0x5a3a24, 0.46);
  const walnutDark = kit.wood(0x3b2618, 0.5);
  const oak = kit.wood(0x8a6240, 0.5);
  const marbleMat = kit.mapped(kit.maps.marble, 1, 1, { roughness: 0.16, metalness: 0.06 });
  const emerald = kit.velvet(0x1e6a4a);
  const emeraldDeep = kit.velvet(0x154e38);
  const champagne = kit.velvet(0xcbb98a);
  const blush = kit.velvet(0xa85a68);
  const ivory = kit.linen(0xf7f3ea);
  const linenBlue = kit.linen(0xd5dde6);
  const leather = kit.leather(0x6a242c);
  const leatherDark = kit.leather(0x3d2218);
  const gold = kit.linen(0xd4b36a);
  const rugLiving = rugMat(kit.maps.rugLiving);
  const rugBed = rugMat(kit.maps.rugBed);
  const rugStudy = rugMat(kit.maps.rugStudy);
  const sheer = new THREE.MeshStandardMaterial({
    color: 0xfff8ef, transparent: true, opacity: 0.3, roughness: 0.35,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const drapeByFloor = [emerald, champagne, kit.velvet(0x7a2e3a)];
  const emberMat = () => new THREE.MeshStandardMaterial({
    color: 0xff6a2a, emissive: 0xff5a1a, emissiveIntensity: 1.5, roughness: 0.8,
  });

  function rugMat(map) {
    const mat = kit.mapped(map, 1, 1, { roughness: 1 });
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -2;
    mat.polygonOffsetUnits = -2;
    return mat;
  }

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = null) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (parent) parent.add(mesh);
    return mesh;
  };

  const cyl = (r1, r2, h, mat, x, y, z, seg = 12, parent = null) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (parent) parent.add(mesh);
    return mesh;
  };

  return {
    walnut, walnutDark, oak, marbleMat, emerald, emeraldDeep, champagne, blush, ivory,
    linenBlue, leather, leatherDark, gold, rugLiving, rugBed, rugStudy, sheer, drapeByFloor,
    emberMat, rugMat, box, cyl,
  };
}
