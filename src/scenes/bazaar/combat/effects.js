import * as THREE from 'three';

// 敌人侧的曳光、尘土、枪口闪光与伤害数字。特效数组与闪光灯光由工厂内部持有。
const TRACER_SPEED = 120;

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

export function createCombatEffects({ scene }) {
  const effects = [];
  const damageNumbers = [];
  let flashLight = null;
  const zAxis = new THREE.Vector3(0, 0, 1);

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

  function dispose() {
    for (const fx of effects) fx.mesh.removeFromParent();
    effects.length = 0;
  }

  return { tickEffects, spawnDust, spawnTracer, spawnMuzzleLight, spawnDamageNumber, dispose };
}
