import * as THREE from 'three';
// 已去掉头侧深色鲸耳块

const C = {
  skin: 0xf5cfc0,
  hair: 0x3e6eb0,
  hairTip: 0x9fd2f5,
  navy: 0x1c2a4a,
  navyDeep: 0x151e36,
  white: 0xf7f4ee,
  gold: 0xd4b36a,
  bowBlue: 0x7eb6eb,
  belly: 0xc8d2de,
  stocking: 0x1a1f2e,
};

function mat(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.52,
    metalness: 0.03,
    ...extra,
  });
}

function mesh(geo, material) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function v(x, y, z) {
  return new THREE.Vector3(x, y, z);
}

function canvasTex(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function colorAlong(geo, c0, c1) {
  const uv = geo.attributes.uv;
  const colors = new Float32Array(uv.count * 3);
  const a = new THREE.Color(c0);
  const b = new THREE.Color(c1);
  const t = new THREE.Color();
  for (let i = 0; i < uv.count; i++) {
    t.lerpColors(a, b, THREE.MathUtils.clamp(uv.getY(i), 0, 1));
    colors[i * 3] = t.r;
    colors[i * 3 + 1] = t.g;
    colors[i * 3 + 2] = t.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function strand(parent, material, points, radius, segments = 16) {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.curveType = 'catmullrom';
  curve.tension = 0.4;
  const geo = new THREE.TubeGeometry(curve, segments, radius, 7, false);
  colorAlong(geo, C.hair, C.hairTip);
  const m = mesh(geo, material);
  parent.add(m);
  return m;
}

function makeBow(color, scale = 1) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.4 });
  const knot = mesh(new THREE.SphereGeometry(0.026, 10, 8), m);
  knot.scale.set(1.2, 0.82, 0.85);
  g.add(knot);
  for (const s of [-1, 1]) {
    const loop = mesh(new THREE.SphereGeometry(0.048, 12, 10), m);
    loop.scale.set(1.4, 0.75, 0.36);
    loop.position.set(s * 0.052, 0.006, 0);
    loop.rotation.z = s * 0.32;
    g.add(loop);
    const ribbon = mesh(new THREE.BoxGeometry(0.034, 0.085, 0.01), m);
    ribbon.position.set(s * 0.026, -0.052, 0.004);
    ribbon.rotation.z = s * 0.48;
    g.add(ribbon);
  }
  g.scale.setScalar(scale);
  return g;
}

function drawFace(ctx, s, blink) {
  ctx.clearRect(0, 0, s, s);

  ctx.strokeStyle = '#2c4168';
  ctx.lineWidth = s * 0.01;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.33);
  ctx.quadraticCurveTo(s * 0.3, s * 0.27, s * 0.4, s * 0.33);
  ctx.moveTo(s * 0.6, s * 0.33);
  ctx.quadraticCurveTo(s * 0.7, s * 0.27, s * 0.78, s * 0.33);
  ctx.stroke();

  function eye(cx, cy) {
    if (blink) {
      ctx.strokeStyle = '#1c2740';
      ctx.lineWidth = s * 0.015;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.12, cy);
      ctx.quadraticCurveTo(cx, cy + s * 0.018, cx + s * 0.12, cy);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = '#1c2740';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, s * 0.13, s * 0.095, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.125, s * 0.155, 0, 0, Math.PI * 2);
    ctx.fill();
    const ig = ctx.createRadialGradient(cx, cy + 10, 2, cx, cy + 6, s * 0.11);
    ig.addColorStop(0, '#c5eeff');
    ig.addColorStop(0.3, '#5aacec');
    ig.addColorStop(1, '#1d5c9a');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, s * 0.095, s * 0.118, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14233f';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, s * 0.042, s * 0.058, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 14, cy - 18, 11, 14, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16, cy + 14, 5.5, 6.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c2740';
    ctx.lineWidth = s * 0.015;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.125, s * 0.155, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  eye(s * 0.31, s * 0.5);
  eye(s * 0.69, s * 0.5);

  ctx.fillStyle = 'rgba(236, 128, 140, 0.3)';
  ctx.beginPath();
  ctx.ellipse(s * 0.18, s * 0.7, s * 0.1, s * 0.048, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.82, s * 0.7, s * 0.1, s * 0.048, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c45a6a';
  ctx.lineWidth = s * 0.013;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.45, s * 0.8);
  ctx.quadraticCurveTo(s * 0.5, s * 0.835, s * 0.55, s * 0.8);
  ctx.stroke();
}

