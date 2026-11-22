import * as THREE from 'three';
import { spawnEnemy } from './enemy.js';

// 波次防守。大厅选了游戏模式才会创建；自由跑图不 import 这个模块的效果，
// 战斗逻辑以 no-op 形式存在，main.js 的其它分支不用写两套。

const MAX_ALIVE = 5;
const WAVE_BREAK = 6;
const RESPAWN_DELAY = 3;
const ARMOR_MAX = 100;
const HP_MAX = 100;
const HEALTH_PER_WAVE = 25;
const ARMOR_PER_WAVE = 20;
const TRACER_SPEED = 120;
const FONT = '"Microsoft YaHei", sans-serif';

// ---------- 出生点 ----------

// 世界坐标。南凹槽两个口子是主攻方向，东拱门和货车旁是侧翼，北面从背后压过来。
// path 的每一点都是世界坐标，enemy.js 直接读 x / z。所有路径都停在棚外，
// 敌人不会走进任何 rooms 范围里。
export const SPAWNS = {
  southLeft: {
    x: -6, z: 26.5,
    path: [{ x: -6, z: 19 }, { x: -6, z: 12 }, { x: -6, z: 8.6 }],
  },
  southRight: {
    x: 7, z: 26.5,
    path: [{ x: 7, z: 19 }, { x: 7, z: 12 }, { x: 7, z: 8.6 }],
  },
  north: {
    x: 3, z: -17,
    path: [{ x: 3, z: -12 }, { x: 2, z: -9 }, { x: 2, z: -7.4 }],
  },
  northWest: {
    x: -10, z: -17,
    path: [{ x: -10, z: -12 }, { x: -8, z: -9.5 }, { x: -8, z: -7.4 }],
  },
  northEast: {
    x: 10, z: -17,
    path: [{ x: 10, z: -12 }, { x: 8, z: -9.5 }, { x: 8, z: -7.4 }],
  },
  // 东拱门在蓝楼西侧，进门后斜穿广场，停在棚子东侧外沿。
  arch: {
    x: 14.5, z: 13.05,
    path: [{ x: 12.2, z: 13.05 }, { x: 9.5, z: 10 }, { x: 9.4, z: 8.4 }],
  },
  // 货车停在广场西南，从车身东南侧的摊位间绕进来。
  van: {
    x: -16.5, z: 17.5,
    path: [{ x: -15, z: 11 }, { x: -11, z: 8.6 }, { x: -8.6, z: 8.4 }],
  },
};

// 阳台居高临下，不从地面走。
export const BALCONY = { x: -19.5, z: 6, y: 3.7 };

function wavePlan(n) {
  // 第 1 波只从南凹槽两侧来，玩家先熟悉正面交火；北面从第 2 波开始压过来。
  if (n === 1) {
    return [
      { at: SPAWNS.southLeft, kind: 'walker', delay: 0 },
      { at: SPAWNS.southRight, kind: 'walker', delay: 1.4 },
      { at: SPAWNS.southLeft, kind: 'walker', delay: 3.2 },
    ];
  }
  if (n === 2) {
    return [
      { at: SPAWNS.southLeft, kind: 'walker', delay: 0 },
      { at: SPAWNS.southRight, kind: 'walker', delay: 0.8 },
      { at: SPAWNS.north, kind: 'walker', delay: 2 },
      { at: SPAWNS.arch, kind: 'walker', delay: 3 },
      { at: SPAWNS.van, kind: 'walker', delay: 4.2 },
    ];
  }
  const plan = [];
  const order = [
    SPAWNS.southLeft, SPAWNS.southRight, SPAWNS.arch,
    SPAWNS.north, SPAWNS.northWest, SPAWNS.northEast, SPAWNS.van,
  ];
  const count = n === 3 ? 7 : Math.min(16, 7 + (n - 3));
  for (let i = 0; i < count; i++) {
    plan.push({
      at: order[i % order.length],
      kind: 'walker',
      delay: i * Math.max(0.6, 1.6 - n * 0.1),
    });
  }
  if (n === 3) {
    plan.push({ at: BALCONY, kind: 'stationary', delay: 2.4 });
    plan.push({ at: BALCONY, kind: 'stationary', delay: 3.6 });
  } else if (n >= 5) {
    plan.push({ at: BALCONY, kind: 'stationary', delay: 2 });
  }
  return plan;
}

