import * as THREE from 'three';
import { applyMetricUV } from '../villaMaterials.js';

// 建筑通用材质包与 box/cyl 两个落网格助手，由 createBuilding 挂到 ctx 上。
export function createBuildingParts(ctx) {
  const { kit, group } = ctx;

  const stone = kit.mapped(kit.maps.stone, 1, 1, { roughness: 0.9 });
  const marble = kit.mapped(kit.maps.marble, 1, 1, { roughness: 0.2, metalness: 0.05 });
  const walnut = kit.mapped(kit.maps.walnut, 1, 1, { roughness: 0.52, metalness: 0.03 });
  const parquet = kit.mapped(kit.maps.parquet, 1, 1, { roughness: 0.48, metalness: 0.04 });
  const paver = kit.mapped(kit.maps.paver, 1, 1, { roughness: 0.9 });
  const plaster = kit.plaster;
  const trimWood = kit.wood(0x5c3d28, 0.5);
  const doorWood = kit.wood(0x4e3018, 0.42);
  const doorPanel = kit.wood(0x3a2414, 0.5);
  const runnerMat = kit.velvet(0x6e2430);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f6a3c, roughness: 0.9 });
  const leafLite = new THREE.MeshStandardMaterial({ color: 0x4e9454, roughness: 0.86 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d8, emissive: 0xffc56e, emissiveIntensity: 1.7,
  });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xf4ecdf, roughness: 0.62 });

  // +x -x +y -y +z -z。外立面石材，室内一侧是石膏。
  const matLeft = [plaster, stone, stone, stone, stone, stone];
  const matRight = [stone, plaster, stone, stone, stone, stone];
  const matBack = [stone, stone, stone, stone, plaster, stone];
  const matFront = [stone, stone, stone, stone, stone, plaster];

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, uvScale = 0, parent = group) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    if (uvScale > 0) applyMetricUV(geo, x, y, z, uvScale);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  const cyl = (r1, r2, h, mat, x, y, z, seg = 16, parent = group) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  return {
    stone, marble, walnut, parquet, paver, plaster, trimWood, doorWood, doorPanel,
    runnerMat, leafMat, leafLite, lampMat, crownMat, matLeft, matRight, matBack, matFront,
    box, cyl,
  };
}
