import * as THREE from 'three';
import { C, mat, mesh } from './base.js';

// 女仆部件：顶点着色 colorAlong、发束 strand、蝴蝶结 makeBow、尾鳍 flukeGeo。
export function colorAlong(geo, c0, c1) {
  const uv = geo.attributes.uv;
  const colors = new Float32Array(uv.count * 3);
  const a = new THREE.Color(c0);
  const b = new THREE.Color(c1);
  const t = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    t.lerpColors(a, b, THREE.MathUtils.clamp(uv.getY(i), 0, 1));
    colors[i * 3] = t.r;
    colors[i * 3 + 1] = t.g;
    colors[i * 3 + 2] = t.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

export function strand(parent, material, points, radius, segments = 16) {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.curveType = 'catmullrom';
  curve.tension = 0.4;
  const geo = new THREE.TubeGeometry(curve, segments, radius, 7, false);
  colorAlong(geo, C.hair, C.hairTip);
  const m = mesh(geo, material);
  parent.add(m);
  return m;
}

export function makeBow(color, scale = 1) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.4 });
  const knot = mesh(new THREE.SphereGeometry(0.026, 10, 8), m);
  knot.scale.set(1.2, 0.82, 0.85);
  g.add(knot);
  for (const s of [-1, 1]) {
    const loop = mesh(new THREE.SphereGeometry(0.048, 12, 10), m);
    loop.scale.set(1.4, 0.75, 0.36);
    loop.position.set(s * 0.052, 0.006, 0);
    loop.rotation.z = s * 0.32;
    g.add(loop);
    const ribbon = mesh(new THREE.BoxGeometry(0.034, 0.085, 0.01), m);
    ribbon.position.set(s * 0.026, -0.052, 0.004);
    ribbon.rotation.z = s * 0.48;
    g.add(ribbon);
  }
  g.scale.setScalar(scale);
  return g;
}

export function flukeGeo() {
  const s = new THREE.Shape();
  s.moveTo(0.0, 0.04);
  s.bezierCurveTo(0.22, 0.16, 0.52, 0.34, 0.98, 0.2);
  s.bezierCurveTo(1.08, 0.12, 1.04, 0.0, 0.9, -0.08);
  s.bezierCurveTo(0.62, -0.18, 0.28, -0.1, 0.0, -0.02);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
}
