import * as THREE from 'three';
import { canvasTex } from './canvasTex.js';

// CS T 方的公共角色模块。面朝局部 +Z，原点在脚底，单位为米。
// 该模块只负责角色外观和基础待机/走路动画，不依赖具体地图。

export const CHAR_SCALE = 1;

const UPPER_ARM = 0.28;
const FOREARM = 0.25;
const THIGH = 0.43;
const SHIN = 0.39;

const OLIVE = 0x4b542d;
const OLIVE_DARK = 0x30391f;
const VEST = 0x3c4529;
const VEST_DARK = 0x252d1a;
const RED_SHIRT = 0x6b4a46;
const SKIN = 0x9d6848;
const GLOVE = 0x171a18;
const BOOT = 0x241f18;
const BOOT_SOLE = 0x111310;
const METAL = 0x656b68;

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.03,
    ...extra,
  });
}

function mesh(geometry, material, shadow = true) {
  const result = new THREE.Mesh(geometry, material);
  result.castShadow = shadow;
  result.receiveShadow = false;
  return result;
}

function put(parent, geometry, material, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) {
  const result = mesh(geometry, material, shadow);
  result.position.set(x, y, z);
  result.rotation.set(rx, ry, rz);
  parent.add(result);
  return result;
}

function plaidTexture() {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#76534f';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#3d302f';
    for (let x = 8; x < w; x += 22) ctx.fillRect(x, 0, 7, h);
    for (let y = 10; y < h; y += 22) ctx.fillRect(0, y, w, 7);
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = '#bc8880';
    for (let x = 17; x < w; x += 22) ctx.fillRect(x, 0, 3, h);
    for (let y = 19; y < h; y += 22) ctx.fillRect(0, y, w, 3);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#f0c4b7';
    for (let x = 0; x < w; x += 11) ctx.fillRect(x, 0, 2, h);
    ctx.globalAlpha = 1;
  });
}

