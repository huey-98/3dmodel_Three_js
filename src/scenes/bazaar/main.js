import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCtOperator, CHAR_SCALE } from './operator.js';
import { createFirstPersonView } from '@shared/firstPerson.js';
import { createPlaySettings } from '@shared/playSettings.js';
import { createBazaar, MAP_SCALE } from './world.js';
import { createCarbine } from './gun.js';
import { createPerfStats } from '@shared/perfStats.js';

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
const perf = createPerfStats({ renderer, name: 'bazaar' });

scene.add(new THREE.HemisphereLight(0xfff6ea, 0xc6aa84, 0.78));
const sun = new THREE.DirectionalLight(0xfff1d2, 2.05);
sun.position.set(-20 * MAP_SCALE, 32, 18 * MAP_SCALE);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28 * MAP_SCALE;
sun.shadow.camera.right = 28 * MAP_SCALE;
sun.shadow.camera.top = 28 * MAP_SCALE;
sun.shadow.camera.bottom = -28 * MAP_SCALE;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 90 * MAP_SCALE;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffe6cc, 0.28);
fill.position.set(16 * MAP_SCALE, 10, 6 * MAP_SCALE);
scene.add(fill);

const world = createBazaar();
scene.add(world.group);

const person = createCtOperator();
person.group.position.set(0.8 * MAP_SCALE, 0, 7.2 * MAP_SCALE);
person.group.rotation.y = Math.PI;
scene.add(person.group);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.8 * MAP_SCALE, 1.6, 7.2 * MAP_SCALE);
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
});

const keys = new Set();
let jumpRequested = false;
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  keys.add(e.code);
  if (!e.repeat && e.code === 'Space') jumpRequested = true;
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

const PERSON_R = 0.32 * CHAR_SCALE;
const GRAVITY = 24;
const JUMP_SPEED = 8.6;
const STEP_UP = 0.35;
let jumpVel = 0;
let grounded = true;

function overlaps(x, z, r) {
  return x > r.minX - PERSON_R && x < r.maxX + PERSON_R
    && z > r.minZ - PERSON_R && z < r.maxZ + PERSON_R;
}

function resolveGroundY(x, z) {
  let y = 0;
  for (const plat of world.platforms) {
    if (overlaps(x, z, plat) && plat.top > y) y = plat.top;
  }
  return y;
}

function isBlocked(x, z) {
  for (const r of world.solids) {
    if (overlaps(x, z, r)) return true;
  }
  const feet = person.group.position.y;
  for (const plat of world.platforms) {
    if (feet >= plat.top - STEP_UP) continue;
    if (overlaps(x, z, plat)) return true;
  }
  return false;
}

function roomAt(x, z) {
  for (const r of world.rooms) {
    if (x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ) return r;
  }
  return null;
}

function maxRayInside(origin, dir, box) {
  let tExit = Infinity;
  const axes = [['x', box.minX, box.maxX], ['y', box.minY, box.maxY], ['z', box.minZ, box.maxZ]];
  for (const [axis, min, max] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return 0;
      continue;
    }
    tExit = Math.min(tExit, Math.max((min - o) / d, (max - o) / d));
  }
  return Number.isFinite(tExit) ? Math.max(0, tExit) : 0;
}

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
    if (!isBlocked(nx, nz)) {
      p.x = nx;
      p.z = nz;
    } else if (!isBlocked(nx, p.z)) {
      p.x = nx;
    } else if (!isBlocked(p.x, nz)) {
      p.z = nz;
    }
    person.group.rotation.y = Math.atan2(move.x, move.z);
  }
  person.update(dt, moving);

  const floorY = resolveGroundY(p.x, p.z);
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

    const room = roomAt(p.x, p.z);
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
    ? (running ? 16 : moving ? 9 : 0) + (grounded ? 0 : 6) + gun.crosshairGap()
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
