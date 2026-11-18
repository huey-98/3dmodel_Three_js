import * as THREE from 'three';
import { createBazaarKit } from './materials.js';

// 参考图布局：中央绿篷棚屋（正面红字 B），左粉墙、后白楼、右蓝墙，石板路环绕。
const BOOTH = { x0: -4.95, x1: 5.25, z0: -4.2, z1: 5.05, h: 5.25 };

export function createBazaar() {
  const kit = createBazaarKit();
  const group = new THREE.Group();
  const solids = [];
  const animated = [];
  const geoCache = new Map();
  const archCache = new Map();

  function add(mesh) {
    group.add(mesh);
    return mesh;
  }

  function makeBox(w, h, d) {
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
    let geo = geoCache.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      const uv = geo.attributes.uv;
      const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) {
        const su = faces[f][0] * 0.48;
        const sv = faces[f][1] * 0.48;
        for (let i = 0; i < 4; i++) {
          const idx = f * 4 + i;
          uv.setXY(idx, uv.getX(idx) * su, uv.getY(idx) * sv);
        }
      }
      geoCache.set(key, geo);
    }
    return geo;
  }

  function box(w, h, d, mat, x, y, z) {
    const mesh = new THREE.Mesh(makeBox(w, h, d), mat);
    mesh.position.set(x, y, z);
    return add(mesh);
  }

  function volume(ax, bx, ay, by, az, bz, mat) {
    const x0 = Math.min(ax, bx);
    const x1 = Math.max(ax, bx);
    const y0 = Math.min(ay, by);
    const y1 = Math.max(ay, by);
    const z0 = Math.min(az, bz);
    const z1 = Math.max(az, bz);
    const w = x1 - x0;
    const h = y1 - y0;
    const d = z1 - z0;
    if (w < 0.001 || h < 0.001 || d < 0.001) return null;
    return box(w, h, d, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }

  function solid(x0, x1, z0, z1) {
    solids.push({
      minX: Math.min(x0, x1),
      maxX: Math.max(x0, x1),
      minZ: Math.min(z0, z1),
      maxZ: Math.max(z0, z1),
    });
  }

  function block(x0, x1, z0, z1, h, mat) {
    volume(x0, x1, 0, h, z0, z1, mat);
    solid(x0, x1, z0, z1);
  }

  function skirt(x0, x1, z0, z1, mat) {
    const o = 0.03;
    volume(x0 - o, x1 + o, 0, 0.46, z0 - o, z1 + o, mat);
  }

  function getArch(w, h) {
    const key = `${w.toFixed(2)}x${h.toFixed(2)}`;
    let geo = archCache.get(key);
    if (!geo) {
      const r = Math.min(w / 2 - 0.001, Math.max(0.2, h - 0.25));
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2, 0);
      shape.lineTo(w / 2, 0);
      shape.lineTo(w / 2, h - r);
      shape.absarc(0, h - r, r, 0, Math.PI, false);
      shape.closePath();
      geo = new THREE.ShapeGeometry(shape, 14);
      archCache.set(key, geo);
    }
    return geo;
  }

  // rotY：窗朝向。局部 +Z 为室外。
  function placeWindow(x, y, z, w, h, rotY, arch = false) {
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = rotY;
    const glass = new THREE.Mesh(arch ? getArch(w, h) : new THREE.PlaneGeometry(w, h), kit.glass);
    const recess = new THREE.Mesh(
      arch ? getArch(w * 0.9, h * 0.94) : new THREE.PlaneGeometry(w * 0.9, h * 0.92),
      kit.recess,
    );
    if (!arch) {
      glass.position.y = h / 2;
      recess.position.y = h / 2;
    }
    glass.position.z = 0.03;
    recess.position.z = -0.02;
    glass.userData.noShadow = true;
    glass.userData.noReceive = true;
    recess.userData.noShadow = true;
    root.add(recess, glass);

    const sill = new THREE.Mesh(makeBox(w + 0.18, 0.08, 0.2), kit.trim);
    sill.position.set(0, 0.02, 0.08);
    root.add(sill);
    const jambH = arch ? Math.max(0.35, h - w / 2) : h;
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(makeBox(0.07, jambH, 0.1), kit.trim);
      jamb.position.set(side * w / 2, jambH / 2, 0.045);
      root.add(jamb);
    }
    if (!arch) {
      const lintel = new THREE.Mesh(makeBox(w + 0.16, 0.08, 0.11), kit.trim);
      lintel.position.set(0, h + 0.03, 0.05);
      root.add(lintel);
    }
    group.add(root);
  }

  function parapet(x0, x1, z0, z1, y, mat) {
    const t = 0.14;
    const h = 0.4;
    volume(x0, x1, y, y + h, z0, z0 + t, mat);
    volume(x0, x1, y, y + h, z1 - t, z1, mat);
    volume(x0, x0 + t, y, y + h, z0, z1, mat);
    volume(x1 - t, x1, y, y + h, z0, z1, mat);
  }

  function sagGeo(w, d, sx, sz, sagScale = 1) {
    const geo = new THREE.PlaneGeometry(w, d, sx, sz);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const nx = x / (w * 0.5);
      const nz = z / (d * 0.5);
      let y = -0.34 * sagScale * (1 - nx * nx) * (1 - nz * nz);
      y += 0.12 * sagScale * Math.exp(-nx * nx * 14);
      y += 0.08 * sagScale * Math.exp(-nz * nz * 10);
      y += Math.sin(nx * 9.5) * Math.sin(nz * 7.5) * 0.03 * sagScale;
      y -= 0.08 * sagScale * Math.max(0, nz);
      const dx = x - 1.4;
      const dz = z - 0.7;
      y -= Math.exp(-(dx * dx + dz * dz) * 0.7) * 0.18 * sagScale;
      pos.setY(i, y);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function hangCloth(a, b, drop) {
    const segU = 18;
    const segV = 8;
    const positions = [];
    const uvs = [];
    const indices = [];
    const dir = new THREE.Vector3().subVectors(b, a);
    dir.normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    for (let j = 0; j <= segV; j++) {
      const v = j / segV;
      for (let i = 0; i <= segU; i++) {
        const u = i / segU;
        const p = new THREE.Vector3().lerpVectors(a, b, u);
        const hang = Math.sin(v * Math.PI * 0.9) * drop * (0.3 + 0.7 * Math.sin(u * Math.PI));
        const fold = Math.sin(u * Math.PI * 4) * 0.14 * v;
        p.addScaledVector(side, fold);
        p.y -= hang;
        positions.push(p.x, p.y, p.z);
        uvs.push(u, 1 - v);
      }
    }
    const stride = segU + 1;
    for (let j = 0; j < segV; j++) {
      for (let i = 0; i < segU; i++) {
        const n = j * stride + i;
        indices.push(n, n + stride, n + 1, n + 1, n + stride, n + stride + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, kit.cloth);
    add(mesh);
    animated.push({
      mode: 'cloth',
      geo,
      base: Float32Array.from(geo.attributes.position.array),
      weights: Float32Array.from(uvs.filter((_, idx) => idx % 2 === 1).map((v) => 1 - v)),
    });
    return mesh;
  }

  function wire(ax, ay, az, bx, by, bz, sag) {
    const a = new THREE.Vector3(ax, ay, az);
    const b = new THREE.Vector3(bx, by, bz);
    const mid = a.clone().lerp(b, 0.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.012, 4, false), kit.wire);
    mesh.userData.noShadow = true;
    mesh.userData.noReceive = true;
    add(mesh);
  }

  function palm(x, y, z, h, mat, leanZ = 0) {
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.z = leanZ;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1, 7), kit.bark);
    trunk.scale.y = h;
    trunk.position.y = h / 2;
    root.add(trunk);
    const leafGeo = palm.leafGeo;
    for (let i = 0; i < 8; i++) {
      const piv = new THREE.Group();
      piv.rotation.y = (i / 8) * Math.PI * 2;
      piv.rotation.x = 0.5 + (i % 3) * 0.16;
      const leaf = new THREE.Mesh(leafGeo, mat);
      leaf.position.y = 1.05;
      leaf.userData.noShadow = true;
      const leaf2 = leaf.clone();
      leaf2.rotation.y = 0.7;
      piv.add(leaf, leaf2);
      root.add(piv);
      piv.position.y = h - 0.05;
      animated.push({ mode: 'frond', obj: piv, base: piv.rotation.x, phase: i * 0.8 + x });
    }
    for (let i = 0; i < 3; i++) {
      const piv = new THREE.Group();
      piv.position.y = h - 0.05;
      piv.rotation.y = i * 2.1;
      piv.rotation.x = 0.16;
      const leaf = new THREE.Mesh(leafGeo, mat);
      leaf.position.y = 1.15;
      leaf.scale.set(0.62, 0.82, 1);
      leaf.userData.noShadow = true;
      piv.add(leaf);
      root.add(piv);
    }
    group.add(root);
    if (y < 0.2) solid(x - 0.18, x + 0.18, z - 0.18, z + 0.18);
  }
  palm.leafGeo = new THREE.PlaneGeometry(0.7, 2.3);

  function crate(x, z, w, h, d, color, y = 0) {
    box(w, h, d, kit.crate(color), x, y + h / 2, z);
    solid(x - w / 2, x + w / 2, z - d / 2, z + d / 2);
  }

  // ---------- 地面 ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), kit.cobble);
  ground.rotation.x = -Math.PI / 2;
  ground.userData.noShadow = true;
  add(ground);
  for (const [x, z, rx, rz] of [[5.4, 5.1, 0.9, 0.55], [-5.6, 1.4, 0.7, 0.9]]) {
    const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), kit.sandPile);
    pile.scale.set(rx, 0.07, rz);
    pile.position.set(x, 0.04, z);
    pile.userData.noShadow = true;
    add(pile);
  }

  // ---------- 敞开棚：四根柱子 + 顶棚 ----------
  const B = BOOTH;
  const cx = (B.x0 + B.x1) / 2;
  const cz = (B.z0 + B.z1) / 2;
  const post = 0.42;

  for (const [x, z] of [[B.x0, B.z0], [B.x1, B.z0], [B.x0, B.z1], [B.x1, B.z1]]) {
    box(post, B.h, post, kit.beam, x, B.h / 2, z);
    solid(x - post / 2, x + post / 2, z - post / 2, z + post / 2);
  }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(B.x1 - B.x0 - 0.5, B.z1 - B.z0 - 0.5), kit.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0.02, cz);
  floor.userData.noShadow = true;
  add(floor);

  const xCanvas = document.createElement('canvas');
  xCanvas.width = 512;
  xCanvas.height = 512;
  const xctx = xCanvas.getContext('2d');
  xctx.strokeStyle = '#d21f18';
  xctx.lineWidth = 62;
  xctx.lineCap = 'square';
  xctx.beginPath();
  xctx.moveTo(78, 78);
  xctx.lineTo(434, 434);
  xctx.moveTo(434, 78);
  xctx.lineTo(78, 434);
  xctx.stroke();
  const xTex = new THREE.CanvasTexture(xCanvas);
  xTex.colorSpace = THREE.SRGBColorSpace;
  const xMark = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 4.6),
    new THREE.MeshStandardMaterial({
      map: xTex,
      transparent: true,
      alphaTest: 0.2,
      roughness: 0.62,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
    }),
  );
  xMark.rotation.x = -Math.PI / 2;
  xMark.position.set(cx, 0.045, cz);
  xMark.userData.noShadow = true;
  add(xMark);

  // 右下角（朝向广场的右前柱）内侧的大箱子
  const bw = 2.05;
  const bh = 1.65;
  const bd = 1.75;
  crate(B.x1 - post / 2 - bw / 2 + 0.04, B.z1 - post / 2 - bd / 2 + 0.04, bw, bh, bd, 0xc99555);

  const tarpW = (B.x1 - B.x0) + 1.35;
  const tarpD = (B.z1 - B.z0) + 1.35;
  const tarpY = B.h + 0.16;
  const tarp = new THREE.Mesh(sagGeo(tarpW, tarpD, 28, 20, 1.45), kit.tarp);
  tarp.position.set(cx, tarpY, cz);
  add(tarp);
  animated.push({
    mode: 'tarp',
    geo: tarp.geometry,
    base: Float32Array.from(tarp.geometry.attributes.position.array),
  });
  const patch = new THREE.Mesh(sagGeo(5.2, 3.6, 12, 8, 1.2), kit.tarpPatch);
  patch.position.set(cx - 1.6, tarpY + 0.06, cz - 0.8);
  add(patch);

  const slats = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.9), kit.wood);
  slats.rotation.x = -Math.PI / 2;
  slats.position.set(cx + 1.4, tarpY - 0.28, cz + 0.7);
  const slatUv = slats.geometry.attributes.uv;
  for (let i = 0; i < slatUv.count; i++) slatUv.setXY(i, slatUv.getX(i) * 3, slatUv.getY(i) * 2);
  add(slats);

  const beamY = B.h - 0.08;
  volume(B.x0 - 0.12, B.x1 + 0.12, beamY, beamY + 0.16, B.z0 - 0.22, B.z0 + 0.06, kit.beam);
  volume(B.x0 - 0.12, B.x1 + 0.12, beamY, beamY + 0.16, B.z1 - 0.06, B.z1 + 0.22, kit.beam);
  volume(B.x0 - 0.22, B.x0 + 0.06, beamY, beamY + 0.16, B.z0, B.z1, kit.beam);
  volume(B.x1 - 0.06, B.x1 + 0.22, beamY, beamY + 0.16, B.z0, B.z1, kit.beam);
  volume(B.x0, B.x1, beamY, beamY + 0.12, cz - 0.08, cz + 0.08, kit.beam);

  // ---------- 左：粉墙 ----------
  // 西贴边界墙，北贴北墙；南端北收，给加长阳台和白车通道留空。
  const pink = { x0: -15.5, x1: -9.625, z0: -14.6, z1: 0.3, h: 7.35 };
  const pinkCx = (pink.x0 + pink.x1) / 2;
  block(pink.x0, pink.x1, pink.z0, pink.z1, pink.h, kit.pink);
  skirt(pink.x0, pink.x1, pink.z0, pink.z1, kit.skirtPink);
  parapet(pink.x0, pink.x1, pink.z0, pink.z1, pink.h, kit.pink);
  volume(pink.x0 - 0.06, pink.x1 + 0.06, pink.h - 0.08, pink.h + 0.08, pink.z0 - 0.06, pink.z1 + 0.06, kit.trim);

  const balX0 = pink.x0 + 0.4;
  const balX1 = pink.x1 - 0.4;
  const SOUTH_WALL_Z = 12.4;
  const vanHalf = 2.06;
  const vanZ = SOUTH_WALL_Z - vanHalf;
  const balD = 3.5;
  const balTop = 3.92;
  volume(balX0, balX1, 0, balTop, pink.z1 - 0.05, pink.z1 + balD, kit.pink);
  solid(balX0, balX1, pink.z1 - 0.05, pink.z1 + balD);
  placeWindow((balX0 + balX1) / 2, balTop, pink.z1 + 0.03, balX1 - balX0 - 0.45, 2.15, 0, false);

  for (const z of [-13.1, -10.8, -8.5, -6.2, -3.9, -1.6, 0.05]) {
    placeWindow(pink.x1 + 0.03, 4.4, z, 0.78, 1.05, Math.PI / 2, false);
  }
  box(0.34, 0.36, 0.7, kit.ac, pink.x1 + 0.18, 3.55, -2.2);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, pink.h, 6), kit.metalDark);
  spout.position.set(pink.x1 + 0.08, pink.h / 2, pink.z1 - 0.2);
  add(spout);

  // ---------- 后：白楼（贴北墙的薄条，北墙与棚屋之间留大片空地） ----------
  const backs = [
    { x0: -9.625, x1: -2.05, z0: -14.6, z1: -13.15, h: 9.4 },
    { x0: -2.05, x1: 3.35, z0: -14.6, z1: -13.4, h: 7.8 },
    { x0: 3.35, x1: 8.05, z0: -14.6, z1: -13.05, h: 8.9 },
  ];
  for (const bld of backs) {
    block(bld.x0, bld.x1, bld.z0, bld.z1, bld.h, kit.white);
    skirt(bld.x0, bld.x1, bld.z0, bld.z1, kit.skirtWhite);
    parapet(bld.x0, bld.x1, bld.z0, bld.z1, bld.h, kit.white);
  }
  const windows = [
    [-7.6, 1.35, -13.12, 0.75, 1.15],
    [-5.7, 3.4, -13.12, 0.82, 1.28, true],
    [-3.5, 1.25, -13.12, 0.7, 1.08],
    [-0.6, 1.45, -13.37, 0.88, 1.42, true],
    [1.3, 3.9, -13.37, 0.7, 1.05],
    [4.7, 1.35, -13.02, 0.8, 1.28],
    [6.5, 3.45, -13.02, 0.7, 1.08],
  ];
  for (const [x, y, z, w, h, arch] of windows) {
    placeWindow(x, y, z, w, h, 0, !!arch);
  }

  box(1.28, 0.68, 0.06, kit.trim, 0.4, 4.15, -13.37);
  const arrow = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.58), kit.arrow);
  arrow.position.set(0.4, 4.15, -13.32);
  add(arrow);

  volume(-7.6, -5.5, 9.4, 11.3, -14.45, -13.4, kit.white);
  placeWindow(-6.55, 9.55, -13.37, 0.55, 0.8, 0, false);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 14), kit.tank);
  tank.position.set(0.5, 8.45, -13.95);
  add(tank);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
    kit.metal,
  );
  dish.position.set(5.7, 9.35, -13.75);
  dish.rotation.x = 0.7;
  dish.rotation.y = 0.6;
  add(dish);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.7, 5), kit.metal);
  antenna.position.set(3.7, 9.85, -13.75);
  add(antenna);
  box(0.95, 0.03, 0.03, kit.metal, 3.7, 10.5, -13.75);

  // ---------- 右：蓝墙 ----------
  const blue = { x0: 8.05, x1: 14.48, z0: -14.6, z1: 12.42, h: 6.55 };
  block(blue.x0, blue.x1, blue.z0, blue.z1, blue.h, kit.blue);
  skirt(blue.x0, blue.x1, blue.z0, blue.z1, kit.skirtBlue);
  parapet(blue.x0, blue.x1, blue.z0, blue.z1, blue.h, kit.blue);
  placeWindow(blue.x0 - 0.03, 0.42, 8.7, 2.2, 3.3, -Math.PI / 2, true);
  box(0.32, 0.12, 2.5, kit.concrete, blue.x0 - 0.2, 0.46, 8.7);
  placeWindow(blue.x0 - 0.03, 4.25, 8.7, 0.9, 1.05, -Math.PI / 2, false);
  placeWindow(blue.x0 - 0.03, 1.55, 1.4, 0.85, 1.25, -Math.PI / 2, false);
  placeWindow(blue.x0 - 0.03, 4.15, 1.7, 0.7, 0.95, -Math.PI / 2, false);
  placeWindow(blue.x0 - 0.03, 1.4, -11.2, 0.85, 1.25, -Math.PI / 2, false);
  placeWindow(blue.x0 - 0.03, 4.1, -10.9, 0.7, 0.95, -Math.PI / 2, false);
  placeWindow(blue.x0 - 0.03, 1.5, -7.4, 0.9, 1.35, -Math.PI / 2, true);
  placeWindow(blue.x0 - 0.03, 4.2, -4.2, 0.75, 1.05, -Math.PI / 2, false);
  placeWindow(blue.x0 - 0.03, 1.45, -1.2, 0.8, 1.2, -Math.PI / 2, false);
  placeWindow(10.4, 1.3, blue.z1 + 0.03, 0.9, 1.6, 0, true);
  placeWindow(12.6, 3.6, blue.z1 + 0.03, 0.75, 1.05, 0, false);
  box(0.7, 0.34, 0.32, kit.ac, blue.x0 - 0.02, 3.15, 3.2);

  // ---------- 货车 ----------
  // 竖放：中心 X 与红楼对齐，车头紧贴南侧围墙。
  const vanRot = 0;
  const vanX = pinkCx;
  const van = new THREE.Group();
  van.position.set(vanX, 0, vanZ);
  van.rotation.y = vanRot;
  const body = new THREE.Mesh(makeBox(1.78, 1.62, 4.05), kit.van);
  body.position.y = 1.28;
  van.add(body);
  const trimBand = new THREE.Mesh(makeBox(1.82, 0.28, 4.08), kit.vanTrim);
  trimBand.position.y = 0.62;
  van.add(trimBand);
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.62), kit.glass);
  glassPane.position.set(0, 1.55, 2.03);
  glassPane.userData.noShadow = true;
  van.add(glassPane);
  for (const sx of [-1, 1]) {
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.48), kit.glass);
    sideGlass.position.set(sx * 0.9, 1.52, 0.85);
    sideGlass.rotation.y = sx * Math.PI / 2;
    sideGlass.userData.noShadow = true;
    van.add(sideGlass);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14);
  for (const sx of [-1, 1]) {
    for (const sz of [-1.25, 1.25]) {
      const wheel = new THREE.Mesh(wheelGeo, kit.rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * 0.82, 0.34, sz);
      van.add(wheel);
    }
  }
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0xf0e6c8, emissive: 0xf0e2c0, emissiveIntensity: 0.4, roughness: 0.4,
  });
  for (const sx of [-0.55, 0.55]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.04), lampMat);
    lamp.position.set(sx, 0.85, 2.04);
    van.add(lamp);
  }
  group.add(van);
  {
    const c = Math.abs(Math.cos(vanRot));
    const s = Math.abs(Math.sin(vanRot));
    const hx = 0.95;
    const hz = 2.15;
    const vx = vanX;
    const vz = vanZ;
    solid(vx - (hx * c + hz * s), vx + (hx * c + hz * s), vz - (hx * s + hz * c), vz + (hx * s + hz * c));
  }

  // ---------- 棕榈、电线、橙布 ----------
  palm(-3.4, 0, -4.9, 7.6, kit.leaf, 0.05);
  palm(0.6, 0, -4.95, 8.3, kit.leafDry, -0.04);
  palm(6.7, 0, -4.75, 7.1, kit.leaf, 0.06);
  palm(6.4, 0, -8.4, 7.4, kit.leafDry, -0.05);
  palm(pinkCx, pink.h, (pink.z0 + pink.z1) / 2, 4.6, kit.leaf, 0.08);
  palm(-5.9, backs[0].h, -13.85, 5.2, kit.leaf);
  palm(0.5, backs[1].h, -14.0, 4.8, kit.leafDry, 0.05);
  palm(5.7, backs[2].h, -13.8, 5.4, kit.leaf, -0.06);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 8.4, 6), kit.beam);
  mast.position.set(-5.72, 4.2, -4.85);
  add(mast);
  solid(-5.86, -5.58, -5.0, -4.7);
  box(0.7, 0.06, 0.06, kit.beam, -5.72, 8.15, -4.85);

  wire(pinkCx, pink.h + 0.3, -7.2, -6.2, 9.8, -13.9, 0.75);
  wire(-6.2, 9.7, -13.9, 0.6, 8.3, -14.0, 0.4);
  wire(0.6, 8.2, -14.0, 11.2, 6.9, 1.6, 0.9);
  wire(-5.72, 8.35, -4.85, pinkCx, pink.h + 0.25, -1.8, 0.55);
  wire(-5.72, 8.3, -4.85, 4.4, 9.2, -13.5, 1.15);
  wire(-6.1, 7.6, -1.5, 9.2, 6.8, 5.5, 1.25);
  wire(2.2, 8.5, -13.3, 12.5, 6.9, -0.2, 0.8);

  hangCloth(
    new THREE.Vector3(-0.5, 5.45, -4.18),
    new THREE.Vector3(3.5, 5.35, -4.18),
    1.05,
  );

  // ---------- 远处街区 ----------
  const farSpecs = [
    [-26, 9, 8, 6], [-17, 14, 6, 7], [-9, 10, 7, 5], [-1, 16, 5, 6],
    [6, 11, 7, 5], [14, 13, 6, 7], [22, 8, 7, 5], [30, 12, 6, 6],
  ];
  farSpecs.forEach(([x, h, w, d], i) => {
    const mesh = box(w, h, d, kit.far[i % kit.far.length], x, h / 2 - 0.2, -36);
    mesh.userData.noShadow = true;
    mesh.userData.noReceive = true;
  });

  // 场地边界：黄色实墙，代替原来的空气墙
  const yellowWall = new THREE.MeshStandardMaterial({ color: 0xb5a898, roughness: 0.9 });
  const wallH = 3.2;
  function barrier(x0, x1, z0, z1) {
    volume(x0, x1, 0, wallH, z0, z1, yellowWall);
    solid(x0, x1, z0, z1);
  }
  barrier(-20, 20, 12.4, 13.2);
  barrier(-20, 20, -16.2, -14.7);
  barrier(-16.4, -15.5, -16, 13);
  barrier(14.4, 15.3, -16, 13);

  const barrel = new THREE.Group();
  barrel.position.set(7.55, 0, 10.35);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.86, 12), kit.barrel);
  drum.position.y = 0.43;
  barrel.add(drum);
  for (const y of [0.2, 0.7]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.025, 6, 14), kit.metalDark);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = y;
    barrel.add(rib);
  }
  group.add(barrel);
  solid(7.22, 7.88, 10.02, 10.68);

  group.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = !obj.userData.noShadow;
    obj.receiveShadow = !obj.userData.noReceive;
  });

  function update(t) {
    for (const item of animated) {
      if (item.mode === 'frond') {
        item.obj.rotation.x = item.base + Math.sin(t * 1.15 + item.phase) * 0.035;
        continue;
      }
      const pos = item.geo.attributes.position;
      const base = item.base;
      if (item.mode === 'tarp') {
        for (let i = 0; i < pos.count; i++) {
          pos.setY(i, base[i * 3 + 1] + Math.sin(t * 1.4 + base[i * 3] * 0.8) * 0.012);
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          const w = item.weights[i];
          pos.setY(i, base[i * 3 + 1] + Math.sin(t * 1.6 + i * 0.15) * 0.045 * w);
        }
      }
      pos.needsUpdate = true;
      item.geo.computeVertexNormals();
    }
  }

  return { group, solids, update };
}
