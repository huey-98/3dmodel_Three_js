import * as THREE from 'three';
import { createCtOperator, CHAR_SCALE } from './operator.js';
import { groundAt, slideMove, lineOfSight, GRAVITY } from './physics.js';

// 命中盒和干员共用局部坐标系，随 group 的 CHAR_SCALE 一起缩放，和玩家看到的身体对齐。
const EYE = 1.64 * CHAR_SCALE;
const PLAYER_CHEST = 1.3;
const SPOT_RANGE = 45;
const FOV_DOT = Math.cos(THREE.MathUtils.degToRad(52));
const LOS_INTERVAL = 0.2;
const STRAFE_SPEED = 1.9;
const BODY_R = 0.32;

const STATE = {
  IDLE: 'idle',
  MOVE: 'move',
  ENGAGE: 'engage',
  SEARCH: 'search',
  DEAD: 'dead',
};

const parts = [
  { name: 'head', scale: 4, y: 1.64, geo: () => new THREE.SphereGeometry(0.17, 10, 8) },
  { name: 'body', scale: 1, y: 1.24, geo: () => new THREE.BoxGeometry(0.52, 0.66, 0.36) },
  { name: 'legs', scale: 0.75, y: 0.46, geo: () => new THREE.BoxGeometry(0.44, 0.82, 0.32) },
];

// 命中盒透明但不关 object.visible：玩家射线的过滤条件会跳过不可见对象。
const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });

const eyeFrom = new THREE.Vector3();
const eyeTo = new THREE.Vector3();
const muzzlePoint = new THREE.Vector3();
const shotDir = new THREE.Vector3();
const strafe = new THREE.Vector3();
const playerChest = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

