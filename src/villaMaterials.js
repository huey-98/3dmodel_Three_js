import * as THREE from 'three';

function makeTex(size, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

function drawAshlar(ctx, s) {
  ctx.fillStyle = '#cbbba6';
  ctx.fillRect(0, 0, s, s);
  const rowH = 32;
  const blockW = 64;
  const rows = s / rowH;
  for (let row = 0; row < rows; row++) {
    const y = row * rowH;
    const offset = (row % 2) * (blockW / 2);
    for (let x = -blockW; x < s + blockW; x += blockW) {
      const shade = 214 + ((row * 5 + x / blockW) % 4) * 6;
      ctx.fillStyle = `rgb(${shade}, ${shade - 14}, ${shade - 30})`;
      ctx.fillRect(x + offset + 1.5, y + 1.5, blockW - 3, rowH - 3);
    }
  }
}

function drawMarble(ctx, s) {
  const img = ctx.createImageData(s, s);
  const d = img.data;
  const f = (Math.PI * 2) / s;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const wave = Math.sin(x * f * 3 + Math.sin(y * f * 2) * 1.6);
      const wave2 = Math.sin((x + y) * f * 2);
      const grain = Math.sin(x * f * 11 + y * f * 5) * 0.5;
      let shade = 240 + grain * 4;
      if (Math.abs(wave) > 0.93) shade -= 14 + (Math.abs(wave) - 0.93) * 40;
      if (Math.abs(wave2) > 0.97) shade -= 8;
      const i = (y * s + x) * 4;
      d[i] = shade;
      d[i + 1] = shade - 3;
      d[i + 2] = shade - 10;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function drawPlanks(ctx, s) {
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(0, 0, s, s);
  const n = 6;
  const plank = s / n;
  for (let i = 0; i < n; i++) {
    const x = i * plank;
    const tone = 92 + (i % 3) * 14;
    ctx.fillStyle = `rgb(${tone + 28}, ${tone - 6}, ${tone - 32})`;
    ctx.fillRect(x + 2, 0, plank - 4, s);
    ctx.strokeStyle = 'rgba(255, 220, 180, 0.06)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 7; g++) {
      const yy = ((g + 0.5) / 7) * s;
      ctx.beginPath();
      ctx.moveTo(x + 6, yy);
      ctx.bezierCurveTo(x + plank * 0.35, yy + 10, x + plank * 0.65, yy - 12, x + plank - 6, yy + 3);
      ctx.stroke();
    }
  }
}

function drawParquet(ctx, s) {
  const n = 4;
  const cell = s / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const x = i * cell;
      const y = j * cell;
      ctx.fillStyle = (i + j) % 2 === 0 ? '#6d4932' : '#7d5640';
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = 'rgba(42, 24, 12, 0.55)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
      ctx.strokeStyle = 'rgba(255, 226, 190, 0.07)';
      ctx.lineWidth = 1.5;
      const flip = (i + j) % 2 === 0;
      for (let k = 1; k < 4; k++) {
        const p = (k / 4) * cell;
        ctx.beginPath();
        if (flip) {
          ctx.moveTo(x + p, y + 4);
          ctx.lineTo(x + cell - 4, y + p);
        } else {
          ctx.moveTo(x + 4, y + p);
          ctx.lineTo(x + p, y + cell - 4);
        }
        ctx.stroke();
      }
    }
  }
}

function drawPavers(ctx, s) {
  ctx.fillStyle = '#b7ab9c';
  ctx.fillRect(0, 0, s, s);
  const n = 4;
  const cell = s / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const shade = 198 + ((i * 3 + j) % 5) * 5;
      ctx.fillStyle = `rgb(${shade}, ${shade - 8}, ${shade - 20})`;
      ctx.fillRect(i * cell + 3, j * cell + 3, cell - 6, cell - 6);
    }
  }
}

