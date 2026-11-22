import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCtOperator, CHAR_SCALE } from './operator.js';
import { createFirstPersonView } from '@shared/firstPerson.js';
import { createPlaySettings } from '@shared/playSettings.js';
import { createBazaar, MAP_SCALE } from './world.js';
import { createCarbine } from './gun.js';
import { createPerfStats } from '@shared/perfStats.js';
import { createCombat } from './combat.js';
import {
  GRAVITY,
  JUMP_SPEED,
  groundAt,
  blockedAt,
  roomAt,
  maxRayInside,
} from './physics.js';

// 大厅弹窗会带上 ?mode=free / ?mode=game，没有参数时按自由跑图。
const mode = new URLSearchParams(location.search).get('mode') === 'game' ? 'game' : 'free';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd2d8d4);
scene.fog = new THREE.Fog(0xd5d6cc, 28 * MAP_SCALE, 82 * MAP_SCALE);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 220 * MAP_SCALE);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);
const perf = createPerfStats({ renderer, name: `bazaar-${mode}` });

scene.add(new THREE.HemisphereLight(0xfff6ea, 0xc6aa84, 0.78));
const sun = new THREE.DirectionalLight(0xfff1d2, 2.05);
sun.position.set(-20 * MAP_SCALE, 32, 18 * MAP_SCALE);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28 * MAP_SCALE;
// 东侧空地伸到 X≈79，阴影相机向右、向上和远平面随扩，远端才有影子。
sun.shadow.camera.right = 36 * MAP_SCALE;
sun.shadow.camera.top = 32 * MAP_SCALE;
sun.shadow.camera.bottom = -28 * MAP_SCALE;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 80 * MAP_SCALE;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffe6cc, 0.28);
fill.position.set(16 * MAP_SCALE, 10, 6 * MAP_SCALE);
scene.add(fill);

const world = createBazaar();
scene.add(world.group);

// 游戏模式的出生点在棚子南缘，面朝 +Z，正对南凹槽这两个主攻口；自由跑图保持原来的位置。
const SPAWN_FREE = { x: 0.8 * MAP_SCALE, z: 7.2 * MAP_SCALE, yaw: Math.PI };
const SPAWN_GAME = { x: 0, z: 5.5 * MAP_SCALE, yaw: 0 };

const person = createCtOperator();
scene.add(person.group);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(6.2 * MAP_SCALE, 13.2, 11.15 * MAP_SCALE);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.minDistance = 3;
controls.maxDistance = 42 * MAP_SCALE;
controls.enablePan = false;
const settings = createPlaySettings();
const view = createFirstPersonView({
  camera,
  domElement: renderer.domElement,
  controls,
  subject: person.group,
  getLookScale: () => settings.lookScale(),
  getFov: () => settings.fov(),
});

const gun = createCarbine({
  scene,
  camera,
  domElement: renderer.domElement,
  isFirstPerson: () => view.isActive(),
  target: world.group,
  getSound: () => settings.sound(),
  onShot: (shot) => (combat ? combat.resolveShot(shot) : null),
});

const PERSON_R = 0.32 * CHAR_SCALE;
let jumpVel = 0;
let grounded = true;

// 战斗模块只需要这几个跟玩家有关的方法，弹药和血量都还留在 gun.js 里。
const player = {
  group: person.group,
  setVitals(state) {
    gun.setVitals(state);
  },
  refillAmmo() {
    gun.refillAmmo();
  },
  respawn() {
    placePlayer(SPAWN_GAME);
    jumpVel = 0;
    grounded = true;
  },
};

let dismissHint = () => {};

const combat = mode === 'game'
  ? createCombat({
    scene, camera, domElement: renderer.domElement, world, player, settings,
    onState: (state) => {
      if (state !== 'idle') dismissHint();
    },
  })
  : null;

if (combat) dismissHint = showModeHint('游戏模式：按 G 开始第 1 波');

function placePlayer(spawn) {
  person.group.position.set(spawn.x, groundAt(world, spawn.x, spawn.z, 0.29), spawn.z);
  person.group.rotation.y = spawn.yaw;
  controls.target.set(spawn.x, 1.6, spawn.z);
}

// 初始机位沿用原版从东南俯视的角度，两种出生点共用同一组偏移。
const CAMERA_OFFSET = { x: 8.1, y: 13.2, z: 5.9 };

function placeCamera() {
  const p = person.group.position;
  camera.position.set(p.x + CAMERA_OFFSET.x, CAMERA_OFFSET.y, p.z + CAMERA_OFFSET.z);
  controls.target.set(p.x, 1.6, p.z);
  controls.update();
}

placePlayer(mode === 'game' ? SPAWN_GAME : SPAWN_FREE);
placeCamera();

