import * as THREE from 'three';

// 只给荒漠迷城的第一人称用。弹夹 30 发，打空后按 R 重新装满。
const MAG = 30;
const FIRE_GAP = 0.09;
const RELOAD_TIME = 1.65;
const RANGE = 48;

const tracerGeo = new THREE.BoxGeometry(0.02, 0.02, 1);
const flashGeo = new THREE.SphereGeometry(0.08, 8, 6);
const sparkGeo = new THREE.SphereGeometry(0.06, 8, 6);
const zAxis = new THREE.Vector3(0, 0, 1);
const aim = new THREE.Vector3();
const muzzle = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

function additive(color) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

function noRaycast(mesh) {
  mesh.raycast = () => {};
  mesh.frustumCulled = false;
  return mesh;
}

export function createCarbine({ scene, camera, domElement, isFirstPerson, target }) {
  let ammo = MAG;
  let gap = 0;
  let reloading = false;
  let reloadLeft = 0;
  let recoil = 0;
  const effects = [];

  const flashLight = new THREE.PointLight(0xffe2b0, 0, 7, 2);
  scene.add(flashLight);

  const hud = document.createElement('div');
  hud.id = 'ammo';
  hud.style.cssText = [
    'position:fixed',
    'right:28px',
    'bottom:28px',
    'color:#fff',
    'font:22px "Microsoft YaHei", sans-serif',
    'letter-spacing:0.04em',
    'text-shadow:0 1px 2px rgba(0,0,0,.85)',
    'pointer-events:none',
    'user-select:none',
    'z-index:5',
    'display:none',
  ].join(';');
  document.body.appendChild(hud);

  let audio;
  function tone(freq, dur, gainValue, type) {
    try {
      if (!audio) audio = new AudioContext();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.35), t + dur);
      gain.gain.setValueAtTime(gainValue, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // 没有音频设备时仍然可以开火
    }
  }

  function paint() {
    const active = isFirstPerson();
    hud.style.display = active ? 'block' : 'none';
    if (!active) return;
    hud.textContent = reloading ? `换弹 ${ammo}` : `${ammo} / ${MAG}`;
    hud.style.color = ammo === 0 && !reloading ? '#ffb4a8' : '#fff';
  }

  function addEffect(mesh, life) {
    scene.add(mesh);
    effects.push({ mesh, life, max: life });
  }

  function spawnShot(start, dir, end, impacted) {
    const flash = noRaycast(new THREE.Mesh(flashGeo, additive(0xfff0c8)));
    flash.position.copy(start);
    addEffect(flash, 0.045);

    const tracer = noRaycast(new THREE.Mesh(tracerGeo, additive(0xffc56a)));
    const length = Math.max(0.2, start.distanceTo(end));
    tracer.position.copy(start).lerp(end, 0.5);
    tracer.scale.z = length;
    tracer.quaternion.setFromUnitVectors(zAxis, dir);
    addEffect(tracer, 0.07);

    if (impacted) {
      const spark = noRaycast(new THREE.Mesh(sparkGeo, additive(0xffb15a)));
      spark.position.copy(end);
      addEffect(spark, 0.12);
    }

    flashLight.position.copy(start);
    flashLight.intensity = 6;
    recoil = 0.028;
    tone(140, 0.09, 0.22, 'square');
  }

  function tryFire() {
    if (!isFirstPerson() || reloading || gap > 0) return;
    if (ammo <= 0) {
      gap = 0.2;
      tone(70, 0.04, 0.08, 'square');
      paint();
      return;
    }
    ammo -= 1;
    gap = FIRE_GAP;
    camera.getWorldDirection(aim);
    muzzle.copy(camera.position).addScaledVector(aim, 0.45);
    raycaster.set(muzzle, aim);
    raycaster.far = RANGE;
    const hits = raycaster.intersectObject(target, true);
    const hit = hits.find((item) => item.object.visible && item.distance > 0.2);
    if (hit) hitPoint.copy(hit.point);
    else hitPoint.copy(muzzle).addScaledVector(aim, RANGE);
    spawnShot(muzzle, aim, hitPoint, Boolean(hit));
    paint();
  }

  function tryReload() {
    if (!isFirstPerson() || reloading || ammo === MAG) return;
    reloading = true;
    reloadLeft = RELOAD_TIME;
    tone(220, 0.06, 0.1, 'triangle');
    paint();
  }

  domElement.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    tryFire();
  });
  addEventListener('keydown', (event) => {
    if (event.repeat || event.code !== 'KeyR') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    tryReload();
  });

  function update(dt) {
    gap = Math.max(0, gap - dt);
    if (reloading) {
      reloadLeft -= dt;
      if (reloadLeft <= 0) {
        reloading = false;
        ammo = MAG;
        tone(320, 0.05, 0.08, 'triangle');
      }
    }
    flashLight.intensity = Math.max(0, flashLight.intensity - dt * 90);
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      effect.life -= dt;
      effect.mesh.material.opacity = Math.max(0, effect.life / effect.max);
      if (effect.life <= 0) {
        scene.remove(effect.mesh);
        effect.mesh.material.dispose();
        effects.splice(i, 1);
      }
    }
    if (recoil > 0) recoil = Math.max(0, recoil - dt * 0.55);
    paint();
  }

  // 在第一人称相机摆好之后调用，只抖一下，不改准星朝向
  function kick() {
    if (recoil > 0 && isFirstPerson()) camera.rotateX(recoil);
  }

  paint();
  return { update, kick };
}