function whaleLogoTex() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1c2a4a';
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.58, 66, 38, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.7, h * 0.55);
    ctx.quadraticCurveTo(w * 0.9, h * 0.38, w * 0.84, h * 0.66);
    ctx.quadraticCurveTo(w * 0.78, h * 0.6, w * 0.7, h * 0.58);
    ctx.fill();
    ctx.fillStyle = '#f7f4ee';
    ctx.beginPath();
    ctx.arc(w * 0.38, h * 0.52, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c2a4a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.38);
    ctx.quadraticCurveTo(w * 0.52, h * 0.16, w * 0.64, h * 0.24);
    ctx.stroke();
    ctx.fillStyle = '#1c2a4a';
    ctx.beginPath();
    ctx.arc(w * 0.66, h * 0.18, 4.5, 0, Math.PI * 2);
    ctx.arc(w * 0.74, h * 0.12, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function apronTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ece6d8';
    ctx.lineWidth = 2;
    for (let y = 24; y < h * 0.78; y += 16) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.14) * 3.5);
      ctx.stroke();
    }
  });
}

function skirtTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1c2a4a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4b36a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.lineTo(w, h * 0.86);
    ctx.stroke();
    ctx.fillStyle = '#e4d3a4';
    const marks = [
      [80, 130], [190, 100], [320, 140], [440, 95],
      [70, 270], [210, 240], [360, 280],
      [120, 390], [270, 410], [410, 370],
    ];
    for (const [x, y] of marks) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-6, -1.2, 12, 2.4);
      ctx.fillRect(-1.2, -6, 2.4, 12);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x + 16, y - 10, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function flukeGeo() {
  const s = new THREE.Shape();
  s.moveTo(0.0, 0.04);
  s.bezierCurveTo(0.22, 0.16, 0.52, 0.34, 0.98, 0.2);
  s.bezierCurveTo(1.08, 0.12, 1.04, 0.0, 0.9, -0.08);
  s.bezierCurveTo(0.62, -0.18, 0.28, -0.1, 0.0, -0.02);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
}

