import * as THREE from 'three';

// 荒漠迷城的全部程序化贴图绘制：固定种子随机、canvas 工具与各 draw* 函数，以及通用材质构造 mapped。
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeTex(size, draw, { repeat = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  return tex;
}

export function makeRectTex(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawStucco(ctx, s, base, dark, light, peel) {
  const rnd = mulberry32(base.length * 97 + base.charCodeAt(1));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 42; i++) {
    ctx.globalAlpha = 0.16 + rnd() * 0.28;
    ctx.fillStyle = rnd() > 0.45 ? dark : light;
    const x = rnd() * s;
    const y = rnd() * s;
    ctx.beginPath();
    ctx.ellipse(x, y, 12 + rnd() * 54, 8 + rnd() * 36, rnd() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = dark;
  for (let i = 0; i < 16; i++) {
    const x = rnd() * s;
    ctx.lineWidth = 1 + rnd() * 2.5;
    ctx.beginPath();
    ctx.moveTo(x, rnd() * s * 0.25);
    ctx.lineTo(x + (rnd() - 0.5) * 16, s);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(50, 36, 24, 0.38)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) {
    let x = rnd() * s;
    let y = rnd() * s;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (rnd() - 0.5) * 46;
      y += rnd() * 28;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  if (peel) {
    ctx.fillStyle = peel;
    for (let i = 0; i < 7; i++) {
      ctx.globalAlpha = 0.88;
      const x = rnd() * s;
      const y = rnd() * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < 6; k++) ctx.lineTo(x + (rnd() - 0.5) * 78, y + (rnd() - 0.5) * 52);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 280; i++) {
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = rnd() > 0.5 ? '#000' : '#fff';
    ctx.fillRect(rnd() * s, rnd() * s, 2, 2);
  }
  ctx.globalAlpha = 1;
}

export function drawCobble(ctx, s) {
  const rnd = mulberry32(42);
  ctx.fillStyle = '#7a6640';
  ctx.fillRect(0, 0, s, s);
  const n = 4;
  const gap = Math.max(4, s * 0.02);
  const cell = s / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = i * cell + gap * 0.5;
      const y = j * cell + gap * 0.5;
      const tw = cell - gap;
      const th = cell - gap;
      const tone = 188 + Math.floor(rnd() * 32);
      const r = tone;
      const g = tone - 24 - ((rnd() * 10) | 0);
      const b = Math.max(48, tone - 92 - ((rnd() * 12) | 0));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      roundRect(ctx, x, y, tw, th, 5);
      ctx.fill();
    }
  }
}

export function drawTile(ctx, s) {
  const rnd = mulberry32(77);
  ctx.fillStyle = '#6f7370';
  ctx.fillRect(0, 0, s, s);
  const n = 4;
  const gap = Math.max(2, s * 0.012);
  const cell = s / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const tone = 196 + Math.floor(rnd() * 22);
      ctx.fillStyle = `rgb(${tone}, ${tone + 2}, ${tone - 2})`;
      ctx.fillRect(i * cell + gap / 2, j * cell + gap / 2, cell - gap, cell - gap);
      for (let k = 0; k < 5; k++) {
        ctx.globalAlpha = 0.05 + rnd() * 0.06;
        ctx.fillStyle = rnd() > 0.5 ? '#8a8f8a' : '#ffffff';
        ctx.beginPath();
        ctx.ellipse(i * cell + rnd() * cell, j * cell + rnd() * cell, 4 + rnd() * 14, 3 + rnd() * 10, rnd() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}

export function drawGraffiti(ctx, w, h) {
  const rnd = mulberry32(31);
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#2f7a36';
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.55 + rnd() * 0.4;
    ctx.lineWidth = 8 + rnd() * 16;
    ctx.beginPath();
    let x = w * (0.12 + rnd() * 0.2);
    let y = h * (0.2 + rnd() * 0.6);
    ctx.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += w * (0.1 + rnd() * 0.18);
      y += (rnd() - 0.5) * h * 0.5;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function drawStone(ctx, s) {
  const rnd = mulberry32(55);
  ctx.fillStyle = '#8f8474';
  ctx.fillRect(0, 0, s, s);
  const rows = 5;
  const h = s / rows;
  for (let j = 0; j < rows; j++) {
    const offset = (j % 2) * (s / 6);
    for (let i = -1; i < 4; i++) {
      const w = s / 3;
      const x = i * w + offset;
      const tone = 196 + Math.floor(rnd() * 26);
      ctx.fillStyle = `rgb(${tone}, ${tone - 10}, ${tone - 30})`;
      ctx.fillRect(x + 3, j * h + 3, w - 6, h - 6);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = rnd() > 0.5 ? '#6f6455' : '#ffffff';
      ctx.fillRect(x + 3 + rnd() * (w - 20), j * h + 3 + rnd() * (h - 12), 8 + rnd() * 20, 4 + rnd() * 8);
      ctx.globalAlpha = 1;
    }
  }
}

export function drawAMark(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#c8201a';
  ctx.font = `bold ${Math.floor(h * 0.6)}px "Arial Black", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('A', w * 0.08, h * 0.9);
  ctx.strokeStyle = '#c8201a';
  ctx.lineWidth = h * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h * 0.4);
  ctx.lineTo(w * 0.84, h * 0.16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.84, h * 0.16);
  ctx.lineTo(w * 0.66, h * 0.15);
  ctx.moveTo(w * 0.84, h * 0.16);
  ctx.lineTo(w * 0.76, h * 0.32);
  ctx.stroke();
}

export function drawSign(ctx, w, h) {
  ctx.fillStyle = '#2e5f8a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#dfe8ee';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = '#e8eef2';
  ctx.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.1);
  ctx.fillRect(w * 0.15, h * 0.42, w * 0.55, h * 0.08);
  ctx.fillRect(w * 0.15, h * 0.6, w * 0.62, h * 0.08);
}

export function drawPanel(ctx, s) {
  const rnd = mulberry32(11);
  ctx.fillStyle = '#dcc6a4';
  ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 20; i++) {
    ctx.globalAlpha = 0.12 + rnd() * 0.15;
    ctx.fillStyle = rnd() > 0.5 ? '#c2a67c' : '#ead8b8';
    ctx.fillRect(rnd() * s, rnd() * s, 20 + rnd() * 80, 10 + rnd() * 40);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(90, 62, 36, 0.45)';
  ctx.lineWidth = 3;
  for (let i = 1; i < 4; i++) {
    const x = (i * s) / 4 + (rnd() - 0.5) * 4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, s);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, s * 0.48);
  ctx.lineTo(s, s * 0.52);
  ctx.stroke();
  ctx.fillStyle = 'rgba(70, 50, 30, 0.35)';
  for (let i = 0; i < 18; i++) ctx.fillRect(rnd() * s, rnd() * s, 3, 3);
}

export function drawWood(ctx, s) {
  const rnd = mulberry32(3);
  ctx.fillStyle = '#b9b1a6';
  ctx.fillRect(0, 0, s, s);
  const rows = 5;
  const h = s / rows;
  for (let i = 0; i < rows; i++) {
    const y = i * h;
    const tone = 168 + ((i * 17) % 5) * 12;
    ctx.fillStyle = `rgb(${tone}, ${tone - 6}, ${tone - 12})`;
    ctx.fillRect(0, y + 2, s, h - 4);
    ctx.strokeStyle = 'rgba(80, 60, 40, 0.18)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 3; g++) {
      const yy = y + 8 + g * 14;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(s * 0.3, yy + 6, s * 0.6, yy - 5, s, yy + 2);
      ctx.stroke();
    }
    if (rnd() > 0.4) {
      ctx.fillStyle = 'rgba(90, 60, 30, 0.18)';
      ctx.beginPath();
      ctx.ellipse(rnd() * s, y + h * 0.5, 8 + rnd() * 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawTarp(ctx, s, withHole) {
  const rnd = mulberry32(21);
  ctx.fillStyle = '#66783f';
  ctx.fillRect(0, 0, s, s);
  const cols = 3;
  const rows = 2;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i * s) / cols;
      const y = (j * s) / rows;
      const g = 78 + ((i + j * 3) % 4) * 14;
      ctx.fillStyle = `rgb(${g + 8}, ${g + 22}, ${g - 28})`;
      ctx.fillRect(x + 3, y + 3, s / cols - 6, s / rows - 6);
    }
  }
  ctx.strokeStyle = 'rgba(40, 48, 24, 0.55)';
  ctx.lineWidth = 4;
  for (let i = 1; i < cols; i++) {
    ctx.beginPath();
    ctx.moveTo((i * s) / cols, 0);
    ctx.lineTo((i * s) / cols, s);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, s / 2);
  ctx.lineTo(s, s / 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const y = (i + 0.5) * (s / 8);
    const grad = ctx.createLinearGradient(0, y - 18, 0, y + 18);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(20, 28, 10, 0.16)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 18, s, 36);
  }
  for (let i = 0; i < 160; i++) {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = rnd() > 0.5 ? '#3a4424' : '#d5d2b0';
    ctx.fillRect(rnd() * s, rnd() * s, 2 + rnd() * 4, 2);
  }
  ctx.globalAlpha = 1;
  if (!withHole) return;
  // 画布上方对应 uv.y = 1。破洞放在棚顶前右。
  const cx = s * 0.63;
  const cy = s * (1 - 0.41);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.13, cy - s * 0.03);
  ctx.lineTo(cx - s * 0.02, cy - s * 0.11);
  ctx.lineTo(cx + s * 0.12, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.06);
  ctx.lineTo(cx + s * 0.03, cy + s * 0.12);
  ctx.lineTo(cx - s * 0.11, cy + s * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(40, 48, 22, 0.8)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + (rnd() - 0.5) * 40, cy + (rnd() - 0.5) * 30);
    ctx.lineTo(cx + (rnd() - 0.5) * 120, cy + (rnd() - 0.5) * 90);
    ctx.stroke();
  }
}

export function drawCloth(ctx, s) {
  ctx.fillStyle = '#e4572c';
  ctx.fillRect(0, 0, s, s);
  const bands = 7;
  for (let i = 0; i < bands; i++) {
    const y = (i * s) / bands;
    const grad = ctx.createLinearGradient(0, y, 0, y + s / bands);
    grad.addColorStop(0, 'rgba(90, 20, 8, 0.28)');
    grad.addColorStop(0.45, 'rgba(255, 220, 180, 0.16)');
    grad.addColorStop(1, 'rgba(70, 16, 6, 0.32)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, s, s / bands + 1);
  }
}

export function drawCrate(ctx, s) {
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#c8c8c8';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, s - 36, s - 36);
  ctx.beginPath();
  ctx.moveTo(28, 28);
  ctx.lineTo(s - 28, s - 28);
  ctx.moveTo(s - 28, 28);
  ctx.lineTo(28, s - 28);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.5);
  ctx.lineTo(s, s * 0.5);
  ctx.stroke();
}

export function drawBark(ctx, s) {
  const rnd = mulberry32(8);
  ctx.fillStyle = '#6a4b32';
  ctx.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 6) {
    const tone = 78 + Math.floor(rnd() * 36);
    ctx.fillStyle = `rgb(${tone + 28}, ${tone}, ${tone - 18})`;
    ctx.fillRect(0, y, s, 4 + (rnd() * 2) | 0);
  }
  ctx.strokeStyle = 'rgba(40, 24, 12, 0.45)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const x = (i + 0.3) * (s / 8);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 8, s * 0.3, x - 8, s * 0.6, x + 3, s);
    ctx.stroke();
  }
}

export function drawLeaf(ctx, s) {
  ctx.clearRect(0, 0, s, s);
  const grad = ctx.createLinearGradient(s * 0.5, 0, s * 0.5, s);
  grad.addColorStop(0, '#8fbf45');
  grad.addColorStop(0.45, '#3f7a32');
  grad.addColorStop(1, '#245326');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(s * 0.5, s * 0.02);
  ctx.quadraticCurveTo(s * 0.92, s * 0.28, s * 0.6, s * 0.98);
  ctx.quadraticCurveTo(s * 0.5, s * 0.72, s * 0.4, s * 0.98);
  ctx.quadraticCurveTo(s * 0.08, s * 0.28, s * 0.5, s * 0.02);
  ctx.fill();
  ctx.strokeStyle = 'rgba(18, 50, 16, 0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const t = 0.18 + i * 0.1;
    ctx.beginPath();
    ctx.moveTo(s * 0.5, s * t);
    ctx.lineTo(s * (0.5 + 0.18), s * (t + 0.05));
    ctx.moveTo(s * 0.5, s * t);
    ctx.lineTo(s * (0.5 - 0.18), s * (t + 0.05));
    ctx.stroke();
  }
}

export function drawMarkB(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  ctx.strokeStyle = '#d21f18';
  ctx.lineWidth = Math.max(8, w * 0.055);
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#d21f18';
  ctx.font = `bold ${Math.floor(h * 0.52)}px "Arial Black", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B', cx, cy + h * 0.02);
}

export function drawMarkA(ctx, w, h) {
  const rnd = mulberry32(61);
  ctx.clearRect(0, 0, w, h);
  const cx = w * 0.5;
  const cy = h * 0.5;
  // 外围喷溅：先铺一层散点，让圆圈像现场喷的而不是贴上去的。
  ctx.fillStyle = '#d21f18';
  for (let i = 0; i < 90; i++) {
    ctx.globalAlpha = 0.05 + rnd() * 0.18;
    ctx.beginPath();
    ctx.arc(cx + (rnd() - 0.5) * w * 0.98, cy + (rnd() - 0.5) * h * 0.98, 1 + rnd() * 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#d21f18';
  ctx.lineWidth = Math.max(8, w * 0.055);
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#d21f18';
  ctx.font = `bold ${Math.floor(h * 0.52)}px "Arial Black", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', cx, cy + h * 0.02);
  // 下缘两挂漆痕。
  ctx.globalAlpha = 0.5;
  for (const dx of [-0.16, 0.09]) {
    ctx.fillRect(cx + w * dx, cy + h * 0.2, w * 0.012, h * (0.05 + rnd() * 0.06));
  }
  ctx.globalAlpha = 1;
}

export function drawArrow(ctx, w, h) {
  ctx.fillStyle = '#1e8a3e';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#f3f6f1';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, w - 16, h - 16);
  ctx.fillStyle = '#f4f7f2';
  ctx.beginPath();
  ctx.moveTo(w * 0.22, h * 0.5);
  ctx.lineTo(w * 0.48, h * 0.18);
  ctx.lineTo(w * 0.48, h * 0.36);
  ctx.lineTo(w * 0.8, h * 0.36);
  ctx.lineTo(w * 0.8, h * 0.64);
  ctx.lineTo(w * 0.48, h * 0.64);
  ctx.lineTo(w * 0.48, h * 0.82);
  ctx.closePath();
  ctx.fill();
}

// A 包点大拱券的白色格子窗：画布比例须与拱面一致（256×320 对 4.8×6.0），
// 这样 arc 出来的是正半券。券外四个角留透明，靠 alphaTest 抠掉露出米黄墙面。
export function drawArchWindow(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const r = w / 2;
  const outline = () => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, r);
    ctx.arc(w / 2, r, r, Math.PI, Math.PI * 2);
    ctx.lineTo(w, h);
    ctx.closePath();
  };
  ctx.save();
  outline();
  ctx.clip();
  ctx.fillStyle = '#1a1512';
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, 'rgba(120, 140, 150, 0.22)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#efe6d4';
  ctx.lineWidth = w * 0.035;
  for (const fx of [0.2, 0.4, 0.6, 0.8]) {
    ctx.beginPath();
    ctx.moveTo(w * fx, 0);
    ctx.lineTo(w * fx, h);
    ctx.stroke();
  }
  for (let fy = r; fy < h; fy += h * 0.115) {
    ctx.beginPath();
    ctx.moveTo(0, fy);
    ctx.lineTo(w, fy);
    ctx.stroke();
  }
  ctx.lineWidth = w * 0.05;
  outline();
  ctx.stroke();
  ctx.restore();
}

// A 包点边界：地上一个红色虚线方框，中间空着给红圈 A。四角各补一段实心角标。
export function drawSiteFrame(ctx, w, h) {
  const rnd = mulberry32(67);
  ctx.clearRect(0, 0, w, h);
  const o = w * 0.045;
  ctx.strokeStyle = '#c8201a';
  ctx.lineWidth = Math.max(4, w * 0.013);
  ctx.setLineDash([w * 0.055, w * 0.03]);
  ctx.strokeRect(o, o, w - 2 * o, h - 2 * o);
  ctx.setLineDash([]);
  const t = w * 0.055;
  for (const [sx, sy] of [[o, o], [w - o, o], [o, h - o], [w - o, h - o]]) {
    const dx = sx < w / 2 ? 1 : -1;
    const dy = sy < h / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(sx, sy + dy * t);
    ctx.lineTo(sx, sy);
    ctx.lineTo(sx + dx * t, sy);
    ctx.stroke();
  }
  // 沿线刷的喷溅，让方框像是现场画的。
  ctx.fillStyle = '#c8201a';
  for (let i = 0; i < 70; i++) {
    ctx.globalAlpha = 0.05 + rnd() * 0.16;
    const side = i % 4;
    const u = o + rnd() * (w - 2 * o);
    const j = (rnd() - 0.5) * w * 0.03;
    const p = side === 0 ? [u, o + j]
      : side === 1 ? [u, h - o + j]
        : side === 2 ? [o + j, u]
          : [w - o + j, u];
    ctx.beginPath();
    ctx.arc(p[0], p[1], 1 + rnd() * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function mapped(map, opts = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    color: opts.color ?? 0xffffff,
    roughness: opts.roughness ?? 0.9,
    metalness: opts.metalness ?? 0,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    alphaTest: opts.alphaTest ?? 0,
    polygonOffset: opts.polygonOffset ?? false,
    polygonOffsetFactor: opts.polygonOffsetFactor ?? 0,
    polygonOffsetUnits: opts.polygonOffsetUnits ?? 0,
  });
}
