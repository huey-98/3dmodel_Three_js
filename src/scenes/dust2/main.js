// 炙热沙城（Dust2）场景入口：第三人称鲸尾女仆跑图 + V 切第一人称。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createWhaleMaid } from '@shared/whaleMaid.js';
import { createFirstPersonView } from '@shared/firstPerson.js';
import { createPlaySettings } from '@shared/playSettings.js';
import { createPerfStats } from '@shared/perfStats.js';
import { createDust2World } from './world.js';
import { SPAWNS } from './layout.js';
import { GRAVITY, JUMP_SPEED, PERSON_R, WALK_SPEED, RUN_SPEED, EYE_HEIGHT } from './constants.js';
import { groundAt, blockedAt, zoneAt, roomAt, maxRayInside } from './physics.js';



const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd9bd85);
scene.fog = new THREE.Fog(0xdcc494, 60, 210);

const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 320);
camera.position.set(-26, 6, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
document.body.appendChild(renderer.domElement);
const perf = createPerfStats({ renderer, name: 'dust2' });

// ---------- 光照：正午大漠 ----------
scene.add(new THREE.HemisphereLight(0xfff3da, 0xc99d61, 0.82));
const sun = new THREE.DirectionalLight(0xfff0cd, 2.0);
sun.position.set(-40, 60, -30);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -78;
sun.shadow.camera.right = 78;
sun.shadow.camera.top = 78;
sun.shadow.camera.bottom = -78;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 220;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.05;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffe2b8, 0.22);
fill.position.set(30, 18, 40);
scene.add(fill);

// ---------- 世界 ----------
const world = createDust2World();
scene.add(world.group);

// ---------- 人物（鲸尾女仆） ----------
const spawnKey = new URLSearchParams(location.search).get('spawn') || 't';
let spawn = SPAWNS[spawnKey] || SPAWNS.t;
const person = createWhaleMaid();
person.group.position.set(spawn.x, spawn.y, spawn.z);
person.group.rotation.y = spawn.yaw;
scene.add(person.group);

// ---------- 相机控制 ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(spawn.x, spawn.y + 1.4, spawn.z);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 3;
controls.maxDistance = 30;
const settings = createPlaySettings({ withSound: false });
const view = createFirstPersonView({
  camera,
  domElement: renderer.domElement,
  controls,
  subject: person.group,
  getLookScale: () => settings.lookScale(),
  getFov: () => settings.fov(),
});

// ---------- 键盘 ----------
const keys = new Set();
let jumpRequested = false;
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  keys.add(e.code);
  if (!e.repeat && e.code === 'Space') jumpRequested = true;
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- HUD ----------
const zoneEl = document.getElementById('zone');
let lastZone = '';
function setZone(name) {
  if (name === lastZone) return;
  lastZone = name;
  zoneEl.textContent = name;
  zoneEl.classList.add('flash');
  clearTimeout(setZone.timer);
  setZone.timer = setTimeout(() => zoneEl.classList.remove('flash'), 350);
}

// ---------- 移动与碰撞 ----------
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const eye = new THREE.Vector3();
const camDir = new THREE.Vector3();
let feetY = spawn.y;
let grounded = true;
let jumpVel = 0;
let elapsed = 0;
let last = performance.now();

function tryMove(dx, dz) {
  const p = person.group.position;
  if (!blockedAt(world, p.x + dx, p.z + dz, PERSON_R, feetY)) {
    p.x += dx;
    p.z += dz;
    return true;
  }
  let moved = false;
  if (!blockedAt(world, p.x + dx, p.z, PERSON_R, feetY)) {
    p.x += dx;
    moved = true;
  }
  if (!blockedAt(world, p.x, p.z + dz, PERSON_R, feetY)) {
    p.z += dz;
    moved = true;
  }
  return moved;
}

function animate(now) {
  requestAnimationFrame(animate);
  perf.beginFrame();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  elapsed += dt;

  const p = person.group.position;

  // 输入：方向键世界方向优先于 WASD 相对相机
  const arrowX = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  const arrowZ = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
  const wasdX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const wasdZ = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
  const worldDir = arrowX !== 0 || arrowZ !== 0;
  const ix = worldDir ? arrowX : wasdX;
  const iz = worldDir ? arrowZ : wasdZ;

  let moving = false;
  if (ix !== 0 || iz !== 0) {
    if (worldDir) move.set(ix, 0, iz).normalize();
    else {
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      right.crossVectors(forward, camera.up).normalize();
      move.copy(forward).multiplyScalar(-iz).addScaledVector(right, ix).normalize();
    }
    moving = true;
    const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? RUN_SPEED : WALK_SPEED) * settings.moveScale();
    tryMove(move.x * speed * dt, move.z * speed * dt);
    person.group.rotation.y = Math.atan2(move.x, move.z);
  }
  person.update(dt, moving);

  // 高度：地面 / 平台 / 跳跃
  const floorY = groundAt(world, p.x, p.z, PERSON_R, feetY);
  if (jumpRequested) {
    if (grounded) {
      jumpVel = JUMP_SPEED;
      grounded = false;
    }
    jumpRequested = false;
  }
  if (!grounded) {
    jumpVel -= GRAVITY * dt;
    feetY += jumpVel * dt;
    if (jumpVel <= 0 && feetY <= floorY) {
      feetY = floorY;
      jumpVel = 0;
      grounded = true;
    }
  } else if (feetY - floorY > 0.12) {
    grounded = false;
    jumpVel = 0;
  } else {
    feetY = floorY;
  }
  if (grounded) {
    p.y += (feetY - p.y) * (1 - Math.exp(-dt * 16));
    if (Math.abs(feetY - p.y) < 0.002) p.y = feetY;
  } else {
    p.y = feetY;
  }

  if (p.y < -6.2) {
    p.x = spawn.x; p.y = spawn.y; p.z = spawn.z;
    feetY = spawn.y; jumpVel = 0; grounded = true;
  }
  setZone(zoneAt(p.x, p.z, feetY));
  world.update(elapsed);
  if (view.isActive()) person.group.rotation.y = view.facingYaw();

  // 相机
  if (view.isActive()) {
    eye.set(0, EYE_HEIGHT, 0);
    person.group.localToWorld(eye);
    view.apply(eye);
    controls.target.set(p.x, p.y + EYE_HEIGHT, p.z);
  } else {
    const ty = p.y + 1.4;
    const dx = p.x - controls.target.x;
    const dy = ty - controls.target.y;
    const dz = p.z - controls.target.z;
    controls.target.set(p.x, ty, p.z);
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;

    const room = roomAt(world, p.x, p.z, p.y);
    controls.maxDistance = room ? 4.2 : 30;
    controls.minDistance = 2.6;
    controls.update();
    if (room) {
      camDir.copy(camera.position).sub(controls.target);
      const dist = camDir.length();
      if (dist > 1e-4) {
        camDir.multiplyScalar(1 / dist);
        const maxD = maxRayInside(controls.target, camDir, room) - 0.12;
        camera.position.copy(controls.target).addScaledVector(camDir, Math.min(dist, Math.max(0.8, maxD)));
      }
    }
  }

  renderer.render(scene, camera);
  perf.endFrame(now);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});