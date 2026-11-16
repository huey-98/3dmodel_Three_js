import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createBuilding, WALL_RECTS, DOOR_GAP, DOOR_ANCHOR,
  INSIDE_POINT, OUTSIDE_POINT, STAIRS, STAIR_RAILS, INTERIOR, FLOOR_H,
} from './building.js';
import { createEnvironment, ENV_RECTS } from './environment.js';
import { createInterior } from './interior.js';
import { createPerson } from './person.js';

// ---------- 场景 / 相机 / 渲染器 ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 70, 190);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(19, 12, 33);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

// ---------- 光照 ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0x7cb35c, 0.7));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.8);
sun.position.set(28, 45, 22);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.far = 120;
sun.shadow.bias = -0.0005;
scene.add(sun);

// ---------- 环境 / 楼房 / 室内 ----------
const environment = createEnvironment();
scene.add(environment.group);

const building = createBuilding();
scene.add(building.group);
scene.add(createInterior());

// ---------- 人物 ----------
const person = createPerson();
person.group.position.set(4, 0, 12);
scene.add(person.group);

// ---------- 鼠标视角控制 ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(4, 1.2, 12);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 3;
controls.maxDistance = 70;

// ---------- 键盘输入 ----------
const keys = new Set();
let jumpRequested = false;     // 空格起跳
let interactRequested = false; // F 开关门
let enterRequested = false;    // G 进屋/出门
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (e.code === 'Space') jumpRequested = true;
  if (e.code === 'KeyF') interactRequested = true;
  if (e.code === 'KeyG') enterRequested = true;
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- 碰撞检测 ----------
const SOLIDS = [...WALL_RECTS, ...ENV_RECTS, ...STAIR_RAILS];
const inside = (x, z, r) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;
let doorOpen = false;

function isBlocked(x, z) {
  for (const r of SOLIDS) {
    if (inside(x, z, r)) return true;
  }
  // 门口通道：门关着时不能进屋
  if (!doorOpen && inside(x, z, DOOR_GAP)) return true;
  return false;
}

// ---------- 跳跃物理 ----------
const GRAVITY = 24;    // 重力加速度
const JUMP_SPEED = 8;  // 起跳初速度
let jumpVel = 0;       // 垂直速度
let jumpOffset = 0;    // 相对地面的跳跃高度
let grounded = true;   // 是否站在地面

// ---------- 楼层与楼梯 ----------
let floorIndex = 0;    // 当前所在楼层：0 一层 / 1 二层 / 2 三层
let lastRamp = null;   // 上一次踩到的楼梯段
let lastT = 0;         // 楼梯上的进度（0 底部 → 1 顶部）

// 返回 (x,z) 处的地面高度；踩在楼梯上时按坡度插值
function resolveGroundY(x, z) {
  for (const s of STAIRS) {
    if (s.from !== floorIndex && s.to !== floorIndex) continue;
    if (x < s.xMin || x > s.xMax) continue;
    if (z < Math.min(s.z0, s.z1) || z > Math.max(s.z0, s.z1)) continue;
    const t = THREE.MathUtils.clamp((z - s.z0) / (s.z1 - s.z0), 0, 1);
    lastRamp = s;
    lastT = t;
    return s.y0 + (s.y1 - s.y0) * t;
  }
  // 离开楼梯：按上楼梯的位置决定落到哪一层
  if (lastRamp) {
    floorIndex = lastT >= 0.5 ? lastRamp.to : lastRamp.from;
    lastRamp = null;
  }
  return floorIndex * FLOOR_H;
}

// ---------- 自动寻路（进屋/出门） ----------
const autoPath = [];
let autoDone = null;

function startAutoMove(points, onDone) {
  autoPath.length = 0;
  for (const p of points) autoPath.push(p.clone());
  autoDone = onDone || null;
}

const DOOR_OUTSIDE = new THREE.Vector3(DOOR_ANCHOR.x, 0, DOOR_ANCHOR.z);

// 相机机位：进屋后切到屋内视角，出门后切回屋外
function focusCamera(ox, oy, oz) {
  const p = person.group.position;
  camera.position.set(p.x + ox, p.y + oy, p.z + oz);
  controls.target.set(p.x, p.y + 1.2, p.z);
  controls.update();
}

// ---------- 交互提示 ----------
const promptEl = document.getElementById('prompt');
const floorEl = document.getElementById('floor');