function showModeHint(text) {
  const hint = document.createElement('div');
  hint.textContent = text;
  hint.style.cssText = [
    'position:fixed',
    'left:50%',
    'bottom:14%',
    'transform:translateX(-50%)',
    'z-index:6',
    'pointer-events:none',
    'user-select:none',
    'color:#fff',
    'font:15px "Microsoft YaHei", sans-serif',
    'background:rgba(0,0,0,.55)',
    'padding:9px 16px',
    'border-radius:8px',
    'transition:opacity .4s ease',
  ].join(';');
  document.body.appendChild(hint);
  let done = false;
  function dismiss() {
    if (done) return;
    done = true;
    hint.style.opacity = '0';
    setTimeout(() => hint.remove(), 500);
  }
  addEventListener('keydown', (event) => {
    if (event.code === 'KeyG') dismiss();
  });
  return dismiss;
}

const keys = new Set();
let jumpRequested = false;
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  keys.add(e.code);
  if (!e.repeat && e.code === 'Space') jumpRequested = true;
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const followTarget = new THREE.Vector3();
const camDir = new THREE.Vector3();
const eye = new THREE.Vector3();
let last = performance.now();
let elapsed = 0;

function animate(now) {
  requestAnimationFrame(animate);
  perf.beginFrame();
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  elapsed += dt;

  const p = person.group.position;
  const groundedNow = grounded;
  const arrowX = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0);
  const arrowZ = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
  const wasdX = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
  const wasdZ = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
  const worldDir = arrowX !== 0 || arrowZ !== 0;
  const ix = worldDir ? arrowX : wasdX;
  const iz = worldDir ? arrowZ : wasdZ;

  let moving = false;
  if (ix !== 0 || iz !== 0) {
    if (worldDir) {
      move.set(ix, 0, iz).normalize();
    } else {
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0, 0, -1);
      forward.normalize();
      right.crossVectors(forward, camera.up).normalize();
      move.copy(forward).multiplyScalar(-iz).addScaledVector(right, ix).normalize();
    }
    moving = true;
    const speed = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7 : 3.6) * settings.moveScale();
    const nx = p.x + move.x * speed * dt;
    const nz = p.z + move.z * speed * dt;
    if (!blockedAt(world, nx, nz, PERSON_R, p.y)) {
      p.x = nx;
      p.z = nz;
    } else if (!blockedAt(world, nx, p.z, PERSON_R, p.y)) {
      p.x = nx;
    } else if (!blockedAt(world, p.x, nz, PERSON_R, p.y)) {
      p.z = nz;
    }
    person.group.rotation.y = Math.atan2(move.x, move.z);
  }
  person.update(dt, moving);

  const floorY = groundAt(world, p.x, p.z, PERSON_R);
  if (jumpRequested) {
    if (grounded) {
      jumpVel = JUMP_SPEED;
      grounded = false;
    }
    jumpRequested = false;
  }
  if (!grounded) {
    jumpVel -= GRAVITY * dt;
    p.y += jumpVel * dt;
    if (jumpVel <= 0 && p.y <= floorY) {
      p.y = floorY;
      jumpVel = 0;
      grounded = true;
    }
  } else if (p.y - floorY > 0.12) {
    grounded = false;
    jumpVel = 0;
  } else {
    p.y = floorY;
  }

  world.update(elapsed);
  if (combat) combat.update(dt);

  if (view.isActive()) person.group.rotation.y = view.facingYaw();

  followTarget.set(p.x, p.y + 1.5 * CHAR_SCALE, p.z);
  if (view.isActive()) {
    controls.target.copy(followTarget);
    eye.set(0, 1.64, 0); // 护目镜中线，干员的眼睛高度
    person.group.localToWorld(eye);
    view.apply(eye);
    gun.kick();
  } else {
    const dx = followTarget.x - controls.target.x;
    const dy = followTarget.y - controls.target.y;
    const dz = followTarget.z - controls.target.z;
    controls.target.copy(followTarget);
    camera.position.x += dx;
    camera.position.y += dy;
    camera.position.z += dz;

    const room = roomAt(world, p.x, p.z);
    controls.maxDistance = room ? 5.2 * MAP_SCALE : 42 * MAP_SCALE;
    controls.minDistance = room ? 1.6 * MAP_SCALE : 3;
    controls.update();

    if (room) {
      camDir.copy(camera.position).sub(controls.target);
      const dist = camDir.length();
      if (dist > 1e-4) {
        camDir.multiplyScalar(1 / dist);
        const maxD = maxRayInside(controls.target, camDir, room) - 0.12;
        camera.position.copy(controls.target).addScaledVector(camDir, Math.min(dist, Math.max(0.6, maxD)));
      }
    }
  }

  const running = moving && (keys.has('ShiftLeft') || keys.has('ShiftRight'));
  gun.update(dt, { moving, running, airborne: !grounded });
  const moveGap = view.isActive()
    ? (running ? 16 : moving ? 9 : 0) + (groundedNow ? 0 : 6) + gun.crosshairGap()
    : 0;
  view.setCrosshairSpread(moveGap);
  renderer.render(scene, camera);
  gun.render(renderer);
  perf.endFrame(now);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
