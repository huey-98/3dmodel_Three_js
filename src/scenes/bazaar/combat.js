import * as THREE from 'three';
import { spawnEnemy } from './enemy.js';
import { createCombatEffects } from './combat/effects.js';
import { createCombatAudio } from './combat/audio.js';
import { createCombatHudDom } from './combat/hudDom.js';
import { SPAWNS, BALCONY, wavePlan, waveTuning } from './combat/wavePlan.js';
export { SPAWNS, BALCONY } from './combat/wavePlan.js';

// 波次防守。大厅选了游戏模式才会创建；自由跑图不 import 这个模块的效果，
// 战斗逻辑以 no-op 形式存在，main.js 的其它分支不用写两套。

const MAX_ALIVE = 5;
const WAVE_BREAK = 6;
const RESPAWN_DELAY = 3;
const ARMOR_MAX = 100;
const HP_MAX = 100;
const HEALTH_PER_WAVE = 25;
const ARMOR_PER_WAVE = 20;

export function createCombat({ scene, camera, domElement, world, player, settings, onState }) {
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
  const raycaster = new THREE.Raycaster();
  const tmp = new THREE.Vector3();

  const combatFx = createCombatEffects({ scene });
  const toneShot = createCombatAudio();
  const {
    top, waveLine, waveSub, banner, bannerMain, bannerSub, vignette,
    hurtRow, hurtArrow, marker, markerPath, over, overTitle, overSub,
  } = createCombatHudDom();

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
      reaction: tuning.reaction,
    });
    enemies.push(record);
    return record;
  }

  // 敌人淡出后从场景摘掉并释放几何体：干员每个实例都新建几何，材质在模块内共享。
  function discardEnemy(e) {
    e.group.removeFromParent();
    e.group.traverse((obj) => {
      if (obj.isMesh && obj.geometry) obj.geometry.dispose();
    });
  }

  function beginWave(n) {
    wave = n;
    plan = wavePlan(n).slice();
    planStart = 0;
    queue = 0;
    tuning = waveTuning(n);
    for (const e of enemies) discardEnemy(e);
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
        .filter((hit) => hit.object.visible && hit.distance > 0.05);

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
        combatFx.spawnDamageNumber(target.point, Math.round(33 * mult));
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
        if (timer <= 0) {
          restartWave();
          return;
        }
        setText(overSub, `第 ${wave} 波，击杀 ${kills}　${Math.ceil(timer)} 秒后重开`);
        paintHud();
        combatFx.tickEffects(dt);
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
      enemies = enemies.filter((e) => {
        if (e.alive || e.group.visible) return true;
        discardEnemy(e);
        return false;
      });
      combatFx.tickEffects(dt);
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
        const angle = Math.atan2(tmp.x, tmp.z) - Math.atan2(hurtDir.x, hurtDir.z);
        hurtArrow.style.transform = `rotate(${angle + Math.PI}rad)`;
      }
      paintHud();
    },
    start() {
      beginWave(1);
      over.style.display = 'none';
    },
    dispose() {
      for (const e of enemies) discardEnemy(e);
      enemies = [];
      combatFx.dispose();
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
    combatFx.spawnMuzzleLight(payload.muzzle);
    combatFx.spawnTracer(payload.muzzle, payload.dir, payload.end, true);
    if (payload.hitWall && payload.wallPoint) {
      combatFx.spawnDust(payload.wallPoint, payload.wallNormal || payload.dir.clone().negate());
    }
    // 离得远时音量按距离衰减，近处能听到枪声方向。
    if (settings.sound()) {
      toneShot(payload.muzzle.distanceTo(camera.position));
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