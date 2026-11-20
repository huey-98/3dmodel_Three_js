// 别墅和荒漠迷城共用的移动速度、鼠标灵敏度。数值记在 localStorage。
const STORAGE_KEY = '3dmodel.playSettings';
const MOVE_MIN = 0.5;
const MOVE_MAX = 2.5;
const LOOK_MIN = 0.25;
const LOOK_MAX = 3;

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      moveScale: clamp(raw.moveScale, MOVE_MIN, MOVE_MAX, 1),
      lookScale: clamp(raw.lookScale, LOOK_MIN, LOOK_MAX, 1),
    };
  } catch {
    return { moveScale: 1, lookScale: 1 };
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式等环境写不进本地存储时，本次会话内的滑杆仍然有效
  }
}

export function createPlaySettings() {
  const state = load();
  const font = '"Microsoft YaHei", sans-serif';

  const corner = document.createElement('div');
  corner.style.cssText = [
    'position:absolute',
    'top:12px',
    'right:12px',
    'z-index:6',
    'display:flex',
    'flex-direction:column',
    'align-items:flex-end',
    'gap:8px',
    `font-family:${font}`,
  ].join(';');

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:8px;align-items:center';

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '设置';
  button.setAttribute('aria-expanded', 'false');
  button.style.cssText = [
    'color:#fff',
    'font:13px "Microsoft YaHei", sans-serif',
    'background:rgba(0,0,0,.55)',
    'padding:8px 12px',
    'border-radius:8px',
    'border:0',
    'cursor:pointer',
  ].join(';');

  const panel = document.createElement('div');
  panel.style.cssText = [
    'color:#fff',
    'font-size:13px',
    'line-height:1.4',
    'background:rgba(0,0,0,.72)',
    'padding:12px 14px',
    'border-radius:8px',
    'width:220px',
    'display:none',
    'flex-direction:column',
    'gap:12px',
    'user-select:none',
  ].join(';');

  addSlider(panel, '移动速度', state.moveScale, MOVE_MIN, MOVE_MAX, (scale) => {
    state.moveScale = scale;
    save(state);
  });
  addSlider(panel, '鼠标灵敏度', state.lookScale, LOOK_MIN, LOOK_MAX, (scale) => {
    state.lookScale = scale;
    save(state);
  });

  button.addEventListener('click', () => {
    const open = panel.style.display === 'none';
    panel.style.display = open ? 'flex' : 'none';
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (document.pointerLockElement) document.exitPointerLock();
  });

  const home = document.getElementById('home');
  if (home) home.style.position = 'static';
  row.append(button);
  if (home) row.append(home);
  corner.append(row, panel);
  document.body.append(corner);

  return {
    moveScale() { return state.moveScale; },
    lookScale() { return state.lookScale; },
  };
}

function addSlider(panel, name, scale, min, max, onChange) {
  const label = document.createElement('label');
  label.style.cssText = 'display:flex;flex-direction:column;gap:6px;cursor:pointer';
  const title = document.createElement('span');
  title.style.cssText = 'display:flex;justify-content:space-between';
  const caption = document.createElement('span');
  caption.textContent = name;
  const value = document.createElement('span');
  title.append(caption, value);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(Math.round(min * 100));
  input.max = String(Math.round(max * 100));
  input.step = '5';
  input.value = String(Math.round(scale * 100));
  input.style.cssText = 'width:100%;accent-color:#9ecbff;margin:0';
  const show = () => {
    value.textContent = `${input.value}%`;
  };
  show();
  input.addEventListener('input', () => {
    show();
    onChange(Number(input.value) / 100);
  });
  label.append(title, input);
  panel.append(label);
}
