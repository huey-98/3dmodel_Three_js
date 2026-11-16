import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBuilding, WALL_RECTS, DOOR_GAP } from './building.js';
import { createEnvironment, ENV_RECTS } from './environment.js';
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

// ---------- 环境（地面、河流、桥、树木花草石头） ----------
const environment = createEnvironment();
scene.add(environment.group);

// ---------- 楼房 ----------
const building = createBuilding();
scene.add(building.group);

// ---------- 人物 ----------
const person = createPerson();
person.group.position.set(4, 0, 12);
scene.add(person.group);

// ---------- 鼠标视角控制 ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(4, 1.2, 12);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.03; // 不允许钻到地面以下
controls.minDistance = 3;
controls.maxDistance = 70;

// ---------- 键盘输入 ----------
const keys = new Set();
let jumpRequested = false;    // 空格起跳请求
let interactRequested = false; // F 键交互请求
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (e.code === 'Space') jumpRequested = true;
  if (e.code === 'KeyF') interactRequested = true;
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- 碰撞检测 ----------
const SOLIDS = [...WALL_RECTS, ...ENV_RECTS];
const inside = (x, z, r) => x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ;
let doorOpen = false;

// ---------- 跳跃物理 ----------
const GRAVITY = 24;   // 重力加速度
const JUMP_SPEED = 8; // 起跳初速度（约 1.33m 跳跃高度）
let vy = 0;           // 当前垂直速度
let grounded = true;  // 是否站在地面

function isBlocked(x, z) {
  for (const r of SOLIDS) {
    if (inside(x, z, r)) return true;
  }
  // 门口通道：门关着时不能进屋
  if (!doorOpen && inside(x, z, DOOR_GAP)) return true;
  return false;
}

// ---------- 交互提示 ----------
const promptEl = document.getElementById('prompt');
const doorAnchor = building.doorAnchor;

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

  // 读取输入
  let ix = 0, iz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
  const moving = ix !== 0 || iz !== 0;

  const p = person.group.position;

  if (moving) {
    // 移动方向相对相机朝向：W 永远朝屏幕里走
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, camera.up).normalize();
    move
      .copy(forward)
      .multiplyScalar(-iz)
      .addScaledVector(right, ix)
      .normalize();

    const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7 : 3.5;
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

  // 跳跃：起跳 → 抛物线下落 → 落地
  if (jumpRequested) {
    if (grounded) {
      vy = JUMP_SPEED;
      grounded = false;
    }
    jumpRequested = false;
  }
  if (!grounded) {
    vy -= GRAVITY * dt;
    p.y += vy * dt;
    if (p.y <= 0) {
      p.y = 0;
      vy = 0;
      grounded = true;
    }
  }

  // 开门交互：靠近门口时按 F
  const nearDoor = Math.hypot(p.x - doorAnchor.x, p.z - doorAnchor.z) < 3.2;
  if (interactRequested) {
    if (nearDoor) {
      doorOpen = !doorOpen;
      building.setDoorOpen(doorOpen);
    }
    interactRequested = false;
  }
  if (nearDoor) {
    promptEl.style.display = 'block';
    const text = doorOpen ? '按 F 关门' : '按 F 开门';
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
