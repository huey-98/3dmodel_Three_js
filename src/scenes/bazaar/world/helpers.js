import * as THREE from 'three';
import { MAP_SCALE } from '../constants.js';

// 建造助手：几何缓存、实体碰撞、门窗与拱、布帘电线等。由 createBazaar 挂到 ctx 上。
export function createWorldHelpers(ctx) {
  const { kit, group, solids, platforms, animated, geoCache, archCache } = ctx;

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

  return {
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  };
}
