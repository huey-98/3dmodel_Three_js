import * as THREE from 'three';

// 按 .screenshots/cs_CT 的正面、背面、两侧和两个斜侧视角拼的 CT 干员。
// 面朝局部 +Z。外层 group 管位移、朝向和跳跃；胸腔组只管呼吸和走路扭转。

const UPPER = 0.3;
const FORE = 0.27;
const THIGH = 0.42;
const SHIN = 0.4;

const NAVY = 0x314e7a;
const NAVY_DEEP = 0x283f64;
const VEST = 0x2a3036;
const VEST_DARK = 0x1b1f24;
const BLACK = 0x171a1e;
const BOOT = 0x141618;
const SKIN = 0x8d5a3b;
const PAD = 0x32383f;
const RIFLE = 0x4a515a;
const RIFLE_DARK = 0x2b3036;
const METAL = 0x6a727c;

function canvasTex(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function plateTexture(fontPx) {
  return canvasTex(160, 72, (ctx, w, h) => {
    ctx.fillStyle = '#14171b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#8d939b';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    ctx.fillStyle = '#f4f5f7';
    ctx.font = `bold ${fontPx}px Arial, "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CT', w / 2, h / 2 + 1);
  });
}

function laceTexture() {
  return canvasTex(64, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#c5c6c2';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const y = 14 + i * 18;
      ctx.beginPath();
      ctx.moveTo(12, y);
      ctx.lineTo(w - 12, y + 10);
      ctx.moveTo(w - 12, y);
      ctx.lineTo(12, y + 10);
      ctx.stroke();
    }
  });
}

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.72,
    metalness: 0.04,
    ...extra,
  });
}

function mesh(geo, material, shadow = true) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = shadow;
  m.receiveShadow = false;
  return m;
}

function put(parent, geo, material, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) {
  const m = mesh(geo, material, shadow);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}

function alignBone(pivot, dir, hint) {
  const y = dir.clone().normalize().negate();
  const x = new THREE.Vector3().crossVectors(y, hint);
  if (x.lengthSq() < 1e-8) x.crossVectors(y, new THREE.Vector3(0, 0, 1));
  x.normalize();
  const z = new THREE.Vector3().crossVectors(x, y).normalize();
  pivot.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

// 两段骨骼：肩、肘的局部 -Y 顺着骨头。pole 把肘往外撑。
function poseArm(shoulder, elbow, target, pole) {
  const origin = shoulder.position;
  const to = new THREE.Vector3().subVectors(target, origin);
  const reach = UPPER + FORE - 0.001;
  const dist = THREE.MathUtils.clamp(to.length(), Math.abs(UPPER - FORE) + 0.001, reach);
  const dir = to.normalize();
  const hand = origin.clone().addScaledVector(dir, dist);
  const cosA = THREE.MathUtils.clamp(
    (UPPER * UPPER + dist * dist - FORE * FORE) / (2 * UPPER * dist),
    -1,
    1,
  );
  const theta = Math.acos(cosA);
  const poleDir = pole.clone().sub(origin);
  const side = new THREE.Vector3().crossVectors(dir, poleDir);
  if (side.lengthSq() < 1e-8) side.set(0, 0, 1);
  side.normalize();
  let bend = new THREE.Vector3().crossVectors(side, dir).normalize();
  if (bend.dot(poleDir) < 0) bend.negate();
  const upperDir = dir.clone().multiplyScalar(Math.cos(theta)).addScaledVector(bend, Math.sin(theta));
  const elbowPos = origin.clone().addScaledVector(upperDir, UPPER);
  const foreDir = hand.clone().sub(elbowPos).normalize();
  alignBone(shoulder, upperDir, poleDir);
  const inv = shoulder.quaternion.clone().invert();
  alignBone(elbow, foreDir.clone().applyQuaternion(inv), poleDir.clone().normalize().applyQuaternion(inv));
  return elbowPos;
}

function buildLeg(rig, materials, side) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.12, 0.92, 0);
  hip.rotation.y = side * 0.06;
  rig.add(hip);

  put(hip, new THREE.BoxGeometry(0.17, THIGH + 0.08, 0.17), materials.pants, 0, -THIGH / 2 + 0.03, 0);
  put(hip, new THREE.BoxGeometry(0.17, 0.035, 0.17), materials.black, 0, -0.33, 0);
  put(
    hip,
    new THREE.BoxGeometry(0.025, 0.11, 0.09),
    materials.vestDark,
    side * 0.09,
    -0.16,
    0.02,
  );
  if (side < 0) {
    put(hip, new THREE.BoxGeometry(0.07, 0.13, 0.05), materials.vest, -0.02, -0.2, 0.1);
  }

  const knee = new THREE.Group();
  knee.position.set(0, -THIGH, 0);
  hip.add(knee);
  put(knee, new THREE.BoxGeometry(0.15, SHIN + 0.06, 0.15), materials.pants, 0, -SHIN / 2 + 0.03, 0);
  const pad = put(knee, new THREE.SphereGeometry(0.062, 14, 12), materials.pad, 0, 0.01, 0.075);
  pad.scale.set(1.15, 1.35, 0.55);
  put(knee, new THREE.BoxGeometry(0.15, 0.1, 0.03), materials.pad, 0, 0, 0.07);

  const ankle = new THREE.Group();
  ankle.position.set(0, -SHIN + 0.012, 0);
  knee.add(ankle);
  put(ankle, new THREE.BoxGeometry(0.13, 0.16, 0.14), materials.boot, 0, -0.01, 0.01);
  put(ankle, new THREE.BoxGeometry(0.135, 0.07, 0.26), materials.boot, 0, -0.06, 0.07);
  put(ankle, new THREE.BoxGeometry(0.125, 0.05, 0.08), materials.boot, 0, -0.05, 0.18);
  put(ankle, new THREE.BoxGeometry(0.145, 0.025, 0.28), materials.black, 0, -0.09, 0.06);
  const laces = put(
    ankle,
    new THREE.PlaneGeometry(0.055, 0.12),
    materials.lace,
    0,
    -0.02,
    0.2,
    -0.7,
    0,
    0,
    false,
  );
  laces.renderOrder = 2;

  return { hip, knee, ankle };
}

function buildTorso(chest, materials) {
  put(chest, new THREE.BoxGeometry(0.36, 0.16, 0.22), materials.pants, 0, 0.98, 0);
  put(chest, new THREE.BoxGeometry(0.4, 0.2, 0.24), materials.navy, 0, 1.14, 0.01);
  put(chest, new THREE.BoxGeometry(0.5, 0.28, 0.26), materials.navy, 0, 1.34, 0);
  put(chest, new THREE.BoxGeometry(0.4, 0.06, 0.24), materials.black, 0, 0.96, 0.01);
  put(chest, new THREE.BoxGeometry(0.08, 0.05, 0.02), materials.buckle, 0, 0.96, 0.135);

  put(chest, new THREE.BoxGeometry(0.42, 0.34, 0.08), materials.vest, 0, 1.24, 0.15);
  put(chest, new THREE.BoxGeometry(0.36, 0.32, 0.04), materials.vestDark, 0, 1.22, -0.15);
  for (let i = 0; i < 4; i++) {
    put(chest, new THREE.BoxGeometry(0.3, 0.038, 0.02), materials.vest, 0, 1.12 + i * 0.055, -0.175);
  }
  for (const i of [-1, 0, 1]) {
    put(chest, new THREE.BoxGeometry(0.09, 0.075, 0.04), materials.vestDark, i * 0.11, 1.12, 0.205);
  }
  put(chest, new THREE.BoxGeometry(0.07, 0.12, 0.07), materials.vestDark, -0.23, 1.04, 0.06);
  put(chest, new THREE.BoxGeometry(0.065, 0.1, 0.06), materials.vestDark, 0.23, 1.02, 0.05);
  for (const side of [-1, 1]) {
    const strap = put(chest, new THREE.BoxGeometry(0.055, 0.2, 0.035), materials.vest, side * 0.16, 1.44, 0.04);
    strap.rotation.z = side * -0.4;
    strap.rotation.x = 0.2;
    put(chest, new THREE.SphereGeometry(0.085, 12, 10), materials.navy, side * 0.28, 1.4, 0);
  }

  const plate = put(chest, new THREE.PlaneGeometry(0.15, 0.062), materials.plate, 0, 1.34, 0.196, 0, 0, 0, false);
  plate.renderOrder = 2;

  put(chest, new THREE.CylinderGeometry(0.065, 0.08, 0.1, 16), materials.navy, 0, 1.52, 0.01);
  put(chest, new THREE.BoxGeometry(0.11, 0.08, 0.03), materials.navy, 0, 1.54, 0.07);
  put(chest, new THREE.BoxGeometry(0.06, 0.045, 0.03), materials.skin, 0, 1.56, -0.055);
}

function buildHead(chest, materials) {
  const head = put(chest, new THREE.SphereGeometry(0.118, 24, 18), materials.black, 0, 1.64, 0.02);
  head.scale.set(0.98, 1.12, 1.02);
  const shell = put(
    chest,
    new THREE.SphereGeometry(0.146, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
    materials.helmet,
    0,
    1.72,
    -0.02,
  );
  shell.scale.set(1.08, 0.92, 1.05);
  put(chest, new THREE.BoxGeometry(0.06, 0.016, 0.09), materials.helmet, 0, 1.845, 0.01);
  put(chest, new THREE.BoxGeometry(0.2, 0.086, 0.03), materials.black, 0, 1.64, 0.12);
  put(chest, new THREE.BoxGeometry(0.172, 0.07, 0.04), materials.visor, 0, 1.64, 0.145, 0, 0, 0, false);
  put(chest, new THREE.BoxGeometry(0.13, 0.016, 0.012), materials.shine, 0, 1.658, 0.168, 0, 0, 0, false);
  for (const side of [-1, 1]) {
    const ear = put(chest, new THREE.SphereGeometry(0.052, 14, 12), materials.helmet, side * 0.145, 1.645, 0.02);
    ear.scale.set(0.7, 1.05, 0.95);
    put(chest, new THREE.BoxGeometry(0.035, 0.06, 0.08), materials.visor, side * 0.1, 1.64, 0.09, 0, 0, 0, false);
  }
}

function buildRifle(chest, materials) {
  const weapon = new THREE.Group();
  chest.add(weapon);
  const rifle = new THREE.Group();
  weapon.add(rifle);

  const barrel = new THREE.Vector3(0.62, -0.18, 0.68).normalize();
  const upHint = new THREE.Vector3(0, 1, 0);
  const y = upHint.clone().addScaledVector(barrel, -upHint.dot(barrel)).normalize();
  const z = new THREE.Vector3().crossVectors(barrel, y).normalize();
  rifle.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(barrel, y, z));
  rifle.position.set(0.0, 1.2, 0.2);

  put(rifle, new THREE.BoxGeometry(0.018, 0.11, 0.044), materials.metal, -0.3, 0.02, 0);
  put(rifle, new THREE.BoxGeometry(0.15, 0.058, 0.04), materials.wood, -0.21, 0.028, 0);
  put(rifle, new THREE.BoxGeometry(0.07, 0.04, 0.032), materials.wood, -0.1, 0.036, 0);
  put(rifle, new THREE.BoxGeometry(0.2, 0.068, 0.048), materials.rifle, 0.02, 0.046, 0);
  put(rifle, new THREE.BoxGeometry(0.13, 0.016, 0.04), materials.rifleDark, -0.005, 0.086, 0);
  put(rifle, new THREE.BoxGeometry(0.022, 0.032, 0.02), materials.metal, 0.09, 0.108, 0);
  put(rifle, new THREE.BoxGeometry(0.02, 0.016, 0.018), materials.metal, 0.02, 0.05, -0.032);
  put(rifle, new THREE.BoxGeometry(0.038, 0.09, 0.034), materials.wood, -0.035, -0.015, 0, 0, 0, -0.42);
  put(rifle, new THREE.BoxGeometry(0.045, 0.012, 0.03), materials.metal, 0.01, -0.002, 0);
  put(rifle, new THREE.BoxGeometry(0.055, 0.09, 0.048), materials.rifleDark, 0.04, -0.02, 0, 0, 0, 0.12);
  put(rifle, new THREE.BoxGeometry(0.048, 0.08, 0.044), materials.rifleDark, 0.07, -0.075, 0, 0, 0, 0.42);
  put(rifle, new THREE.BoxGeometry(0.18, 0.058, 0.048), materials.wood, 0.2, 0.04, 0);
  const gas = put(rifle, new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), materials.metal, 0.18, 0.074, 0);
  gas.rotation.z = Math.PI / 2;
  put(rifle, new THREE.BoxGeometry(0.024, 0.032, 0.032), materials.rifleDark, 0.3, 0.055, 0);
  const bore = put(rifle, new THREE.CylinderGeometry(0.012, 0.011, 0.38, 8), materials.metal, 0.36, 0.048, 0);
  bore.rotation.z = Math.PI / 2;
  put(rifle, new THREE.BoxGeometry(0.032, 0.032, 0.03), materials.rifleDark, 0.5, 0.068, 0);
  const muzzle = put(rifle, new THREE.CylinderGeometry(0.015, 0.013, 0.04, 8), materials.metal, 0.56, 0.048, 0);
  muzzle.rotation.z = Math.PI / 2;

  const grip = new THREE.Object3D();
  grip.position.set(-0.02, -0.04, 0);
  rifle.add(grip);
  const support = new THREE.Object3D();
  support.position.set(0.24, 0.01, 0);
  rifle.add(support);

  const gloveGeo = new THREE.BoxGeometry(0.09, 0.08, 0.08);
  put(rifle, gloveGeo, materials.glove, -0.02, -0.055, 0.01);
  put(rifle, gloveGeo, materials.glove, 0.24, -0.01, 0.015);

  return { weapon, grip, support };
}

function buildArms(chest, materials, grip, support) {
  chest.updateMatrixWorld(true);
  const gripAt = chest.worldToLocal(grip.getWorldPosition(new THREE.Vector3()));
  const supportAt = chest.worldToLocal(support.getWorldPosition(new THREE.Vector3()));

  function arm(side, target, pole) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.3, 1.4, 0.02);
    chest.add(shoulder);
    put(shoulder, new THREE.BoxGeometry(0.135, UPPER + 0.04, 0.135), materials.navy, 0, -UPPER / 2 + 0.02, 0);
    const elbow = new THREE.Group();
    elbow.position.set(0, -UPPER, 0);
    shoulder.add(elbow);
    put(elbow, new THREE.BoxGeometry(0.115, FORE + 0.05, 0.115), materials.navyDeep, 0, -FORE / 2 + 0.02, 0);
    poseArm(shoulder, elbow, target, pole);
    put(elbow, new THREE.SphereGeometry(0.055, 10, 8), materials.navy, 0, 0.01, 0);
    shoulder.updateMatrixWorld(true);
    const shoulderAt = new THREE.Vector3();
    const elbowAt = new THREE.Vector3();
    shoulder.getWorldPosition(shoulderAt);
    elbow.getWorldPosition(elbowAt);
    const outward = new THREE.Vector3(side, 0, 0).transformDirection(chest.matrixWorld);
    const patchAt = shoulderAt.clone().lerp(elbowAt, 0.42).addScaledVector(outward, 0.078);
    const patch = put(shoulder, new THREE.BoxGeometry(0.012, 0.05, 0.07), materials.plate, 0, 0, 0, 0, 0, 0, false);
    shoulder.worldToLocal(patchAt);
    patch.position.copy(patchAt);
    const localOut = outward.clone().transformDirection(new THREE.Matrix4().copy(shoulder.matrixWorld).invert());
    const yAxis = new THREE.Vector3(0, 1, 0);
    let xAxis = new THREE.Vector3().crossVectors(yAxis, localOut);
    if (xAxis.lengthSq() < 1e-8) xAxis.set(0, 0, 1);
    xAxis.normalize();
    const zAxis = new THREE.Vector3().crossVectors(localOut, xAxis).normalize();
    patch.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(localOut, zAxis, xAxis));
    return { shoulder, elbow };
  }

  const right = arm(-1, gripAt, new THREE.Vector3(-0.9, 1.05, -0.15));
  const left = arm(1, supportAt, new THREE.Vector3(0.95, 1.15, -0.2));
  return { right, left };
}

export const CHAR_SCALE = 0.9;

export function createCtOperator() {
  const group = new THREE.Group();
  group.scale.setScalar(CHAR_SCALE);
  const rig = new THREE.Group();
  const chest = new THREE.Group();
  group.add(rig);
  rig.add(chest);

  const materials = {
    navy: mat(NAVY, { roughness: 0.84 }),
    navyDeep: mat(NAVY_DEEP, { roughness: 0.86 }),
    pants: mat(0x2a4368, { roughness: 0.88 }),
    vest: mat(VEST, { roughness: 0.78 }),
    vestDark: mat(VEST_DARK, { roughness: 0.8 }),
    black: mat(BLACK, { roughness: 0.62, metalness: 0.08 }),
    boot: mat(BOOT, { roughness: 0.55, metalness: 0.12 }),
    helmet: mat(0x23272d, { roughness: 0.38, metalness: 0.42 }),
    skin: mat(SKIN, { roughness: 0.72 }),
    pad: mat(PAD, { roughness: 0.64, metalness: 0.08 }),
    rifle: mat(RIFLE, { roughness: 0.4, metalness: 0.62 }),
    rifleDark: mat(RIFLE_DARK, { roughness: 0.46, metalness: 0.5 }),
    wood: mat(0x7a4326, { roughness: 0.82, metalness: 0.02 }),
    metal: mat(METAL, { roughness: 0.28, metalness: 0.78 }),
    glove: mat(0x1a1d21, { roughness: 0.7 }),
    buckle: mat(0x8a9098, { roughness: 0.32, metalness: 0.7 }),
    visor: mat(0x2f6d8c, {
      roughness: 0.14,
      metalness: 0.72,
      emissive: 0x1a5678,
      emissiveIntensity: 0.4,
    }),
    shine: mat(0xb7d4e4, {
      roughness: 0.1,
      metalness: 0.4,
      emissive: 0x9ec6dc,
      emissiveIntensity: 0.7,
    }),
    plate: new THREE.MeshStandardMaterial({
      map: plateTexture(42),
      roughness: 0.55,
      metalness: 0.08,
    }),
    lace: new THREE.MeshStandardMaterial({
      map: laceTexture(),
      transparent: true,
      alphaTest: 0.4,
      roughness: 0.6,
    }),
  };

  const legL = buildLeg(rig, materials, -1);
  const legR = buildLeg(rig, materials, 1);
  buildTorso(chest, materials);
  buildHead(chest, materials);
  const rifle = buildRifle(chest, materials);
  buildArms(chest, materials, rifle.grip, rifle.support);

  let phase = 0;
  let swing = 0;
  let time = 0;

  function update(dt, moving) {
    time += dt;
    const targetAmp = moving ? 0.62 : 0;
    swing += (targetAmp - swing) * Math.min(dt * 10, 1);
    if (moving) phase += dt * 9;
    const s = Math.sin(phase) * swing;
    const bend = (v) => Math.max(0, v) * 0.8;
    legL.hip.rotation.x = s;
    legR.hip.rotation.x = -s;
    const kneeL = bend(s);
    const kneeR = bend(-s);
    legL.knee.rotation.x = kneeL;
    legR.knee.rotation.x = kneeR;
    legL.ankle.rotation.x = -(s + kneeL);
    legR.ankle.rotation.x = -(-s + kneeR);
    const bob = moving
      ? Math.abs(Math.cos(phase)) * 0.035 * (swing / 0.62)
      : (Math.sin(time * 1.7) * 0.5 + 0.5) * 0.008;
    chest.position.y = bob;
    chest.rotation.y = s * 0.12;
    rifle.weapon.rotation.x = Math.sin(time * (moving ? 9 : 1.7)) * (moving ? 0.02 * swing : 0.008);
  }

  return { group, update };
}