export function spawnEnemy({
  world, scene, kind = 'walker', spawn, path, speed, interval, reaction: reactionTime = 0.3,
}) {
  const body = createCtOperator({ palette: 'enemy' });
  const group = body.group;
  group.position.set(spawn.x, spawn.y ?? 0, spawn.z);
  scene.add(group);

  const hitBox = new THREE.Group();
  group.add(hitBox);
  const boxes = [];
  for (const part of parts) {
    const mesh = new THREE.Mesh(part.geo(), hitMaterial);
    mesh.position.y = part.y;
    mesh.userData.part = part.name;
    mesh.userData.scale = part.scale;
    hitBox.add(mesh);
    boxes.push(mesh);
  }

  let hp = 100;
  let state = kind === 'stationary' ? STATE.ENGAGE : STATE.MOVE;
  let alive = true;
  let waypoint = 0;
  let reaction = reactionTime;
  let fireCd = interval * 0.6;
  let losTimer = 0;
  let seen = false;
  let loseSight = 0;
  let lostTimer = 0;
  let strafeDir = Math.random() < 0.5 ? -1 : 1;
  let strafeTimer = 0;
  let deathTime = 0;
  let vy = 0;
  const lastSeen = new THREE.Vector3(spawn.x, spawn.y ?? 0, spawn.z);

  function faceToward(x, z, dt, rate = 8) {
    const want = Math.atan2(x - group.position.x, z - group.position.z);
    let diff = want - group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    group.rotation.y += diff * Math.min(1, dt * rate);
  }

  // 敌人不进屋子：封闭的房间（小卖部、西楼二楼）当禁入区，开放的棚子可以进。
  // 用移动半径外扩一点，避免贴着门槛卡住。
  function canWalkTo(x, z, r) {
    for (const room of world.rooms) {
      if (room.open) continue;
      if (x > room.minX - r && x < room.maxX + r
        && z > room.minZ - r && z < room.maxZ + r) return false;
    }
    return true;
  }

  function moveTo(dx, dz) {
    const p = group.position;
    if (!canWalkTo(p.x + dx, p.z + dz, BODY_R)) return false;
    return slideMove(world, p, dx, dz, BODY_R);
  }

  function aimPitchAt(player) {
    const horiz = Math.hypot(player.x - group.position.x, player.z - group.position.z);
    const eyeY = group.position.y + EYE;
    return Math.atan2(player.y + PLAYER_CHEST - eyeY, Math.max(horiz, 0.3));
  }

  function canSee(player) {
    const dx = player.x - group.position.x;
    const dz = player.z - group.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > SPOT_RANGE) return false;
    const aware = state === STATE.ENGAGE || state === STATE.SEARCH;
    if (!aware) {
      const dot = (dx * Math.sin(group.rotation.y) + dz * Math.cos(group.rotation.y))
        / Math.max(dist, 1e-4);
      if (dot < FOV_DOT) return false;
    }
    eyeFrom.copy(group.position);
    eyeFrom.y += EYE;
    eyeTo.set(player.x, player.y + PLAYER_CHEST, player.z);
    return lineOfSight(raycaster, world.group, eyeFrom, eyeTo);
  }

  // 一次点射：一条真实弹道。打不中就是被掩体挡住了。
  function shoot(player, api) {
    group.rotation.y = Math.atan2(player.x - group.position.x, player.z - group.position.z);
    body.muzzleWorld(muzzlePoint);
    playerChest.set(player.x, player.y + PLAYER_CHEST, player.z);
    const range = muzzlePoint.distanceTo(playerChest);
    shotDir.copy(playerChest).sub(muzzlePoint).normalize();
    const spread = 0.045 + (range / 30) * 0.055;
    shotDir.x += (Math.random() * 2 - 1) * spread;
    shotDir.y += (Math.random() * 2 - 1) * spread;
    shotDir.z += (Math.random() * 2 - 1) * spread;
    shotDir.normalize();

    raycaster.set(muzzlePoint, shotDir);
    raycaster.far = range;
    const wall = raycaster.intersectObject(world.group, true)
      .find((hit) => hit.object.visible && hit.distance > 0.4);
    const hitDistance = wall ? wall.distance : range;

    // 弹道到身体中心的最近距离，超过肩宽一半就擦过去了。
    const along = playerChest.clone().sub(muzzlePoint).dot(shotDir);
    const closest = muzzlePoint.clone().addScaledVector(shotDir, along);
    const hitPlayer = !wall && closest.distanceTo(playerChest) < 0.42;

    body.recoil();
    body.setAimPitch(-aimPitchAt(player));
    api.fire({
      muzzle: muzzlePoint,
      dir: shotDir,
      end: muzzlePoint.clone().addScaledVector(shotDir, hitDistance),
      hitWall: Boolean(wall),
      wallPoint: wall ? wall.point : null,
      wallNormal: wall ? wall.face.normal.clone().transformDirection(wall.object.matrixWorld) : null,
    });
    if (hitPlayer) api.hitPlayer(10, muzzlePoint);
  }

  function update(dt, api) {
    // api = { player: {x,y,z}, fire(payload), hitPlayer(damage, from) }
    const p = group.position;
    const player = api.player;

    if (state === STATE.DEAD) {
      deathTime += dt;
      group.rotation.z = Math.min(1.45, deathTime * 3.4);
      p.y = Math.max(0, p.y - dt * 0.9);
      if (deathTime > 3) group.visible = false;
      return;
    }

    if (kind === 'stationary') {
      if (player) {
        faceToward(player.x, player.z, dt, 6);
        body.setAimPitch(-aimPitchAt(player));
        reaction = Math.max(0, reaction - dt);
        fireCd = Math.max(0, fireCd - dt);
        if (reaction === 0 && fireCd === 0 && canSee(player)) {
          shoot(player, api);
          fireCd = interval;
        }
      }
      body.update(dt, false);
      return;
    }

    losTimer -= dt;
    if (losTimer <= 0) {
      losTimer = LOS_INTERVAL;
      if (canSee(player)) {
        seen = true;
        lastSeen.set(player.x, player.y, player.z);
        loseSight = 0;
      } else if (seen) {
        loseSight += LOS_INTERVAL;
      }
    }
    if (seen && loseSight > 3) {
      seen = false;
      state = STATE.SEARCH;
    }

    let moving = false;
    if (state === STATE.DEAD) return;

    if (seen) {
      state = STATE.ENGAGE;
      reaction = Math.max(0, reaction - dt);
      faceToward(player.x, player.z, dt, 6);
      body.setAimPitch(-aimPitchAt(player));
      fireCd = Math.max(0, fireCd - dt);
      strafeTimer -= dt;
      if (strafeTimer <= 0) {
        strafeTimer = 1.1 + Math.random() * 1.2;
        strafeDir *= -1;
      }
      const dist = Math.hypot(player.x - p.x, player.z - p.z);
      if (dist > 12) {
        // 太远就压上去，别站着对射。
        moving = moveTo(((player.x - p.x) / dist) * speed * dt, ((player.z - p.z) / dist) * speed * dt);
      } else if (dist < 14) {
        strafe.set(
          Math.cos(group.rotation.y) * strafeDir,
          0,
          -Math.sin(group.rotation.y) * strafeDir,
        );
        moving = moveTo(strafe.x * STRAFE_SPEED * dt, strafe.z * STRAFE_SPEED * dt);
      }
      if (reaction === 0 && fireCd === 0) {
        shoot(player, api);
        fireCd = interval;
      }
    } else if (state === STATE.SEARCH) {
      const dx = lastSeen.x - p.x;
      const dz = lastSeen.z - p.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.2) {
        state = STATE.IDLE;
        lostTimer = 2.2;
      } else {
        moving = moveTo((dx / dist) * speed * 0.85 * dt, (dz / dist) * speed * 0.85 * dt);
        faceToward(lastSeen.x, lastSeen.z, dt, 7);
        body.setAimPitch(0);
      }
    } else if (state === STATE.IDLE) {
      lostTimer -= dt;
      if (lostTimer <= 0) state = STATE.MOVE;
    } else {
      const target = path[waypoint];
      if (!target || !Number.isFinite(target.x) || !Number.isFinite(target.z)) {
        state = STATE.IDLE;
        lostTimer = 2.2;
      } else {
        const dx = target.x - p.x;
        const dz = target.z - p.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.7) {
          waypoint += 1;
        } else {
          moving = moveTo((dx / dist) * speed * dt, (dz / dist) * speed * dt);
          faceToward(target.x, target.z, dt, 7);
          body.setAimPitch(0);
        }
      }
    }

    // 传当前脚底高度：头顶的悬空跳台不该把敌人抬到台面上去。
    const floor = groundAt(world, p.x, p.z, BODY_R, p.y);
    if (p.y > floor + 0.02) {
      vy -= GRAVITY * dt;
      p.y = Math.max(floor, p.y + vy * dt);
    } else {
      p.y = floor;
      vy = 0;
    }

    body.update(dt, moving);
  }

  return {
    group,
    hitBox,
    boxes,
    debug: () => ({ spawn, x: group.position.x, z: group.position.z, state, hp }),
    get alive() { return alive; },
    get state() { return state; },
    update,
    damage(mult) {
      if (!alive) return false;
      hp -= 33 * mult;
      if (kind !== 'stationary') {
        seen = true;
        loseSight = 0;
        if (state === STATE.MOVE || state === STATE.IDLE) state = STATE.ENGAGE;
      }
      if (hp <= 0) {
        alive = false;
        hp = 0;
        state = STATE.DEAD;
        deathTime = 0;
        hitBox.visible = false;
        return true;
      }
      return false;
    },
  };
}
