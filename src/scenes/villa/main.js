import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createBuilding, WALL_RECTS, DOOR_GAP, DOOR_ANCHOR,
  INSIDE_POINT, OUTSIDE_POINT, STAIRS, STAIR_RAILS, STAIR_WELLS, INTERIOR, FLOOR_H,
  stairSurfaceY,
} from './building.js';
import {
  createEnvironment, ENV_RECTS, BRIDGE, RIVER_Z0, RIVER_Z1, WATER_Y, PIER_RECTS, waterHeight,
} from './environment.js';
import { createBoat } from '@shared/boat.js';
import { createInterior, FURNITURE_RECTS } from './interior.js';
import { createWhaleMaid } from '@shared/whaleMaid.js';

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
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

// ---------- 光照 ----------
scene.add(new THREE.HemisphereLight(0xfff8ef, 0xe7d5bc, 0.74));
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
const interior = createInterior();
scene.add(interior.group);

// ---------- 小船 ----------
const boat = createBoat();
boat.group.position.set(7.5, WATER_Y, 22.2);
scene.add(boat.group);
let inBoat = false;
let boatSpeed = 0;    // 前进速度（负数为倒行）
let boatHeading = 0;  // 船头朝向
let rowPhase = 0;     // 划桨相位

// ---------- 人物（鲸女仆，替换原来的简易小人） ----------
const person = createWhaleMaid();
person.group.position.set(4, 0, 12);
scene.add(person.group);

// ---------- 鼠标视角控制 ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(4, 1.2, 12);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0;
controls.maxPolarAngle = Math.PI / 2 - 0.03;
controls.minDistance = 3;
controls.maxDistance = 70;

