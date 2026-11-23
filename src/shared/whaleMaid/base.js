import * as THREE from 'three';

// 女仆基础件：配色表 C、材质助手 mat、网格助手 mesh、向量助手 v。
export const C = {
  skin: 0xf5cfc0,
  hair: 0x3e6eb0,
  hairTip: 0x9fd2f5,
  navy: 0x1c2a4a,
  navyDeep: 0x151e36,
  white: 0xf7f4ee,
  gold: 0xd4b36a,
  bowBlue: 0x7eb6eb,
  belly: 0xc8d2de,
  stocking: 0x1a1f2e,
};

export function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.03,
    ...extra,
  });
}

export function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function v(x, y, z) {
  return new THREE.Vector3(x, y, z);
}