function drawRug(ctx, s, field, border, accent) {
  ctx.fillStyle = field;
  ctx.fillRect(0, 0, s, s);
  const margin = 22;
  ctx.strokeStyle = border;
  ctx.lineWidth = 18;
  ctx.strokeRect(11, 11, s - 22, s - 22);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.strokeRect(margin + 6, margin + 6, s - (margin + 6) * 2, s - (margin + 6) * 2);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(s / 2, s / 2, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
  for (const [x, y] of [[48, 48], [s - 48, 48], [48, s - 48], [s - 48, s - 48]]) {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  }
}

const AXIS = { x: 0, y: 1, z: 2 };
const FACE_AXES = [
  ['z', 'y'],
  ['z', 'y'],
  ['x', 'z'],
  ['x', 'z'],
  ['x', 'y'],
  ['x', 'y'],
];

// 把盒子 UV 设成世界米制，墙面分段后石材缝仍能对齐
export function applyMetricUV(geo, ox, oy, oz, scale) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const off = [ox, oy, oz];
  const per = pos.count / 6;
  if (!Number.isInteger(per) || per < 1) return;
  for (let f = 0; f < 6; f++) {
    const ia = AXIS[FACE_AXES[f][0]];
    const ib = AXIS[FACE_AXES[f][1]];
    for (let k = 0; k < per; k++) {
      const i = f * per + k;
      uv.setXY(
        i,
        (pos.getComponent(i, ia) + off[ia]) * scale,
        (pos.getComponent(i, ib) + off[ib]) * scale,
      );
    }
  }
  uv.needsUpdate = true;
}

export function createVillaKit() {
  const maps = {
    stone: makeTex(256, drawAshlar),
    marble: makeTex(256, drawMarble),
    walnut: makeTex(256, drawPlanks),
    parquet: makeTex(256, drawParquet),
    paver: makeTex(256, drawPavers),
    rugLiving: makeTex(256, (ctx, s) => drawRug(ctx, s, '#f4efe4', '#6d2432', '#c4a15a')),
    rugBed: makeTex(256, (ctx, s) => drawRug(ctx, s, '#e6eef3', '#8d7049', '#f7f4ee')),
    rugStudy: makeTex(256, (ctx, s) => drawRug(ctx, s, '#6e2430', '#2c140f', '#d4b36a')),
  };

  function mapped(map, rx, ry, opts = {}) {
    const image = map.clone();
    image.wrapS = image.wrapT = THREE.RepeatWrapping;
    image.repeat.set(rx, ry);
    image.colorSpace = THREE.SRGBColorSpace;
    image.anisotropy = 8;
    image.needsUpdate = true;
    return new THREE.MeshStandardMaterial({
      map: image,
      color: opts.color ?? 0xffffff,
      roughness: opts.roughness ?? 0.86,
      metalness: opts.metalness ?? 0,
    });
  }

  const plaster = new THREE.MeshStandardMaterial({ color: 0xf7f2e9, roughness: 0.94 });
  const stoneSmooth = new THREE.MeshStandardMaterial({ color: 0xe7dccb, roughness: 0.78 });
  const stoneDark = new THREE.MeshStandardMaterial({ color: 0xcbbfae, roughness: 0.88 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.92, roughness: 0.28 });
  const brassDark = new THREE.MeshStandardMaterial({ color: 0x8a6a3d, metalness: 0.84, roughness: 0.36 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x4e4036, metalness: 0.72, roughness: 0.34 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xb87333, metalness: 0.78, roughness: 0.32 });
  const slate = new THREE.MeshStandardMaterial({ color: 0x3c4652, roughness: 0.8 });
  const slateDark = new THREE.MeshStandardMaterial({ color: 0x2c333c, roughness: 0.86 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xd7e7ef,
    metalness: 0,
    roughness: 0.045,
    transmission: 0.88,
    thickness: 0.14,
    ior: 1.5,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const railGlass = new THREE.MeshPhysicalMaterial({
    color: 0xd5e4ea,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.72,
    thickness: 0.08,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const velvet = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.02 });
  const leather = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.48, metalness: 0.08 });
  const linen = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92 });
  const wood = (color, roughness = 0.52) => new THREE.MeshStandardMaterial({
    color, roughness, metalness: 0.04,
  });

  return {
    maps, mapped, plaster, stoneSmooth, stoneDark, brass, brassDark, bronze, copper,
    slate, slateDark, glass, railGlass, velvet, leather, linen, wood,
  };
}

let sharedKit = null;
export function getVillaKit() {
  if (!sharedKit) sharedKit = createVillaKit();
  return sharedKit;
}