// ---------- 键盘输入 ----------
const keys = new Set();
let jumpRequested = false;     // 空格起跳
let interactRequested = false; // F 开关门 / 上船
let enterRequested = false;    // G 进屋/出门
addEventListener('keydown', (e) => {
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  keys.add(e.code);
  if (e.repeat) return;
  if (e.code === 'Space') jumpRequested = true;
  if (e.code === 'KeyF') interactRequested = true;
  if (e.code === 'KeyG') enterRequested = true;
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());

// ---------- 碰撞检测 ----------
const SOLIDS = [...WALL_RECTS, ...ENV_RECTS];
const PERSON_R = 0.32;
let doorOpen = false;

function overlaps(x, z, r, pad = PERSON_R) {
  return x > r.minX - pad && x < r.maxX + pad && z > r.minZ - pad && z < r.maxZ + pad;
}

function railApplies(r) {
  if (floorIndex === r.from || floorIndex === r.to) return true;
  return lastRamp != null && lastRamp.from === r.from && lastRamp.to === r.to;
}

function isBlocked(x, z) {
  for (const r of SOLIDS) {
    if (overlaps(x, z, r)) return true;
  }
  for (const r of STAIR_RAILS) {
    if (railApplies(r) && overlaps(x, z, r)) return true;
  }
  if (overlaps(x, z, DOOR_GAP)) {
    // 二层以上门洞是过梁实体；一层仅在关门时挡住
    if (floorIndex > 0 || !doorOpen) return true;
  }
  // 上层楼梯井：未走楼梯时不能踏空穿到楼下
  for (let i = 0; i < STAIRS.length; i++) {
    const s = STAIRS[i];
    if (s.to !== floorIndex) continue;
    const hole = STAIR_WELLS[i];
    if (!overlaps(x, z, hole, 0)) continue;
    if (lastRamp === s) continue;
    const t = (z - s.z0) / (s.z1 - s.z0);
    if (t < 0.82) return true;
  }
  if (!lastRamp) {
    for (const r of FURNITURE_RECTS) {
      if (r.floor !== floorIndex) continue;
      if (overlaps(x, z, r)) return true;
    }
  }
  return false;
}

// 船只在河内行驶，并避开桥墩（垫量按船体半宽 / 半长）
function boatBlocked(x, z) {
  if (z < RIVER_Z0 + 1.15 || z > RIVER_Z1 - 1.15) return true;
  if (Math.abs(x) > 78) return true;
  for (const r of PIER_RECTS) {
    if (x > r.minX - 0.5 && x < r.maxX + 0.5 && z > r.minZ - 1.55 && z < r.maxZ + 1.55) return true;
  }
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

// 桥面/引桥高度（桥面高于河面，人可走上桥）
function bridgeHeight(x, z) {
  const b = BRIDGE;
  if (x <= b.x0 || x >= b.x1) return 0;
  if (z <= b.rampZ0 || z >= b.rampZ1) return 0;
  if (z < b.deckZ0) return b.deckY * (z - b.rampZ0) / (b.deckZ0 - b.rampZ0);
  if (z <= b.deckZ1) return b.deckY;
  return b.deckY * (b.rampZ1 - z) / (b.rampZ1 - b.deckZ1);
}

// 返回 (x,z) 处的地面高度；踩在楼梯上时按坡度插值
function resolveGroundY(x, z) {
  if (x > INTERIOR.minX && x < INTERIOR.maxX && z > INTERIOR.minZ && z < INTERIOR.maxZ) {
    for (const s of STAIRS) {
      if (s.from !== floorIndex && s.to !== floorIndex) continue;
      if (x < s.xMin || x > s.xMax) continue;
      if (z < Math.min(s.z0, s.z1) || z > Math.max(s.z0, s.z1)) continue;
      const t = THREE.MathUtils.clamp((z - s.z0) / (s.z1 - s.z0), 0, 1);
      // 只能从楼梯底部或顶部踏上，避免一层走进楼梯顶端被抬到二楼
      const onThisRamp = lastRamp === s;
      const nearBottom = floorIndex === s.from && t < 0.22;
      const nearTop = floorIndex === s.to && t > 0.78;
      if (!onThisRamp && !nearBottom && !nearTop) continue;
      lastRamp = s;
      lastT = t;
      return stairSurfaceY(s, z);
    }
    // 离开楼梯：按上楼梯的位置决定落到哪一层
    if (lastRamp) {
      floorIndex = lastT >= 0.5 ? lastRamp.to : lastRamp.from;
      lastRamp = null;
    }
    return floorIndex * FLOOR_H;
  }
  lastRamp = null;
  floorIndex = 0;
  return bridgeHeight(x, z);
}

// ---------- 自动寻路（进屋/出门/上船） ----------
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

// ---------- 上船 / 下船 ----------
let boatInteractLock = 0;

// 船靠岸时才有上下船的位置（离岸超过 2.5m 无法上下船）
function boatDock() {
  const bx = boat.group.position.x;
  const bz = boat.group.position.z;
  let shoreZ = null;
  if (bz < RIVER_Z0 + 2.5) shoreZ = RIVER_Z0 - 1.6;
  else if (bz > RIVER_Z1 - 2.5) shoreZ = RIVER_Z1 + 1.6;
  else return null;
  for (const dx of [1.8, -1.8, 2.6, -2.6, 3.4, -3.4, 0]) {
    const x = bx + dx;
    if (!isBlocked(x, shoreZ)) return new THREE.Vector3(x, 0, shoreZ);
  }
  return new THREE.Vector3(bx + 2.8, 0, shoreZ);
}

function boardBoat() {
  boat.group.add(person.group);
  person.group.position.copy(boat.seatPosition);
  person.group.rotation.set(0, Math.PI, 0);
  inBoat = true;
  boatSpeed = 0;
  jumpRequested = false;
  boatInteractLock = 0.45;
}

function leaveBoat() {
  const dock = boatDock();
  if (!dock) return;
  scene.add(person.group);
  person.group.position.copy(dock);
  person.group.rotation.set(0, 0, 0);
  inBoat = false;
  boatSpeed = 0;
  boatInteractLock = 1.0;
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
const worldPos = new THREE.Vector3();
const camDir = new THREE.Vector3();

function maxRayInside(origin, dir, box) {
  let tExit = Infinity;
  const axes = [
    ['x', box.minX, box.maxX],
    ['y', box.minY, box.maxY],
    ['z', box.minZ, box.maxZ],
  ];
  for (const [axis, min, max] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return 0;
      continue;
    }
    const tFar = Math.max((min - o) / d, (max - o) / d);
    tExit = Math.min(tExit, tFar);
  }
  return Number.isFinite(tExit) ? Math.max(0, tExit) : 0;
}

function rayHitT(origin, dir, box) {
  let tmin = 0;
  let tmax = Infinity;
  const axes = [
    ['x', box.minX, box.maxX],
    ['y', box.minY, box.maxY],
    ['z', box.minZ, box.maxZ],
  ];
  for (const [axis, min, max] of axes) {
    const o = origin[axis];
    const d = dir[axis];
    if (Math.abs(d) < 1e-8) {
      if (o < min || o > max) return Infinity;
      continue;
    }
    let t1 = (min - o) / d;
    let t2 = (max - o) / d;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  const p = person.group.position;              // 局部坐标
  if (boatInteractLock > 0) boatInteractLock = Math.max(0, boatInteractLock - dt);

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

  if (inBoat) {
    // ---------- 划船 ----------
    jumpRequested = false;
    const thrust = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)
      - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
    const turn = (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
      - (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0);
    boatSpeed += thrust * 3.8 * dt;
    boatSpeed *= 1 - Math.min(dt * 1.5, 1);
    boatSpeed = THREE.MathUtils.clamp(boatSpeed, -1.8, 4.5);
    if (turn !== 0) {
      const steer = Math.abs(boatSpeed) > 0.05 ? Math.sign(boatSpeed) : 1;
      boatHeading += turn * 0.95 * dt * steer;
    }
    const nx = boat.group.position.x + Math.sin(boatHeading) * boatSpeed * dt;
    const nz = boat.group.position.z + Math.cos(boatHeading) * boatSpeed * dt;
    if (!boatBlocked(nx, nz)) {
      boat.group.position.x = nx;
      boat.group.position.z = nz;
    } else if (!boatBlocked(nx, boat.group.position.z)) {
      boat.group.position.x = nx;
      boatSpeed *= 1 - Math.min(dt * 4, 0.8);
    } else if (!boatBlocked(boat.group.position.x, nz)) {
      boat.group.position.z = nz;
      boatSpeed *= 1 - Math.min(dt * 4, 0.8);
    } else {
      boatSpeed *= 1 - Math.min(dt * 8, 0.9);
    }
    boat.group.rotation.y = boatHeading;
    boat.group.position.y = WATER_Y
      + waterHeight(boat.group.position.x, boat.group.position.z, t);
    boat.group.rotation.z = Math.sin(t * 1.6) * 0.05;
    boat.group.rotation.x = Math.sin(t * 2.3) * 0.035;
    const rowing = thrust !== 0 || Math.abs(boatSpeed) > 0.18;
    if (rowing) rowPhase += dt * (2.4 + Math.abs(boatSpeed) * 1.6);
    boat.setRowPhase(rowPhase, rowing);
    person.update(dt, false, { phase: rowPhase, active: rowing });
  } else {
    // ---------- 人物移动 ----------
    let moving = false;
    let speed = 3.5;
    if (autoPath.length) {
      const target = autoPath[0];
      const dx = target.x - p.x;
      const dz = target.z - p.z;
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
      const nx2 = p.x + move.x * speed * dt;
      const nz2 = p.z + move.z * speed * dt;
      // 撞墙时尝试沿单轴滑动
      if (!isBlocked(nx2, nz2)) {
        p.x = nx2;
        p.z = nz2;
      } else if (!isBlocked(nx2, p.z)) {
        p.x = nx2;
      } else if (!isBlocked(p.x, nz2)) {
        p.z = nz2;
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
  }

  person.group.getWorldPosition(worldPos);
  const wp = worldPos;

  // 门口交互
  const nearDoor = floorIndex === 0
    && Math.hypot(wp.x - DOOR_ANCHOR.x, wp.z - DOOR_ANCHOR.z) < 3.6;
  const insideHouse = wp.x > INTERIOR.minX && wp.x < INTERIOR.maxX
    && wp.z > INTERIOR.minZ && wp.z < INTERIOR.maxZ;
  const dock = boatDock();
  const nearBoat = !inBoat && !!dock && boatInteractLock <= 0
    && Math.hypot(wp.x - dock.x, wp.z - dock.z) < 2.4;

  if (interactRequested) {
    interactRequested = false;
    if (inBoat && boatInteractLock <= 0) {
      leaveBoat();
    } else if (nearBoat) {
      // 先走到岸边的登船点再上船
      startAutoMove([dock], () => boardBoat());
    } else if (nearDoor && !insideHouse) {
      // 只在屋外才能关门，避免把人关在屋里
      doorOpen = !doorOpen;
      building.setDoorOpen(doorOpen);
    }
  }
  if (enterRequested) {
    enterRequested = false;
    if (!inBoat && nearDoor && doorOpen) {
      if (insideHouse) {
        startAutoMove([DOOR_OUTSIDE, OUTSIDE_POINT], () => focusCamera(4, 4, 5));
      } else {
        startAutoMove([DOOR_OUTSIDE, INSIDE_POINT], () => focusCamera(-3.4, 2.6, -4.4));
      }
    }
  }

  // 提示文案
  const fLabel = `${floorIndex + 1}F`;
  if (floorEl.textContent !== fLabel) floorEl.textContent = fLabel;
  let text = '';
  if (inBoat) {
    text = dock
      ? 'W/S 划桨前进 · A/D 转向 · 按 F 下船'
      : 'W/S 划桨前进 · A/D 转向 · 划到岸边才能下船';
  } else if (nearBoat) {
    text = '按 F 上船';
  } else if (nearDoor) {
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
  interior.update(t);
  environment.updateWater(t);

  // 相机跟随人物（保持当前轨道偏移）
  followTarget.set(wp.x, wp.y + 1.2, wp.z);
  const dx = followTarget.x - controls.target.x;
  const dy = followTarget.y - controls.target.y;
  const dz = followTarget.z - controls.target.z;
  controls.target.set(followTarget.x, followTarget.y, followTarget.z);
  camera.position.x += dx;
  camera.position.y += dy;
  camera.position.z += dz;

  const onStairs = lastRamp != null;
  if (insideHouse && !inBoat) {
    controls.minDistance = onStairs ? 1.7 : 1.4;
    controls.maxDistance = onStairs ? 3.4 : 6.4;
    controls.minPolarAngle = 0.16;
    controls.maxPolarAngle = Math.PI * 0.72;
  } else {
    controls.minDistance = 3;
    controls.maxDistance = 70;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
  }
  controls.update();

  // 屋内只沿视线缩短距离，保留旋转角度；上楼时相机跟着人抬高，避免被下层楼板夹进身体
  if (insideHouse && !inBoat) {
    const room = {
      minX: INTERIOR.minX + 0.2,
      maxX: INTERIOR.maxX - 0.2,
      minZ: INTERIOR.minZ + 0.2,
      maxZ: INTERIOR.maxZ - 0.2,
      minY: wp.y + 0.5,
      maxY: onStairs
        ? wp.y + 2.55
        : Math.min(wp.y + FLOOR_H - 0.45, (floorIndex + 1) * FLOOR_H - 0.22),
    };
    camDir.copy(camera.position).sub(controls.target);
    const dist = camDir.length();
    if (dist > 1e-4) {
      camDir.multiplyScalar(1 / dist);
      let maxD = maxRayInside(controls.target, camDir, room) - 0.08;
      if (!onStairs) {
        for (const r of FURNITURE_RECTS) {
          if (r.floor !== floorIndex) continue;
          const t = rayHitT(controls.target, camDir, {
            minX: r.minX, maxX: r.maxX,
            minZ: r.minZ, maxZ: r.maxZ,
            minY: wp.y, maxY: wp.y + 1.55,
          });
          if (t > 0.3 && t < maxD) maxD = t - 0.06;
        }
      }
      camera.position.copy(controls.target).addScaledVector(camDir, Math.min(dist, Math.max(0.55, maxD)));
    }
  }

  renderer.render(scene, camera);
}
animate();

// ---------- 窗口自适应 ----------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