export function createWhaleMaid() {
  const group = new THREE.Group();
  const rig = new THREE.Group();
  group.add(rig);

  const skinM = mat(C.skin, { roughness: 0.64 });
  const navyM = mat(C.navy, { roughness: 0.46 });
  const deepM = mat(C.navyDeep, { roughness: 0.48 });
  const whiteM = mat(C.white, { roughness: 0.38 });
  const goldM = mat(C.gold, { roughness: 0.32, metalness: 0.4 });
  const bellyM = mat(C.belly, { roughness: 0.55 });
  const stockM = mat(C.stocking, { roughness: 0.72 });
  const hairM = mat(0xffffff, { vertexColors: true, roughness: 0.38 });

  const head = mesh(new THREE.SphereGeometry(0.23, 28, 22), skinM);
  head.scale.set(0.96, 1.02, 0.9);
  head.position.y = 1.48;
  rig.add(head);

  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = 512;
  faceCanvas.height = 512;
  const faceCtx = faceCanvas.getContext('2d');
  drawFace(faceCtx, 512, false);
  const faceTex = new THREE.CanvasTexture(faceCanvas);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.44, 0.44),
    new THREE.MeshStandardMaterial({
      map: faceTex,
      transparent: true,
      roughness: 0.64,
      depthWrite: false,
    }),
  );
  face.position.set(0, 1.475, 0.205);
  face.renderOrder = 2;
  rig.add(face);

  const hair = new THREE.Group();
  hair.position.y = 1.48;
  rig.add(hair);

  const cap = mesh(new THREE.SphereGeometry(0.245, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(C.hair, { roughness: 0.38 }));
  cap.scale.set(1.05, 1.1, 1.02);
  cap.position.y = 0.03;
  hair.add(cap);

  const locks = [
    { r: 0.072, p: [[-0.08, 0.1, -0.14], [-0.26, -0.25, -0.12], [-0.18, -0.65, -0.1], [-0.32, -1.05, -0.04]] },
    { r: 0.072, p: [[0.08, 0.1, -0.14], [0.28, -0.22, -0.12], [0.2, -0.62, -0.08], [0.34, -1.02, -0.02]] },
    { r: 0.064, p: [[0.0, 0.12, -0.18], [-0.04, -0.35, -0.2], [0.06, -0.75, -0.12], [0.0, -1.12, -0.06]] },
    { r: 0.052, p: [[-0.16, 0.08, -0.1], [-0.38, -0.2, -0.06], [-0.3, -0.58, -0.04], [-0.42, -0.98, 0.0]] },
    { r: 0.052, p: [[0.16, 0.08, -0.1], [0.4, -0.18, -0.04], [0.32, -0.55, -0.02], [0.44, -0.96, 0.02]] },
    { r: 0.046, p: [[-0.22, 0.04, -0.02], [-0.36, -0.35, 0.02], [-0.28, -0.72, 0.0], [-0.36, -1.0, 0.0]] },
    { r: 0.046, p: [[0.22, 0.04, 0.0], [0.38, -0.32, 0.04], [0.3, -0.7, 0.02], [0.38, -0.98, 0.02]] },
    { r: 0.042, p: [[-0.12, 0.06, -0.16], [-0.08, -0.4, -0.18], [-0.2, -0.8, -0.1], [-0.16, -1.08, -0.06]] },
    { r: 0.042, p: [[0.12, 0.06, -0.16], [0.1, -0.38, -0.18], [0.22, -0.78, -0.08], [0.18, -1.06, -0.04]] },
    { r: 0.038, p: [[-0.18, 0.02, -0.08], [-0.32, -0.45, -0.1], [-0.24, -0.85, -0.06]] },
    { r: 0.038, p: [[0.18, 0.02, -0.08], [0.34, -0.42, -0.08], [0.26, -0.82, -0.04]] },
  ];
  for (const lock of locks) {
    strand(hair, hairM, lock.p.map((p) => v(...p)), lock.r);
  }
  const fillM = mat(C.hair, { roughness: 0.4 });
  const fillTip = mat(C.hairTip, { roughness: 0.4 });
  const fill = (x, y, z, sx, sy, sz, rx = 0, rz = 0) => {
    const m = mesh(new THREE.SphereGeometry(0.5, 14, 10), y < -0.55 ? fillTip : fillM);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    m.rotation.set(rx, 0, rz);
    hair.add(m);
  };
  fill(-0.22, -0.28, -0.12, 0.2, 0.55, 0.16, 0.12, 0.2);
  fill(0.24, -0.26, -0.12, 0.2, 0.55, 0.16, 0.12, -0.2);
  fill(-0.3, -0.7, -0.06, 0.16, 0.42, 0.14, 0.08, 0.18);
  fill(0.32, -0.68, -0.04, 0.16, 0.42, 0.14, 0.08, -0.18);

  const bangs = [
    { r: 0.03, p: [[-0.02, 0.18, 0.16], [-0.05, 0.08, 0.21], [-0.06, 0.0, 0.2]] },
    { r: 0.032, p: [[0.04, 0.19, 0.16], [0.03, 0.08, 0.22], [0.02, 0.0, 0.2]] },
    { r: 0.028, p: [[0.1, 0.17, 0.15], [0.12, 0.07, 0.2], [0.13, -0.01, 0.17]] },
    { r: 0.028, p: [[-0.1, 0.16, 0.15], [-0.13, 0.06, 0.19], [-0.14, -0.01, 0.16]] },
    { r: 0.026, p: [[-0.16, 0.12, 0.12], [-0.19, 0.02, 0.13], [-0.2, -0.08, 0.1]] },
    { r: 0.026, p: [[0.16, 0.12, 0.12], [0.19, 0.03, 0.13], [0.2, -0.06, 0.1]] },
  ];
  for (const b of bangs) strand(hair, hairM, b.p.map((p) => v(...p)), b.r, 10);

  const crown = mesh(new THREE.SphereGeometry(0.07, 12, 10), mat(C.hair, { roughness: 0.38 }));
  crown.scale.set(0.55, 1.15, 0.4);
  crown.position.set(-0.04, 0.24, -0.02);
  crown.rotation.z = 0.28;
  hair.add(crown);

  const lace = mesh(new THREE.TorusGeometry(0.038, 0.01, 8, 14), whiteM);
  lace.position.set(-0.22, 0.06, 0.11);
  lace.rotation.set(0.6, 0.7, 0.1);
  hair.add(lace);
  const hairBow = makeBow(C.bowBlue, 1.15);
  hairBow.position.set(-0.22, 0.05, 0.13);
  hairBow.rotation.set(0.15, 0.45, 0.1);
  hair.add(hairBow);

  const neck = mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.08, 12), skinM);
  neck.position.y = 1.28;
  rig.add(neck);

  const torso = mesh(new THREE.CapsuleGeometry(0.145, 0.24, 6, 14), navyM);
  torso.scale.set(1.18, 1, 0.68);
  torso.position.y = 1.08;
  rig.add(torso);

  const collar = mesh(new THREE.TorusGeometry(0.1, 0.024, 8, 20), whiteM);
  collar.position.y = 1.25;
  collar.rotation.x = Math.PI / 2;
  rig.add(collar);
  const collarFrill = mesh(new THREE.TorusGeometry(0.108, 0.012, 6, 20), whiteM);
  collarFrill.position.y = 1.24;
  collarFrill.rotation.x = Math.PI / 2;
  rig.add(collarFrill);

  const bib = mesh(new THREE.BoxGeometry(0.19, 0.34, 0.032), whiteM);
  bib.position.set(0, 1.06, 0.115);
  rig.add(bib);
  for (const x of [-0.105, 0.105]) {
    const r = mesh(new THREE.BoxGeometry(0.032, 0.34, 0.028), whiteM);
    r.position.set(x, 1.06, 0.12);
    rig.add(r);
  }
  for (let i = 0; i < 5; i++) {
    const btn = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.01, 10), navyM);
    btn.rotation.x = Math.PI / 2;
    btn.position.set(0, 1.18 - i * 0.048, 0.136);
    rig.add(btn);
  }

  const neckBow = makeBow(C.navy, 1.35);
  neckBow.position.set(0, 1.2, 0.15);
  rig.add(neckBow);
  const clasp = mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.01, 12), goldM);
  clasp.rotation.x = Math.PI / 2;
  clasp.position.set(0, 1.226, 0.165);
  rig.add(clasp);

  const belt = mesh(new THREE.CylinderGeometry(0.17, 0.175, 0.08, 18), deepM);
  belt.scale.set(1.08, 1, 0.68);
  belt.position.y = 0.88;
  rig.add(belt);
  for (const x of [-0.036, 0.036]) {
    const gb = mesh(new THREE.SphereGeometry(0.014, 10, 8), goldM);
    gb.position.set(x, 0.88, 0.125);
    rig.add(gb);
  }

  const apronShape = new THREE.Shape();
  apronShape.moveTo(-0.155, 0.16);
  apronShape.lineTo(0.155, 0.16);
  apronShape.quadraticCurveTo(0.21, 0.0, 0.16, -0.17);
  apronShape.quadraticCurveTo(0, -0.23, -0.16, -0.17);
  apronShape.quadraticCurveTo(-0.21, 0.0, -0.155, 0.16);
  const apron = mesh(
    new THREE.ExtrudeGeometry(apronShape, { depth: 0.016, bevelEnabled: false }),
    mat(0xffffff, { map: apronTex(), roughness: 0.4 }),
  );
  apron.position.set(0, 0.68, 0.135);
  rig.add(apron);

  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.11),
    new THREE.MeshStandardMaterial({ map: whaleLogoTex(), transparent: true, roughness: 0.45 }),
  );
  logo.position.set(0.08, 0.58, 0.16);
  rig.add(logo);

  const skirtPts = [
    new THREE.Vector2(0.17, 0.38),
    new THREE.Vector2(0.24, 0.26),
    new THREE.Vector2(0.38, 0.1),
    new THREE.Vector2(0.46, 0.0),
  ];
  const skirt = mesh(new THREE.LatheGeometry(skirtPts, 32), mat(0xffffff, { map: skirtTex(), roughness: 0.48 }));
  skirt.position.y = 0.5;
  rig.add(skirt);

  const petticoatPts = [
    new THREE.Vector2(0.4, 0.02),
    new THREE.Vector2(0.47, -0.03),
    new THREE.Vector2(0.46, -0.07),
  ];
  const petticoat = mesh(new THREE.LatheGeometry(petticoatPts, 28), whiteM);
  petticoat.position.y = 0.5;
  rig.add(petticoat);

  const skirtBowL = makeBow(C.gold, 0.88);
  skirtBowL.position.set(-0.26, 0.58, 0.28);
  skirtBowL.rotation.y = -0.18;
  rig.add(skirtBowL);
  const skirtBowR = makeBow(C.gold, 0.88);
  skirtBowR.position.set(0.26, 0.58, 0.28);
  skirtBowR.rotation.y = 0.18;
  rig.add(skirtBowR);

  function arm(side) {
    const g = new THREE.Group();
    g.position.set(side * 0.21, 1.18, 0.02);
    g.userData.rest = { x: 0.28, z: side * 0.22 };
    g.rotation.z = g.userData.rest.z;
    g.rotation.x = g.userData.rest.x;
    const puff = mesh(new THREE.SphereGeometry(0.085, 12, 10), navyM);
    puff.scale.set(0.95, 0.8, 0.9);
    puff.position.y = -0.07;
    g.add(puff);
    const fore = mesh(new THREE.CapsuleGeometry(0.048, 0.1, 4, 10), navyM);
    fore.position.set(side * -0.02, -0.28, 0.04);
    fore.rotation.x = 0.65;
    fore.rotation.z = side * -0.4;
    g.add(fore);
    const cuff = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), whiteM);
    cuff.position.set(side * -0.03, -0.34, 0.07);
    cuff.rotation.x = 0.65;
    g.add(cuff);
    const gold = mesh(new THREE.SphereGeometry(0.01, 8, 6), goldM);
    gold.position.set(side * -0.03, -0.34, 0.1);
    g.add(gold);
    rig.add(g);
    return g;
  }
  const armL = arm(-1);
  const armR = arm(1);

  function leg(side) {
    const g = new THREE.Group();
    g.position.set(side * 0.08, 0.4, 0);
    const thigh = mesh(new THREE.CapsuleGeometry(0.065, 0.18, 4, 10), stockM);
    thigh.position.y = -0.1;
    g.add(thigh);
    const shin = mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 10), stockM);
    shin.position.y = -0.32;
    g.add(shin);
    const shoe = mesh(new THREE.SphereGeometry(0.05, 10, 8), deepM);
    shoe.scale.set(1, 0.5, 1.35);
    shoe.position.set(0, -0.46, 0.02);
    g.add(shoe);
    rig.add(g);
    return g;
  }
  const legL = leg(-1);
  const legR = leg(1);

  const tail = new THREE.Group();
  tail.position.set(0, 0.4, -0.08);
  const stem = mesh(new THREE.CapsuleGeometry(0.04, 0.2, 4, 10), deepM);
  stem.rotation.x = Math.PI / 2.2;
  stem.position.set(0, -0.02, -0.12);
  tail.add(stem);
  const geo = flukeGeo();
  for (const side of [-1, 1]) {
    const f = new THREE.Group();
    const top = mesh(geo, deepM);
    top.position.z = -0.025;
    f.add(top);
    const belly = mesh(new THREE.BoxGeometry(0.62, 0.075, 0.035), bellyM);
    belly.position.set(0.42, -0.08, 0);
    belly.rotation.z = -0.12;
    f.add(belly);
    f.position.set(side * 0.08, 0.0, -0.18);
    f.rotation.set(0.08, side * 0.42, side * 0.18);
    f.scale.set(side * 1.15, 1.12, 1);
    tail.add(f);
  }
  rig.add(tail);

  let blinkT = 2.6;
  let blinking = 0;
  let walkPhase = 0;
  let walkSwing = 0;
  const footY = 0.085; // 鞋底贴地，避免脚埋进地面

  function blink(dt) {
    blinkT -= dt;
    if (blinkT <= 0 && blinking <= 0) {
      blinking = 0.12;
      blinkT = 2.2 + Math.random() * 2.8;
    }
    if (blinking > 0) {
      blinking -= dt;
      drawFace(faceCtx, 512, blinking > 0.04 && blinking < 0.1);
      faceTex.needsUpdate = true;
    }
  }

  // 与 createPerson 相同签名：walking / 划船坐姿，idle 时保持轻摆
  function update(dt, moving = false, row = null) {
    const t = performance.now() * 0.001;
    blink(dt);
    hair.rotation.y = Math.sin(t * 0.55) * 0.02;

    if (row) {
      const s = row.active ? Math.sin(row.phase) : 0;
      armL.rotation.set(-0.38 + s * 0.5, 0.12, -0.55);
      armR.rotation.set(-0.38 + s * 0.5, -0.12, 0.55);
      legL.rotation.set(-1.18, 0, 0.08);
      legR.rotation.set(-1.18, 0, -0.08);
      tail.rotation.set(0.42, 0, 0);
      rig.position.y = footY;
      walkSwing = 0;
      return;
    }

    const targetAmp = moving ? 0.55 : 0;
    walkSwing += (targetAmp - walkSwing) * Math.min(dt * 10, 1);
    if (moving) walkPhase += dt * 9;
    const s = Math.sin(walkPhase) * walkSwing;

    legL.rotation.set(s, 0, 0);
    legR.rotation.set(-s, 0, 0);
    // 双手插袋，走路时只轻微带动
    armL.rotation.set(armL.userData.rest.x + s * 0.08, 0, armL.userData.rest.z);
    armR.rotation.set(armR.userData.rest.x - s * 0.08, 0, armR.userData.rest.z);
    tail.rotation.set(0, Math.sin(t * 0.8) * 0.04 + s * 0.1, Math.sin(t * 1.0) * 0.02);

    const bob = moving
      ? Math.abs(Math.cos(walkPhase)) * 0.035 * (walkSwing / 0.55)
      : Math.sin(t * 1.5) * 0.008;
    rig.position.y = footY + bob;
  }

  return { group, update, rig, hair, tail, legL, legR, armL, armR };
}
