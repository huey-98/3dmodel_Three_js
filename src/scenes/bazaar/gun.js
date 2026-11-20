import * as THREE from 'three';
import { MAP_SCALE } from './world.js';

// 只给荒漠迷城的第一人称用。1 步枪连发，2 手枪单点，3 匕首刺击。
const RANGE = 48 * MAP_SCALE;
const KNIFE_REACH = 2.1;
const KNIFE_TIME = 0.48;
const KNIFE_HIT = 0.2;
const RIFLE_MUZZLE_Z = 0.76;
const RIFLE_ROLL = THREE.MathUtils.degToRad(2);
const PISTOL_MUZZLE_Z = 0.24;
const WEAPONS = {
  rifle: { label: '步枪', mag: 30, reserve: 90, auto: true, gap: 0.09, reload: 1.65, flame: 1, recoil: 0.028 },
  pistol: { label: '手枪', mag: 12, reserve: 36, auto: false, gap: 0.2, reload: 1.3, flame: 0.62, recoil: 0.018 },
  knife: { label: '匕首', auto: false, gap: 0.48 },
};

const chipGeo = new THREE.BoxGeometry(0.035, 0.02, 0.05);
const holeGeo = new THREE.PlaneGeometry(0.18, 0.18);
const slashGeo = new THREE.PlaneGeometry(0.58, 0.05);
const FLAME_LEN = 0.4;
const flameGeo = new THREE.PlaneGeometry(FLAME_LEN, 0.12);
const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);
const aim = new THREE.Vector3();
const muzzle = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const hitNormal = new THREE.Vector3();
const gunMuzzle = new THREE.Vector3();
const flightDir = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const HOLE_LIFE = 3;
const TRACER_SPEED = 120;

const _origin = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _x = new THREE.Vector3();
const _y = new THREE.Vector3();
const _x2 = new THREE.Vector3();
const _y2 = new THREE.Vector3();
const _up = new THREE.Vector3();
const _basis = new THREE.Matrix4();
const _muzzleLocal = new THREE.Vector3();

