import * as THREE from 'three';
import { FLAME_LEN } from './constants.js';

// 武器近景与特效共用的模块级资源：几何体、贴图、scratch 向量与纯工具。只存一份，各处 import 复用。
export const chipGeo = new THREE.BoxGeometry(0.035, 0.02, 0.05);
export const holeGeo = new THREE.PlaneGeometry(0.18, 0.18);
export const slashGeo = new THREE.PlaneGeometry(0.58, 0.05);
export const flameGeo = new THREE.PlaneGeometry(FLAME_LEN, 0.12);
export const xAxis = new THREE.Vector3(1, 0, 0);
export const zAxis = new THREE.Vector3(0, 0, 1);
export const aim = new THREE.Vector3();
export const muzzle = new THREE.Vector3();
export const hitPoint = new THREE.Vector3();
export const hitNormal = new THREE.Vector3();
export const gunMuzzle = new THREE.Vector3();
export const flightDir = new THREE.Vector3();
export const raycaster = new THREE.Raycaster();

export const _origin = new THREE.Vector3();
export const _aim = new THREE.Vector3();
export const _dir = new THREE.Vector3();
export const _x = new THREE.Vector3();
export const _y = new THREE.Vector3();
export const _x2 = new THREE.Vector3();
export const _y2 = new THREE.Vector3();
export const _up = new THREE.Vector3();
export const _basis = new THREE.Matrix4();
export const _muzzleLocal = new THREE.Vector3();

export function makeTracerGeo() {
  const geo = new THREE.BoxGeometry(0.007, 0.007, 1);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const head = new THREE.Color(0xfff7ea);
  const body = new THREE.Color(0xffb02e);
  const tail = new THREE.Color(0xff3a0e);
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getZ(i) + 0.5;
    if (t > 0.7) color.copy(head);
    else if (t > 0.25) color.copy(body);
    else color.copy(tail).multiplyScalar(t / 0.25);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export const tracerGeo = makeTracerGeo();

export function canvasTex(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const flameMap = canvasTex(256, (ctx, s) => {
  ctx.clearRect(0, 0, s, s);
  const along = ctx.createLinearGradient(0, 0, s, 0);
  along.addColorStop(0, 'rgba(255,255,248,1)');
  along.addColorStop(0.16, 'rgba(255,236,160,1)');
  along.addColorStop(0.42, 'rgba(255,176,42,0.95)');
  along.addColorStop(0.72, 'rgba(255,72,18,0.7)');
  along.addColorStop(1, 'rgba(160,24,0,0)');
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, s, s);
  const across = ctx.createLinearGradient(0, 0, 0, s);
  across.addColorStop(0, 'rgba(0,0,0,0)');
  across.addColorStop(0.5, 'rgba(0,0,0,1)');
  across.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, s, s);
});

export const holeMap = canvasTex(160, (ctx, s) => {
  const c = s / 2;
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(214,196,170,0.9)';
  ctx.beginPath();
  ctx.arc(c, c, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.arc(c, c, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0c0a08';
  ctx.beginPath();
  ctx.arc(c, c, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(28,20,14,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const len = 46 + (i % 3) * 12;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 12, c + Math.sin(a) * 12);
    ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(168,150,128,0.8)';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.fillRect(c + Math.cos(a) * 24 - 3, c + Math.sin(a) * 24 - 2, 7, 4);
  }
});

export const slashMap = canvasTex(256, (ctx, s) => {
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(28, 22, 18, 0.95)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(18, s * 0.46);
  ctx.quadraticCurveTo(s * 0.45, s * 0.62, s - 16, s * 0.4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90, 78, 66, 0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, s * 0.58);
  ctx.quadraticCurveTo(s * 0.5, s * 0.7, s - 40, s * 0.52);
  ctx.stroke();
});

export const leatherMap = canvasTex(256, (ctx, s) => {
  ctx.fillStyle = '#4a4038';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 2) {
    for (let x = 0; x < s; x += 2) {
      const n = ((x * 17 + y * 31) ^ (x * 3 + y * 5)) & 255;
      const g = 48 + (n % 28);
      ctx.fillStyle = `rgba(${g + 10},${g},${g - 8},0.22)`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.strokeStyle = 'rgba(28,20,16,0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    const y = 8 + i * 28;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(80, y - 6, 170, y + 8, s, y - 2);
    ctx.stroke();
  }
});

export const clothMap = canvasTex(128, (ctx, s) => {
  ctx.fillStyle = '#596069';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 2) {
    for (let x = 0; x < s; x += 2) {
      const n = ((x * 13 + y * 19) ^ (y * 7)) & 255;
      ctx.fillStyle = `rgba(${70 + (n % 30)},${74 + (n % 24)},${82 + (n % 20)},0.35)`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.strokeStyle = 'rgba(24,26,30,0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, s);
    ctx.moveTo(0, i);
    ctx.lineTo(s, i);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(230,234,238,0.2)';
  for (let i = 2; i < s; i += 4) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(s, i);
    ctx.stroke();
  }
});

export function viewMesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = false;
  m.receiveShadow = false;
  m.frustumCulled = false;
  m.raycast = () => {};
  return m;
}


export function remember(obj) {
  obj.userData.rest = obj.position.clone();
  return obj;
}

export function noRaycast(mesh) {
  mesh.raycast = () => {};
  mesh.frustumCulled = false;
  return mesh;
}


export function aimQuat(origin, targetPoint, roll, out) {
  _dir.copy(targetPoint).sub(origin);
  if (_dir.lengthSq() < 1e-8) _dir.set(0, 0, -1);
  else _dir.normalize();
  _x.crossVectors(_up.set(0, 1, 0), _dir);
  if (_x.lengthSq() < 1e-6) _x.set(1, 0, 0);
  _x.normalize();
  _y.crossVectors(_dir, _x).normalize();
  if (roll) {
    const c = Math.cos(roll);
    const s = Math.sin(roll);
    _x2.copy(_x).multiplyScalar(c).addScaledVector(_y, s);
    _y2.copy(_y).multiplyScalar(c).addScaledVector(_x, -s);
    _x.copy(_x2);
    _y.copy(_y2);
  }
  _basis.makeBasis(_x, _y, _dir);
  out.setFromRotationMatrix(_basis);
}
