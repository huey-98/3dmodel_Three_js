import * as THREE from 'three';

// 只给荒漠迷城的第一人称用。弹夹 30 发，打空后按 R 重新装满。
const MAG = 30;
const FIRE_GAP = 0.09;
const RELOAD_TIME = 1.65;
const RANGE = 48;

const tracerGeo = new THREE.BoxGeometry(0.045, 0.045, 1);
const chipGeo = new THREE.BoxGeometry(0.035, 0.02, 0.05);
const holeGeo = new THREE.PlaneGeometry(0.36, 0.36);
const zAxis = new THREE.Vector3(0, 0, 1);
const aim = new THREE.Vector3();
const muzzle = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const hitNormal = new THREE.Vector3();
const flashAnchor = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const FLASH_LIFE = 0.2;
const HOLE_LIFE = 3;

function canvasTex(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const flameMap = canvasTex(128, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,245,1)');
  g.addColorStop(0.18, 'rgba(255,214,90,0.95)');
  g.addColorStop(0.42, 'rgba(255,110,24,0.62)');
  g.addColorStop(1, 'rgba(255,40,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
});

const holeMap = canvasTex(160, (ctx, s) => {
  const c = s / 2;
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(92,74,54,0.55)';
  ctx.beginPath();
  ctx.arc(c, c, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(48,36,28,0.78)';
  ctx.beginPath();
  ctx.arc(c, c, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1410';
  ctx.beginPath();
  ctx.arc(c, c, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(28,20,14,0.9)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const len = 46 + (i % 3) * 12;
    ctx.beginPath();
    ctx.moveTo(c + Math.cos(a) * 12, c + Math.sin(a) * 12);
    ctx.lineTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(168,150,128,0.8)';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.fillRect(c + Math.cos(a) * 24 - 3, c + Math.sin(a) * 24 - 2, 7, 4);
  }
});

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
  let flashLife = 0;
  const effects = [];

  const flashMat = new THREE.SpriteMaterial({
    map: flameMap,
    color: 0xfff4d2,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const coreMat = flashMat.clone();
  coreMat.color.setHex(0xffffff);
  const flash = new THREE.Sprite(flashMat);
  const core = new THREE.Sprite(coreMat);
  flash.visible = false;
  core.visible = false;
  scene.add(flash, core);

  const flashLight = new THREE.PointLight(0xffb45a, 0, 10, 2);
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

  function addEffect(mesh, life, extra = {}) {
    scene.add(mesh);
    effects.push({ mesh, life, max: life, ...extra });
  }

  function placeFlash() {
    camera.updateMatrixWorld();
    flashAnchor.set(0.1, -0.16, -0.62);
    camera.localToWorld(flashAnchor);
    flash.position.copy(flashAnchor);
    core.position.copy(flashAnchor);
    flashLight.position.copy(flashAnchor);
  }

  function spawnMuzzle() {
    flashLife = FLASH_LIFE;
    flash.visible = true;
    core.visible = true;
    const spread = 0.85 + Math.random() * 0.35;
    flash.scale.set(0.52 * spread, 0.52 * spread, 1);
    core.scale.set(0.18 * spread, 0.18 * spread, 1);
    flashMat.rotation = Math.random() * Math.PI;
    flashMat.opacity = 1;
    coreMat.opacity = 1;
    placeFlash();
    flashLight.intensity = 28;
  }

  function spawnHole(point, normal) {
    const mat = new THREE.MeshBasicMaterial({
      map: holeMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
    const hole = noRaycast(new THREE.Mesh(holeGeo, mat));
    const align = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, Math.random() * Math.PI * 2);
    hole.quaternion.copy(align).premultiply(spin);
    hole.position.copy(point).addScaledVector(normal, 0.025);
    hole.scale.setScalar(0.85 + Math.random() * 0.35);
    addEffect(hole, HOLE_LIFE, { hold: true });

    for (let i = 0; i < 5; i++) {
      const chip = noRaycast(new THREE.Mesh(
        chipGeo,
        new THREE.MeshStandardMaterial({
          color: i % 2 ? 0x6a5344 : 0x2a211c,
          roughness: 0.9,
          transparent: true,
        }),
      ));
      chip.position.copy(point).addScaledVector(normal, 0.04);
      chip.rotation.set(Math.random(), Math.random(), Math.random());
      const velocity = normal.clone().multiplyScalar(1.4 + Math.random() * 1.6);
      velocity.x += (Math.random() - 0.5) * 1.8;
      velocity.z += (Math.random() - 0.5) * 1.8;
      addEffect(chip, 0.55, {
        tick(item, dt) {
          velocity.y -= 9 * dt;
          item.mesh.position.addScaledVector(velocity, dt);
          item.mesh.rotation.x += dt * 8;
        },
      });
    }
  }

  function spawnShot(start, dir, end, impacted, normal) {
    spawnMuzzle();

    const tracer = noRaycast(new THREE.Mesh(tracerGeo, additive(0xfff0c2)));
    const length = Math.max(0.2, start.distanceTo(end));
    tracer.position.copy(start).lerp(end, 0.5);
    tracer.scale.z = length;
    tracer.quaternion.setFromUnitVectors(zAxis, dir);
    addEffect(tracer, 0.12);

    if (impacted) spawnHole(end, normal);

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
    const hit = hits.find((item) => item.object.visible && item.face && item.distance > 0.2);
    if (hit) {
      hitPoint.copy(hit.point);
      hitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      if (hitNormal.dot(aim) > 0) hitNormal.negate();
    } else {
      hitPoint.copy(muzzle).addScaledVector(aim, RANGE);
    }
    spawnShot(muzzle, aim, hitPoint, Boolean(hit), hitNormal);
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
    if (flashLife > 0) {
      flashLife = Math.max(0, flashLife - dt);
      const k = flashLife / FLASH_LIFE;
      flashMat.opacity = k;
      coreMat.opacity = k;
      flash.scale.multiplyScalar(1 + dt * 2.2);
      placeFlash();
      flashLight.intensity = 28 * k;
      if (flashLife === 0) {
        flash.visible = false;
        core.visible = false;
        flashLight.intensity = 0;
      }
    }
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i];
      effect.life -= dt;
      if (effect.tick) effect.tick(effect, dt);
      const fade = effect.hold ? 0.35 : effect.max;
      const left = effect.hold ? Math.min(effect.life, fade) : effect.life;
      effect.mesh.material.opacity = Math.max(0, left / fade);
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