function waveTuning(n) {
  return {
    speed: Math.min(4.2, 2.4 + 0.3 * (n - 1)),
    interval: Math.max(0.45, 1.7 - 0.11 * (n - 1)),
    reaction: Math.max(0.55, 1.4 - 0.15 * (n - 1)),
  };
}

// ---------- 弹道与受击效果 ----------

const tracerGeo = (() => {
  const geo = new THREE.BoxGeometry(0.03, 0.03, 1);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getZ(i) + 0.5;
    color.setRGB(1, 0.72 - t * 0.4, 0.2 - t * 0.18);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
})();

const dustGeo = new THREE.SphereGeometry(0.06, 6, 5);
const sparkGeo = new THREE.PlaneGeometry(0.26, 0.26);

function canvasTex(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const puffMap = canvasTex(64, (ctx, s) => {
  const grad = ctx.createRadialGradient(s / 2, s / 2, 1, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(150,126,96,0.85)');
  grad.addColorStop(0.5, 'rgba(150,126,96,0.35)');
  grad.addColorStop(1, 'rgba(150,126,96,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, s, s);
});

export function createCombat({ scene, camera, domElement, world, player, settings, onState }) {
  const effects = [];
  const damageNumbers = [];
  let enemies = [];
  let hp = HP_MAX;
  let armor = ARMOR_MAX;
  let kills = 0;
  let wave = 0;
  let phase = 'idle'; // idle | countdown | fight | break | dead
  let timer = 0;
  let plan = [];
  let queue = 0;
  let planStart = 0;
  let tuning = waveTuning(1);
  let dead = false;
  let hurtTimer = 0;
  let hurtDir = new THREE.Vector3();
  let hitMarker = 0;
  let killMarker = 0;
  let markerShown = 0;
  let flashLight = null;
  const raycaster = new THREE.Raycaster();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const tmp = new THREE.Vector3();

  // ---------- 界面 ----------
  const top = document.createElement('div');
  top.id = 'wave';
  top.style.cssText = [
    'position:fixed', 'left:28px', 'top:20px', 'z-index:5',
    'pointer-events:none', 'user-select:none',
    `font:${FONT}`, 'color:#fff', 'text-shadow:0 1px 3px rgba(0,0,0,.85)',
  ].join(';');
  const waveLine = document.createElement('div');
  waveLine.style.cssText = 'font-size:18px;font-weight:700;line-height:1.3';
  const waveSub = document.createElement('div');
  waveSub.style.cssText = 'font-size:13px;opacity:.85;line-height:1.4';
  top.append(waveLine, waveSub);
  document.body.appendChild(top);

  const banner = document.createElement('div');
  banner.id = 'wave-banner';
  banner.style.cssText = [
    'position:fixed', 'left:50%', 'top:32%', 'transform:translate(-50%,-50%)',
    'z-index:6', 'pointer-events:none', 'user-select:none', 'opacity:0',
    'transition:opacity .25s ease', 'text-align:center',
    `font:${FONT}`, 'color:#fff', 'text-shadow:0 2px 14px rgba(0,0,0,.9)',
  ].join(';');
  const bannerMain = document.createElement('div');
  bannerMain.style.cssText = 'font-size:44px;font-weight:800;letter-spacing:2px';
  const bannerSub = document.createElement('div');
  bannerSub.style.cssText = 'font-size:15px;opacity:.9;margin-top:6px;letter-spacing:1px';
  banner.append(bannerMain, bannerSub);
  document.body.appendChild(banner);

  const vignette = document.createElement('div');
  vignette.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:4', 'pointer-events:none', 'opacity:0',
    'transition:opacity .18s ease',
    'background:radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(150,10,10,.75) 100%)',
  ].join(';');
  document.body.appendChild(vignette);

  const hurtRow = document.createElement('div');
  hurtRow.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:22%', 'transform:translateX(-50%)',
    'z-index:5', 'pointer-events:none', 'user-select:none',
    `font:${FONT}`, 'text-align:center',
  ].join(';');
  const hurtArrow = document.createElement('div');
  hurtArrow.style.cssText = [
    'width:0', 'height:0', 'margin:0 auto',
    'border-left:26px solid transparent', 'border-right:26px solid transparent',
    'border-bottom:34px solid rgba(255,80,64,.92)',
    'filter:drop-shadow(0 0 8px rgba(255,40,20,.9))', 'opacity:0',
    'transition:opacity .25s ease',
  ].join(';');
  hurtRow.appendChild(hurtArrow);
  document.body.appendChild(hurtRow);

  // 命中标记：画在准星外围，和 firstPerson.js 的十字共用中心。
  const marker = document.createElement('div');
  marker.style.cssText = [
    'position:fixed', 'left:50%', 'top:50%', 'width:34px', 'height:34px',
    'transform:translate(-50%,-50%)', 'pointer-events:none', 'z-index:6', 'opacity:0',
    `font:${FONT}`,
  ].join(';');
  marker.innerHTML = [
    '<svg width="34" height="34" viewBox="0 0 34 34" style="display:block">',
    '<g stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none">',
    '<path d="M6 6 L13 13 M28 6 L21 13 M6 28 L13 21 M28 28 L21 21"/>',
    '</g>',
    '</svg>',
  ].join('');
  document.body.appendChild(marker);
  const markerPath = marker.querySelector('path');

  // 死亡遮罩
  const over = document.createElement('div');
  over.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:8', 'display:none',
    'align-items:center', 'justify-content:center', 'flex-direction:column', 'gap:10px',
    'background:rgba(40,4,4,.62)', 'backdrop-filter:blur(2px)',
    `font:${FONT}`, 'color:#fff',
  ].join(';');
  const overTitle = document.createElement('div');
  overTitle.textContent = '阵亡';
  overTitle.style.cssText = 'font-size:38px;font-weight:800;letter-spacing:6px';
  const overSub = document.createElement('div');
  overSub.style.cssText = 'font-size:14px;opacity:.85';
  over.append(overTitle, overSub);
  document.body.appendChild(over);

  function setState(state) {
    if (state) onState?.(state);
  }

  let bannerTimer = 0;

  function showBanner(main, sub, hold = 1.4) {
    bannerMain.textContent = main;
    bannerSub.textContent = sub;
    banner.style.opacity = '1';
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      banner.style.opacity = '0';
    }, hold * 1000);
  }

  // 每帧都会调 paintHud，只有内容真的变了才写 DOM，避免持续的样式重算。
  let hudMain = null;
  let hudSub = null;
  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function paintHud() {
    const remaining = enemies.filter((e) => e.alive).length;
    let main = '';
    let sub = '';
    if (phase === 'idle') {
      main = '准备';
      sub = '按 G 开始';
    } else if (phase === 'countdown') {
      main = `第 ${wave} 波`;
      sub = `${Math.ceil(timer)} 秒后敌人进场`;
    } else if (phase === 'fight') {
      main = `第 ${wave} 波`;
      sub = `剩余敌人 ${remaining}${queue > 0 ? `（待进场 ${queue}）` : ''}`;
    } else if (phase === 'break') {
      main = `第 ${wave} 波已清空`;
      sub = `下一波 ${Math.ceil(timer)} 秒`;
    } else {
      main = '阵亡';
      sub = `${Math.ceil(timer)} 秒后从第 ${wave} 波重开`;
    }
    if (main === hudMain && sub === hudSub) return;
    hudMain = main;
    hudSub = sub;
    waveLine.textContent = main;
    waveSub.textContent = sub;
  }

  function paintVitals() {
    player.setVitals?.({ hp, armor, kills });
    const low = hp / HP_MAX;
    vignette.style.opacity = low < 0.55 ? String(Math.min(0.9, (0.55 - low) * 2.4)) : '0';
  }

  // ---------- 受击与命中的少量特效 ----------

  function tickEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const fx = effects[i];
      fx.life -= dt;
      if (fx.tick) fx.tick(fx, dt);
      if (fx.fade) fx.mesh.material.opacity = Math.max(0, Math.min(1, fx.life / fx.fade));
      if (fx.life <= 0) {
        fx.mesh.removeFromParent();
        fx.mesh.material.dispose();
        effects.splice(i, 1);
      }
    }
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
      const num = damageNumbers[i];
      num.life -= dt;
      num.mesh.position.y += dt * 0.55;
      num.mesh.material.opacity = Math.max(0, num.life / 0.7);
      if (num.life <= 0) {
        num.mesh.removeFromParent();
        num.mesh.material.dispose();
        num.mesh.geometry.dispose();
        num.mesh.material.map?.dispose();
        damageNumbers.splice(i, 1);
      }
    }
  }

  function spawnDust(point, normal) {
    for (let i = 0; i < 4; i++) {
      const puff = new THREE.Mesh(
        sparkGeo,
        new THREE.MeshBasicMaterial({
          map: puffMap, transparent: true, depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      puff.position.copy(point).addScaledVector(normal, 0.03);
      puff.position.x += (Math.random() - 0.5) * 0.12;
      puff.position.z += (Math.random() - 0.5) * 0.12;
      puff.scale.setScalar(0.6 + Math.random() * 0.5);
      puff.quaternion.setFromUnitVectors(zAxis, normal);
      scene.add(puff);
      const drift = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        0.35 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.5,
      );
      effects.push({
        mesh: puff, life: 0.5, fade: 0.5,
        tick: (fx, d) => {
          fx.mesh.position.addScaledVector(drift, d);
          fx.mesh.scale.multiplyScalar(1 + d * 1.2);
        },
      });
    }
  }

  function spawnTracer(start, dir, end, fast = false) {
    const range = Math.max(0.4, start.distanceTo(end));
    const length = Math.min(fast ? 0.7 : 0.5, range);
    const streak = new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({
      vertexColors: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    streak.scale.set(fast ? 0.5 : 1, fast ? 0.5 : 1, length);
    streak.quaternion.setFromUnitVectors(zAxis, dir);
    const origin = start.clone();
    let traveled = length * 0.5;
    streak.position.copy(origin).addScaledVector(dir, traveled);
    streak.raycast = () => {};
    scene.add(streak);
    effects.push({
      mesh: streak, life: 1,
      tick(fx, d) {
        if (!fx.shown) {
          fx.shown = true;
          return;
        }
        traveled += TRACER_SPEED * d;
        const center = Math.min(traveled, Math.max(length * 0.5, range - length * 0.5));
        fx.mesh.position.copy(origin).addScaledVector(dir, center);
        if (traveled >= range) fx.life = 0;
      },
    });
    return streak;
  }

  function spawnMuzzleLight(point) {
    if (!flashLight) {
      flashLight = new THREE.PointLight(0xffb060, 0, 10, 2);
      scene.add(flashLight);
    }
    flashLight.position.copy(point);
    flashLight.intensity = 16;
    clearTimeout(spawnMuzzleLight.timer);
    spawnMuzzleLight.timer = setTimeout(() => {
      flashLight.intensity = 0;
    }, 45);
  }

  function spawnDamageNumber(point, amount) {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 34px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0,0,0,.8)';
    ctx.strokeText(String(amount), 48, 24);
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(String(amount), 48, 24);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthTest: false, depthWrite: false,
    }));
    sprite.position.copy(point);
    sprite.position.y += 0.35;
    sprite.scale.set(0.62, 0.31, 1);
    scene.add(sprite);
    damageNumbers.push({ mesh: sprite, life: 0.7 });
  }

  // ---------- 敌人生命周期 ----------

  function spawnFrom(entry, tuning) {
    const record = spawnEnemy({
      world,
      scene,
      kind: entry.kind,
      spawn: entry.at,
      path: entry.at.path || [],
      speed: tuning.speed,
      interval: tuning.interval,
    });
    enemies.push(record);
    return record;
  }

  function beginWave(n) {
    wave = n;
    plan = wavePlan(n).slice();
    planStart = 0;
    queue = 0;
    tuning = waveTuning(n);
    for (const e of enemies) e.group.removeFromParent();
    enemies = [];
    showBanner(`第 ${n} 波`, `敌人 ${plan.length} 名`, 1.8);
    phase = 'countdown';
    timer = 3;
    setState('countdown');
    paintHud();
  }

  function beginFight() {
    phase = 'fight';
    timer = 0;
    queue = plan.length;
    setState('fight');
  }

  function spawnDue(dt) {
    planStart += dt;
    let room = MAX_ALIVE - enemies.filter((e) => e.alive).length;
    for (const entry of plan) {
      if (entry.spawned) continue;
      if (entry.delay > planStart) continue;
      if (room <= 0) break;
      entry.spawned = true;
      queue -= 1;
      room -= 1;
      spawnFrom(entry, tuning);
    }
  }

  function finishWave() {
    phase = 'break';
    timer = WAVE_BREAK;
    hp = Math.min(HP_MAX, hp + HEALTH_PER_WAVE);
    armor = Math.min(ARMOR_MAX, armor + ARMOR_PER_WAVE);
    player.refillAmmo?.();
    paintVitals();
    showBanner(`第 ${wave} 波完成`, `血量 +${HEALTH_PER_WAVE}　护甲 +${ARMOR_PER_WAVE}　备弹已补满`, 2.2);
    setState('break');
  }

  function playerDied() {
    phase = 'dead';
    timer = RESPAWN_DELAY;
    dead = true;
    over.style.display = 'flex';
    overSub.textContent = `第 ${wave} 波，击杀 ${kills}`;
    setState('dead');
  }

  function restartWave() {
    over.style.display = 'none';
    dead = false;
    hp = HP_MAX;
    armor = ARMOR_MAX;
    kills = 0;
    player.respawn?.();
    paintVitals();
    beginWave(wave);
  }

  // ---------- 对外接口 ----------

  const api = {
    mode: 'game',
    playing() {
      return phase === 'fight' || phase === 'break';
    },
    hurt(damage, dir) {
      if (phase === 'dead' || phase === 'idle') return;
      let left = damage;
      if (armor > 0) {
        const absorbed = Math.min(armor, left * 0.5);
        armor -= absorbed;
        left -= absorbed;
      }
      hp = Math.max(0, hp - left);
      hurtTimer = 0.9;
      hurtDir.copy(dir || hurtDir);
      paintVitals();
      if (hp <= 0) playerDied();
    },
    // gun.js 每开一枪调一次：瞄准结果、命中部位都从敌人命中盒得出。
    resolveShot({ weapon, origin, direction, reach, onHit }) {
      raycaster.set(origin, direction);
      raycaster.far = reach;

      // 墙面要递归进 world.group 的子网格；命中盒本身是网格，递归与否都一样。
      const pick = (list) => raycaster.intersectObjects(list, true)
        .filter((hit) => hit.object.visible && hit.distance > 0.3);

      const wallHits = pick([world.group]);
      const enemyMeshes = [];
      for (const e of enemies) {
        if (e.alive) enemyMeshes.push(...e.boxes);
      }
      const enemyHits = pick(enemyMeshes);

      const wall = wallHits[0] || null;
      const target = enemyHits[0] || null;
      const useEnemy = target && (!wall || target.distance < wall.distance);

      if (useEnemy) {
        const record = enemies.find((e) => e.boxes.includes(target.object));
        const part = target.object.userData.part;
        const mult = target.object.userData.scale;
        const killed = record ? record.damage(mult) : false;
        if (record && killed) {
          kills += 1;
          killMarker = 0.25;
          paintHud();
          paintVitals();
        } else if (record) {
          hitMarker = 0.14;
        }
        spawnDamageNumber(target.point, Math.round(33 * mult));
        onHit?.({ point: target.point, normal: direction.clone().negate(), enemy: true, killed });
        return {
          point: target.point,
          normal: direction.clone().negate(),
          enemy: true,
          killed,
          damage: 33 * mult,
        };
      }

      if (wall) {
        const normal = wall.face
          ? wall.face.normal.clone().transformDirection(wall.object.matrixWorld).normalize()
          : direction.clone().negate();
        onHit?.({ point: wall.point, normal, enemy: false, killed: false });
        return { point: wall.point, normal, enemy: false, killed: false };
      }

      onHit?.(null);
      return null;
    },
    update(dt) {
      if (phase === 'idle') {
        paintHud();
        return;
      }
      if (phase === 'dead') {
        timer -= dt;
        if (timer <= 0) restartWave();
        paintHud();
        tickEffects(dt);
        return;
      }
      if (phase === 'countdown') {
        timer -= dt;
        if (timer <= 0) beginFight();
      } else if (phase === 'break') {
        timer -= dt;
        if (timer <= 0) beginWave(wave + 1);
      } else if (phase === 'fight') {
        spawnDue(dt);
        const anyAlive = enemies.some((e) => e.alive);
        const pending = plan.some((entry) => !entry.spawned);
        if (!anyAlive && !pending && plan.length > 0) finishWave();
      }

      const playerState = {
        x: player.group.position.x,
        y: player.group.position.y,
        z: player.group.position.z,
      };
      const enemyApi = {
        player: playerState,
        fire: fireFromEnemy,
        hitPlayer: (dmg, from) => {
          const dir = tmp.copy(player.group.position).sub(from);
          dir.y = 0;
          if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
          dir.normalize();
          api.hurt(dmg, dir);
        },
      };
      for (const e of enemies) e.update(dt, enemyApi);
      enemies = enemies.filter((e) => e.alive || e.group.visible);
      tickEffects(dt);
      if (hurtTimer > 0) hurtTimer = Math.max(0, hurtTimer - dt);
      if (hitMarker > 0) hitMarker = Math.max(0, hitMarker - dt);
      if (killMarker > 0) killMarker = Math.max(0, killMarker - dt);
      const markerAlpha = Math.max(hitMarker > 0 ? 0.85 : 0, killMarker > 0 ? 1 : 0);
      if (markerAlpha !== markerShown) {
        markerShown = markerAlpha;
        marker.style.opacity = String(markerAlpha);
        markerPath.setAttribute('stroke', killMarker > 0 ? '#ff5a4a' : '#fff');
      }
      const hurtAlpha = hurtTimer > 0 ? '0.95' : '0';
      if (hurtArrow.style.opacity !== hurtAlpha) hurtArrow.style.opacity = hurtAlpha;
      if (hurtTimer > 0) {
        camera.getWorldDirection(tmp);
        const angle = Math.atan2(hurtDir.x, hurtDir.z) - Math.atan2(tmp.x, tmp.z);
        hurtArrow.style.transform = `rotate(${angle + Math.PI}rad)`;
      }
      paintHud();
      if (phase === 'dead') {
        setText(overSub, `第 ${wave} 波，击杀 ${kills}　${Math.ceil(Math.max(0, timer))} 秒后重开`);
      }
    },
    start() {
      beginWave(1);
      over.style.display = 'none';
    },
    dispose() {
      for (const e of enemies) e.group.removeFromParent();
      enemies = [];
      for (const fx of effects) fx.mesh.removeFromParent();
      effects.length = 0;
      top.remove();
      banner.remove();
      vignette.remove();
      hurtRow.remove();
      marker.remove();
      over.remove();
      clearTimeout(bannerTimer);
    },
  };

  function fireFromEnemy(payload) {
    spawnMuzzleLight(payload.muzzle);
    spawnTracer(payload.muzzle, payload.dir, payload.end, true);
    if (payload.hitWall && payload.wallPoint) {
      spawnDust(payload.wallPoint, payload.wallNormal || payload.dir.clone().negate());
    }
    // 离得远时音量按距离衰减，近处能听到枪声方向。
    if (settings.sound()) {
      toneShot(payload.muzzle.distanceTo(camera.position));
    }
  }

  let audio = null;
  function toneShot(distance) {
    const gain = Math.max(0.02, 0.24 * (1 - Math.min(1, distance / 40)));
    try {
      if (!audio) audio = new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const amp = audio.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);
      amp.gain.setValueAtTime(gain, t);
      amp.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(amp).connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {
      // 没有音频设备时静音继续
    }
  }

  addEventListener('keydown', (event) => {
    if (event.code !== 'KeyG' || event.repeat) return;
    if (phase === 'idle') api.start();
  });

  over.addEventListener('click', () => {
    if (phase === 'dead') restartWave();
  });

  paintHud();
  paintVitals();

  // ?debug 时把战斗对象挂到 window，方便在浏览器里看敌人状态。
  if (new URLSearchParams(location.search).has('debug')) {
    api.debugEnemies = () => enemies.map((e) => ({
      state: e.state,
      alive: e.alive,
      x: e.group.position.x,
      y: e.group.position.y,
      z: e.group.position.z,
    }));
    api.debugEnemiesRaw = () => enemies.map((e) => e.debug?.());
    api.debugPlayer = () => ({
      hp, armor, wave, phase, kills,
      x: player.group.position.x,
      y: player.group.position.y,
      z: player.group.position.z,
    });
    window.__combat = api;
  }
  return api;
}