import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCtOperator } from './operator.js';
import { createFirstPersonView } from '@shared/firstPerson.js';
import { createPlaySettings } from '@shared/playSettings.js';
import { createBazaar } from './world.js';
import { createCarbine } from './gun.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd2d8d4);
scene.fog = new THREE.Fog(0xd5d6cc, 28, 82);

const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 220);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xfff6ea, 0xc6aa84, 0.78));
const sun = new THREE.DirectionalLight(0xfff1d2, 2.05);
sun.position.set(-20, 32, 18);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 90;
sun.shadow.bias = -0.00025;
sun.shadow.normalBias = 0.035;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffe6cc, 0.28);
fill.position.set(16, 10, 6);
scene.add(fill);

const world = createBazaar();
scene.add(world.group);

const person = createCtOperator();
person.group.position.set(0.8, 0, 7.2);
person.group.rotation.y = Math.PI;
scene.add(person.group);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.8, 1.6, 7.2);
camera.position.set(6.2, 13.2, 11.15);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.12;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.minDistance = 3;
controls.maxDistance = 42;
controls.enablePan = false;
const settings = createPlaySettings();
const view = createFirstPersonView({
  camera,
  domElement: renderer.domElement,
  controls,
  subject: person.group,
  getLookScale: () => settings.lookScale(),
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

const PERSON_R = 0.32;
const GRAVITY = 24;
const JUMP_SPEED = 8;
let jumpVel = 0;
let jumpOffset = 0;
let grounded = true;

function overlaps(x, z, r) {
  return x > r.minX - PERSON_R && x < r.maxX + PERSON_R
    && z > r.minZ - PERSON_R && z < r.maxZ + PERSON_R;
}

function isBlocked(x, z) {
  for (const r of world.solids) {
    if (overlaps(x, z, r)) return true;
  }
  return false;
}

const ROOM = { minX: -4.55, maxX: 4.85, minZ: -3.8, maxZ: 4.65, minY: 0.4, maxY: 4.9 };

function insideBooth(x, z) {
  return x > ROOM.minX && x < ROOM.maxX && z > ROOM.minZ && z < ROOM.maxZ;
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
  p.y = jumpOffset;

  world.update(elapsed);

  if (view.isActive()) person.group.rotation.y = view.facingYaw();

  followTarget.set(p.x, p.y + 1.5, p.z);
  if (view.isActive()) {
    controls.target.copy(followTarget);
    eye.set(0, 1.64, 0);
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

    const inside = insideBooth(p.x, p.z);
    controls.maxDistance = inside ? 5.2 : 42;
    controls.minDistance = inside ? 1.6 : 3;
    controls.update();

    if (inside) {
      camDir.copy(camera.position).sub(controls.target);
      const dist = camDir.length();
      if (dist > 1e-4) {
        camDir.multiplyScalar(1 / dist);
        const maxD = maxRayInside(controls.target, camDir, ROOM) - 0.12;
        camera.position.copy(controls.target).addScaledVector(camDir, Math.min(dist, Math.max(0.6, maxD)));
      }
    }
  }

  gun.update(dt);
  renderer.render(scene, camera);
}
requestAnimationFrame(animate);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