function makeTracerGeo() {
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

const tracerGeo = makeTracerGeo();

function canvasTex(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const flameMap = canvasTex(256, (ctx, s) => {
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

const holeMap = canvasTex(160, (ctx, s) => {
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

const slashMap = canvasTex(256, (ctx, s) => {
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

const leatherMap = canvasTex(256, (ctx, s) => {
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

const clothMap = canvasTex(128, (ctx, s) => {
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

const woodMap = canvasTex(128, (ctx, s) => {
  ctx.fillStyle = '#6e3a1e';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 1) {
    const n = (y * 17) ^ (y * 3);
    const shift = (n % 18) - 6;
    ctx.fillStyle = `rgba(${148 + shift},${76 + (n % 14)},${34 + (n % 10)},0.32)`;
    ctx.fillRect(0, y, s, 1);
  }
  ctx.strokeStyle = 'rgba(42,18,8,0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const y = 8 + i * 18 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s * 0.35, y - 4, s * 0.7, y + 5, s, y - 1);
    ctx.stroke();
  }
});

function viewMesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = false;
  m.receiveShadow = false;
  m.frustumCulled = false;
  m.raycast = () => {};
  return m;
}

function addFinger(parent, x, y, z, lengths, width, mat) {
  const joints = [];
  let prev = null;
  let prevLen = 0;
  for (let i = 0; i < lengths.length; i++) {
    const len = lengths[i];
    const pivot = new THREE.Group();
    if (i === 0) pivot.position.set(x, y, z);
    else pivot.position.z = prevLen;
    (prev || parent).add(pivot);
    if (i === 0) {
      const knuckle = viewMesh(new THREE.SphereGeometry(width * 0.56, 8, 6), mat);
      pivot.add(knuckle);
    }
    const seg = viewMesh(new THREE.BoxGeometry(width, width * 0.9, len * 0.86), mat);
    seg.position.z = len * 0.46;
    pivot.add(seg);
    const cap = viewMesh(new THREE.SphereGeometry(width * 0.46, 8, 6), mat);
    cap.scale.z = 0.75;
    cap.position.z = len * 0.9;
    pivot.add(cap);
    joints.push(pivot);
    prev = pivot;
    prevLen = len;
  }
  return joints;
}

// 手掌朝局部 -Y，手指朝局部 +Z。side 决定拇指在哪一侧。
function buildHand(leather, cloth, side) {
  const s = side === 'right' ? 1 : -1;
  const root = new THREE.Group();
  const palm = viewMesh(new THREE.BoxGeometry(0.086, 0.03, 0.09), leather);
  palm.position.set(0, 0, 0.012);
  root.add(palm);
  const heel = viewMesh(new THREE.BoxGeometry(0.078, 0.034, 0.034), leather);
  heel.position.set(0, -0.002, -0.036);
  root.add(heel);
  const cuff = viewMesh(new THREE.BoxGeometry(0.072, 0.04, 0.028), cloth);
  cuff.position.set(0, -0.004, -0.055);
  root.add(cuff);

  const fingers = [
    { x: 0.032, z: 0.05, w: 0.015, lens: [0.03, 0.022, 0.016] },
    { x: 0.011, z: 0.056, w: 0.016, lens: [0.034, 0.024, 0.018] },
    { x: -0.011, z: 0.052, w: 0.015, lens: [0.032, 0.022, 0.016] },
    { x: -0.031, z: 0.044, w: 0.013, lens: [0.026, 0.018, 0.014] },
  ].map((spec) => addFinger(root, spec.x * s, 0.01, spec.z, spec.lens, spec.w, leather));

  const thumb = addFinger(root, -0.04 * s, -0.006, 0.014, [0.028, 0.022], 0.018, leather);
  thumb[0].rotation.y = -0.65 * s;
  thumb[0].rotation.z = 0.4 * s;

  function pose({ curl = 0.72, trigger = 0, thumbCurl = 0.5, index = null }) {
    fingers.forEach((joints, i) => {
      const pinky = i === 0;
      let c = curl + (pinky ? 0.08 : 0);
      if (i === 3 && index != null) c = index + trigger * 0.75;
      joints[0].rotation.x = 0.12 + c * 1.05;
      joints[1].rotation.x = 0.16 + c * 0.95;
      joints[2].rotation.x = 0.1 + c * 0.62;
    });
    thumb[0].rotation.x = 0.12 + thumbCurl * 0.65;
    thumb[1].rotation.x = 0.18 + thumbCurl * 0.75;
  }

  pose({});
  return { group: root, pose };
}

// 手指沿 fingerDir，手背沿 backDir。两者不必正交，手背会投到手指的垂直面上。
function pointHand(group, fingerDir, backDir) {
  const z = fingerDir.clone().normalize();
  const y = backDir.clone().addScaledVector(z, -backDir.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// 前臂从手腕沿 away 延伸。away 在手的父级空间里，朝向画面下方，这样手臂留在画面里。
function addArm(hand, cloth, away, length = 0.32) {
  const arm = new THREE.Group();
  arm.position.set(0, 0, -0.062);
  const forearm = viewMesh(new THREE.BoxGeometry(0.064, 0.058, length), cloth);
  forearm.position.set(0, 0, -length / 2);
  arm.add(forearm);
  const elbow = viewMesh(new THREE.BoxGeometry(0.068, 0.062, 0.046), cloth);
  elbow.position.set(0, 0, -length - 0.01);
  arm.add(elbow);
  hand.add(arm);
  const z = away.clone().negate().normalize();
  const up = Math.abs(z.y) > 0.82 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const y = up.clone().addScaledVector(z, -up.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z).normalize();
  const parentQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  arm.quaternion.copy(hand.quaternion).invert().multiply(parentQ);
  return arm;
}

// 静止在右下角；刺击时先后拉、前刺、再收回，并带一点过冲。
const KNIFE_POSES = [
  { t: 0, x: 0.38, y: -0.18, z: -0.42, dx: -0.479, dy: 0.588, dz: -0.652, roll: 1.05, curl: 0.68, wrist: 0, ease: 'smooth' },
  { t: 0.1, x: 0.44, y: -0.06, z: -0.32, dx: -0.25, dy: 0.85, dz: -0.46, roll: 1, curl: 0.76, wrist: -0.028, ease: 'in' },
  { t: 0.2, x: 0.12, y: -0.16, z: -0.62, dx: -0.358, dy: 0.418, dz: -0.836, roll: 0.82, curl: 0.84, wrist: 0.02, ease: 'smooth' },
  { t: 0.26, x: 0.13, y: -0.15, z: -0.58, dx: -0.34, dy: 0.38, dz: -0.86, roll: 0.84, curl: 0.8, wrist: 0.008, ease: 'out' },
  { t: 0.4, x: 0.46, y: -0.26, z: -0.3, dx: -0.45, dy: 0.42, dz: -0.79, roll: 1.12, curl: 0.7, wrist: -0.016, ease: 'smooth' },
  { t: 0.48, x: 0.38, y: -0.18, z: -0.42, dx: -0.479, dy: 0.588, dz: -0.652, roll: 1.05, curl: 0.68, wrist: 0, ease: 'smooth' },
];

function sampleKnife(elapsed) {
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
function daggerBladeGeo() {
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

function remember(obj) {
  obj.userData.rest = obj.position.clone();
  return obj;
}

function noRaycast(mesh) {
  mesh.raycast = () => {};
  mesh.frustumCulled = false;
  return mesh;
}

export function createCarbine({ scene, camera, domElement, isFirstPerson, target }) {
  const ammo = { rifle: WEAPONS.rifle.mag, pistol: WEAPONS.pistol.mag };
  const reserve = { rifle: WEAPONS.rifle.reserve, pistol: WEAPONS.pistol.reserve };
  let weapon = 'rifle';
  let gap = 0;
  let reloading = false;
  let reloadLeft = 0;
  let reloadDuration = 1;
  let recoil = 0;
  let burstFrames = 0;
  let holding = false;
  let dryPlayed = false;
  let swing = 0;
  let knifeStruck = false;
  let knifePose = KNIFE_POSES[0];
  let viewKick = 0;
  let triggerPull = 0;
  let shotSpread = 0;
  let equip = 1;
  let bob = 0;
  let motion = { moving: false, running: false, airborne: false };
  const effects = [];

  const viewScene = new THREE.Scene();
  viewScene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7560, 1.05));
  const viewKey = new THREE.DirectionalLight(0xfff3e2, 1.45);
  viewKey.position.set(0.35, 1.2, 2.4);
  viewScene.add(viewKey);
  const viewFill = new THREE.DirectionalLight(0xd5e2ff, 0.38);
  viewFill.position.set(-1.4, 0.3, 0.4);
  viewScene.add(viewFill);
  const viewCamera = new THREE.PerspectiveCamera(90, 1, 0.02, 6);

  const viewmodel = new THREE.Group();
  const rifleView = new THREE.Group();
  const pistolView = new THREE.Group();
  const knifeView = new THREE.Group();
  viewmodel.add(rifleView, pistolView, knifeView);
  viewScene.add(viewmodel);

  const gunMetal = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.78, roughness: 0.32 });
  const slideMetal = new THREE.MeshStandardMaterial({ color: 0xc5ccd4, metalness: 0.72, roughness: 0.26 });
  const gunDark = new THREE.MeshStandardMaterial({ color: 0x171b20, metalness: 0.5, roughness: 0.46 });
  const polymer = new THREE.MeshStandardMaterial({ color: 0x24282e, metalness: 0.08, roughness: 0.62 });
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.78, metalness: 0.02 });
  const blued = new THREE.MeshStandardMaterial({ color: 0x2a3140, metalness: 0.8, roughness: 0.34 });
  const magSteel = new THREE.MeshStandardMaterial({ color: 0x4a525c, metalness: 0.62, roughness: 0.38 });
  const bladeMetal = new THREE.MeshStandardMaterial({ color: 0xd5dbe3, metalness: 0.84, roughness: 0.18 });
  const leather = new THREE.MeshStandardMaterial({ map: leatherMap, roughness: 0.72, metalness: 0.04 });
  const cloth = new THREE.MeshStandardMaterial({ map: clothMap, roughness: 0.88, metalness: 0 });
  const sleeve = new THREE.MeshStandardMaterial({ map: clothMap, color: 0x23282e, roughness: 0.92, metalness: 0 });

  const part = (parent, geo, mat, x, y, z, rx = 0, rz = 0) => {
    const mesh = viewMesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    mesh.rotation.z = rz;
    parent.add(mesh);
    return mesh;
  };
  const tube = (parent, radius, length, mat, x, y, z) => {
    const mesh = viewMesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const axle = (parent, radius, length, mat, x, y, z) => {
    const mesh = viewMesh(new THREE.CylinderGeometry(radius, radius, length, 8), mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // 经典 AK-47。+Z 朝枪口，拉机柄和保险在右侧（局部 -X）。枪口保持在步枪轴上。
  part(rifleView, new THREE.BoxGeometry(0.048, 0.108, 0.016), gunDark, 0, 0.002, -0.378);
  part(rifleView, new THREE.BoxGeometry(0.04, 0.074, 0.16), wood, 0, 0.008, -0.288);
  part(rifleView, new THREE.BoxGeometry(0.032, 0.046, 0.09), wood, 0, 0.022, -0.162);
  part(rifleView, new THREE.BoxGeometry(0.048, 0.064, 0.22), blued, 0, 0.03, 0);
  part(rifleView, new THREE.BoxGeometry(0.044, 0.014, 0.18), gunMetal, 0, 0.066, -0.01);
  part(rifleView, new THREE.BoxGeometry(0.008, 0.006, 0.15), gunDark, 0, 0.076, -0.01);
  part(rifleView, new THREE.BoxGeometry(0.04, 0.028, 0.032), blued, 0, 0.086, 0.112);
  part(rifleView, new THREE.BoxGeometry(0.008, 0.036, 0.02), gunDark, 0, 0.11, 0.11);
  part(rifleView, new THREE.BoxGeometry(0.008, 0.014, 0.12), gunDark, -0.028, 0.012, -0.02);
  part(rifleView, new THREE.BoxGeometry(0.01, 0.016, 0.016), gunMetal, -0.03, 0.006, 0.038);
  axle(rifleView, 0.008, 0.01, gunMetal, -0.028, 0.042, -0.068);
  part(rifleView, new THREE.BoxGeometry(0.006, 0.012, 0.13), gunDark, -0.024, 0.048, -0.01);
  const rifleBolt = new THREE.Group();
  rifleBolt.position.set(-0.03, 0.048, 0.02);
  rifleView.add(rifleBolt);
  remember(rifleBolt);
  part(rifleBolt, new THREE.BoxGeometry(0.014, 0.012, 0.016), blued, -0.004, 0, 0);
  axle(rifleBolt, 0.009, 0.016, gunMetal, -0.014, 0, 0);
  for (const [y, z] of [[0.042, -0.06], [0.016, -0.06], [0.042, 0.04], [0.016, 0.04]]) {
    axle(rifleView, 0.0035, 0.008, gunMetal, -0.026, y, z);
  }
  part(rifleView, new THREE.BoxGeometry(0.05, 0.018, 0.062), blued, 0, -0.004, 0.09);
  part(rifleView, new THREE.BoxGeometry(0.034, 0.1, 0.04), wood, 0, -0.056, -0.036, 0.3);
  part(rifleView, new THREE.BoxGeometry(0.028, 0.008, 0.052), blued, 0, -0.03, 0.018);
  part(rifleView, new THREE.BoxGeometry(0.028, 0.024, 0.008), blued, 0, -0.016, -0.008);
  part(rifleView, new THREE.BoxGeometry(0.028, 0.02, 0.008), blued, 0, -0.016, 0.044);
  part(rifleView, new THREE.BoxGeometry(0.018, 0.018, 0.01), gunDark, 0, -0.02, 0.06);
  const rifleTrigger = new THREE.Group();
  rifleTrigger.position.set(0, -0.012, 0.016);
  rifleView.add(rifleTrigger);
  part(rifleTrigger, new THREE.BoxGeometry(0.008, 0.028, 0.01), gunDark, 0, -0.01, 0);
  const rifleMag = new THREE.Group();
  rifleMag.position.set(0, -0.006, 0.09);
  rifleView.add(rifleMag);
  remember(rifleMag);
  let magY = -0.008;
  let magZ = 0.008;
  let magAng = -0.18;
  for (let i = 0; i < 6; i++) {
    const last = i === 5;
    part(
      rifleMag,
      new THREE.BoxGeometry(last ? 0.032 : 0.03, last ? 0.018 : 0.048, last ? 0.034 : 0.034),
      last ? gunMetal : magSteel,
      0,
      magY,
      magZ,
      magAng,
    );
    const step = 0.022;
    magY -= Math.cos(magAng) * step;
    magZ -= Math.sin(magAng) * step;
    magAng -= 0.16;
  }
  part(rifleView, new THREE.BoxGeometry(0.048, 0.062, 0.22), wood, 0, 0.03, 0.27);
  part(rifleView, new THREE.BoxGeometry(0.044, 0.016, 0.12), wood, 0, 0.002, 0.3);
  tube(rifleView, 0.008, 0.16, gunMetal, 0, 0.066, 0.24);
  part(rifleView, new THREE.BoxGeometry(0.052, 0.05, 0.02), blued, 0, 0.036, 0.39);
  tube(rifleView, 0.011, 0.62, gunDark, 0, 0.034, 0.43);
  part(rifleView, new THREE.BoxGeometry(0.032, 0.048, 0.036), blued, 0, 0.066, 0.64);
  tube(rifleView, 0.0026, 0.2, gunMetal, 0, 0.02, 0.52);
  tube(rifleView, 0.015, 0.04, blued, 0, 0.034, 0.73);
  tube(rifleView, 0.017, 0.012, gunMetal, 0, 0.034, 0.754);
  const rifleMuzzle = new THREE.Object3D();
  rifleMuzzle.position.set(0, 0.034, RIFLE_MUZZLE_Z);
  rifleView.add(rifleMuzzle);
  const rifleRight = buildHand(leather, cloth, 'right');
  const rifleLeft = buildHand(leather, cloth, 'left');
  rifleView.add(rifleRight.group, rifleLeft.group);
  rifleRight.group.position.set(-0.02, -0.062, -0.015);
  pointHand(rifleRight.group, new THREE.Vector3(0.1, -0.1, 1), new THREE.Vector3(0.1, 0.45, -1));
  addArm(rifleRight.group, sleeve, new THREE.Vector3(-0.35, -1, -0.04), 0.4);
  rifleRight.group.visible = false;
  remember(rifleRight.group);
  rifleLeft.group.position.set(0, -0.046, 0.28);
  pointHand(rifleLeft.group, new THREE.Vector3(0.04, 0.4, 1), new THREE.Vector3(-0.2, -0.7, -0.6));
  addArm(rifleLeft.group, sleeve, new THREE.Vector3(0.42, -1, -0.05), 0.16);
  remember(rifleLeft.group);

  part(pistolView, new THREE.BoxGeometry(0.032, 0.036, 0.18), slideMetal, 0, 0.045, 0.04);
  part(pistolView, new THREE.BoxGeometry(0.01, 0.016, 0.018), gunDark, 0, 0.07, -0.03);
  part(pistolView, new THREE.BoxGeometry(0.01, 0.018, 0.016), gunDark, 0, 0.068, 0.1);
  const pistolSlide = remember(part(pistolView, new THREE.BoxGeometry(0.034, 0.02, 0.07), slideMetal, 0, 0.05, 0.0));
  tube(pistolView, 0.009, 0.1, gunDark, 0, 0.038, 0.16);
  part(pistolView, new THREE.BoxGeometry(0.03, 0.04, 0.12), polymer, 0, 0.02, 0.0);
  part(pistolView, new THREE.BoxGeometry(0.03, 0.11, 0.042), polymer, 0, -0.05, -0.03, 0.2);
  const pistolTrigger = new THREE.Group();
  pistolTrigger.position.set(0, 0.0, 0.02);
  pistolView.add(pistolTrigger);
  part(pistolTrigger, new THREE.BoxGeometry(0.006, 0.026, 0.008), gunDark, 0, -0.01, 0);
  const pistolMag = remember(part(pistolView, new THREE.BoxGeometry(0.026, 0.09, 0.032), gunDark, 0, -0.07, -0.02));
  const pistolMuzzle = new THREE.Object3D();
  pistolMuzzle.position.set(0, 0.04, PISTOL_MUZZLE_Z);
  pistolView.add(pistolMuzzle);
  const pistolHand = buildHand(leather, cloth, 'right');
  const pistolSupport = buildHand(leather, cloth, 'left');
  pistolView.add(pistolHand.group, pistolSupport.group);
  pistolHand.group.position.set(0.01, -0.02, -0.02);
  pointHand(pistolHand.group, new THREE.Vector3(0.08, -0.2, 1), new THREE.Vector3(0.05, 0.4, -1));
  remember(pistolHand.group);
  pistolSupport.group.position.set(0.016, -0.02, 0.03);
  pointHand(pistolSupport.group, new THREE.Vector3(0.35, -0.15, 0.9), new THREE.Vector3(-0.15, 0.35, -1));
  remember(pistolSupport.group);

  knifeView.add(viewMesh(daggerBladeGeo(), bladeMetal));
  part(knifeView, new THREE.BoxGeometry(0.016, 0.066, 0.013), gunMetal, 0, 0, 0.004);
  const quillon = (y) => {
    const ball = viewMesh(new THREE.SphereGeometry(0.008, 10, 8), gunMetal);
    ball.position.set(0, y, 0.004);
    knifeView.add(ball);
  };
  quillon(0.034);
  quillon(-0.034);
  tube(knifeView, 0.015, 0.016, gunMetal, 0, 0, -0.012);
  tube(knifeView, 0.012, 0.078, leather, 0, 0, -0.056);
  tube(knifeView, 0.0142, 0.007, gunDark, 0, 0, -0.026);
  tube(knifeView, 0.0142, 0.007, gunDark, 0, 0, -0.056);
  tube(knifeView, 0.0142, 0.007, gunDark, 0, 0, -0.086);
  const pommel = viewMesh(new THREE.SphereGeometry(0.016, 12, 8), gunMetal);
  pommel.scale.set(1.05, 1.05, 0.7);
  pommel.position.set(0, 0, -0.11);
  knifeView.add(pommel);
  const knifeHand = buildHand(leather, cloth, 'right');
  knifeView.add(knifeHand.group);
  knifeHand.group.position.set(0.012, 0.002, -0.1);
  pointHand(knifeHand.group, new THREE.Vector3(0.82, -0.4, 0.22), new THREE.Vector3(-0.2, 0.78, -0.55));
  addArm(knifeHand.group, cloth, new THREE.Vector3(-0.54, -0.06, -0.84), 0.4);

  const flashLight = new THREE.PointLight(0xffa040, 0, 8, 2);
  scene.add(flashLight);

  const font = '"Microsoft YaHei", sans-serif';
  const hud = document.createElement('div');
  hud.id = 'ammo';
  hud.style.cssText = [
    'position:fixed',
    'right:28px',
    'bottom:28px',
    'display:none',
    'flex-direction:column',
    'align-items:flex-end',
    'gap:6px',
    'pointer-events:none',
    'user-select:none',
    'z-index:5',
    `font:18px ${font}`,
    'color:#fff',
    'text-shadow:0 1px 2px rgba(0,0,0,.85)',
  ].join(';');
  const icon = document.createElement('canvas');
  icon.width = 112;
  icon.height = 48;
  icon.style.cssText = 'display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.85))';
  const bar = document.createElement('div');
  bar.style.cssText = [
    'width:112px',
    'height:6px',
    'border-radius:3px',
    'background:rgba(255,255,255,.28)',
    'overflow:hidden',
    'display:none',
  ].join(';');
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0;background:#fff';
  bar.appendChild(fill);
  const readout = document.createElement('div');
  readout.style.cssText = 'display:flex;align-items:baseline;gap:6px';
  const magEl = document.createElement('div');
  magEl.style.cssText = 'font-size:28px;font-weight:700;line-height:1';
  const sepEl = document.createElement('div');
  sepEl.textContent = '/';
  sepEl.style.cssText = 'font-size:16px;opacity:.8';
  const reserveEl = document.createElement('div');
  reserveEl.style.cssText = 'font-size:16px;line-height:1';
  readout.append(magEl, sepEl, reserveEl);
  hud.append(icon, bar, readout);
  document.body.appendChild(hud);

  const vitals = document.createElement('div');
  vitals.id = 'vitals';
  vitals.style.cssText = [
    'position:fixed',
    'left:28px',
    'bottom:28px',
    'display:none',
    'flex-direction:column',
    'gap:8px',
    'pointer-events:none',
    'user-select:none',
    'z-index:5',
    `font:13px ${font}`,
    'color:#fff',
    'text-shadow:0 1px 2px rgba(0,0,0,.85)',
  ].join(';');
  vitals.append(vitalRow('血量', '#7CFF6B'), vitalRow('护甲', '#8EB6FF'));
  document.body.appendChild(vitals);

  let drawn = '';

  function vitalRow(name, color) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    const label = document.createElement('div');
    label.textContent = name;
    label.style.cssText = 'width:36px';
    const track = document.createElement('div');
    track.style.cssText = 'width:120px;height:8px;border-radius:2px;background:rgba(255,255,255,.22);overflow:hidden';
    const meter = document.createElement('div');
    meter.style.cssText = `width:100%;height:100%;background:${color}`;
    track.appendChild(meter);
    const num = document.createElement('div');
    num.textContent = '100';
    num.style.cssText = 'font-size:18px;font-weight:700;min-width:32px';
    row.append(label, track, num);
    return row;
  }

  function drawWeapon(kind) {
    const ctx = icon.getContext('2d');
    const w = icon.width;
    const h = icon.height;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 3;
    if (kind === 'rifle') {
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(6, 32);
      ctx.lineTo(8, 16);
      ctx.lineTo(26, 15);
      ctx.lineTo(32, 20);
      ctx.lineTo(50, 18);
      ctx.lineTo(52, 11);
      ctx.lineTo(56, 18);
      ctx.lineTo(84, 16);
      ctx.lineTo(86, 9);
      ctx.lineTo(92, 9);
      ctx.lineTo(92, 17);
      ctx.lineTo(106, 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(34, 24);
      ctx.lineTo(106, 22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(42, 23);
      ctx.quadraticCurveTo(50, 34, 60, 42);
      ctx.quadraticCurveTo(54, 34, 48, 23);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(30, 22);
      ctx.lineTo(24, 36);
      ctx.lineTo(31, 38);
      ctx.lineTo(36, 24);
      ctx.stroke();
    } else if (kind === 'pistol') {
      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(86, 18);
      ctx.lineTo(86, 26);
      ctx.lineTo(48, 28);
      ctx.lineTo(42, 42);
      ctx.lineTo(30, 40);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(104, 8);
      ctx.lineTo(50, 18);
      ctx.lineTo(50, 8);
      ctx.lineTo(42, 8);
      ctx.lineTo(42, 20);
      ctx.lineTo(22, 26);
      ctx.lineTo(16, 20);
      ctx.lineTo(10, 30);
      ctx.lineTo(22, 32);
      ctx.lineTo(42, 28);
      ctx.lineTo(42, 40);
      ctx.lineTo(50, 40);
      ctx.lineTo(50, 30);
      ctx.closePath();
      ctx.fill();
    }
  }

  let audio;
  function tone(freq, dur, gainValue, type) {
    try {
      if (!audio) audio = new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.35), t + dur);
      gain.gain.setValueAtTime(gainValue, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // 没有音频设备时仍然可以开火
    }
  }

  function spec() {
    return WEAPONS[weapon];
  }

  function paint() {
    const active = isFirstPerson();
    hud.style.display = active ? 'flex' : 'none';
    vitals.style.display = active ? 'flex' : 'none';
    if (!active) return;
    if (drawn !== weapon) {
      drawWeapon(weapon);
      drawn = weapon;
    }
    if (weapon === 'knife') {
      readout.style.display = 'none';
      bar.style.display = 'none';
      return;
    }
    readout.style.display = 'flex';
    magEl.textContent = String(ammo[weapon]);
    reserveEl.textContent = String(reserve[weapon]);
    magEl.style.color = ammo[weapon] === 0 && !reloading ? '#ffb4a8' : '#fff';
    if (reloading && reloadDuration > 0) {
      bar.style.display = 'block';
      const progress = 1 - reloadLeft / reloadDuration;
      fill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    } else {
      bar.style.display = 'none';
    }
  }

  function addEffect(mesh, life, extra = {}) {
    if (!mesh.parent) scene.add(mesh);
    effects.push({ mesh, life, max: life, ...extra });
  }

  function spawnViewFlame(mark, scale) {
    const align = new THREE.Quaternion().setFromUnitVectors(xAxis, zAxis);
    for (let i = 0; i < 3; i++) {
      const tongue = viewMesh(flameGeo, new THREE.MeshBasicMaterial({
        map: flameMap,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }));
      const twist = new THREE.Quaternion().setFromAxisAngle(zAxis, i * Math.PI / 3);
      tongue.quaternion.copy(twist).multiply(align);
      tongue.scale.set(scale, scale, 1);
      tongue.position.set(0, 0, FLAME_LEN * scale * 0.45);
      mark.add(tongue);
      addEffect(tongue, 1, { burst: true, frames: 0 });
    }
  }

  function spawnTracer(start, dir, end) {
    const range = Math.max(0.3, start.distanceTo(end));
    const length = Math.min(0.9, range);
    const streak = noRaycast(new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })));
    streak.scale.set(1, 1, length);
    streak.quaternion.setFromUnitVectors(zAxis, dir);
    const origin = start.clone();
    const flight = dir.clone();
    let traveled = length * 0.5;
    streak.position.copy(origin).addScaledVector(flight, traveled);
    addEffect(streak, 1, {
      tick(item, dt) {
        if (!item.shown) {
          item.shown = true;
          return;
        }
        traveled += TRACER_SPEED * dt;
        const center = Math.min(traveled, Math.max(length * 0.5, range - length * 0.5));
        item.mesh.position.copy(origin).addScaledVector(flight, center);
        if (traveled >= range) item.life = 0;
      },
    });
  }

  function spawnHole(point, normal) {
    const mat = new THREE.MeshBasicMaterial({
      map: holeMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
    const hole = noRaycast(new THREE.Mesh(holeGeo, mat));
    const align = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, Math.random() * Math.PI * 2);
    hole.quaternion.copy(align).premultiply(spin);
    hole.position.copy(point).addScaledVector(normal, 0.025);
    hole.scale.setScalar(0.85 + Math.random() * 0.35);
    addEffect(hole, HOLE_LIFE, { hold: true });

    for (let i = 0; i < 5; i++) {
      const chip = noRaycast(new THREE.Mesh(
        chipGeo,
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x6a5344 : 0x2a211c,
          roughness: 0.9,
          transparent: true,
        }),
      ));
      chip.position.copy(point).addScaledVector(normal, 0.04);
      chip.rotation.set(Math.random(), Math.random(), Math.random());
      const velocity = normal.clone().multiplyScalar(1.4 + Math.random() * 1.6);
      velocity.x += (Math.random() - 0.5) * 1.8;
      velocity.z += (Math.random() - 0.5) * 1.8;
      addEffect(chip, 0.55, {
        tick(item, dt) {
          velocity.y -= 9 * dt;
          item.mesh.position.addScaledVector(velocity, dt);
          item.mesh.rotation.x += dt * 8;
        },
      });
    }
  }

  function spawnSlash(point, normal) {
    const mat = new THREE.MeshBasicMaterial({
      map: slashMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
    const mark = noRaycast(new THREE.Mesh(slashGeo, mat));
    const align = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, Math.random() * Math.PI);
    mark.quaternion.copy(align).premultiply(spin);
    mark.position.copy(point).addScaledVector(normal, 0.02);
    mark.scale.setScalar(0.85 + Math.random() * 0.3);
    addEffect(mark, HOLE_LIFE, { hold: true });
  }

  function spawnShot(mark, scale, end, impacted, normal) {
    const item = spec();
    spawnViewFlame(mark, scale);
    flashLight.position.copy(gunMuzzle);
    flashLight.intensity = 24;
    burstFrames = 2;
    spawnTracer(gunMuzzle, flightDir, end);
    if (impacted) spawnHole(end, normal);
    recoil = item.recoil;
    viewKick = weapon === 'pistol' ? 0.045 : 0.06;
    triggerPull = 1;
    shotSpread = weapon === 'pistol' ? 11 : 15;
    tone(weapon === 'pistol' ? 210 : 140, 0.09, weapon === 'pistol' ? 0.14 : 0.22, 'square');
  }

  function aimShot(reach) {
    camera.updateMatrixWorld();
    camera.getWorldDirection(aim);
    muzzle.copy(camera.position).addScaledVector(aim, 0.35);
    placeViewmodel();
    const mark = weapon === 'pistol' ? pistolMuzzle : rifleMuzzle;
    mark.getWorldPosition(_muzzleLocal);
    gunMuzzle.copy(_muzzleLocal).applyMatrix4(camera.matrixWorld);
    raycaster.set(weapon === 'knife' ? camera.position : muzzle, aim);
    raycaster.far = reach;
    const hits = raycaster.intersectObject(target, true);
    const hit = hits.find((item) => item.object.visible && item.face && item.distance > 0.2 && item.distance <= reach);
    if (hit) {
      hitPoint.copy(hit.point);
      hitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      if (hitNormal.dot(aim) > 0) hitNormal.negate();
    } else {
      hitPoint.copy(muzzle).addScaledVector(aim, reach);
    }
    return hit;
  }

  function aimQuat(origin, targetPoint, roll, out) {
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

  function reloadMotion() {
    if (!reloading || reloadDuration <= 0) return { drop: 0, mag: 0, bolt: 0, support: 0 };
    const p = 1 - reloadLeft / reloadDuration;
    let drop = 0;
    if (p < 0.18) drop = p / 0.18;
    else if (p < 0.82) drop = 1;
    else drop = 1 - (p - 0.82) / 0.18;
    let mag = 0;
    if (p > 0.16 && p < 0.62) mag = Math.sin(((p - 0.16) / 0.46) * Math.PI);
    let bolt = 0;
    if (p > 0.64 && p < 0.96) bolt = Math.sin(((p - 0.64) / 0.32) * Math.PI);
    let support = 0;
    if (p < 0.18) support = p / 0.18;
    else if (p < 0.78) support = 1;
    else support = Math.max(0, 1 - (p - 0.78) / 0.18);
    return { drop, mag, bolt, support };
  }

  function applyBob(origin) {
    const amp = motion.moving ? (motion.running ? 0.016 : 0.01) : 0.003;
    origin.x += Math.sin(bob) * amp;
    origin.y += Math.abs(Math.cos(bob)) * amp * 0.65;
  }

  function poseFingers() {
    const ready = equip * equip * (3 - 2 * equip);
    const grip = 0.38 + ready * 0.4;
    const motionNow = reloadMotion();
    if (weapon === 'rifle') {
      rifleRight.pose({
        curl: 0.58 + ready * 0.22,
        trigger: triggerPull,
        thumbCurl: 0.48,
        index: 0.08,
      });
      rifleLeft.pose({ curl: 0.42, thumbCurl: 0.34 + motionNow.bolt * 0.2 });
      rifleTrigger.rotation.x = triggerPull * 0.7;
      rifleMag.position.copy(rifleMag.userData.rest);
      rifleMag.position.y -= motionNow.mag * 0.18;
      rifleRight.group.position.copy(rifleRight.group.userData.rest);
      rifleRight.group.position.y -= motionNow.mag * 0.1;
      rifleBolt.position.copy(rifleBolt.userData.rest);
      rifleBolt.position.z -= motionNow.bolt * 0.06;
      rifleLeft.group.position.copy(rifleLeft.group.userData.rest);
      rifleLeft.group.position.z -= motionNow.bolt * 0.06;
      rifleLeft.group.position.y += motionNow.bolt * 0.02;
    } else if (weapon === 'pistol') {
      pistolHand.pose({
        curl: grip + 0.06,
        trigger: triggerPull,
        thumbCurl: 0.58,
        index: 0.14,
      });
      pistolTrigger.rotation.x = triggerPull * 0.8;
      pistolSlide.position.copy(pistolSlide.userData.rest);
      pistolSlide.position.z -= motionNow.bolt * 0.045;
      pistolHand.group.position.copy(pistolHand.group.userData.rest);
      pistolHand.group.position.z -= motionNow.bolt * 0.02;
      pistolMag.position.copy(pistolMag.userData.rest);
      pistolMag.position.y -= motionNow.mag * 0.12;
      pistolSupport.pose({
        curl: 0.58 + motionNow.support * 0.12 - motionNow.mag * 0.2,
        thumbCurl: 0.42 + motionNow.mag * 0.4,
      });
      pistolSupport.group.position.copy(pistolSupport.group.userData.rest);
      pistolSupport.group.position.y -= motionNow.mag * 0.1;
    } else {
      knifeHand.pose({ curl: knifePose.curl, trigger: 0, thumbCurl: 0.46 + knifePose.curl * 0.12 });
      knifeHand.group.position.set(0.012, 0.002, -0.1 + knifePose.wrist);
    }
  }

  function placeViewmodel() {
    const fp = isFirstPerson();
    viewmodel.visible = fp;
    if (!fp) return;
    rifleView.visible = weapon === 'rifle';
    pistolView.visible = weapon === 'pistol';
    knifeView.visible = weapon === 'knife';
    const ready = equip * equip * (3 - 2 * equip);
    const dip = 1 - ready;
    const reload = reloadMotion();
    if (weapon === 'knife') knifePose = sampleKnife(swing > 0 ? KNIFE_TIME - swing : 0);
    poseFingers();

    if (weapon === 'knife') {
      _origin.set(knifePose.x, knifePose.y, knifePose.z);
      _dir.set(knifePose.dx, knifePose.dy, knifePose.dz);
    } else if (weapon === 'pistol') {
      _origin.set(0.30, -0.26, -0.32);
      _dir.set(0, 0, -1);
      _aim.copy(_origin).addScaledVector(_dir, PISTOL_MUZZLE_Z);
    } else {
      _origin.set(0.48, -0.36, -0.36);
      _dir.set(-0.1, -0.04, -0.99);
      _aim.copy(_origin).addScaledVector(_dir, RIFLE_MUZZLE_Z);
    }
    if (weapon === 'knife') {
      _origin.y -= dip * 0.22;
    } else {
      _origin.y -= dip * 0.26;
      _origin.z += dip * 0.08;
      _aim.y -= dip * 0.1;
      _origin.y -= reload.drop * 0.1;
      _origin.z += reload.drop * 0.05;
      _aim.y -= reload.drop * 0.16;
    }
    if (viewKick > 0) {
      _origin.z += viewKick;
      _origin.y += viewKick * 0.2;
      _aim.y += viewKick * 0.35;
    }
    applyBob(_origin);
    if (weapon === 'knife') {
      if (_dir.lengthSq() < 1e-8) _dir.set(0, 0.4, -1);
      _dir.normalize();
      _aim.copy(_origin).add(_dir);
    }
    viewmodel.position.copy(_origin);
    const roll = weapon === 'knife' ? knifePose.roll : weapon === 'rifle' ? RIFLE_ROLL : 0;
    aimQuat(_origin, _aim, roll, viewmodel.quaternion);
  }

  function tryFire() {
    if (!isFirstPerson() || gap > 0) return;
    if (weapon === 'knife') {
      gap = spec().gap;
      swing = KNIFE_TIME;
      knifeStruck = false;
      tone(460, 0.08, 0.07, 'sawtooth');
      return;
    }
    if (reloading) return;
    const item = spec();
    if (ammo[weapon] <= 0) {
      tryReload();
      return;
    }
    ammo[weapon] -= 1;
    gap = item.gap;
    const hit = aimShot(RANGE);
    flightDir.copy(hitPoint).sub(gunMuzzle);
    if (flightDir.lengthSq() < 1e-6) flightDir.copy(aim);
    flightDir.normalize();
    const mark = weapon === 'pistol' ? pistolMuzzle : rifleMuzzle;
    spawnShot(mark, item.flame, hitPoint, Boolean(hit), hitNormal);
    if (ammo[weapon] === 0) tryReload();
    paint();
  }

  function tryReload() {
    if (!isFirstPerson() || weapon === 'knife' || reloading) return;
    const item = spec();
    if (ammo[weapon] >= item.mag || reserve[weapon] <= 0) return;
    reloading = true;
    reloadDuration = item.reload;
    reloadLeft = item.reload;
    tone(220, 0.06, 0.1, 'triangle');
    paint();
  }

  function selectWeapon(next) {
    if (weapon === next) return;
    weapon = next;
    reloading = false;
    gap = 0;
    swing = 0;
    knifeStruck = false;
    equip = 0;
    dryPlayed = false;
    if (next !== 'knife' && ammo[next] === 0 && reserve[next] > 0) tryReload();
    paint();
  }

  domElement.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    holding = true;
    dryPlayed = false;
    tryFire();
  });
  addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    holding = false;
    dryPlayed = false;
  });
  addEventListener('blur', () => {
    holding = false;
  });
  addEventListener('keydown', (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Digit1') selectWeapon('rifle');
    else if (event.code === 'Digit2') selectWeapon('pistol');
    else if (event.code === 'Digit3') selectWeapon('knife');
    else if (event.code === 'KeyR') tryReload();
  });

  function update(dt, nextMotion = {}) {
    motion = {
      moving: Boolean(nextMotion.moving),
      running: Boolean(nextMotion.running),
      airborne: Boolean(nextMotion.airborne),
    };
    bob += dt * (motion.moving ? 8.5 : 1.6);
    gap = Math.max(0, gap - dt);
    equip = Math.min(1, equip + dt / 0.32);
    triggerPull = Math.max(0, triggerPull - dt * 7);
    shotSpread = Math.max(0, shotSpread - dt * 36);
    if (!isFirstPerson()) {
      holding = false;
      swing = 0;
      knifeStruck = false;
    } else if (holding && spec().auto) {
      tryFire();
    }
    if (swing > 0) {
      const prevSwing = swing;
      swing = Math.max(0, swing - dt);
      if (weapon === 'knife' && !knifeStruck) {
        const elapsed = KNIFE_TIME - swing;
        const prevElapsed = KNIFE_TIME - prevSwing;
        if (prevElapsed < KNIFE_HIT && elapsed >= KNIFE_HIT) {
          knifeStruck = true;
          const hit = aimShot(KNIFE_REACH);
          if (hit) spawnSlash(hitPoint, hitNormal);
        }
      }
    }
    if (viewKick > 0) viewKick = Math.max(0, viewKick - dt * 0.45);
    if (reloading) {
      reloadLeft -= dt;
      if (reloadLeft <= 0) {
        reloading = false;
        const item = spec();
        const take = Math.min(item.mag - ammo[weapon], reserve[weapon]);
        ammo[weapon] += take;
        reserve[weapon] -= take;
        tone(320, 0.05, 0.08, 'triangle');
      }
    }
    if (burstFrames > 0) {
      flashLight.intensity = burstFrames > 1 ? 24 : 6;
      burstFrames -= 1;
    } else {
      flashLight.intensity = 0;
    }
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      if (effect.burst) {
        effect.frames += 1;
        effect.mesh.material.opacity = effect.frames === 1 ? 1 : 0.4;
        if (effect.frames > 2) effect.life = 0;
      } else {
        effect.life -= dt;
        if (effect.tick) effect.tick(effect, dt);
        const fade = effect.hold ? 0.35 : effect.max;
        const left = effect.hold ? Math.min(effect.life, fade) : effect.life;
        effect.mesh.material.opacity = Math.max(0, left / fade);
      }
      if (effect.life <= 0) {
        effect.mesh.removeFromParent();
        effect.mesh.material.dispose();
        effects.splice(i, 1);
      }
    }
    if (recoil > 0) recoil = Math.max(0, recoil - dt * 0.55);
    placeViewmodel();
    paint();
  }

  function render(renderer) {
    if (!isFirstPerson()) return;
    viewCamera.fov = camera.fov;
    viewCamera.aspect = camera.aspect;
    viewCamera.updateProjectionMatrix();
    const prev = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(viewScene, viewCamera);
    renderer.autoClear = prev;
  }

  // 在第一人称相机摆好之后调用，只抖一下，不改准星朝向
  function kick() {
    if (recoil > 0 && isFirstPerson()) camera.rotateX(recoil);
  }

  paint();
  return {
    update,
    kick,
    render,
    crosshairGap() { return shotSpread; },
  };
}