function camoTexture() {
  return canvasTex(160, 160, (ctx, w, h) => {
    ctx.fillStyle = '#555b32';
    ctx.fillRect(0, 0, w, h);
    const shapes = [
      ['#303820', 0, 5, 48, 28],
      ['#777344', 36, 0, 38, 31],
      ['#454b29', 92, 10, 56, 30],
      ['#2b351e', 6, 57, 54, 36],
      ['#817447', 63, 47, 34, 35],
      ['#343e23', 111, 60, 43, 45],
      ['#777045', 17, 113, 46, 37],
      ['#2b351f', 76, 101, 46, 50],
      ['#68633a', 125, 120, 35, 40],
    ];
    for (const [color, x, y, sw, sh] of shapes) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, y + sh * 0.25);
      ctx.lineTo(x + sw * 0.25, y);
      ctx.lineTo(x + sw, y + sh * 0.18);
      ctx.lineTo(x + sw * 0.75, y + sh);
      ctx.lineTo(x + sw * 0.12, y + sh * 0.82);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function balaclavaTexture() {
  return canvasTex(96, 128, (ctx, w, h) => {
    ctx.fillStyle = '#394126';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#626b3d';
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    for (let x = -h; x < w + h; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h * 0.32, h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function buildLeg(rig, materials, side) {
  const hip = new THREE.Group();
  hip.position.set(side * 0.115, 0.89, 0);
  rig.add(hip);
  put(hip, new THREE.BoxGeometry(0.18, THIGH, 0.18), materials.pants, 0, -THIGH / 2, 0);
  put(hip, new THREE.BoxGeometry(0.2, 0.04, 0.2), materials.belt, 0, -0.06, 0.02);

  const cargo = put(
    hip,
    new THREE.BoxGeometry(0.11, 0.16, 0.08),
    materials.pantsDark,
    side * 0.09,
    -0.2,
    0.035,
  );
  cargo.rotation.z = side * -0.08;
  put(hip, new THREE.BoxGeometry(0.07, 0.025, 0.012), materials.vestDark, side * 0.09, -0.14, 0.08);

  const knee = new THREE.Group();
  knee.position.set(0, -THIGH + 0.01, 0);
  hip.add(knee);
  put(knee, new THREE.BoxGeometry(0.17, SHIN, 0.17), materials.pants, 0, -SHIN / 2, 0);
  put(knee, new THREE.BoxGeometry(0.18, 0.11, 0.035), materials.pantsDark, 0, -0.03, 0.09);

  const ankle = new THREE.Group();
  ankle.position.set(0, -SHIN + 0.015, 0);
  knee.add(ankle);
  put(ankle, new THREE.BoxGeometry(0.14, 0.17, 0.15), materials.boot, 0, -0.015, 0.01);
  put(ankle, new THREE.BoxGeometry(0.145, 0.08, 0.28), materials.boot, 0, -0.075, 0.08);
  put(ankle, new THREE.BoxGeometry(0.15, 0.025, 0.3), materials.bootSole, 0, -0.12, 0.08);
  put(ankle, new THREE.BoxGeometry(0.06, 0.012, 0.13), materials.metal, 0, 0.02, 0.17);

  return { hip, knee, ankle };
}

function buildTorso(chest, materials) {
  put(chest, new THREE.BoxGeometry(0.38, 0.18, 0.24), materials.shirt, 0, 0.91, 0);
  put(chest, new THREE.BoxGeometry(0.43, 0.32, 0.26), materials.shirt, 0, 1.14, 0);
  put(chest, new THREE.BoxGeometry(0.38, 0.07, 0.25), materials.shirt, 0, 1.34, 0);

  // 头套和躯干之间的衬衫领口/脖子，避免头部像悬空一样直接接在背心上。
  put(chest, new THREE.CylinderGeometry(0.08, 0.095, 0.09, 14), materials.shirt, 0, 1.42, 0);

  // 背心前后片和肩带。
  put(chest, new THREE.BoxGeometry(0.42, 0.37, 0.075), materials.vest, 0, 1.2, 0.15);
  put(chest, new THREE.BoxGeometry(0.4, 0.35, 0.055), materials.vestDark, 0, 1.2, -0.15);
  for (const side of [-1, 1]) {
    const strap = put(chest, new THREE.BoxGeometry(0.055, 0.36, 0.05), materials.vest, side * 0.15, 1.27, 0.03);
    strap.rotation.z = side * -0.08;
  }

  // 衣领、腰带和胸前四个弹匣袋。
  put(chest, new THREE.BoxGeometry(0.12, 0.06, 0.03), materials.shirt, -0.085, 1.4, 0.11, 0.2, 0, -0.2);
  put(chest, new THREE.BoxGeometry(0.12, 0.06, 0.03), materials.shirt, 0.085, 1.4, 0.11, -0.2, 0, 0.2);
  put(chest, new THREE.BoxGeometry(0.41, 0.055, 0.27), materials.belt, 0, 0.94, 0.01);
  put(chest, new THREE.BoxGeometry(0.07, 0.07, 0.03), materials.buckle, 0, 0.94, 0.15);
  for (const x of [-0.16, -0.055, 0.055, 0.16]) {
    put(chest, new THREE.BoxGeometry(0.085, 0.11, 0.07), materials.pouch, x, 1.12, 0.205);
    put(chest, new THREE.BoxGeometry(0.06, 0.018, 0.012), materials.buckle, x, 1.16, 0.243);
  }
  for (const side of [-1, 1]) {
    put(chest, new THREE.BoxGeometry(0.1, 0.16, 0.09), materials.pouch, side * 0.235, 0.99, 0.03);
    put(chest, new THREE.BoxGeometry(0.07, 0.018, 0.012), materials.buckle, side * 0.235, 1.035, 0.08);
  }
}

function buildHead(chest, materials) {
  const face = put(chest, new THREE.SphereGeometry(0.16, 24, 18), materials.balaclava, 0, 1.7, 0.01);
  face.scale.set(0.95, 1.12, 0.94);

  // 面罩开口：深色底、裸露的眼睛和嘴，保持参考图的轮廓识别度。
  put(chest, new THREE.BoxGeometry(0.235, 0.105, 0.018), materials.faceOpening, 0, 1.71, 0.145);
  for (const side of [-1, 1]) {
    put(chest, new THREE.BoxGeometry(0.075, 0.035, 0.012), materials.skin, side * 0.062, 1.725, 0.158);
    put(chest, new THREE.SphereGeometry(0.012, 10, 8), materials.eye, side * 0.062, 1.725, 0.169);
  }
  put(chest, new THREE.BoxGeometry(0.07, 0.028, 0.014), materials.skin, 0, 1.635, 0.158);
  put(chest, new THREE.BoxGeometry(0.09, 0.022, 0.012), materials.balaclavaDark, 0, 1.61, 0.157);
  put(chest, new THREE.BoxGeometry(0.16, 0.025, 0.02), materials.balaclava, 0, 1.855, 0.02);
}

function buildArms(chest, materials) {
  // 双臂自然垂直下垂，贴近身体两侧；不绑定武器，也不在走路时抬臂。
  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.28, 1.34, -0.005);
    chest.add(shoulder);
    put(shoulder, new THREE.BoxGeometry(0.14, UPPER_ARM + 0.035, 0.14), materials.shirt, 0, -UPPER_ARM / 2, 0);

    const elbow = new THREE.Group();
    elbow.position.set(0, -UPPER_ARM, 0);
    shoulder.add(elbow);
    put(elbow, new THREE.BoxGeometry(0.12, 0.05, 0.13), materials.glove, 0, 0.015, 0);
    put(elbow, new THREE.BoxGeometry(0.115, FOREARM, 0.115), materials.skin, 0, -FOREARM / 2, 0);
    put(elbow, new THREE.BoxGeometry(0.12, 0.08, 0.12), materials.glove, 0, -FOREARM + 0.02, 0);
    return { shoulder, elbow };
  }

  const right = arm(-1);
  const left = arm(1);
  return { right, left };
}

const textureSet = {
  shirt: plaidTexture(),
  pants: camoTexture(),
  balaclava: balaclavaTexture(),
};

const materialSets = new Map();
function createMaterials() {
  if (materialSets.has('default')) return materialSets.get('default');
  const materials = {
    shirt: mat(RED_SHIRT, { map: textureSet.shirt, roughness: 0.95 }),
    pants: mat(0x59603a, { map: textureSet.pants, roughness: 0.95 }),
    pantsDark: mat(0x3c4327, { map: textureSet.pants, roughness: 0.96 }),
    balaclava: mat(OLIVE, { map: textureSet.balaclava, roughness: 1 }),
    balaclavaDark: mat(OLIVE_DARK, { roughness: 1 }),
    faceOpening: mat(0x17130f, { roughness: 1 }),
    eye: mat(0x14110c, { roughness: 0.35 }),
    skin: mat(SKIN, { roughness: 0.85 }),
    vest: mat(VEST, { roughness: 0.9 }),
    vestDark: mat(VEST_DARK, { roughness: 0.92 }),
    pouch: mat(0x4a522e, { roughness: 0.93 }),
    belt: mat(0x242b1b, { roughness: 0.9 }),
    buckle: mat(0x71745e, { roughness: 0.48, metalness: 0.45 }),
    glove: mat(GLOVE, { roughness: 0.72 }),
    boot: mat(BOOT, { roughness: 0.78 }),
    bootSole: mat(BOOT_SOLE, { roughness: 0.9 }),
    metal: mat(METAL, { roughness: 0.35, metalness: 0.7 }),
  };
  materialSets.set('default', materials);
  return materials;
}

export function createCsT() {
  const group = new THREE.Group();
  group.scale.setScalar(CHAR_SCALE);
  const rig = new THREE.Group();
  const chest = new THREE.Group();
  const body = new THREE.Group();
  group.add(rig);
  rig.add(chest);
  // 躯干略微上提，让衣领贴近头部，同时保持脚底和头部高度不变。
  body.position.y = 0.055;
  chest.add(body);

  const materials = createMaterials();
  const legL = buildLeg(rig, materials, -1);
  const legR = buildLeg(rig, materials, 1);
  buildTorso(body, materials);
  buildHead(chest, materials);
  const arms = buildArms(body, materials);

  let phase = 0;
  let swing = 0;
  let time = 0;

  function update(dt, moving = false) {
    time += dt;
    const targetSwing = moving ? 0.58 : 0;
    swing += (targetSwing - swing) * Math.min(dt * 10, 1);
    if (moving) phase += dt * 9;
    const stride = Math.sin(phase) * swing;
    const bend = (value) => Math.max(0, value) * 0.75;
    const kneeL = bend(stride);
    const kneeR = bend(-stride);
    legL.hip.rotation.x = stride;
    legR.hip.rotation.x = -stride;
    legL.knee.rotation.x = kneeL;
    legR.knee.rotation.x = kneeR;
    legL.ankle.rotation.x = -(stride + kneeL);
    legR.ankle.rotation.x = -(-stride + kneeR);

    const bob = moving
      ? Math.abs(Math.cos(phase)) * 0.028 * (swing / 0.58)
      : (Math.sin(time * 1.6) * 0.5 + 0.5) * 0.006;
    chest.position.y = bob;
    chest.rotation.y = stride * 0.08;
  }

  return {
    group,
    update,
    rig,
    chest,
    body,
    legL,
    legR,
    arms,
  };
}

// 语义化别名，方便其他地图按“恐怖分子”角色来引用。
export const createTerrorist = createCsT;
