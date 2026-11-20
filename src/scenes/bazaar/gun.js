import * as THREE from 'three';

// 只给荒漠迷城的第一人称用。1 步枪连发，2 手枪单点，3 匕首挥砍。
const RANGE = 48;
const KNIFE_REACH = 2.1;
const SWING_TIME = 0.34;
const WEAPONS = {
  rifle: { label: '步枪', mag: 30, auto: true, gap: 0.09, reload: 1.65, flame: 1, recoil: 0.028 },
  pistol: { label: '手枪', mag: 12, auto: false, gap: 0.2, reload: 1.3, flame: 0.55, recoil: 0.018 },
  knife: { label: '匕首', auto: false, gap: 0.42 },
};

const chipGeo = new THREE.BoxGeometry(0.035, 0.02, 0.05);
const holeGeo = new THREE.PlaneGeometry(0.18, 0.18);
const slashGeo = new THREE.PlaneGeometry(0.58, 0.05);
const FLAME_LEN = 0.4;
const flameGeo = new THREE.PlaneGeometry(FLAME_LEN, 0.12);
const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);
const aim = new THREE.Vector3();
const muzzle = new THREE.Vector3();
const hitPoint = new THREE.Vector3();
const hitNormal = new THREE.Vector3();
const gunMuzzle = new THREE.Vector3();
const flightDir = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const HOLE_LIFE = 3;
const TRACER_SPEED = 120;

