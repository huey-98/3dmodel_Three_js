import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBuilding, BUILDING_BOUNDS } from './building.js';
import { createPerson } from './person.js';

// ---------- 场景 / 相机 / 渲染器 ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 70, 180);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 500);
camera.position.set(20, 14, 30);

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

// ---------- 地面 ----------
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(240, 240),
  new THREE.MeshStandardMaterial({ color: 0x7cb35c, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ---------- 楼房 ----------
scene.add(createBuilding());

// ---------- 树木 ----------
function createTree(x, z, s = 1) {
  const t = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.26, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.9 })
  );
  trunk.position.y = 0.7;
  trunk.castShadow = true;
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.3, 3, 8),
    new THREE.MeshStandardMaterial({ color: 0x3e7c3a, roughness: 0.9 })
  );
  leaves.position.y = 2.6;
  leaves.castShadow = true;
  t.add(trunk, leaves);
  t.position.set(x, 0, z);
  t.scale.setScalar(s);
  return t;
}
[
  [-13, -9], [-16, 5], [12, -13], [17, 5], [-9, 15],
  [9, 17], [-19, -3], [19, -7], [14, 12], [-14, 12],
].forEach(([x, z]) => scene.add(createTree(x, z, 0.8 + Math.random() * 0.5)));

// ---------- 人物 ----------
const person = createPerson();
person.group.position.set(10, 0, 16);
scene.add(person.group);

// ---------- 鼠标视角控制 ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(10, 1.2, 16);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.03; // 不允许钻到地面以下
controls.minDistance = 3;
controls.maxDistance = 60;

// ---------- 键盘输入 ----------
const keys = new Set();
let jumpRequested = false; // 空格起跳请求（按下瞬间触发）
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (e.code === 'Space') jumpRequested = true;
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- 跳跃物理 ----------
const GRAVITY = 24;   // 重力加速度
const JUMP_SPEED = 8; // 起跳初速度（约 1.33m 跳跃高度）
let vy = 0;           // 当前垂直速度
let grounded = true;  // 是否站在地面

// ---------- 碰撞检测（人物不能穿墙） ----------
const B = BUILDING_BOUNDS;
const blocked = (x, z) => x > B.minX && x < B.maxX && z > B.minZ && z < B.maxZ;

// ---------- 主循环 ----------
const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();
const followTarget = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  // 读取输入
  let ix = 0, iz = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) iz -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) iz += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
  const moving = ix !== 0 || iz !== 0;

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
    const p = person.group.position;
    const nx = p.x + move.x * speed * dt;
    const nz = p.z + move.z * speed * dt;
    // 撞墙时尝试沿单轴滑动
    if (!blocked(nx, nz)) {
      p.x = nx;
      p.z = nz;
    } else if (!blocked(nx, p.z)) {
      p.x = nx;
    } else if (!blocked(p.x, nz)) {
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
    person.group.position.y += vy * dt;
    if (person.group.position.y <= 0) {
      person.group.position.y = 0;
      vy = 0;
      grounded = true;
    }
  }

  // 相机跟随人物（保持当前轨道偏移）
  const p = person.group.position;
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
