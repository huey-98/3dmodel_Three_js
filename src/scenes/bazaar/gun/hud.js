// 弹药与血量 HUD 的 DOM 工厂，以及武器简图绘制。
export function createHudDom() {
  const font = '"Microsoft YaHei", sans-serif';
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
    `font:18px ${font}`,
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
  const readout = document.createElement('div');
  readout.style.cssText = 'display:flex;align-items:baseline;gap:6px';
  const magEl = document.createElement('div');
  magEl.style.cssText = 'font-size:28px;font-weight:700;line-height:1';
  const sepEl = document.createElement('div');
  sepEl.textContent = '/';
  sepEl.style.cssText = 'font-size:16px;opacity:.8';
  const reserveEl = document.createElement('div');
  reserveEl.style.cssText = 'font-size:16px;line-height:1';
  readout.append(magEl, sepEl, reserveEl);
  const killLine = document.createElement('div');
  killLine.style.cssText = 'font-size:13px;opacity:.9;letter-spacing:.5px;min-height:18px';
  hud.append(killLine, icon, bar, readout);
  document.body.appendChild(hud);

  const vitalsEl = document.createElement('div');
  vitalsEl.id = 'vitals';
  vitalsEl.style.cssText = [
    'position:fixed',
    'left:28px',
    'bottom:28px',
    'display:none',
    'flex-direction:column',
    'gap:8px',
    'pointer-events:none',
    'user-select:none',
    'z-index:5',
    `font:13px ${font}`,
    'color:#fff',
    'text-shadow:0 1px 2px rgba(0,0,0,.85)',
  ].join(';');
  const hpRow = vitalRow('血量', '#7CFF6B');
  const armorRow = vitalRow('护甲', '#8EB6FF');
  vitalsEl.append(hpRow.row, armorRow.row);
  document.body.appendChild(vitalsEl);

  function vitalRow(name, color) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px';
    const label = document.createElement('div');
    label.textContent = name;
    label.style.cssText = 'width:36px';
    const track = document.createElement('div');
    track.style.cssText = 'width:120px;height:8px;border-radius:2px;background:rgba(255,255,255,.22);overflow:hidden';
    const meter = document.createElement('div');
    meter.style.cssText = `width:100%;height:100%;background:${color};transition:width .12s linear`;
    track.appendChild(meter);
    const num = document.createElement('div');
    num.textContent = '100';
    num.style.cssText = 'font-size:18px;font-weight:700;min-width:32px';
    row.append(label, track, num);
    return { row, meter, num };
  }

  return { hud, icon, bar, fill, readout, magEl, sepEl, reserveEl, killLine, vitalsEl, hpRow, armorRow };
}

export function drawWeaponIcon(icon, kind) {
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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(8, 30);
    ctx.lineTo(14, 20);
    ctx.lineTo(22, 17);
    ctx.lineTo(26, 10);
    ctx.lineTo(40, 10);
    ctx.lineTo(48, 16);
    ctx.lineTo(104, 15);
    ctx.lineTo(112, 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(26, 10);
    ctx.lineTo(26, 15);
    ctx.stroke();
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(14, 22, 10, 4);
    ctx.fillRect(54, 23, 24, 3);
    ctx.fillRect(62, 26, 18, 3);
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(38, 21);
    ctx.quadraticCurveTo(46, 32, 58, 40);
    ctx.quadraticCurveTo(50, 30, 44, 21);
    ctx.stroke();
  } else if (kind === 'pistol') {
    ctx.beginPath();
    ctx.moveTo(28, 20);
    ctx.lineTo(58, 19);
    ctx.lineTo(58, 25);
    ctx.lineTo(48, 28);
    ctx.lineTo(42, 42);
    ctx.lineTo(30, 40);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = '#c5ccd4';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(58, 22);
    ctx.lineTo(112, 22);
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 19.5, 6, 5);
  } else {
    ctx.beginPath();
    ctx.moveTo(104, 8);
    ctx.lineTo(50, 18);
    ctx.lineTo(50, 8);
    ctx.lineTo(42, 8);
    ctx.lineTo(42, 20);
    ctx.lineTo(22, 26);
    ctx.lineTo(16, 20);
    ctx.lineTo(10, 30);
    ctx.lineTo(22, 32);
    ctx.lineTo(42, 28);
    ctx.lineTo(42, 40);
    ctx.lineTo(50, 40);
    ctx.lineTo(50, 30);
    ctx.closePath();
    ctx.fill();
  }
}