// ---------- 主循环 ----------
const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const followTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const p = person.group.position;

  // 读取键盘输入：方向键为固定世界方向，WASD 相对相机朝向
  const arrowX = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  const arrowZ = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
  const wasdX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const wasdZ = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
  const worldDir = arrowX !== 0 || arrowZ !== 0;
  const ix = worldDir ? arrowX : wasdX;
  const iz = worldDir ? arrowZ : wasdZ;
  const manual = ix !== 0 || iz !== 0;
  // 玩家按键接管，自动寻路中断
  if (manual && autoPath.length) {
    autoPath.length = 0;
    autoDone = null;
  }

  // 决定移动方向
  let moving = false;
  let speed = 3.5;
  if (autoPath.length) {
    const wp = autoPath[0];
    const dx = wp.x - p.x;
    const dz = wp.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.18) {
      autoPath.shift();
      if (!autoPath.length) {
        const cb = autoDone;
        autoDone = null;
        if (cb) cb();
      }
    } else {
      move.set(dx / dist, 0, dz / dist);
      moving = true;
      speed = 2.4;
    }
  } else if (manual) {
    if (worldDir) {
      // 固定世界方向
      move.set(ix, 0, iz).normalize();
    } else {
      // 相对相机朝向：W 永远朝屏幕里走
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, camera.up).normalize();
      move
        .copy(forward)
        .multiplyScalar(-iz)
        .addScaledVector(right, ix)
        .normalize();
    }
    moving = true;
    if (keys.has('ShiftLeft') || keys.has('ShiftRight')) speed = 7;
  }

  if (moving) {
    const nx = p.x + move.x * speed * dt;
    const nz = p.z + move.z * speed * dt;
    // 撞墙时尝试沿单轴滑动
    if (!isBlocked(nx, nz)) {
      p.x = nx;
      p.z = nz;
    } else if (!isBlocked(nx, p.z)) {
      p.x = nx;
    } else if (!isBlocked(p.x, nz)) {
      p.z = nz;
    }
    p.x = THREE.MathUtils.clamp(p.x, -100, 100);
    p.z = THREE.MathUtils.clamp(p.z, -100, 100);
    // 转身面向移动方向
    person.group.rotation.y = Math.atan2(move.x, move.z);
  }
  person.update(dt, moving);

  // 垂直方向：地面高度 + 跳跃偏移
  const groundY = resolveGroundY(p.x, p.z);
  if (jumpRequested) {
    if (grounded) {
      jumpVel = JUMP_SPEED;
      grounded = false;
    }
    jumpRequested = false;
  }
  if (!grounded) {
    jumpVel -= GRAVITY * dt;
    jumpOffset += jumpVel * dt;
    if (jumpOffset <= 0) {
      jumpOffset = 0;
      jumpVel = 0;
      grounded = true;
    }
  }
  if (grounded) {
    p.y += (groundY - p.y) * Math.min(dt * 18, 1);
  } else {
    p.y = groundY + jumpOffset;
  }

  // 门口交互
  const nearDoor = Math.hypot(p.x - DOOR_ANCHOR.x, p.z - DOOR_ANCHOR.z) < 3.6;
  const insideHouse = p.x > INTERIOR.minX && p.x < INTERIOR.maxX
    && p.z > INTERIOR.minZ && p.z < INTERIOR.maxZ;

  if (interactRequested) {
    interactRequested = false;
    // 只在屋外才能关门，避免把人关在屋里
    if (nearDoor && !insideHouse) {
      doorOpen = !doorOpen;
      building.setDoorOpen(doorOpen);
    }
  }
  if (enterRequested) {
    enterRequested = false;
    if (nearDoor && doorOpen) {
      if (insideHouse) {
        startAutoMove([DOOR_OUTSIDE, OUTSIDE_POINT], () => focusCamera(4, 4, 5));
      } else {
        startAutoMove([DOOR_OUTSIDE, INSIDE_POINT], () => focusCamera(-2.8, 2.2, -3.6));
      }
    }
  }

  // 提示文案
  const fLabel = `${floorIndex + 1}F`;
  if (floorEl.textContent !== fLabel) floorEl.textContent = fLabel;
  let text = '';
  if (nearDoor) {
    if (insideHouse) {
      text = doorOpen ? '按 G 出门' : '门已关闭，无法离开';
    } else {
      text = doorOpen ? '按 G 进入房间' : '按 F 开门';
    }
  }
  if (text) {
    promptEl.style.display = 'block';
    if (promptEl.textContent !== text) promptEl.textContent = text;
  } else {
    promptEl.style.display = 'none';
  }

  // 场景动画
  building.update(dt);
  environment.updateWater(t);

  // 相机跟随人物（保持当前轨道偏移）
  followTarget.set(p.x, p.y + 1.2, p.z);
  const dx = followTarget.x - controls.target.x;
  const dy = followTarget.y - controls.target.y;
  const dz = followTarget.z - controls.target.z;
  controls.target.set(followTarget.x, followTarget.y, followTarget.z);
  camera.position.x += dx;
  camera.position.y += dy;
  camera.position.z += dz;

  // 人在屋内时把相机限制在屋内，避免被外墙挡住
  if (insideHouse) {
    const dir = camera.position.clone().sub(controls.target);
    dir.setLength(Math.min(dir.length(), 4.2));
    camera.position.copy(controls.target).add(dir);
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, INTERIOR.minX + 0.4, INTERIOR.maxX - 0.4);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, INTERIOR.minZ + 0.4, INTERIOR.maxZ - 0.4);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, p.y + 0.9, p.y + 2.7);
  }
  controls.update();

  renderer.render(scene, camera);
}
animate();

// ---------- 窗口自适应 ----------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
