import * as THREE from 'three';

// 第一人称切换。进入时记下轨道镜头相对目标的偏移，退出时按当前目标还原。
const PITCH_LIMIT = Math.PI / 2 - 0.02;

export function createFirstPersonView({ camera, domElement, controls, subject, getLookScale }) {
  let active = false;
  let yaw = 0;
  let pitch = 0;
  let lastX = null;
  let lastY = null;
  const savedOffset = new THREE.Vector3();
  const look = new THREE.Vector3();
  const facing = new THREE.Vector3();
  const worldQuat = new THREE.Quaternion();

  const crosshair = document.createElement('div');
  crosshair.id = 'crosshair';
  crosshair.setAttribute('aria-hidden', 'true');
  crosshair.style.cssText = [
    'position:fixed',
    'left:50%',
    'top:50%',
    'width:18px',
    'height:18px',
    'transform:translate(-50%,-50%)',
    'pointer-events:none',
    'display:none',
    'z-index:5',
  ].join(';');
  const ticks = [
    [0, 8, 6, 2],
    [12, 8, 6, 2],
    [8, 0, 2, 6],
    [8, 12, 2, 6],
  ];
  for (const [x, y, w, h] of ticks) {
    const tick = document.createElement('div');
    tick.style.cssText = [
      'position:absolute',
      `left:${x}px`,
      `top:${y}px`,
      `width:${w}px`,
      `height:${h}px`,
      'background:#fff',
      'box-shadow:0 0 0 1px rgba(0,0,0,.8)',
    ].join(';');
    crosshair.appendChild(tick);
  }
  document.body.appendChild(crosshair);

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
    active = true;
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
    camera.position.copy(controls.target).add(savedOffset);
    controls.update();
    syncCursor();
    if (document.pointerLockElement === domElement) document.exitPointerLock();
  }

  function apply(eyeWorld) {
    if (!active) return false;
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
  };
}
