import * as THREE from 'three';
import {
  WEAPONS, RANGE, KNIFE_REACH, KNIFE_TIME, KNIFE_HIT,
  RIFLE_MUZZLE_Z, RIFLE_ROLL, PISTOL_MUZZLE_Z,
} from './gun/constants.js';
import {
  aim, hitPoint, hitNormal, gunMuzzle, flightDir, raycaster,
  _origin, _aim, _dir, _muzzleLocal, aimQuat,
} from './gun/resources.js';
import { KNIFE_POSES, sampleKnife } from './gun/knifeMotion.js';
import { createHudDom, drawWeaponIcon } from './gun/hud.js';
import { createTone } from './gun/audio.js';
import { createGunEffects } from './gun/effects.js';
import { createWeaponViews } from './gun/viewmodels.js';

// 只给荒漠迷城的第一人称用。1 步枪连发，2 手枪单点，3 匕首刺击。


export function createCarbine({
  scene,
  camera,
  domElement,
  isFirstPerson,
  target,
  getSound = () => true,
  onShot = null,
}) {
  const ammo = { rifle: WEAPONS.rifle.mag, pistol: WEAPONS.pistol.mag };
  const reserve = { rifle: WEAPONS.rifle.reserve, pistol: WEAPONS.pistol.reserve };
  let weapon = 'rifle';
  let gap = 0;
  let reloading = false;
  let reloadLeft = 0;
  let reloadDuration = 1;
  let recoil = 0;
  let burstFrames = 0;
  let holding = false;
  let dryPlayed = false;
  let swing = 0;
  let knifeStruck = false;
  let knifePose = KNIFE_POSES[0];
  let viewKick = 0;
  let triggerPull = 0;
  let shotSpread = 0;
  let equip = 1;
  let bob = 0;
  let motion = { moving: false, running: false, airborne: false };
  let lastImpact = null;
  let vitals = { hp: 100, armor: 100, kills: 0 };
  let tankFlash = 0;
  const effects = [];

  const viewScene = new THREE.Scene();
  viewScene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7560, 1.05));
  const viewKey = new THREE.DirectionalLight(0xfff3e2, 1.45);
  viewKey.position.set(0.35, 1.2, 2.4);
  viewScene.add(viewKey);
  const viewFill = new THREE.DirectionalLight(0xd5e2ff, 0.38);
  viewFill.position.set(-1.4, 0.3, 0.4);
  viewScene.add(viewFill);
  const viewCamera = new THREE.PerspectiveCamera(90, 1, 0.02, 6);

  const viewmodel = new THREE.Group();
  const {
    rifleView, pistolView, knifeView, rifleBolt, rifleTrigger, rifleMag, rifleMuzzle,
    rifleRight, rifleLeft, pistolSlide, pistolTrigger, pistolMag, pistolMuzzle,
    pistolHand, pistolSupport, knifeHand, flashLight,
  } = createWeaponViews({ scene });
  viewmodel.add(rifleView, pistolView, knifeView);
  viewScene.add(viewmodel);

  const {
    hud, icon, bar, fill, readout, magEl, sepEl, reserveEl, killLine, vitalsEl, hpRow, armorRow,
  } = createHudDom();

  let drawn = '';


  function paintVitals() {
    hpRow.num.textContent = String(Math.round(vitals.hp));
    hpRow.meter.style.width = `${Math.max(0, Math.min(100, vitals.hp))}%`;
    hpRow.meter.style.background = vitals.hp <= 30 ? '#ff6b5a' : '#7CFF6B';
    armorRow.num.textContent = String(Math.round(vitals.armor));
    armorRow.meter.style.width = `${Math.max(0, Math.min(100, vitals.armor))}%`;
    armorRow.meter.style.opacity = vitals.armor > 0 ? '1' : '0.35';
    if (killLine) killLine.textContent = vitals.kills > 0 ? `击杀 ${vitals.kills}` : '';
  }

  function setVitals(next) {
    if (!next) return;
    const hp = Number(next.hp);
    const armor = Number(next.armor);
    const kills = Number(next.kills);
    if (Number.isFinite(hp)) {
      if (hp < vitals.hp) tankFlash = 1;
      vitals.hp = hp;
    }
    if (Number.isFinite(armor)) vitals.armor = armor;
    if (Number.isFinite(kills)) vitals.kills = kills;
    paintVitals();
  }

  function refillAmmo() {
    for (const key of Object.keys(WEAPONS)) {
      if (key === 'knife') continue;
      ammo[key] = WEAPONS[key].mag;
      reserve[key] = WEAPONS[key].reserve;
    }
    reloading = false;
    gap = 0;
    paint();
  }


  const tone = createTone(getSound);

  function spec() {
    return WEAPONS[weapon];
  }

  function paint() {
    const active = isFirstPerson();
    hud.style.display = active ? 'flex' : 'none';
    vitalsEl.style.display = active ? 'flex' : 'none';
    if (!active) return;
    if (drawn !== weapon) {
      drawWeaponIcon(icon, weapon);
      drawn = weapon;
    }
    if (weapon === 'knife') {
      readout.style.display = 'none';
      bar.style.display = 'none';
      return;
    }
    readout.style.display = 'flex';
    magEl.textContent = String(ammo[weapon]);
    reserveEl.textContent = String(reserve[weapon]);
    magEl.style.color = ammo[weapon] === 0 && !reloading ? '#ffb4a8' : '#fff';
    if (reloading && reloadDuration > 0) {
      bar.style.display = 'block';
      const progress = 1 - reloadLeft / reloadDuration;
      fill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    } else {
      bar.style.display = 'none';
    }
  }

  const {
    addEffect, spawnViewFlame, spawnTracer, spawnHole, spawnSlash, spawnHitSpark,
  } = createGunEffects({ scene, camera, effects });

  function spawnShot(mark, scale, end, impacted, normal) {
    const item = spec();
    spawnViewFlame(mark, scale);
    flashLight.position.copy(gunMuzzle);
    flashLight.intensity = 24;
    burstFrames = 2;
    spawnTracer(gunMuzzle, flightDir, end);
    if (impacted) spawnHole(end, normal);
    recoil = item.recoil;
    viewKick = weapon === 'pistol' ? 0.045 : 0.06;
    triggerPull = 1;
    shotSpread = weapon === 'pistol' ? 11 : 15;
    tone(weapon === 'pistol' ? 210 : 140, 0.09, weapon === 'pistol' ? 0.14 : 0.22, 'square');
  }

  function aimShot(reach) {
    camera.updateMatrixWorld();
    camera.getWorldDirection(aim);
    placeViewmodel();
    const mark = weapon === 'pistol' ? pistolMuzzle : rifleMuzzle;
    mark.getWorldPosition(_muzzleLocal);
    gunMuzzle.copy(_muzzleLocal).applyMatrix4(camera.matrixWorld);

    // 命中射线从相机发出，枪口只做视觉：枪口在相机前 0.35 米，贴墙时会落进墙体，
    // 而且距枪口 0.3 米内的近身命中会被战斗模块的过滤丢掉。
    if (onShot) {
      const result = onShot({
        weapon,
        origin: camera.position.clone(),
        direction: aim.clone(),
        reach,
        mark,
        gunMuzzle: gunMuzzle.clone(),
      });
      if (result) {
        hitPoint.copy(result.point);
        hitNormal.copy(result.normal);
        lastImpact = result;
        return result;
      }
    }

    raycaster.set(camera.position, aim);
    raycaster.far = reach;
    const hits = raycaster.intersectObject(target, true);
    const hit = hits.find((item) => item.object.visible && item.face && item.distance > 0.05 && item.distance <= reach);
    if (hit) {
      hitPoint.copy(hit.point);
      hitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      if (hitNormal.dot(aim) > 0) hitNormal.negate();
      lastImpact = { point: hitPoint, normal: hitNormal, enemy: false, killed: false };
    } else {
      hitPoint.copy(camera.position).addScaledVector(aim, reach);
      lastImpact = null;
    }
    return hit;
  }



  function reloadMotion() {
    if (!reloading || reloadDuration <= 0) return { drop: 0, mag: 0, bolt: 0, support: 0 };
    const p = 1 - reloadLeft / reloadDuration;
    let drop = 0;
    if (p < 0.18) drop = p / 0.18;
    else if (p < 0.82) drop = 1;
    else drop = 1 - (p - 0.82) / 0.18;
    let mag = 0;
    if (p > 0.16 && p < 0.62) mag = Math.sin(((p - 0.16) / 0.46) * Math.PI);
    let bolt = 0;
    if (p > 0.64 && p < 0.96) bolt = Math.sin(((p - 0.64) / 0.32) * Math.PI);
    let support = 0;
    if (p < 0.18) support = p / 0.18;
    else if (p < 0.78) support = 1;
    else support = Math.max(0, 1 - (p - 0.78) / 0.18);
    return { drop, mag, bolt, support };
  }

  function applyBob(origin, knife = false) {
    const amp = motion.moving ? (motion.running ? 0.016 : 0.01) : 0.003;
    const scale = knife ? 0.62 : 1;
    const side = knife ? 0.45 : 1;
    origin.x += Math.sin(bob) * amp * scale * side;
    origin.y += Math.abs(Math.cos(bob)) * amp * 0.65 * scale;
    if (knife && motion.moving) origin.z -= Math.sin(bob * 2) * amp * 0.35;
  }

  function poseFingers() {
    const ready = equip * equip * (3 - 2 * equip);
    const grip = 0.38 + ready * 0.4;
    const motionNow = reloadMotion();
    if (weapon === 'rifle') {
      rifleRight.pose({
        curl: 0.58 + ready * 0.22,
        trigger: triggerPull,
        thumbCurl: 0.48,
        index: 0.08,
      });
      rifleLeft.pose({ curl: 0.42, thumbCurl: 0.34 + motionNow.bolt * 0.2 });
      rifleTrigger.rotation.x = triggerPull * 0.7;
      rifleMag.position.copy(rifleMag.userData.rest);
      rifleMag.position.y -= motionNow.mag * 0.18;
      rifleRight.group.position.copy(rifleRight.group.userData.rest);
      rifleRight.group.position.y -= motionNow.mag * 0.1;
      rifleBolt.position.copy(rifleBolt.userData.rest);
      rifleBolt.position.z -= motionNow.bolt * 0.06;
      rifleLeft.group.position.copy(rifleLeft.group.userData.rest);
      rifleLeft.group.position.z -= motionNow.bolt * 0.06;
      rifleLeft.group.position.y += motionNow.bolt * 0.02;
    } else if (weapon === 'pistol') {
      pistolHand.pose({
        curl: grip + 0.06,
        trigger: triggerPull,
        thumbCurl: 0.58,
        index: 0.14,
      });
      pistolTrigger.rotation.x = triggerPull * 0.8;
      pistolSlide.position.copy(pistolSlide.userData.rest);
      pistolSlide.position.z -= motionNow.bolt * 0.045;
      pistolHand.group.position.copy(pistolHand.group.userData.rest);
      pistolHand.group.position.z -= motionNow.bolt * 0.02;
      pistolMag.position.copy(pistolMag.userData.rest);
      pistolMag.position.y -= motionNow.mag * 0.12;
      pistolSupport.pose({
        curl: 0.58 + motionNow.support * 0.12 - motionNow.mag * 0.2,
        thumbCurl: 0.42 + motionNow.mag * 0.4,
      });
      pistolSupport.group.position.copy(pistolSupport.group.userData.rest);
      pistolSupport.group.position.y -= motionNow.mag * 0.1;
    } else {
      knifeHand.pose({ curl: knifePose.curl, trigger: 0, thumbCurl: 0.46 + knifePose.curl * 0.12 });
      knifeHand.group.position.copy(knifeHand.group.userData.rest);
      knifeHand.group.position.z += knifePose.wrist;
    }
  }

  function placeViewmodel() {
    const fp = isFirstPerson();
    viewmodel.visible = fp;
    if (!fp) return;
    rifleView.visible = weapon === 'rifle';
    pistolView.visible = weapon === 'pistol';
    knifeView.visible = weapon === 'knife';
    const ready = equip * equip * (3 - 2 * equip);
    const dip = 1 - ready;
    const reload = reloadMotion();
    if (weapon === 'knife') knifePose = sampleKnife(swing > 0 ? KNIFE_TIME - swing : 0);
    poseFingers();

    if (weapon === 'knife') {
      _origin.set(knifePose.x, knifePose.y, knifePose.z);
      _dir.set(knifePose.dx, knifePose.dy, knifePose.dz);
    } else if (weapon === 'pistol') {
      _origin.set(0.30, -0.26, -0.32);
      _dir.set(0, 0, -1);
      _aim.copy(_origin).addScaledVector(_dir, PISTOL_MUZZLE_Z);
    } else {
      _origin.set(0.48, -0.36, -0.36);
      _dir.set(-0.1, -0.04, -0.99);
      _aim.copy(_origin).addScaledVector(_dir, RIFLE_MUZZLE_Z);
    }
    if (weapon === 'knife') {
      _origin.y -= dip * 0.2;
      _origin.x += dip * 0.06;
    } else {
      _origin.y -= dip * 0.26;
      _origin.z += dip * 0.08;
      _aim.y -= dip * 0.1;
      _origin.y -= reload.drop * 0.1;
      _origin.z += reload.drop * 0.05;
      _aim.y -= reload.drop * 0.16;
    }
    if (viewKick > 0) {
      _origin.z += viewKick;
      _origin.y += viewKick * 0.2;
      _aim.y += viewKick * 0.35;
    }
    applyBob(_origin, weapon === 'knife');
    if (weapon === 'knife') {
      if (_dir.lengthSq() < 1e-8) _dir.set(0, 0.4, -1);
      _dir.normalize();
      _aim.copy(_origin).add(_dir);
    }
    viewmodel.position.copy(_origin);
    const roll = weapon === 'knife' ? knifePose.roll : weapon === 'rifle' ? RIFLE_ROLL : 0;
    aimQuat(_origin, _aim, roll, viewmodel.quaternion);
  }

  function tryFire() {
    if (!isFirstPerson() || gap > 0) return;
    if (weapon === 'knife') {
      gap = spec().gap;
      swing = KNIFE_TIME;
      knifeStruck = false;
      tone(460, 0.08, 0.07, 'sawtooth');
      return;
    }
    if (reloading) return;
    const item = spec();
    if (ammo[weapon] <= 0) {
      tryReload();
      return;
    }
    ammo[weapon] -= 1;
    gap = item.gap;
    lastImpact = null;
    const hit = aimShot(RANGE);
    const impact = lastImpact;
    // 命中敌人时不画墙上的弹孔，敌人的受击反馈由战斗模块负责。
    if (impact?.enemy) {
      flightDir.copy(impact.point).sub(gunMuzzle);
      if (flightDir.lengthSq() < 1e-6) flightDir.copy(aim);
      flightDir.normalize();
      const mark = weapon === 'pistol' ? pistolMuzzle : rifleMuzzle;
      spawnShot(mark, item.flame, impact.point, false, impact.normal);
    } else {
      flightDir.copy(hitPoint).sub(gunMuzzle);
      if (flightDir.lengthSq() < 1e-6) flightDir.copy(aim);
      flightDir.normalize();
      const mark = weapon === 'pistol' ? pistolMuzzle : rifleMuzzle;
      spawnShot(mark, item.flame, hitPoint, Boolean(hit), hitNormal);
    }
    if (ammo[weapon] === 0) tryReload();
    paint();
  }

  function tryReload() {
    if (!isFirstPerson() || weapon === 'knife' || reloading) return;
    const item = spec();
    if (ammo[weapon] >= item.mag || reserve[weapon] <= 0) return;
    reloading = true;
    reloadDuration = item.reload;
    reloadLeft = item.reload;
    tone(220, 0.06, 0.1, 'triangle');
    paint();
  }

  function selectWeapon(next) {
    if (weapon === next) return;
    weapon = next;
    reloading = false;
    gap = 0;
    swing = 0;
    knifeStruck = false;
    equip = 0;
    dryPlayed = false;
    if (next !== 'knife' && ammo[next] === 0 && reserve[next] > 0) tryReload();
    paint();
  }

  domElement.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    holding = true;
    dryPlayed = false;
    tryFire();
  });
  addEventListener('mouseup', (event) => {
    if (event.button !== 0) return;
    holding = false;
    dryPlayed = false;
  });
  addEventListener('blur', () => {
    holding = false;
  });
  addEventListener('keydown', (event) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.code === 'Digit1') selectWeapon('rifle');
    else if (event.code === 'Digit2') selectWeapon('pistol');
    else if (event.code === 'Digit3') selectWeapon('knife');
    else if (event.code === 'KeyR') tryReload();
  });

  function update(dt, nextMotion = {}) {
    motion = {
      moving: Boolean(nextMotion.moving),
      running: Boolean(nextMotion.running),
      airborne: Boolean(nextMotion.airborne),
    };
    bob += dt * (motion.moving ? 8.5 : 1.6);
    gap = Math.max(0, gap - dt);
    equip = Math.min(1, equip + dt / 0.32);
    triggerPull = Math.max(0, triggerPull - dt * 7);
    shotSpread = Math.max(0, shotSpread - dt * 36);
    if (!isFirstPerson()) {
      holding = false;
      swing = 0;
      knifeStruck = false;
    } else if (holding && spec().auto) {
      tryFire();
    }
    if (swing > 0) {
      const prevSwing = swing;
      swing = Math.max(0, swing - dt);
      if (weapon === 'knife' && !knifeStruck) {
        const elapsed = KNIFE_TIME - swing;
        const prevElapsed = KNIFE_TIME - prevSwing;
        if (prevElapsed < KNIFE_HIT && elapsed >= KNIFE_HIT) {
          knifeStruck = true;
          lastImpact = null;
          const hit = aimShot(KNIFE_REACH);
          const impact = lastImpact;
          if (impact?.enemy) {
            if (hit) spawnHitSpark(impact.point);
          } else if (hit) {
            spawnSlash(hitPoint, hitNormal);
          }
        }
      }
    }
    if (viewKick > 0) viewKick = Math.max(0, viewKick - dt * 0.45);
    if (reloading) {
      reloadLeft -= dt;
      if (reloadLeft <= 0) {
        reloading = false;
        const item = spec();
        const take = Math.min(item.mag - ammo[weapon], reserve[weapon]);
        ammo[weapon] += take;
        reserve[weapon] -= take;
        tone(320, 0.05, 0.08, 'triangle');
      }
    }
    if (burstFrames > 0) {
      flashLight.intensity = burstFrames > 1 ? 24 : 6;
      burstFrames -= 1;
    } else {
      flashLight.intensity = 0;
    }
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      if (effect.burst) {
        effect.frames += 1;
        effect.mesh.material.opacity = effect.frames === 1 ? 1 : 0.4;
        if (effect.frames > 2) effect.life = 0;
      } else {
        effect.life -= dt;
        if (effect.tick) effect.tick(effect, dt);
        const fade = effect.hold ? 0.35 : effect.max;
        const left = effect.hold ? Math.min(effect.life, fade) : effect.life;
        effect.mesh.material.opacity = Math.max(0, left / fade);
      }
      if (effect.life <= 0) {
        effect.mesh.removeFromParent();
        effect.mesh.material.dispose();
        effects.splice(i, 1);
      }
    }
    if (recoil > 0) recoil = Math.max(0, recoil - dt * 0.55);
    placeViewmodel();
    paint();
  }

  function render(renderer) {
    if (!isFirstPerson()) return;
    viewCamera.fov = camera.fov;
    viewCamera.aspect = camera.aspect;
    viewCamera.updateProjectionMatrix();
    const prev = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(viewScene, viewCamera);
    renderer.autoClear = prev;
  }

  // 在第一人称相机摆好之后调用，只抖一下，不改准星朝向
  function kick() {
    if (recoil > 0 && isFirstPerson()) camera.rotateX(recoil);
  }

  paint();
  return {
    update,
    kick,
    render,
    setVitals,
    refillAmmo,
    crosshairGap() { return shotSpread; },
  };
}
