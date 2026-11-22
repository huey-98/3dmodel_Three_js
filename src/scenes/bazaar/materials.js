import * as THREE from 'three';

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

function makeTex(size, draw, { repeat = true } = {}) {
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

function makeRectTex(w, h, draw) {
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

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawStucco(ctx, s, base, dark, light, peel) {
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

function drawCobble(ctx, s) {
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

function drawTile(ctx, s) {
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

function drawGraffiti(ctx, w, h) {
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

function drawStone(ctx, s) {
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

function drawAMark(ctx, w, h) {
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

function drawSign(ctx, w, h) {
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

function drawPanel(ctx, s) {
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

function drawWood(ctx, s) {
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

function drawTarp(ctx, s, withHole) {
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

function drawCloth(ctx, s) {
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

function drawCrate(ctx, s) {
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

function drawBark(ctx, s) {
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

function drawLeaf(ctx, s) {
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

function drawMarkB(ctx, w, h) {
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

function drawArrow(ctx, w, h) {
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

function mapped(map, opts = {}) {
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

export function createBazaarKit() {
  const stuccoSand = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#d6c07a', '#b89a58', '#ead89a'));
  const stuccoPink = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#e3a898', '#c47d72', '#f0d2c6', '#d5cdc2'));
  const stuccoWhite = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#e7e1d6', '#bdb6aa', '#f7f4ee', '#cfc6b8'));
  const stuccoBlue = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#7ea4c6', '#688eae', '#c5d4e2', '#e3d2b4'));
  const stuccoShop = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#9aa694', '#8f9b89', '#a6b2a0'));
  const tileMap = makeTex(512, drawTile);
  const stoneMap = makeTex(512, drawStone);
  const graffitiMap = makeRectTex(256, 192, drawGraffiti);
  const aMarkMap = makeRectTex(256, 256, drawAMark);
  const signMap = makeRectTex(128, 160, drawSign);
  const panel = makeTex(512, drawPanel);
  const cobbleMap = makeTex(512, drawCobble);
  cobbleMap.repeat.set(22, 22);
  const woodMap = makeTex(256, drawWood);
  const tarpTorn = makeTex(1024, (ctx, s) => drawTarp(ctx, s, true), { repeat: false });
  const tarpSolid = makeTex(512, (ctx, s) => drawTarp(ctx, s, false));
  const cloth = makeTex(512, drawCloth);
  const crateMap = makeTex(256, drawCrate);
  const barkMap = makeTex(256, drawBark);
  barkMap.repeat.set(2, 3);
  const leafMap = makeTex(256, drawLeaf, { repeat: false });
  const markB = makeRectTex(512, 512, drawMarkB);
  const arrow = makeRectTex(256, 128, drawArrow);

  const wood = (color, roughness) => new THREE.MeshStandardMaterial({
    map: woodMap, color, roughness, metalness: 0.02,
  });
  const crateBase = new THREE.MeshStandardMaterial({
    map: crateMap, color: 0xd7b48a, roughness: 0.84,
  });

  const kit = {
    sand: mapped(stuccoSand, { roughness: 0.93 }),
    pink: mapped(stuccoPink, { roughness: 0.92 }),
    white: mapped(stuccoWhite, { roughness: 0.93 }),
    blue: mapped(stuccoBlue, { roughness: 0.9 }),
    panel: mapped(panel, { roughness: 0.88 }),
    cobble: mapped(cobbleMap, { roughness: 0.96 }),
    tarp: mapped(tarpTorn, {
      roughness: 0.82,
      side: THREE.DoubleSide,
      alphaTest: 0.45,
    }),
    tarpPatch: mapped(tarpSolid, { color: 0xc6b27a, roughness: 0.86, side: THREE.DoubleSide }),
    cloth: mapped(cloth, { roughness: 0.78, side: THREE.DoubleSide }),
    wood: wood(0xd2b48a, 0.74),
    beam: wood(0x6d5138, 0.88),
    door: wood(0x624832, 0.86),
    bark: mapped(barkMap, { roughness: 0.95 }),
    leaf: mapped(leafMap, { roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.45 }),
    leafDry: mapped(leafMap, {
      color: 0xd7e4a4, roughness: 0.82, side: THREE.DoubleSide, alphaTest: 0.45,
    }),
    markB: mapped(markB, {
      roughness: 0.62,
      transparent: true,
      alphaTest: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    arrow: mapped(arrow, { roughness: 0.5 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xefe4d2, roughness: 0.86 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xffefb0, roughness: 0.86 }),
    creamFloor: new THREE.MeshStandardMaterial({
      color: 0xf3d56a, roughness: 0.86,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xc9bfae, roughness: 0.94 }),
    shopFloor: mapped(tileMap, {
      roughness: 0.55,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    shopWall: mapped(stuccoShop, { roughness: 0.9 }),
    stone: mapped(stoneMap, { roughness: 0.95 }),
    aMark: mapped(aMarkMap, {
      roughness: 0.85,
      transparent: true,
      alphaTest: 0.15,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    sign: mapped(signMap, { roughness: 0.6 }),
    ceilDark: new THREE.MeshStandardMaterial({ color: 0x5a5f5c, roughness: 0.95 }),
    sack: new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 1 }),
    graffiti: mapped(graffitiMap, {
      roughness: 0.9,
      transparent: true,
      alphaTest: 0.15,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    skirtSand: new THREE.MeshStandardMaterial({ color: 0xa88b4a, roughness: 0.96 }),
    skirtPink: new THREE.MeshStandardMaterial({ color: 0xa86b62, roughness: 0.96 }),
    skirtWhite: new THREE.MeshStandardMaterial({ color: 0xb3ab9e, roughness: 0.96 }),
    skirtBlue: new THREE.MeshStandardMaterial({ color: 0x6d88a0, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x100e0c, roughness: 0.42, metalness: 0.18, side: THREE.DoubleSide,
    }),
    recess: new THREE.MeshStandardMaterial({
      color: 0x0c0b0a, roughness: 1, side: THREE.DoubleSide,
    }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8d9499, metalness: 0.72, roughness: 0.38 }),
    metalDark: new THREE.MeshStandardMaterial({ color: 0x2c3134, metalness: 0.55, roughness: 0.48 }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4, roughness: 0.45 }),
    van: new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.52, metalness: 0.04 }),
    vanTrim: new THREE.MeshStandardMaterial({ color: 0xb9b4a8, roughness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92 }),
    bin: new THREE.MeshStandardMaterial({ color: 0x5b6d52, metalness: 0.12, roughness: 0.72 }),
    binLid: new THREE.MeshStandardMaterial({ color: 0x3c4540, metalness: 0.28, roughness: 0.5 }),
    tank: new THREE.MeshStandardMaterial({ color: 0xd5d8dc, roughness: 0.45, metalness: 0.25 }),
    ac: new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.6, metalness: 0.15 }),
    sandPile: new THREE.MeshStandardMaterial({
      color: 0xc4ae8c, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
    far: [0xd4cfc2, 0xc5ccc8, 0xddd6c8, 0xb7c0b8].map((color) => (
      new THREE.MeshStandardMaterial({ color, roughness: 1 })
    )),
    crate(color) {
      const m = crateBase.clone();
      m.color.set(color);
      return m;
    },
  };

  return kit;
}
