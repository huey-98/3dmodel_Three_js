import * as THREE from 'three';

// 静止在右下角，刃约 36° 仰角、刀尖仍低于准星；刺击先后拉、前刺至准星附近、收回并略过冲。
export const KNIFE_POSES = [
  { t: 0, x: 0.41, y: -0.27, z: -0.4, dx: -0.44, dy: 0.52, dz: -0.73, roll: 1.08, curl: 0.68, wrist: 0, ease: 'smooth' },
  { t: 0.1, x: 0.43, y: -0.12, z: -0.34, dx: -0.3, dy: 0.68, dz: -0.55, roll: 0.98, curl: 0.76, wrist: -0.034, ease: 'in' },
  { t: 0.2, x: 0.06, y: -0.17, z: -0.7, dx: -0.08, dy: 0.18, dz: -0.98, roll: 0.7, curl: 0.84, wrist: 0.028, ease: 'smooth' },
  { t: 0.26, x: 0.08, y: -0.16, z: -0.66, dx: -0.1, dy: 0.22, dz: -0.97, roll: 0.72, curl: 0.8, wrist: 0.014, ease: 'out' },
  { t: 0.4, x: 0.48, y: -0.31, z: -0.28, dx: -0.48, dy: 0.48, dz: -0.73, roll: 1.14, curl: 0.7, wrist: -0.022, ease: 'smooth' },
  { t: 0.48, x: 0.41, y: -0.27, z: -0.4, dx: -0.44, dy: 0.52, dz: -0.73, roll: 1.08, curl: 0.68, wrist: 0, ease: 'smooth' },
];

export function sampleKnife(elapsed) {
  const keys = KNIFE_POSES;
  let i = 0;
  while (i < keys.length - 2 && elapsed >= keys[i + 1].t) i += 1;
  const a = keys[i];
  const b = keys[i + 1];
  const span = b.t - a.t;
  let u = span <= 1e-5 ? 1 : (elapsed - a.t) / span;
  if (u < 0) u = 0;
  else if (u > 1) u = 1;
  if (a.ease === 'in') u = u * u;
  else if (a.ease === 'out') u = 1 - (1 - u) * (1 - u);
  else u = u * u * (3 - 2 * u);
  const mix = (key) => a[key] + (b[key] - a[key]) * u;
  return {
    x: mix('x'),
    y: mix('y'),
    z: mix('z'),
    dx: mix('dx'),
    dy: mix('dy'),
    dz: mix('dz'),
    roll: mix('roll'),
    curl: mix('curl'),
    wrist: mix('wrist'),
  };
}

// 双刃、中间起脊、向刀尖收成一点。局部 +Z 指向刀尖，刃口在 ±Y。
export function daggerBladeGeo() {
  const stations = [
    { z: 0.012, y: 0.017, x: 0.0048 },
    { z: 0.07, y: 0.014, x: 0.0038 },
    { z: 0.14, y: 0.0095, x: 0.0026 },
    { z: 0.21, y: 0.005, x: 0.0014 },
    { z: 0.26, y: 0.0016, x: 0.0005 },
  ];
  const positions = [];
  stations.forEach((s) => {
    positions.push(0, s.y, s.z, s.x, 0, s.z, 0, -s.y, s.z, -s.x, 0, s.z);
  });
  const tip = positions.length / 3;
  positions.push(0, 0, 0.292);
  const index = [];
  const addTri = (ia, ib, ic, px, py, pz) => {
    const ax = positions[ia * 3];
    const ay = positions[ia * 3 + 1];
    const az = positions[ia * 3 + 2];
    const bx = positions[ib * 3] - ax;
    const by = positions[ib * 3 + 1] - ay;
    const bz = positions[ib * 3 + 2] - az;
    const cx = positions[ic * 3] - ax;
    const cy = positions[ic * 3 + 1] - ay;
    const cz = positions[ic * 3 + 2] - az;
    const nx = by * cz - bz * cy;
    const ny = bz * cx - bx * cz;
    const nz = bx * cy - by * cx;
    if (nx * px + ny * py + nz * pz < 0) index.push(ia, ic, ib);
    else index.push(ia, ib, ic);
  };
  for (let i = 0; i < stations.length - 1; i += 1) {
    for (let k = 0; k < 4; k += 1) {
      const k2 = (k + 1) % 4;
      const a = i * 4 + k;
      const b = (i + 1) * 4 + k;
      const c = (i + 1) * 4 + k2;
      const d = i * 4 + k2;
      const mx = positions[a * 3] + positions[b * 3] + positions[c * 3] + positions[d * 3];
      const my = positions[a * 3 + 1] + positions[b * 3 + 1] + positions[c * 3 + 1] + positions[d * 3 + 1];
      addTri(a, b, c, mx, my, 0);
      addTri(a, c, d, mx, my, 0);
    }
  }
  const last = (stations.length - 1) * 4;
  for (let k = 0; k < 4; k += 1) {
    const k2 = (k + 1) % 4;
    const mx = positions[(last + k) * 3] + positions[(last + k2) * 3];
    const my = positions[(last + k) * 3 + 1] + positions[(last + k2) * 3 + 1];
    addTri(last + k, tip, last + k2, mx, my, 0.02);
  }
  addTri(0, 1, 2, 0, 0, -1);
  addTri(0, 2, 3, 0, 0, -1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