function makeTracerGeo() {
  const geo = new THREE.BoxGeometry(0.007, 0.007, 1);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const head = new THREE.Color(0xfff7ea);
  const body = new THREE.Color(0xffb02e);
  const tail = new THREE.Color(0xff3a0e);
  const color = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = pos.getZ(i) + 0.5;
    if (t > 0.7) color.copy(head);
    else if (t > 0.25) color.copy(body);
    else color.copy(tail).multiplyScalar(t / 0.25);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

const tracerGeo = makeTracerGeo();

function canvasTex(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const flameMap = canvasTex(256, (ctx, s) => {
  ctx.clearRect(0, 0, s, s);
  const along = ctx.createLinearGradient(0, 0, s, 0);
  along.addColorStop(0, 'rgba(255,255,248,1)');
  along.addColorStop(0.16, 'rgba(255,236,160,1)');
  along.addColorStop(0.42, 'rgba(255,176,42,0.95)');
  along.addColorStop(0.72, 'rgba(255,72,18,0.7)');
  along.addColorStop(1, 'rgba(160,24,0,0)');
  ctx.fillStyle = along;
  ctx.fillRect(0, 0, s, s);
  const across = ctx.createLinearGradient(0, 0, 0, s);
  across.addColorStop(0, 'rgba(0,0,0,0)');
  across.addColorStop(0.5, 'rgba(0,0,0,1)');
  across.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalCompositeOperation = 'destination-in';
  ctx.fillStyle = across;
  ctx.fillRect(0, 0, s, s);
});

const holeMap = canvasTex(160, (ctx, s) => {
  const c = s / 2;
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = 'rgba(214,196,170,0.9)';
  ctx.beginPath();
  ctx.arc(c, c, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.arc(c, c, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0c0a08';
  ctx.beginPath();
  ctx.arc(c, c, 16, 0, Math.PI * 2);
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

const slashMap = canvasTex(256, (ctx, s) => {
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = 'rgba(28, 22, 18, 0.95)';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(18, s * 0.46);
  ctx.quadraticCurveTo(s * 0.45, s * 0.62, s - 16, s * 0.4);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(90, 78, 66, 0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(36, s * 0.58);
  ctx.quadraticCurveTo(s * 0.5, s * 0.7, s - 40, s * 0.52);
  ctx.stroke();
});

function noRaycast(mesh) {
  mesh.raycast = () => {};
  mesh.frustumCulled = false;
  return mesh;
}

export function createCarbine({ scene, camera, domElement, isFirstPerson, target }) {
  const ammo = { rifle: WEAPONS.rifle.mag, pistol: WEAPONS.pistol.mag };
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
  const effects = [];

  const blade = new THREE.Group();
  const bladeMetal = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.008, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xd7dbe2, metalness: 0.82, roughness: 0.28 }),
  );
  const bladeGrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.016, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x2c261f, roughness: 0.72 }),
  );
  bladeGrip.position.z = 0.2;
  blade.add(bladeMetal, bladeGrip);
  blade.visible = false;
  scene.add(blade);

  const flashLight = new THREE.PointLight(0xffa040, 0, 8, 2);
  scene.add(flashLight);

  const hud = document.createElement('div');
  hud.id = 'ammo';
  hud.style.cssText = [
    'position:fixed',
    'right:28px',
    'bottom:28px',
    'display:none',
    'flex-direction:column',
    'align-items:flex-end',
    'gap:6px',
    'pointer-events:none',
    'user-select:none',
    'z-index:5',
    'font:18px "Microsoft YaHei", sans-serif',
    'color:#fff',
    'text-shadow:0 1px 2px rgba(0,0,0,.85)',
  ].join(';');
  const icon = document.createElement('canvas');
  icon.width = 112;
  icon.height = 48;
  icon.style.cssText = 'display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.85))';
  const bar = document.createElement('div');
  bar.style.cssText = [
    'width:112px',
    'height:6px',
    'border-radius:3px',
    'background:rgba(255,255,255,.28)',
    'overflow:hidden',
    'display:none',
  ].join(';');
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;width:0;background:#fff';
  bar.appendChild(fill);
  const count = document.createElement('div');
  count.style.cssText = 'font-size:16px;letter-spacing:0.04em;line-height:1';
  hud.append(icon, bar, count);
  document.body.appendChild(hud);
  let drawn = '';

  function drawWeapon(kind) {
    const ctx = icon.getContext('2d');
    const w = icon.width;
    const h = icon.height;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 3;
    if (kind === 'rifle') {
      ctx.beginPath();
      ctx.moveTo(8, 30);
      ctx.lineTo(28, 22);
      ctx.lineTo(78, 20);
      ctx.lineTo(104, 18);
      ctx.moveTo(28, 22);
      ctx.lineTo(34, 38);
      ctx.lineTo(42, 38);
      ctx.lineTo(40, 24);
      ctx.stroke();
      ctx.fillRect(46, 22, 8, 16);
    } else if (kind === 'pistol') {
      ctx.beginPath();
      ctx.moveTo(28, 20);
      ctx.lineTo(86, 18);
      ctx.lineTo(86, 26);
      ctx.lineTo(48, 28);
      ctx.lineTo(42, 42);
      ctx.lineTo(30, 40);
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(18, 36);
      ctx.lineTo(46, 28);
      ctx.lineTo(100, 12);
      ctx.lineTo(96, 18);
      ctx.lineTo(48, 32);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#c8ccd2';
      ctx.stroke();
    }
  }

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

  function spec() {
    return WEAPONS[weapon];
  }

  function paint() {
    const active = isFirstPerson();
    hud.style.display = active ? 'flex' : 'none';
    if (!active) return;
    if (drawn !== weapon) {
      drawWeapon(weapon);
      drawn = weapon;
    }
    if (weapon === 'knife') {
      count.textContent = '';
      bar.style.display = 'none';
      return;
    }
    count.textContent = String(ammo[weapon]);
    count.style.color = ammo[weapon] === 0 && !reloading ? '#ffb4a8' : '#fff';
    if (reloading && reloadDuration > 0) {
      bar.style.display = 'block';
      const progress = 1 - reloadLeft / reloadDuration;
      fill.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
    } else {
      bar.style.display = 'none';
    }
  }

  function addEffect(mesh, life, extra = {}) {
    scene.add(mesh);
    effects.push({ mesh, life, max: life, ...extra });
  }

  function spawnFlame(start, dir, scale = 1) {
    const align = new THREE.Quaternion().setFromUnitVectors(xAxis, dir);
    for (let i = 0; i < 3; i++) {
      const tongue = noRaycast(new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({
        map: flameMap,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })));
      const twist = new THREE.Quaternion().setFromAxisAngle(dir, i * Math.PI / 3);
      tongue.quaternion.copy(align).premultiply(twist);
      tongue.scale.set(scale, scale, 1);
      tongue.position.copy(start).addScaledVector(dir, FLAME_LEN * scale * 0.5);
      addEffect(tongue, 1, { burst: true, frames: 0 });
    }
    flashLight.position.copy(start);
    flashLight.intensity = 24;
    burstFrames = 2;
  }

  function spawnTracer(start, dir, end) {
    const range = Math.max(0.3, start.distanceTo(end));
    const length = Math.min(0.9, range);
    const streak = noRaycast(new THREE.Mesh(tracerGeo, new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })));
    streak.scale.set(1, 1, length);
    streak.quaternion.setFromUnitVectors(zAxis, dir);
    const origin = start.clone();
    const flight = dir.clone();
    let traveled = length * 0.5;
    streak.position.copy(origin).addScaledVector(flight, traveled);
    addEffect(streak, 1, {
      tick(item, dt) {
        if (!item.shown) {
          item.shown = true;
          return;
        }
        traveled += TRACER_SPEED * dt;
        const center = Math.min(traveled, Math.max(length * 0.5, range - length * 0.5));
        item.mesh.position.copy(origin).addScaledVector(flight, center);
        if (traveled >= range) item.life = 0;
      },
    });
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

  function spawnSlash(point, normal) {
    const mat = new THREE.MeshBasicMaterial({
      map: slashMap,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
      side: THREE.DoubleSide,
    });
    const mark = noRaycast(new THREE.Mesh(slashGeo, mat));
    const align = new THREE.Quaternion().setFromUnitVectors(zAxis, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(normal, Math.random() * Math.PI);
    mark.quaternion.copy(align).premultiply(spin);
    mark.position.copy(point).addScaledVector(normal, 0.02);
    mark.scale.setScalar(0.85 + Math.random() * 0.3);
    addEffect(mark, HOLE_LIFE, { hold: true });
  }

  function spawnShot(start, dir, end, impacted, normal) {
    const item = spec();
    spawnFlame(start, dir, item.flame);
    spawnTracer(start, dir, end);
    if (impacted) spawnHole(end, normal);
    recoil = item.recoil;
    tone(weapon === 'pistol' ? 210 : 140, 0.09, weapon === 'pistol' ? 0.14 : 0.22, 'square');
  }

  function aimShot(reach) {
    camera.updateMatrixWorld();
    camera.getWorldDirection(aim);
    muzzle.copy(camera.position).addScaledVector(aim, 0.35);
    gunMuzzle.set(0.16, -0.14, -0.42).applyMatrix4(camera.matrixWorld);
    raycaster.set(weapon === 'knife' ? camera.position : muzzle, aim);
    raycaster.far = reach;
    const hits = raycaster.intersectObject(target, true);
    const hit = hits.find((item) => item.object.visible && item.face && item.distance > 0.2 && item.distance <= reach);
    if (hit) {
      hitPoint.copy(hit.point);
      hitNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize();
      if (hitNormal.dot(aim) > 0) hitNormal.negate();
    } else {
      hitPoint.copy(muzzle).addScaledVector(aim, reach);
    }
    return hit;
  }

  function placeBlade() {
    const t = 1 - swing / SWING_TIME;
    camera.updateMatrixWorld();
    gunMuzzle.set(0.46 - t * 0.92, -0.16 + Math.sin(t * Math.PI) * 0.12, -0.5);
    gunMuzzle.applyMatrix4(camera.matrixWorld);
    blade.position.copy(gunMuzzle);
    blade.quaternion.copy(camera.quaternion);
    blade.rotateZ(-1.2 + t * 2.4);
    blade.rotateX(0.45);
  }

  function tryFire() {
    if (!isFirstPerson() || gap > 0) return;
    if (weapon === 'knife') {
      gap = spec().gap;
      swing = SWING_TIME;
      blade.visible = true;
      tone(460, 0.08, 0.07, 'sawtooth');
      const hit = aimShot(KNIFE_REACH);
      if (hit) spawnSlash(hitPoint, hitNormal);
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
    const hit = aimShot(RANGE);
    flightDir.copy(hitPoint).sub(gunMuzzle);
    if (flightDir.lengthSq() < 1e-6) flightDir.copy(aim);
    flightDir.normalize();
    spawnShot(gunMuzzle, flightDir, hitPoint, Boolean(hit), hitNormal);
    if (ammo[weapon] === 0) tryReload();
    paint();
  }

  function tryReload() {
    if (!isFirstPerson() || weapon === 'knife' || reloading) return;
    const item = spec();
    if (ammo[weapon] === item.mag) return;
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
    dryPlayed = false;
    if (next !== 'knife' && ammo[next] === 0) tryReload();
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

  function update(dt) {
    gap = Math.max(0, gap - dt);
    if (!isFirstPerson()) {
      holding = false;
      swing = 0;
      blade.visible = false;
    } else if (holding && spec().auto) {
      tryFire();
    }
    if (swing > 0) {
      swing = Math.max(0, swing - dt);
      placeBlade();
      blade.visible = swing > 0;
    }
    if (reloading) {
      reloadLeft -= dt;
      if (reloadLeft <= 0) {
        reloading = false;
        ammo[weapon] = spec().mag;
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
