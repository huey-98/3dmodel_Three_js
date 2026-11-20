import * as THREE from 'three';

// 第一人称切换。进入时记下轨道镜头相对目标的偏移，退出时按当前目标还原。
const PITCH_LIMIT = Math.PI / 2 - 0.02;

export function createFirstPersonView({ camera, domElement, controls, subject, getLookScale, getFov }) {
  let active = false;
  let yaw = 0;
  let pitch = 0;
  let lastX = null;
  let lastY = null;
  const savedOffset = new THREE.Vector3();
  const look = new THREE.Vector3();
  const facing = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();
  let savedFov = camera.fov;
  let spread = 0;

  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  crosshair.setAttribute('aria-hidden', 'true');
  crosshair.style.cssText = [
    'position:fixed',
    'left:50%',
    'top:50%',
    'transform:translate(-50%,-50%)',
    'pointer-events:none',
    'display:none',
    'z-index:5',
  ].join(';');
  const tickNodes = [];
  for (let i = 0; i < 4; i++) {
    const tick = document.createElement('div');
    tick.style.cssText = [
      'position:absolute',
      'background:#3ddc6a',
      'box-shadow:0 0 0 1px rgba(0,0,0,.85)',
    ].join(';');
    tickNodes.push(tick);
    crosshair.appendChild(tick);
  }
  const centerDot = document.createElement('div');
  centerDot.style.cssText = [
    'position:absolute',
    'background:#3ddc6a',
    'box-shadow:0 0 0 1px rgba(0,0,0,.85)',
    'border-radius:50%',
  ].join(';');
  crosshair.appendChild(centerDot);
  document.body.appendChild(crosshair);
  layoutCrosshair();

  function layoutCrosshair() {
    const gap = 5 + spread;
    const arm = 8;
    const thick = 2;
    const size = (gap + arm) * 2;
    crosshair.style.width = `${size}px`;
    crosshair.style.height = `${size}px`;
    const mid = size / 2;
    const specs = [
      [mid - gap - arm, mid - thick / 2, arm, thick],
      [mid + gap, mid - thick / 2, arm, thick],
      [mid - thick / 2, mid - gap - arm, thick, arm],
      [mid - thick / 2, mid + gap, thick, arm],
    ];
    tickNodes.forEach((tick, i) => {
      const [x, y, w, h] = specs[i];
      tick.style.left = `${x}px`;
      tick.style.top = `${y}px`;
      tick.style.width = `${w}px`;
      tick.style.height = `${h}px`;
    });
    const dot = 3;
    centerDot.style.left = `${mid - dot / 2}px`;
    centerDot.style.top = `${mid - dot / 2}px`;
    centerDot.style.width = `${dot}px`;
    centerDot.style.height = `${dot}px`;
  }

  function clampPitch() {
    pitch = THREE.MathUtils.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
  }

  function applyLookDelta(dx, dy) {
    const sens = 0.0026 * lookScale();
    yaw -= dx * sens;
    pitch -= dy * sens;
    clampPitch();
  }

  function lookScale() {
    const value = getLookScale ? getLookScale() : 1;
    return Number.isFinite(value) && value > 0 ? value : 1;
  }

  function syncCursor() {
    const locked = document.pointerLockElement === domElement;
    domElement.style.cursor = active && !locked ? 'crosshair' : '';
  }

  function onMouseMove(event) {
    if (!active) return;
    if (document.pointerLockElement === domElement) {
      applyLookDelta(event.movementX, event.movementY);
      return;
    }
    if (event.target !== domElement) {
      lastX = null;
      lastY = null;
      return;
    }
    if (lastX == null) {
      lastX = event.clientX;
      lastY = event.clientY;
      return;
    }
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    if (Math.abs(dx) > 150 || Math.abs(dy) > 150) return;
    applyLookDelta(dx, dy);
  }

  function requestLock() {
    if (typeof domElement.requestPointerLock !== 'function') return;
    try {
      const pending = domElement.requestPointerLock();
      if (pending && typeof pending.catch === 'function') pending.catch(() => {});
    } catch {
      // 没有用户手势时，部分浏览器会直接抛错；这时仍可用画面内的鼠标位移转向
    }
  }

  document.addEventListener('mousemove', onMouseMove);
  domElement.addEventListener('mouseleave', () => {
    lastX = null;
    lastY = null;
  });
  domElement.addEventListener('click', () => {
    if (active && document.pointerLockElement !== domElement) requestLock();
  });
  document.addEventListener('pointerlockchange', () => {
    lastX = null;
    lastY = null;
    syncCursor();
  });

  addEventListener('keydown', (event) => {
    if (event.repeat || event.code !== 'KeyV') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (active) exit();
    else enter();
  });

  function setSubjectVisible(visible) {
    if (subject) subject.visible = visible;
  }

  // 指针锁定解开时浏览器会补发一次很大的鼠标移动。若轨道控制还停在拖拽状态，这次移动会把俯仰甩到贴地。
  function releaseOrbitDrag() {
    controls.state = -1;
    if (controls._pointers) controls._pointers.length = 0;
    if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0);
    if (controls._panOffset) controls._panOffset.set(0, 0, 0);
    controls._scale = 1;
    const doc = domElement.ownerDocument;
    if (controls._onPointerMove) doc.removeEventListener('pointermove', controls._onPointerMove);
    if (controls._onPointerUp) doc.removeEventListener('pointerup', controls._onPointerUp);
  }

  function fovValue() {
    const value = getFov ? getFov() : camera.fov;
    return Number.isFinite(value) ? THREE.MathUtils.clamp(value, 50, 120) : camera.fov;
  }

  function applyFov() {
    if (!getFov) return;
    const next = fovValue();
    if (Math.abs(camera.fov - next) < 0.01) return;
    camera.fov = next;
    camera.updateProjectionMatrix();
  }

  function enter() {
    savedOffset.copy(camera.position).sub(controls.target);
    if (savedOffset.lengthSq() < 0.25) savedOffset.set(3.5, 2.2, 5);
    // 角色局部 +Z 是面朝方向。第一人称改成平视这个方向，不沿用轨道镜头的俯角。
    if (subject) {
      subject.getWorldQuaternion(worldQuat);
      facing.set(0, 0, 1).applyQuaternion(worldQuat);
      if (Math.hypot(facing.x, facing.z) > 1e-4) {
        yaw = Math.atan2(-facing.x, -facing.z);
      }
      pitch = 0;
    } else {
      const horiz = Math.hypot(savedOffset.x, savedOffset.z);
      pitch = Math.atan2(-savedOffset.y, horiz || 1);
      if (horiz > 1e-4) yaw = Math.atan2(savedOffset.x, savedOffset.z);
    }
    clampPitch();
    releaseOrbitDrag();
    savedFov = camera.fov;
    active = true;
    applyFov();
    controls.enabled = false;
    setSubjectVisible(false);
    crosshair.style.display = 'block';
    lastX = null;
    lastY = null;
    syncCursor();
    requestLock();
  }

  function exit() {
    active = false;
    releaseOrbitDrag();
    controls.enabled = true;
    setSubjectVisible(true);
    crosshair.style.display = 'none';
    lastX = null;
    lastY = null;
    camera.up.set(0, 1, 0);
    if (getFov) {
      camera.fov = savedFov;
      camera.updateProjectionMatrix();
    }
    camera.position.copy(controls.target).add(savedOffset);
    controls.update();
    syncCursor();
    if (document.pointerLockElement === domElement) document.exitPointerLock();
  }

  function apply(eyeWorld) {
    if (!active) return false;
    applyFov();
    const cp = Math.cos(pitch);
    look.set(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
    camera.position.copy(eyeWorld);
    camera.up.set(0, 1, 0);
    camera.lookAt(eyeWorld.x + look.x, eyeWorld.y + look.y, eyeWorld.z + look.z);
    return true;
  }

  function facingYaw() {
    return Math.atan2(-Math.sin(yaw), -Math.cos(yaw));
  }

  function addYaw(delta) {
    yaw += delta;
  }

  // 第三人称下一次恢复时使用的相机位置，相对轨道目标
  function setReturnOffset(px, py, pz, tx, ty, tz) {
    savedOffset.set(px - tx, py - ty, pz - tz);
  }

  return {
    isActive() { return active; },
    apply,
    facingYaw,
    addYaw,
    setReturnOffset,
    setCrosshairSpread(extra) {
      const next = Math.max(0, Math.min(40, Number(extra) || 0));
      if (next === spread) return;
      spread = next;
      layoutCrosshair();
    },
  };
}
