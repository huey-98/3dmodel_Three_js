import * as THREE from 'three';
import { createBazaarKit, mulberry32 } from './materials.js';

// 参考图布局：中央绿篷棚屋（正面红字 B），左蓝楼、后白楼、右沙黄楼、南沙黄楼（露天凹槽），沙黄大地砖环绕。
// 只放大水平尺度，层高、窗台和跳板高度不变，人物仍能跳窗、上车。
export const MAP_SCALE = 1.5;
const BOOTH = { x0: -4.95, x1: 5.25, z0: -4.2, z1: 5.05, h: 5.25 };

export function createBazaar() {
  const kit = createBazaarKit();
  const group = new THREE.Group();
  const solids = [];
  const platforms = [];
  const rooms = [];
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
        const su = faces[f][0] * 0.48 * MAP_SCALE;
        const sv = faces[f][1] * 0.48 * (f === 2 || f === 3 ? MAP_SCALE : 1);
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

  function platform(x0, x1, z0, z1, top) {
    platforms.push({
      minX: Math.min(x0, x1),
      maxX: Math.max(x0, x1),
      minZ: Math.min(z0, z1),
      maxZ: Math.max(z0, z1),
      top,
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

  // rotY：窗朝向。局部 +Z 为室外。open 时不下玻璃，能看见室内。
  function placeWindow(x, y, z, w, h, rotY, arch = false, open = false) {
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = rotY;
    if (!open) {
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
    }

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

  function shellWall(x0, x1, z0, z1, h, mat) {
    volume(x0, x1, 0, h, z0, z1, mat);
    solid(x0, x1, z0, z1);
  }

  function solidAlongZ(x0, x1, z0, z1, holes = []) {
    const cuts = holes
      .map((hole) => ({ z0: hole.at - hole.w / 2, z1: hole.at + hole.w / 2 }))
      .sort((a, b) => a.z0 - b.z0);
    let cursor = z0;
    for (const hole of cuts) {
      if (hole.z0 > cursor + 0.001) solid(x0, x1, cursor, hole.z0);
      cursor = Math.max(cursor, hole.z1);
    }
    if (z1 > cursor + 0.001) solid(x0, x1, cursor, z1);
  }

  // 沿 Z 的墙面上按孔挖洞（孔：{ at, w, y, h }）。
  function pierceZ(x0, x1, y0, y1, z0, z1, holes, mat) {
    const cuts = holes
      .map((hole) => ({
        z0: hole.at - hole.w / 2,
        z1: hole.at + hole.w / 2,
        y: hole.y,
        h: hole.h,
      }))
      .sort((a, b) => a.z0 - b.z0);
    let cursor = z0;
    for (const hole of cuts) {
      if (hole.z0 > cursor + 0.001) volume(x0, x1, y0, y1, cursor, hole.z0, mat);
      if (hole.y > y0 + 0.001) volume(x0, x1, y0, hole.y, hole.z0, hole.z1, mat);
      const top = hole.y + hole.h;
      if (y1 > top + 0.001) volume(x0, x1, top, y1, hole.z0, hole.z1, mat);
      cursor = hole.z1;
    }
    if (z1 > cursor + 0.001) volume(x0, x1, y0, y1, cursor, z1, mat);
  }

  // 拱门洞上沿的两角墙体，让矩形墙洞看起来仍是拱形。
  function placeArchSpandrel(x, y, z, w, h, rotY, depth, mat) {
    const r = Math.min(w / 2 - 0.001, Math.max(0.2, h - 0.25));
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, h - r);
    shape.lineTo(-w / 2, h);
    shape.lineTo(w / 2, h);
    shape.lineTo(w / 2, h - r);
    shape.absarc(0, h - r, r, 0, Math.PI, false);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 14,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotY;
    add(mesh);
  }

  function placeArchway(x, y, z, w, h, rotY) {
    const root = new THREE.Group();
    root.position.set(x, y, z);
    root.rotation.y = rotY;
    const jambH = Math.max(0.35, h - w / 2);
    const sill = new THREE.Mesh(makeBox(w + 0.18, 0.08, 0.2), kit.trim);
    sill.position.set(0, 0.02, 0.08);
    root.add(sill);
    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(makeBox(0.07, jambH, 0.1), kit.trim);
      jamb.position.set(side * w / 2, jambH / 2, 0.045);
      root.add(jamb);
    }
    group.add(root);
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

  function crate(x, z, w, h, d, color, y = 0, stand = false) {
    box(w, h, d, kit.crate(color), x, y + h / 2, z);
    const x0 = x - w / 2;
    const x1 = x + w / 2;
    const z0 = z - d / 2;
    const z1 = z + d / 2;
    if (stand) platform(x0, x1, z0, z1, y + h);
    else solid(x0, x1, z0, z1);
  }

  // ---------- 地面 ----------
  kit.cobble.map.repeat.set(22 * MAP_SCALE, 22 * MAP_SCALE);
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

  const bMark = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), kit.markB);
  bMark.rotation.x = -Math.PI / 2;
  bMark.position.set(cx, 0.045, cz);
  bMark.userData.noShadow = true;
  add(bMark);

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
  for (let i = 0; i < slatUv.count; i++) {
    slatUv.setXY(i, slatUv.getX(i) * 3 * MAP_SCALE, slatUv.getY(i) * 2 * MAP_SCALE);
  }
  add(slats);

  const beamY = B.h - 0.08;
  volume(B.x0 - 0.12, B.x1 + 0.12, beamY, beamY + 0.16, B.z0 - 0.22, B.z0 + 0.06, kit.beam);
  volume(B.x0 - 0.12, B.x1 + 0.12, beamY, beamY + 0.16, B.z1 - 0.06, B.z1 + 0.22, kit.beam);
  volume(B.x0 - 0.22, B.x0 + 0.06, beamY, beamY + 0.16, B.z0, B.z1, kit.beam);
  volume(B.x1 - 0.06, B.x1 + 0.22, beamY, beamY + 0.16, B.z0, B.z1, kit.beam);
  volume(B.x0, B.x1, beamY, beamY + 0.12, cz - 0.08, cz + 0.08, kit.beam);
  // open: true 表示只有顶篷、没有墙，敌人可以走进去。
  rooms.push({ minX: -4.55, maxX: 4.85, minZ: -3.8, maxZ: 4.65, minY: 0.4, maxY: 4.9, open: true });

  // ---------- 左：蓝楼（原红楼加高一层） ----------
  // 西贴边界墙；整体南移，北侧与北墙留空，南端给阳台和白车通道留空。
  const pink = { x0: -15.5, x1: -9.625, z0: -12.6, z1: 2.3, h: 7.35 };
  const balTop = 3.7;
  const storyH = 3.43;
  pink.h = balTop + storyH * 2;
  const pinkCx = (pink.x0 + pink.x1) / 2;
  const pinkT = 0.42;
  const f2 = balTop;
  const f3 = balTop + storyH;
  const winW = 3.05;
  const winH = 2.42;
  const winY = balTop + 0.22;
  const eastWins = [-8.85, -1.25];
  const eastHoles = eastWins.map((at) => ({ at, w: winW, y: winY, h: winH }));

  volume(pink.x0, pink.x1, 0, f2, pink.z0, pink.z1, kit.blue);
  volume(pink.x0, pink.x1, f3, pink.h, pink.z0, pink.z1, kit.blue);
  volume(pink.x0, pink.x0 + pinkT, f2, f3, pink.z0, pink.z1, kit.blue);
  volume(pink.x0, pink.x1, f2, f3, pink.z0, pink.z0 + pinkT, kit.blue);
  pierceZ(pink.x1 - pinkT, pink.x1, f2, f3, pink.z0, pink.z1, eastHoles, kit.blue);

  const southWinW = (pink.x1 - pink.x0) - 0.2;
  const southWinX0 = (pink.x0 + pink.x1) / 2 - southWinW / 2;
  const southWinX1 = southWinX0 + southWinW;
  const southWinTop = f2 + storyH - 0.14;
  volume(pink.x0, southWinX0, f2, f3, pink.z1 - pinkT, pink.z1, kit.blue);
  volume(southWinX1, pink.x1, f2, f3, pink.z1 - pinkT, pink.z1, kit.blue);
  volume(southWinX0, southWinX1, southWinTop, f3, pink.z1 - pinkT, pink.z1, kit.blue);

  const ix0b = pink.x0 + pinkT;
  const ix1b = pink.x1 - pinkT;
  const iz0b = pink.z0 + pinkT;
  const iz1b = pink.z1 - pinkT;
  volume(ix0b, ix1b, f2, f2 + 0.05, iz0b, iz1b, kit.creamFloor);
  volume(ix0b, ix1b, f3 - 0.05, f3, iz0b, iz1b, kit.cream);
  volume(ix0b, ix0b + 0.04, f2, f3, iz0b, iz1b, kit.cream);
  volume(ix0b, ix1b, f2, f3, iz0b, iz0b + 0.04, kit.cream);
  pierceZ(ix1b - 0.04, ix1b, f2, f3, iz0b, iz1b, eastHoles, kit.cream);
  volume(ix0b, southWinX0, f2, f3, iz1b - 0.04, iz1b, kit.cream);
  volume(southWinX1, ix1b, f2, f3, iz1b - 0.04, iz1b, kit.cream);
  volume(southWinX0, southWinX1, southWinTop, f3, iz1b - 0.04, iz1b, kit.cream);

  solid(pink.x0, pink.x0 + pinkT, pink.z0, pink.z1);
  solid(pink.x0, pink.x1, pink.z0, pink.z0 + pinkT);
  solidAlongZ(pink.x1 - pinkT, pink.x1, pink.z0, pink.z1, eastHoles);
  solid(pink.x0, southWinX0, pink.z1 - pinkT, pink.z1);
  solid(southWinX1, pink.x1, pink.z1 - pinkT, pink.z1);
  platform(ix0b, ix1b, iz0b, pink.z1, f2);
  rooms.push({
    minX: ix0b,
    maxX: ix1b,
    minZ: iz0b,
    maxZ: iz1b,
    minY: f2 - 0.15,
    maxY: f3 - 0.15,
  });

  {
    const roomCx = (ix0b + ix1b) / 2;
    const roomCz = (iz0b + iz1b) / 2;
    box(1.55, 0.08, 0.82, kit.wood, roomCx, f2 + 0.76, roomCz - 1.4);
    box(0.08, 0.72, 0.08, kit.beam, roomCx - 0.68, f2 + 0.36, roomCz - 1.72);
    box(0.08, 0.72, 0.08, kit.beam, roomCx + 0.68, f2 + 0.36, roomCz - 1.72);
    box(0.08, 0.72, 0.08, kit.beam, roomCx - 0.68, f2 + 0.36, roomCz - 1.08);
    box(0.08, 0.72, 0.08, kit.beam, roomCx + 0.68, f2 + 0.36, roomCz - 1.08);
    box(1.8, 1.15, 0.42, kit.beam, ix0b + 0.55, f2 + 0.58, roomCz + 2.2);
    box(0.7, 0.42, 0.55, kit.wood, roomCx + 0.9, f2 + 0.24, iz0b + 1.4);
    solid(roomCx - 0.78, roomCx + 0.78, roomCz - 1.4 - 0.41, roomCz - 1.4 + 0.41);
    solid(ix0b + 0.55 - 0.9, ix0b + 0.55 + 0.9, roomCz + 2.2 - 0.21, roomCz + 2.2 + 0.21);
    const roomLamp = new THREE.PointLight(0xfff4d2, 4.2, 14, 2);
    roomLamp.position.set(roomCx, f3 - 0.35, roomCz);
    add(roomLamp);
    box(0.55, 0.05, 0.55, kit.cream, roomCx, f3 - 0.12, roomCz);
  }

  skirt(pink.x0, pink.x1, pink.z0, pink.z1, kit.skirtBlue);
  parapet(pink.x0, pink.x1, pink.z0, pink.z1, pink.h, kit.blue);
  volume(pink.x0 - 0.06, pink.x1 + 0.06, pink.h - 0.08, pink.h + 0.08, pink.z0 - 0.06, pink.z1 + 0.06, kit.trim);

  const balX0 = pink.x0;
  const balX1 = pink.x1;
  const SOUTH_WALL_Z = 12.4;
  const vanHalf = 2.06;
  const balD = 3.5;
  const vanGap = 1.15;
  const vanZ = pink.z1 + balD + vanHalf + vanGap;
  volume(balX0, balX1, 0, balTop, pink.z1 - 0.05, pink.z1 + balD, kit.blue);
  platform(balX0, balX1, pink.z1 - 0.05, pink.z1 + balD, balTop);
  placeWindow(
    (balX0 + balX1) / 2,
    balTop,
    pink.z1 + 0.03,
    southWinW,
    storyH - 0.14,
    0,
    false,
    true,
  );

  // 二楼东立面两扇开口大窗，可看见浅黄室内；三楼实墙无窗。
  for (const z of eastWins) {
    placeWindow(pink.x1 + 0.03, winY, z, winW, winH, Math.PI / 2, false, true);
  }
  box(0.34, 0.36, 0.7, kit.ac, pink.x1 + 0.18, 3.55, -0.2);
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

  // ---------- 右：沙黄楼（可进入的小卖部） ----------
  // 东移；北侧留空，宽度与西楼阳台到南墙相当。西立面南端拱门可走入，北侧大窗开口可跳入。
  // 东墙北段另开一扇后门，经带顶通道穿过东边界墙，通到东侧空地。
  const blueDx = 2.5;
  const northGap = SOUTH_WALL_Z - (pink.z1 + balD);
  const blue = {
    x0: 8.05 + blueDx,
    x1: 14.48 + blueDx,
    z0: -14.7 + northGap,
    z1: 12.42,
    h: 6.55,
  };
  const shopT = 0.4;
  const doorZ = 8.7;
  const doorW = 3.6;
  const doorH = 5.75;
  const doorY = 0.42;
  const doorZ0 = doorZ - doorW / 2;
  const doorZ1 = doorZ + doorW / 2;
  const doorTop = doorY + doorH;
  const shopWinZ = 0.25;
  const shopWinW = 3.9;
  const shopWinH = 2.48;
  const shopWinY = 0.78;
  const winZ0 = shopWinZ - shopWinW / 2;
  const winZ1 = shopWinZ + shopWinW / 2;
  const winTop = shopWinY + shopWinH;
  // 东墙北段的后门，门外通道穿过东边界墙通到场地外。
  const eastDoorZ = -5.2;
  const eastDoorW = 2.4;
  const eastDoorH = 3.0;
  const eastDoorZ0 = eastDoorZ - eastDoorW / 2;
  const eastDoorZ1 = eastDoorZ + eastDoorW / 2;
  const eastDoorHoles = [{ at: eastDoorZ, w: eastDoorW, y: 0, h: eastDoorH }];
  const wx0 = blue.x0;
  const wx1 = blue.x0 + shopT;
  const ix0 = blue.x0 + shopT;
  const ix1 = blue.x1 - shopT;
  const iz0 = blue.z0 + shopT;
  const iz1 = blue.z1 - shopT;

  pierceZ(blue.x1 - shopT, blue.x1, 0, blue.h, blue.z0, blue.z1, eastDoorHoles, kit.sand);
  solidAlongZ(blue.x1 - shopT, blue.x1, blue.z0, blue.z1, eastDoorHoles);
  shellWall(blue.x0, blue.x1, blue.z0, blue.z0 + shopT, blue.h, kit.sand);
  shellWall(blue.x0, blue.x1, blue.z1 - shopT, blue.z1, blue.h, kit.sand);
  volume(wx0, wx1, 0, blue.h, blue.z0, winZ0, kit.sand);
  volume(wx0, wx1, 0, shopWinY, winZ0, winZ1, kit.sand);
  volume(wx0, wx1, winTop, blue.h, winZ0, winZ1, kit.sand);
  volume(wx0, wx1, 0, blue.h, winZ1, doorZ0, kit.sand);
  volume(wx0, wx1, doorTop, blue.h, doorZ0, doorZ1, kit.sand);
  volume(wx0, wx1, 0, blue.h, doorZ1, blue.z1, kit.sand);
  solid(wx0, wx1, blue.z0, winZ0);
  solid(wx0, wx1, winZ1, doorZ0);
  solid(wx0, wx1, doorZ1, blue.z1);
  platform(wx0 - 0.16, wx1 + 0.06, winZ0, winZ1, shopWinY);
  volume(blue.x0, blue.x1, blue.h - 0.22, blue.h, blue.z0, blue.z1, kit.sand);
  volume(ix0, ix1, 0.015, 0.04, iz0, iz1, kit.shopFloor);

  // 室内按库房式超市装：灰绿墙板、深色吊顶加搁栅和风管，墙洞跟着门窗挖。
  const panelT = 0.05;
  const inH = blue.h - 0.22;
  volume(ix0, ix1, 0, inH, iz0, iz0 + panelT, kit.shopWall);
  volume(ix0, ix1, 0, inH, iz1 - panelT, iz1, kit.shopWall);
  pierceZ(ix1 - panelT, ix1, 0, inH, iz0, iz1, eastDoorHoles, kit.shopWall);
  pierceZ(ix0, ix0 + panelT, 0, inH, iz0, iz1, [
    { at: shopWinZ, w: shopWinW, y: shopWinY, h: shopWinH },
    { at: doorZ, w: doorW, y: 0, h: doorTop },
  ], kit.shopWall);
  volume(ix0, ix1, inH - 0.04, inH, iz0, iz1, kit.ceilDark);
  for (let z = iz0 + 1.3; z < iz1 - 0.6; z += 2.6) {
    volume(ix0, ix1, inH - 0.34, inH - 0.04, z - 0.09, z + 0.09, kit.ceilDark);
  }
  volume(ix1 - 1.05, ix1 - 0.45, inH - 0.62, inH - 0.2, iz0 + 0.4, iz1 - 0.4, kit.metalDark);

  const skO = 0.03;
  const skT = 0.12;
  const skH = 0.46;
  volume(blue.x0 - skO, blue.x1 + skO, 0, skH, blue.z0 - skO, blue.z0 + skT, kit.skirtSand);
  volume(blue.x0 - skO, blue.x1 + skO, 0, skH, blue.z1 - skT, blue.z1 + skO, kit.skirtSand);
  volume(blue.x1 - skT, blue.x1 + skO, 0, skH, blue.z0, eastDoorZ0, kit.skirtSand);
  volume(blue.x1 - skT, blue.x1 + skO, 0, skH, eastDoorZ1, blue.z1, kit.skirtSand);
  volume(blue.x0 - skO, blue.x0 + skT, 0, skH, blue.z0, doorZ0, kit.skirtSand);
  volume(blue.x0 - skO, blue.x0 + skT, 0, skH, doorZ1, blue.z1, kit.skirtSand);

  parapet(blue.x0, blue.x1, blue.z0, blue.z1, blue.h, kit.sand);
  placeArchway(blue.x0 - 0.03, doorY, doorZ, doorW, doorH, -Math.PI / 2);
  placeArchSpandrel(wx0, doorY, doorZ, doorW, doorH, Math.PI / 2, shopT, kit.sand);
  box(0.28, 0.1, doorW + 0.28, kit.concrete, blue.x0 - 0.12, 0.05, doorZ);
  placeWindow(blue.x0 - 0.03, shopWinY, shopWinZ, shopWinW, shopWinH, -Math.PI / 2, false, true);
  placeWindow(blue.x1 + 0.03, 0, eastDoorZ, eastDoorW, eastDoorH, Math.PI / 2, false, true);
  box(0.28, 0.1, eastDoorW + 0.28, kit.concrete, blue.x1 + 0.12, 0.05, eastDoorZ);

  const goodsMat = [0xb33b2b, 0xd6a23a, 0x3f7c58, 0x2f5f9a, 0xc8b8a0, 0x7a3e2e, 0xe8e4dc].map(
    (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.68 }),
  );

  // 深色金属货架贴东内墙，在后门以南，避开西窗的视线范围。
  {
    const shZ0 = 3.35;
    const shZ1 = 8.05;
    const shD = 0.46;
    const shH = 2.18;
    const shX1 = ix1 - 0.02;
    const shX0 = shX1 - shD;
    const shCx = (shX0 + shX1) / 2;
    const shCz = (shZ0 + shZ1) / 2;
    const shLen = shZ1 - shZ0;
    box(0.04, shH, shLen, kit.metalDark, shX1 - 0.02, shH / 2, shCz);
    box(shD, shH, 0.05, kit.metalDark, shCx, shH / 2, shZ0 + 0.025);
    box(shD, shH, 0.05, kit.metalDark, shCx, shH / 2, shZ1 - 0.025);
    for (const y of [0.08, 0.62, 1.16, 1.7, 2.14]) {
      box(shD - 0.04, 0.04, shLen - 0.1, kit.metalDark, shCx, y, shCz);
    }
    solid(shX0, shX1, shZ0, shZ1);
    let gi = 0;
    for (const y of [0.22, 0.76, 1.3, 1.84]) {
      for (let s = 0; s < 8; s++) {
        const z = shZ0 + 0.28 + s * ((shLen - 0.56) / 7);
        if (s % 3 === 1) {
          const bottle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.05, 0.26, 8),
            goodsMat[gi % goodsMat.length],
          );
          bottle.position.set(shX1 - 0.16, y + 0.13, z);
          add(bottle);
        } else {
          const w = 0.2 + (s % 3) * 0.04;
          const d = 0.15 + (s % 2) * 0.05;
          const hh = 0.16 + (s % 4) * 0.04;
          box(d, hh, w, goodsMat[gi % goodsMat.length], shX1 - 0.1 - d / 2, y + hh / 2, z);
        }
        gi += 1;
      }
    }
  }

  // 开放式金属货架：四角立柱加几层隔板，占一个碰撞矩形。
  function metalShelf(x0, x1, z0, z1, h, levels = 4) {
    for (const px of [x0 + 0.03, x1 - 0.03]) {
      for (const pz of [z0 + 0.03, z1 - 0.03]) {
        box(0.05, h, 0.05, kit.metalDark, px, h / 2, pz);
      }
    }
    const ys = [];
    for (let i = 0; i < levels; i++) {
      const y = 0.12 + (i * (h - 0.16)) / (levels - 1);
      ys.push(y);
      box(x1 - x0, 0.035, z1 - z0, kit.metalDark, (x0 + x1) / 2, y, (z0 + z1) / 2);
    }
    solid(x0, x1, z0, z1);
    return ys;
  }

  // 北内墙从西到东：货架、托盘袋装货堆、靠后门的收银台。
  {
    const ys = metalShelf(11.15, 12.55, iz0 + 0.02, iz0 + 0.52, 2.2);
    box(0.3, 0.24, 0.26, goodsMat[4], 11.5, ys[1] + 0.14, iz0 + 0.27);
    box(0.24, 0.18, 0.22, goodsMat[1], 12.1, ys[0] + 0.11, iz0 + 0.27);
  }
  {
    const px0 = 12.85;
    const px1 = 14.25;
    const pz0 = iz0 + 0.06;
    const pz1 = iz0 + 1.02;
    box(px1 - px0, 0.09, pz1 - pz0, kit.beam, (px0 + px1) / 2, 0.045, (pz0 + pz1) / 2);
    const rnd = mulberry32(9);
    const sackAlt = kit.sack.clone();
    sackAlt.color.set(0xd6d0c0);
    for (let layer = 0; layer < 4; layer++) {
      const cols = layer < 2 ? 2 : 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 2; j++) {
          const bx = px0 + 0.36 + i * 0.68 + (layer >= 2 ? 0.34 : 0);
          const bz = pz0 + 0.25 + j * 0.47;
          const bag = box(
            0.58, 0.2, 0.38, (i + j + layer) % 2 ? kit.sack : sackAlt,
            bx, 0.09 + 0.11 + layer * 0.21, bz,
          );
          bag.rotation.y = (rnd() - 0.5) * 0.3;
        }
      }
    }
    solid(px0, px1, pz0, pz1);
  }
  {
    const cW = 1.9;
    const cD = 0.72;
    const cH = 1.0;
    const cX = ix1 - cW / 2 - 0.15;
    const cZ = iz0 + cD / 2 + 0.08;
    box(cW, cH - 0.06, cD, kit.metalDark, cX, (cH - 0.06) / 2, cZ);
    box(cW + 0.08, 0.06, cD + 0.08, kit.trim, cX, cH - 0.03, cZ);
    solid(cX - cW / 2, cX + cW / 2, cZ - cD / 2, cZ + cD / 2);
    box(0.34, 0.18, 0.26, kit.metalDark, cX + 0.5, cH + 0.09, cZ);
    box(0.22, 0.15, 0.04, kit.metal, cX + 0.5, cH + 0.25, cZ + 0.12);
    box(0.28, 0.12, 0.22, goodsMat[0], cX - 0.55, cH + 0.06, cZ + 0.04);
  }

  // 南内墙两组基本空置的货架，留几件杂货。
  {
    const ys = metalShelf(11.3, 13.7, iz1 - 0.54, iz1 - 0.04, 2.2);
    box(0.34, 0.26, 0.3, goodsMat[5], 11.8, ys[0] + 0.15, iz1 - 0.29);
    box(0.26, 0.2, 0.24, goodsMat[3], 13.2, ys[2] + 0.12, iz1 - 0.29);
    const ys2 = metalShelf(14.0, 16.2, iz1 - 0.54, iz1 - 0.04, 2.2);
    box(0.3, 0.22, 0.26, goodsMat[6], 15.4, ys2[1] + 0.13, iz1 - 0.29);
  }

  // 西内墙窗与拱门之间的绿色涂鸦。
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.25), kit.graffiti);
  poster.position.set(ix0 + panelT + 0.01, 1.75, 4.5);
  poster.rotation.y = Math.PI / 2;
  poster.userData.noShadow = true;
  poster.userData.noReceive = true;
  add(poster);

  // 地面散落的纸屑杂物，不设碰撞。
  {
    const rnd = mulberry32(17);
    const debrisMat = new THREE.MeshStandardMaterial({ color: 0xd9d9d2, roughness: 0.9 });
    for (let i = 0; i < 26; i++) {
      const w = 0.05 + rnd() * 0.16;
      const d = 0.05 + rnd() * 0.16;
      const bit = box(
        w, 0.012 + rnd() * 0.02, d, debrisMat,
        ix0 + 0.7 + rnd() * (ix1 - ix0 - 1.6), 0.05,
        iz0 + 1.3 + rnd() * (iz1 - iz0 - 2.2),
      );
      bit.rotation.y = rnd() * Math.PI;
      bit.userData.noShadow = true;
    }
  }

  // 吊顶下两排冷白荧光灯管。
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0xf6fafc, emissive: 0xeef4ff, emissiveIntensity: 1.6, roughness: 0.4,
  });
  const shopMidX = (ix0 + ix1) / 2;
  for (const x of [shopMidX - 1.5, shopMidX + 1.5]) {
    for (const z of [-3.6, 6.4]) {
      box(0.22, 0.06, 2.4, kit.metalDark, x, inH - 0.38, z);
      box(0.16, 0.05, 2.3, tubeMat, x, inH - 0.43, z);
      const lamp = new THREE.PointLight(0xeef4ff, 2.6, 12, 2);
      lamp.position.set(x, inH - 0.6, z);
      add(lamp);
    }
  }

  rooms.push({
    minX: blue.x0 + 0.12,
    maxX: ix1,
    minZ: iz0,
    maxZ: iz1,
    minY: 0.2,
    maxY: blue.h - 0.2,
  });

  // ---------- 东门外通道：穿过东边界墙，通到东侧空地 ----------
  const passage = {
    x0: blue.x1,
    x1: blue.x1 + 1.62,
    z0: eastDoorZ0,
    z1: eastDoorZ1,
    h: eastDoorH,
    t: 0.3,
  };
  volume(passage.x0, passage.x1, 0, passage.h + 0.2, passage.z0 - passage.t, passage.z0, kit.sand);
  volume(passage.x0, passage.x1, 0, passage.h + 0.2, passage.z1, passage.z1 + passage.t, kit.sand);
  solid(passage.x0, passage.x1, passage.z0 - passage.t, passage.z0);
  solid(passage.x0, passage.x1, passage.z1, passage.z1 + passage.t);
  volume(passage.x0 - 0.02, passage.x1 + 0.06, passage.h, passage.h + 0.2, passage.z0 - passage.t, passage.z1 + passage.t, kit.concrete);
  volume(ix1, passage.x1, 0.015, 0.04, passage.z0, passage.z1, kit.concrete);
  // 通道算封闭房间：第三人称镜头不穿墙，敌人也不会走进来。
  rooms.push({
    minX: ix1,
    maxX: passage.x1,
    minZ: passage.z0,
    maxZ: passage.z1,
    minY: 0.2,
    maxY: passage.h - 0.1,
  });

  // ---------- 南：沙黄楼，中心向南开露天凹槽 ----------
  // 凹槽口的墙与东楼南沿齐平，略高于人物；左右各留通道。
  const south = {
    x0: pink.x0,
    x1: blue.x1,
    z0: blue.z1,
    z1: blue.z1 + 8.2,
    h: 7.05,
  };
  const recCx = (pink.x1 + blue.x0) / 2;
  const recW = 11.4;
  const recX0 = recCx - recW / 2;
  const recX1 = recCx + recW / 2;
  const recDepth = 6.5;
  const recZ1 = south.z0 + recDepth;
  const gapW = 0.64 * 4.5;
  const wallT = 0.52;
  const screenH = 2.25;
  const wallX0 = recX0 + gapW;
  const wallX1 = recX1 - gapW;
  const wallZ0 = blue.z1;
  const wallZ1 = wallZ0 + wallT;

  block(south.x0, recX0, south.z0, south.z1, south.h, kit.sand);
  block(recX1, south.x1, south.z0, south.z1, south.h, kit.sand);
  block(recX0, recX1, recZ1, south.z1, south.h, kit.sand);
  block(wallX0, wallX1, wallZ0, wallZ1, screenH, kit.sand);

  skirt(south.x0, recX0, south.z0, south.z1, kit.skirtSand);
  skirt(recX1, south.x1, south.z0, south.z1, kit.skirtSand);
  skirt(recX0, recX1, recZ1, south.z1, kit.skirtSand);
  skirt(wallX0, wallX1, wallZ0, wallZ1, kit.skirtSand);

  parapet(south.x0, recX0, south.z0, south.z1, south.h, kit.sand);
  parapet(recX1, south.x1, south.z0, south.z1, south.h, kit.sand);
  parapet(recX0, recX1, recZ1, south.z1, south.h, kit.sand);

  // ---------- 货车 ----------
  // 竖放：中心 X 与西楼对齐，停在阳台南侧通道并留空，车顶可助跑跳上二楼阳台。
  const vanRot = 0;
  const vanX = pinkCx;
  const van = new THREE.Group();
  van.position.set(vanX, 0, vanZ);
  van.rotation.y = vanRot;
  const vanTop = 2.35;
  const bodyH = 1.88;
  const bodyY = vanTop - bodyH / 2;
  const body = new THREE.Mesh(makeBox(1.78, bodyH, 4.05), kit.van);
  body.position.y = bodyY;
  van.add(body);
  const trimBand = new THREE.Mesh(makeBox(1.82, 0.28, 4.08), kit.vanTrim);
  trimBand.position.y = 0.62;
  van.add(trimBand);
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.62), kit.glass);
  glassPane.position.set(0, 1.72, 2.03);
  glassPane.userData.noShadow = true;
  van.add(glassPane);
  for (const sx of [-1, 1]) {
    const sideGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.48), kit.glass);
    sideGlass.position.set(sx * 0.9, 1.68, 0.85);
    sideGlass.rotation.y = sx * Math.PI / 2;
    sideGlass.userData.noShadow = true;
    van.add(sideGlass);
  }
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 14);
  for (const sx of [-1, 1]) {
    for (const sz of [-1.25, 1.25]) {
      const wheel = new THREE.Mesh(wheelGeo, kit.rubber);
      wheel.rotation.z = Math.PI / 2;
      wheel.scale.z = 1 / MAP_SCALE;
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
    const x0 = vx - (hx * c + hz * s);
    const x1 = vx + (hx * c + hz * s);
    const z0 = vz - (hx * s + hz * c);
    const z1 = vz + (hx * s + hz * c);
    platform(x0, x1, z0, z1, vanTop);
  }

  // 车身东侧一只木箱当跳板，先跳上箱子再跳上货车。
  {
    const cw = 0.92;
    const ch = 1.05;
    const cd = 0.88;
    crate(vanX + 0.95 + cw / 2 + 0.06, vanZ - 0.85, cw, ch, cd, 0xc99555, 0, true);
  }

  // ---------- 电线、橙布 ----------
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 8.4, 6), kit.beam);
  mast.position.set(-5.72, 4.2, -4.85);
  add(mast);
  solid(-5.86, -5.58, -5.0, -4.7);
  box(0.7, 0.06, 0.06, kit.beam, -5.72, 8.15, -4.85);

  wire(pinkCx, pink.h + 0.3, (pink.z0 + pink.z1) / 2, -6.2, 9.8, -13.9, 0.75);
  wire(-6.2, 9.7, -13.9, 0.6, 8.3, -14.0, 0.4);
  wire(0.6, 8.2, -14.0, blue.x0 + 3.15, blue.h + 0.35, 1.6, 0.9);
  wire(-5.72, 8.35, -4.85, pinkCx, pink.h + 0.25, pink.z1 - 2.1, 0.55);
  wire(-5.72, 8.3, -4.85, 4.4, 9.2, -13.5, 1.15);
  wire(-6.1, 7.6, -1.5, blue.x0 + 1.15, blue.h + 0.25, 5.5, 1.25);
  wire(2.2, 8.5, -13.3, blue.x0 + 4.45, blue.h + 0.35, -0.2, 0.8);

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

  // 场地边界：北、西实墙；东侧边界墙在东门外通道处断开，通道外再圈出一小块空地，
  // 空地南端用横墙截断；南侧由南楼封住，楼后再挡一截防止绕出。
  const yellowWall = new THREE.MeshStandardMaterial({ color: 0xb5a898, roughness: 0.9 });
  const wallH = 3.2;
  function barrier(x0, x1, z0, z1) {
    volume(x0, x1, 0, wallH, z0, z1, yellowWall);
    solid(x0, x1, z0, z1);
  }
  const lotX1 = 24;
  // 南墙取后门中心与原先墙位的中点，空地只留门口一小段。
  const lotZ1 = (eastDoorZ + 1.5) / 2;
  barrier(-20, lotX1, -16.2, -14.7);
  barrier(-16.4, -15.5, -16, south.z1);
  barrier(blue.x1 - 0.08, blue.x1 + 0.82, -16, passage.z0 - passage.t);
  barrier(blue.x1 - 0.08, blue.x1 + 0.82, passage.z1 + passage.t, lotZ1 + 0.8);
  // 通道上方补到边界墙同高（门洞加高后这段可能为零），不设碰撞。
  volume(blue.x1 - 0.08, blue.x1 + 0.82, passage.h + 0.2, wallH, passage.z0 - passage.t, passage.z1 + passage.t, yellowWall);
  barrier(-20, blue.x1 + 0.82, south.z1, south.z1 + 0.8);
  barrier(lotX1 - 0.8, lotX1, -16, lotZ1 + 0.8);
  barrier(blue.x1 - 0.08, lotX1, lotZ1, lotZ1 + 0.8);

  // 通道外空地上的一堆积沙。
  const lotPile = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), kit.sandPile);
  lotPile.scale.set(1.15, 0.08, 0.85);
  lotPile.position.set(21.3, 0.04, -8.2);
  lotPile.userData.noShadow = true;
  add(lotPile);

  const canR = 0.5;
  const canH = 1.18;
  const canX = blue.x0 - canR - 0.12;
  const canZ = SOUTH_WALL_Z - canR - 0.12;
  const bin = new THREE.Group();
  bin.position.set(canX, 0, canZ);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(canR * 0.92, canR, canH, 18), kit.bin);
  drum.position.y = canH / 2;
  bin.add(drum);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(canR + 0.03, canR + 0.04, 0.07, 18), kit.metalDark);
  foot.position.y = 0.035;
  bin.add(foot);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(canR * 0.96, canR * 0.94, 0.08, 18), kit.metalDark);
  rim.position.y = canH - 0.02;
  bin.add(rim);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(canR * 1.04, canR * 1.02, 0.07, 18), kit.binLid);
  lid.position.y = canH + 0.04;
  bin.add(lid);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(canR * 0.78, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
    kit.binLid,
  );
  dome.position.y = canH + 0.06;
  bin.add(dome);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 14, Math.PI), kit.metal);
  handle.position.y = canH + 0.28;
  handle.rotation.z = Math.PI / 2;
  bin.add(handle);
  group.add(bin);
  solid(canX - canR, canX + canR, canZ - canR, canZ + canR);

  group.scale.set(MAP_SCALE, 1, MAP_SCALE);
  for (const list of [solids, platforms, rooms]) {
    for (const b of list) {
      b.minX *= MAP_SCALE;
      b.maxX *= MAP_SCALE;
      b.minZ *= MAP_SCALE;
      b.maxZ *= MAP_SCALE;
    }
  }

  group.traverse((obj) => {
    if (obj.isPointLight) {
      obj.distance *= MAP_SCALE;
      obj.intensity *= MAP_SCALE;
    }
    if (!obj.isMesh) return;
    obj.castShadow = !obj.userData.noShadow;
    obj.receiveShadow = !obj.userData.noReceive;
  });

  function update(t) {
    for (const item of animated) {
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

  return { group, solids, platforms, rooms, update };
}
