import * as THREE from 'three';
import { FLOOR_H, INTERIOR, OPENINGS } from './building.js';
import { getVillaKit } from './villaMaterials.js';

// 家具碰撞（按楼层；避开楼梯、门洞和上楼通道）
export const FURNITURE_RECTS = [];

function solid(floor, x, z, hx, hz) {
  FURNITURE_RECTS.push({
    floor,
    minX: x - hx, maxX: x + hx,
    minZ: z - hz, maxZ: z + hz,
  });
}

function footprint(rot, hx, hz) {
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  return [hx * c + hz * s, hx * s + hz * c];
}

export function createInterior() {
  FURNITURE_RECTS.length = 0;
  const kit = getVillaKit();
  const root = new THREE.Group();
  const flickers = [];

  const walnut = kit.wood(0x5a3a24, 0.46);
  const walnutDark = kit.wood(0x3b2618, 0.5);
  const oak = kit.wood(0x8a6240, 0.5);
  const marbleMat = kit.mapped(kit.maps.marble, 1, 1, { roughness: 0.16, metalness: 0.06 });
  const emerald = kit.velvet(0x1e6a4a);
  const emeraldDeep = kit.velvet(0x154e38);
  const champagne = kit.velvet(0xcbb98a);
  const blush = kit.velvet(0xa85a68);
  const ivory = kit.linen(0xf7f3ea);
  const linenBlue = kit.linen(0xd5dde6);
  const leather = kit.leather(0x6a242c);
  const leatherDark = kit.leather(0x3d2218);
  const gold = kit.linen(0xd4b36a);
  const rugLiving = rugMat(kit.maps.rugLiving);
  const rugBed = rugMat(kit.maps.rugBed);
  const rugStudy = rugMat(kit.maps.rugStudy);
  const sheer = new THREE.MeshStandardMaterial({
    color: 0xfff8ef, transparent: true, opacity: 0.3, roughness: 0.35,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const drapeByFloor = [emerald, champagne, kit.velvet(0x7a2e3a)];
  const emberMat = () => new THREE.MeshStandardMaterial({
    color: 0xff6a2a, emissive: 0xff5a1a, emissiveIntensity: 1.5, roughness: 0.8,
  });

  function rugMat(map) {
    const mat = kit.mapped(map, 1, 1, { roughness: 1 });
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -2;
    mat.polygonOffsetUnits = -2;
    return mat;
  }

  const box = (w, h, d, mat, x = 0, y = 0, z = 0, parent = null) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (parent) parent.add(mesh);
    return mesh;
  };

  const cyl = (r1, r2, h, mat, x, y, z, seg = 12, parent = null) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (parent) parent.add(mesh);
    return mesh;
  };

  function plant(parent, x, z, floor, s = 1) {
    const g = new THREE.Group();
    cyl(0.16 * s, 0.12 * s, 0.28 * s, kit.stoneDark, 0, 0.14 * s, 0, 10, g);
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.28 * s, 10, 8), new THREE.MeshStandardMaterial({ color: 0x2f6a3c, roughness: 0.9 }));
    a.position.y = 0.48 * s;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.18 * s, 8, 6), new THREE.MeshStandardMaterial({ color: 0x4e9454, roughness: 0.88 }));
    b.position.set(0.12 * s, 0.72 * s, 0);
    g.add(a, b);
    g.position.set(x, 0, z);
    parent.add(g);
    solid(floor, x, z, 0.22 * s, 0.22 * s);
  }

  function bouquet(parent, x, y, z, s = 1) {
    const g = new THREE.Group();
    cyl(0.07 * s, 0.09 * s, 0.22 * s, kit.stoneSmooth, 0, 0.11 * s, 0, 10, g);
    const colors = [0xd4577a, 0xf4f1ea, 0xe7b34a, 0xc46b8a];
    colors.forEach((color, i) => {
      const bloom = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 * s, 8, 6),
        new THREE.MeshStandardMaterial({ color, roughness: 0.65 }),
      );
      bloom.position.set((i - 1.5) * 0.05 * s, 0.28 * s, (i % 2) * 0.04);
      bloom.castShadow = false;
      g.add(bloom);
    });
    g.position.set(x, y, z);
    parent.add(g);
  }

  function chandelier(parent, x, z, intensity = 3.4) {
    const g = new THREE.Group();
    const y0 = 3.92;
    cyl(0.02, 0.02, 0.45, kit.brassDark, 0, y0 - 0.22, 0, 6, g).castShadow = false;
    cyl(0.28, 0.28, 0.04, kit.brass, 0, y0 - 0.48, 0, 16, g).castShadow = false;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const px = Math.cos(a) * 0.34;
      const pz = Math.sin(a) * 0.34;
      const arm = box(0.34, 0.025, 0.025, kit.brass, px / 2, y0 - 0.5, pz / 2, g);
      arm.rotation.y = -a;
      arm.castShadow = false;
      const candle = cyl(0.025, 0.025, 0.12, ivory, px, y0 - 0.58, pz, 6, g);
      candle.castShadow = false;
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffe1a8, emissive: 0xffc56a, emissiveIntensity: 1.6 }),
      );
      flame.position.set(px, y0 - 0.66, pz);
      g.add(flame);
      const drop = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.035, 0),
        new THREE.MeshStandardMaterial({ color: 0xe7f2f8, roughness: 0.08, metalness: 0.15 }),
      );
      drop.position.set(px * 0.72, y0 - 0.78, pz * 0.72);
      g.add(drop);
    }
    const light = new THREE.PointLight(0xffe2be, intensity, 8, 2);
    light.position.set(0, y0 - 0.7, 0);
    g.add(light);
    g.position.set(x, 0, z);
    parent.add(g);
    const rose = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 6, 24), kit.brass);
    rose.rotation.x = Math.PI / 2;
    rose.position.set(x, 3.98, z);
    rose.castShadow = false;
    parent.add(rose);
  }

  function art(parent, x, y, z, w, h, c1, c2) {
    const g = new THREE.Group();
    box(w + 0.1, h + 0.1, 0.045, kit.brassDark, 0, 0, 0, g).castShadow = false;
    box(w, h * 0.52, 0.02, kit.linen(c1), 0, h * 0.2, 0.02, g).castShadow = false;
    box(w, h * 0.48, 0.02, kit.linen(c2), 0, -h * 0.22, 0.02, g).castShadow = false;
    g.position.set(x, y, z);
    parent.add(g);
  }

  function mirror(parent, x, y, z, w, h) {
    const g = new THREE.Group();
    box(w + 0.1, h + 0.1, 0.05, kit.brass, 0, 0, 0, g).castShadow = false;
    const glass = box(w, h, 0.02, new THREE.MeshStandardMaterial({
      color: 0xe8f1f6, metalness: 0.55, roughness: 0.14,
      emissive: 0x9eb6c4, emissiveIntensity: 0.28,
    }), 0, 0, 0.03, g);
    glass.castShadow = false;
    g.position.set(x, y, z);
    parent.add(g);
  }

  function sofa(parent, x, z, rot, floor, mat, scale = 1) {
    const g = new THREE.Group();
    const w = 2.5 * scale;
    const d = 0.92 * scale;
    box(w, 0.34, d, mat, 0, 0.28, 0.04, g);
    box(w, 0.62, 0.16, mat, 0, 0.62, -d / 2 + 0.08, g);
    box(0.16, 0.48, d, mat, -w / 2 + 0.08, 0.48, 0.04, g);
    box(0.16, 0.48, d, mat, w / 2 - 0.08, 0.48, 0.04, g);
    box(w * 0.28, 0.12, d * 0.62, gold, -w * 0.24, 0.5, 0.08, g);
    box(w * 0.28, 0.12, d * 0.62, ivory, w * 0.22, 0.5, 0.08, g);
    box(0.34, 0.1, 0.34, blush, 0, 0.56, 0.12, g);
    for (const lx of [-w / 2 + 0.12, w / 2 - 0.12]) {
      for (const lz of [-0.28, 0.32]) cyl(0.035, 0.04, 0.16, kit.brass, lx, 0.08, lz, 8, g);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    parent.add(g);
    const [hx, hz] = footprint(rot, w / 2, d / 2 + 0.05);
    solid(floor, x, z, hx, hz);
  }

  function wing(parent, x, z, rot, floor, mat) {
    const g = new THREE.Group();
    box(0.68, 0.12, 0.66, mat, 0, 0.46, 0, g);
    box(0.68, 0.72, 0.12, mat, 0, 0.86, -0.28, g);
    box(0.12, 0.42, 0.6, mat, -0.3, 0.7, 0, g);
    box(0.12, 0.42, 0.6, mat, 0.3, 0.7, 0, g);
    box(0.5, 0.08, 0.48, gold, 0, 0.56, 0.02, g);
    for (const [lx, lz] of [[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]]) {
      cyl(0.03, 0.035, 0.42, walnutDark, lx, 0.21, lz, 6, g);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    parent.add(g);
    const [hx, hz] = footprint(rot, 0.38, 0.4);
    solid(floor, x, z, hx, hz);
  }

  function diningChair(parent, x, z, rot) {
    const g = new THREE.Group();
    box(0.44, 0.08, 0.44, ivory, 0, 0.48, 0, g);
    box(0.44, 0.5, 0.08, ivory, 0, 0.74, -0.18, g);
    box(0.4, 0.06, 0.4, walnut, 0, 0.42, 0, g);
    for (const [lx, lz] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]]) {
      cyl(0.025, 0.03, 0.42, walnutDark, lx, 0.21, lz, 6, g);
    }
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    parent.add(g);
  }

  function fireplace(parent, x, z, floor) {
    const g = new THREE.Group();
    box(1.85, 1.25, 0.32, kit.stoneSmooth, 0, 0.66, 0, g);
    box(1.55, 0.12, 0.38, kit.stoneDark, 0, 1.28, 0.02, g);
    box(2.05, 0.1, 0.46, walnut, 0, 1.4, 0.06, g);
    box(0.72, 0.58, 0.16, new THREE.MeshStandardMaterial({ color: 0x1a120e, roughness: 0.95 }), 0, 0.5, 0.1, g);
    const ember = box(0.55, 0.12, 0.18, emberMat(), 0, 0.2, 0.12, g);
    ember.castShadow = false;
    const log = cyl(0.05, 0.05, 0.42, walnutDark, 0, 0.28, 0.12, 8, g);
    log.rotation.z = Math.PI / 2;
    cyl(0.04, 0.045, 0.32, walnut, 0.05, 0.34, 0.14, 6, g).rotation.z = Math.PI / 2.4;
    box(1.15, 0.06, 0.55, kit.stoneDark, 0, 0.04, 0.28, g);
    bouquet(g, -0.55, 1.46, 0.08, 0.85);
    bouquet(g, 0.5, 1.46, 0.08, 0.7);
    cyl(0.04, 0.04, 0.16, kit.brass, -0.15, 1.56, 0.1, 6, g);
    cyl(0.04, 0.04, 0.16, kit.brass, 0.15, 1.56, 0.1, 6, g);
    const light = new THREE.PointLight(0xff7a3c, 2.1, 5.5, 2);
    light.position.set(0, 0.55, 0.35);
    g.add(light);
    g.position.set(x, 0, z);
    parent.add(g);
    solid(floor, x, z + 0.08, 1.02, 0.42);
    flickers.push({ light, ember, base: 2.1 });
  }

  function bookcase(parent, x, z, floor, w) {
    const h = 2.25;
    const g = new THREE.Group();
    box(w, h, 0.3, walnutDark, 0, h / 2, -0.02, g);
    const rows = 5;
    const cols = Math.max(4, Math.floor(w / 0.22));
    for (let r = 0; r < rows; r++) {
      box(w - 0.08, 0.04, 0.26, walnut, 0, 0.28 + r * 0.4, 0.02, g);
    }
    const geo = new THREE.BoxGeometry(0.16, 0.28, 0.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });
    const books = new THREE.InstancedMesh(geo, mat, rows * cols);
    const dummy = new THREE.Object3D();
    const tint = new THREE.Color();
    const palette = [0x8d2f2a, 0x2f4f6a, 0xc4a15a, 0x2f6a3c, 0x6a3a28, 0x243044, 0xa56b3a];
    let n = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dummy.position.set(-w / 2 + 0.18 + c * ((w - 0.28) / cols), 0.48 + r * 0.4, 0.06);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.9 + (c % 3) * 0.08, 0.92 + (r % 2) * 0.08, 1);
        dummy.updateMatrix();
        books.setMatrixAt(n, dummy.matrix);
        books.setColorAt(n, tint.setHex(palette[(r + c) % palette.length]));
        n++;
      }
    }
    books.castShadow = false;
    g.add(books);
    g.position.set(x, 0, z);
    parent.add(g);
    solid(floor, x, z, w / 2, 0.2);
  }

  function bed(parent, x, z, floor) {
    const g = new THREE.Group();
    box(2.25, 0.28, 2.35, walnutDark, 0, 0.22, 0, g);
    box(2.15, 0.22, 2.15, ivory, 0, 0.42, 0.02, g);
    box(2.05, 0.14, 1.7, linenBlue, 0, 0.56, 0.12, g);
    box(0.7, 0.06, 0.45, blush, 0.15, 0.66, 0.45, g);
    box(2.3, 1.15, 0.12, champagne, 0, 0.85, -1.12, g);
    box(2.2, 0.16, 0.08, walnut, 0, 0.28, 1.12, g);
    box(0.7, 0.2, 0.34, ivory, -0.45, 0.72, -0.72, g);
    box(0.7, 0.2, 0.34, ivory, 0.45, 0.72, -0.72, g);
    box(0.55, 0.16, 0.28, blush, -0.15, 0.84, -0.55, g);
    for (const lx of [-1.05, 1.05]) {
      for (const lz of [-1.05, 1.05]) cyl(0.045, 0.05, 0.55, walnut, lx, 0.28, lz, 8, g);
    }
    g.position.set(x, 0, z);
    parent.add(g);
    solid(floor, x, z, 1.16, 1.22);
  }

  function nightstand(parent, x, z, floor) {
    const g = new THREE.Group();
    box(0.5, 0.5, 0.4, walnut, 0, 0.28, 0, g);
    box(0.54, 0.04, 0.44, marbleMat, 0, 0.54, 0, g);
    cyl(0.08, 0.1, 0.16, kit.brassDark, 0, 0.66, 0, 8, g);
    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.16, 0.18, 12, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xfff1d4, emissive: 0xffd7a2, emissiveIntensity: 0.7, side: THREE.DoubleSide,
      }),
    );
    shade.position.y = 0.84;
    g.add(shade);
    const light = new THREE.PointLight(0xffe0b8, 1.05, 3.5, 2);
    light.position.set(0, 0.8, 0);
    g.add(light);
    g.position.set(x, 0, z);
    parent.add(g);
    solid(floor, x, z, 0.28, 0.24);
  }

  function clock(parent, x, z, floor) {
    const g = new THREE.Group();
    box(0.48, 1.85, 0.28, walnutDark, 0, 0.95, 0, g);
    box(0.32, 0.32, 0.04, kit.stoneSmooth, 0, 1.45, 0.14, g).castShadow = false;
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0xf7f1e4, roughness: 0.6 }),
    );
    face.position.set(0, 1.45, 0.17);
    g.add(face);
    box(0.02, 0.08, 0.02, kit.brassDark, 0, 1.48, 0.18, g);
    g.position.set(x, 0, z);
    parent.add(g);
    solid(floor, x, z, 0.28, 0.18);
  }

  function curtainsFor(parent, floor) {
    const groupY = parent.position.y;
    const drape = drapeByFloor[floor];
    for (const op of OPENINGS) {
      if (op.floor !== floor || (op.kind !== 'window' && op.kind !== 'french')) continue;
      let x;
      let z;
      let rot = 0;
      const inset = 0.18;
      if (op.wall === 'front') { x = op.along; z = INTERIOR.maxZ - inset; }
      else if (op.wall === 'back') { x = op.along; z = INTERIOR.minZ + inset; }
      else if (op.wall === 'left') { x = INTERIOR.minX + inset; z = op.along; rot = Math.PI / 2; }
      else { x = INTERIOR.maxX - inset; z = op.along; rot = Math.PI / 2; }
      const g = new THREE.Group();
      const top = (op.y + op.h / 2) - groupY + 0.05;
      const ph = Math.max(0.8, top - 0.06);
      const panelW = Math.min(0.3, op.w * 0.24);
      const span = op.w * 0.46;
      const rod = cyl(0.018, 0.018, op.w + 0.35, kit.brass, 0, top, 0, 8, g);
      rod.rotation.z = Math.PI / 2;
      rod.castShadow = false;
      const left = box(panelW, ph, 0.05, drape, -span, 0.06 + ph / 2, 0, g);
      const right = box(panelW, ph, 0.05, drape, span, 0.06 + ph / 2, 0, g);
      left.castShadow = false;
      right.castShadow = false;
      const veil = box(op.w * 0.5, ph * 0.94, 0.012, sheer, 0, 0.08 + ph * 0.45, 0.02, g);
      veil.castShadow = false;
      veil.receiveShadow = false;
      if (op.kind === 'window') {
        const sillY = (op.y - op.h / 2) - groupY;
        box(op.w + 0.12, 0.05, 0.12, walnut, 0, sillY, 0, g).castShadow = false;
      }
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      parent.add(g);
    }
  }

  // ---------- 一层：门厅、会客厅、餐厅 ----------
  const g0 = new THREE.Group();
  g0.position.y = 0.04;
  const med = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.03, 8, 48), kit.brass);
  med.rotation.x = Math.PI / 2;
  med.position.set(0, 0.02, 3.45);
  g0.add(med);
  box(4.8, 0.025, 3.6, rugLiving, 0.1, 0.02, -2.55, g0);
  sofa(g0, 0.12, -1.32, Math.PI, 0, emerald);
  box(1.05, 0.08, 0.62, marbleMat, 0.12, 0.42, -2.72, g0);
  for (const [lx, lz] of [[-0.32, -2.95], [0.55, -2.95], [-0.32, -2.5], [0.55, -2.5]]) {
    cyl(0.03, 0.04, 0.38, kit.brass, lx, 0.2, lz, 8, g0);
  }
  solid(0, 0.12, -2.72, 0.55, 0.34);
  box(0.28, 0.04, 0.2, walnutDark, -0.1, 0.48, -2.72, g0).castShadow = false;
  bouquet(g0, 0.28, 0.48, -2.65, 0.75);
  wing(g0, -2.35, -3.85, Math.PI / 2, 0, emeraldDeep);
  wing(g0, 2.22, -3.85, -Math.PI / 2, 0, emeraldDeep);
  for (const sx of [-1, 1]) {
    box(0.42, 0.48, 0.36, walnut, sx * 1.72, 0.26, -1.28, g0);
    cyl(0.06, 0.08, 0.22, kit.brass, sx * 1.72, 0.62, -1.28, 8, g0);
    solid(0, sx * 1.72, -1.28, 0.24, 0.2);
  }
  fireplace(g0, 0.12, -5.28, 0);
  art(g0, 0.12, 2.15, -5.5, 1.35, 0.85, 0x1e3d56, 0xc4a15a);
  clock(g0, -3.45, -5.32, 0);
  for (const sx of [-1, 1]) {
    box(1.15, 0.08, 0.38, walnut, sx * 3.85, 0.78, 5.12, g0);
    for (const lx of [-0.42, 0.42]) cyl(0.03, 0.035, 0.74, kit.brass, sx * 3.85 + lx, 0.37, 5.12, 6, g0);
    solid(0, sx * 3.85, 5.12, 0.6, 0.22);
    bouquet(g0, sx * 3.85, 0.86, 5.08, 0.9);
    mirror(g0, sx * 3.85, 1.65, 5.42, 0.7, 1.05);
  }

  box(3.4, 0.02, 2.5, rugLiving, 4.5, 0.02, -2.8, g0);
  cyl(0.16, 0.2, 0.74, walnutDark, 4.5, 0.37, -2.8, 12, g0);
  box(2.2, 0.08, 0.98, walnut, 4.5, 0.78, -2.8, g0);
  bouquet(g0, 4.5, 0.88, -2.8, 0.85);
  cyl(0.035, 0.035, 0.22, kit.brass, 4.15, 0.98, -2.8, 6, g0);
  cyl(0.035, 0.035, 0.22, kit.brass, 4.85, 0.98, -2.8, 6, g0);
  diningChair(g0, 3.95, -2.15, 0);
  diningChair(g0, 5.05, -2.15, 0);
  diningChair(g0, 3.95, -3.45, Math.PI);
  diningChair(g0, 5.05, -3.45, Math.PI);
  diningChair(g0, 3.15, -2.8, Math.PI / 2);
  solid(0, 4.5, -2.85, 1.6, 1.15);
  box(0.42, 0.82, 2.15, walnutDark, 7.22, 0.42, -0.2, g0);
  box(0.48, 0.06, 2.25, marbleMat, 7.22, 0.86, -0.2, g0);
  for (const z of [-0.85, -0.2, 0.45]) {
    cyl(0.05, 0.05, 0.2, new THREE.MeshStandardMaterial({
      color: z < 0 ? 0x7a1e2a : 0xd7b15a, roughness: 0.25, metalness: 0.15,
    }), 7.18, 1.02, z, 8, g0).castShadow = false;
  }
  solid(0, 7.22, -0.2, 0.28, 1.15);

  plant(g0, -7.05, 5.05, 0, 1.05);
  plant(g0, 7.05, 5.05, 0, 0.95);
  plant(g0, -7.05, -5.15, 0, 0.9);
  chandelier(g0, 0, 3.35, 3.6);
  chandelier(g0, 0.1, -2.3, 3.2);
  chandelier(g0, 4.5, -2.8, 2.8);
  curtainsFor(g0, 0);
  root.add(g0);

  // ---------- 二层：主卧套房 ----------
  const g1 = new THREE.Group();
  g1.position.y = FLOOR_H;
  box(4.4, 0.02, 3.5, rugBed, 0.05, 0.02, -3.35, g1);
  bed(g1, 0.05, -4.0, 1);
  nightstand(g1, -1.58, -4.55, 1);
  nightstand(g1, 1.68, -4.55, 1);
  box(1.15, 0.16, 0.38, champagne, 0.05, 0.32, -2.48, g1);
  for (const lx of [-0.42, 0.42]) cyl(0.03, 0.035, 0.28, kit.brass, lx, 0.14, -2.48, 6, g1);
  solid(1, 0.05, -2.48, 0.6, 0.22);
  bookcase(g1, -3.35, -5.28, 1, 1.15);
  box(1.15, 0.72, 0.42, walnut, 2.75, 0.38, -5.18, g1);
  box(1.22, 0.05, 0.48, marbleMat, 2.75, 0.76, -5.18, g1);
  mirror(g1, 2.75, 1.4, -5.42, 0.7, 0.85);
  solid(1, 2.75, -5.18, 0.62, 0.26);
  bouquet(g1, 2.75, 0.82, -5.12, 0.7);
  wing(g1, -2.25, 3.35, Math.PI / 2, 1, blush);
  box(1.35, 0.72, 0.42, walnut, 2.55, 0.38, 4.95, g1);
  solid(1, 2.55, 4.95, 0.7, 0.24);
  art(g1, 0.05, 2.05, -5.5, 1.2, 0.7, 0x1e4d56, 0xf3ead7);
  plant(g1, -6.9, 4.85, 1, 0.9);
  plant(g1, 6.55, -4.85, 1, 0.85);
  chandelier(g1, 0.05, -2.6, 2.8);
  curtainsFor(g1, 1);
  root.add(g1);

  // ---------- 三层：书房与休息室 ----------
  const g2 = new THREE.Group();
  g2.position.y = FLOOR_H * 2;
  box(5.2, 0.02, 3.3, rugStudy, -0.2, 0.02, -3.15, g2);
  fireplace(g2, -0.15, -5.28, 2);
  art(g2, -0.15, 2.2, -5.5, 1.15, 0.72, 0x14283a, 0xc4a15a);
  bookcase(g2, -3.05, -5.28, 2, 2.05);
  bookcase(g2, 2.85, -5.28, 2, 2.05);
  sofa(g2, -0.15, -2.25, Math.PI, 2, leather, 0.92);
  box(0.9, 0.08, 0.5, walnutDark, -0.15, 0.4, -3.35, g2);
  solid(2, -0.15, -3.35, 0.48, 0.28);
  box(0.22, 0.03, 0.16, gold, -0.15, 0.46, -3.35, g2).castShadow = false;
  wing(g2, -2.45, -3.5, Math.PI / 2, 2, leatherDark);
  wing(g2, 2.05, -3.5, -Math.PI / 2, 2, leatherDark);

  box(1.4, 0.06, 0.72, walnut, -4.45, 0.76, 0.45, g2);
  for (const [lx, lz] of [[-0.55, -0.26], [0.55, -0.26], [-0.55, 0.26], [0.55, 0.26]]) {
    cyl(0.035, 0.04, 0.74, walnutDark, -4.45 + lx, 0.37, 0.45 + lz, 6, g2);
  }
  box(0.7, 0.015, 0.48, leather, -4.45, 0.8, 0.45, g2).castShadow = false;
  box(0.28, 0.04, 0.2, gold, -4.7, 0.84, 0.4, g2).castShadow = false;
  const deskShade = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.16, 12, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0x1f6a3c, emissive: 0x14381f, emissiveIntensity: 0.45, side: THREE.DoubleSide,
    }),
  );
  deskShade.position.set(-4.15, 1.05, 0.45);
  g2.add(deskShade);
  cyl(0.03, 0.04, 0.22, kit.brass, -4.15, 0.9, 0.45, 8, g2);
  const deskLight = new THREE.PointLight(0xffe6c4, 1.15, 3.2, 2);
  deskLight.position.set(-4.15, 1.0, 0.45);
  g2.add(deskLight);
  wing(g2, -3.55, 0.45, -Math.PI / 2, 2, leather);
  solid(2, -4.35, 0.45, 1.15, 0.55);

  cyl(0.12, 0.16, 0.72, walnutDark, 0.85, 0.36, 0.15, 10, g2);
  box(1.7, 0.07, 0.85, walnut, 0.7, 0.76, 0.15, g2);
  solid(2, 0.75, 0.15, 1.15, 0.7);
  diningChair(g2, 0.15, 0.7, 0);
  diningChair(g2, 1.25, 0.7, 0);
  diningChair(g2, 0.15, -0.4, Math.PI);
  diningChair(g2, 1.25, -0.4, Math.PI);

  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 14),
    new THREE.MeshStandardMaterial({ color: 0x1d4d62, roughness: 0.45, metalness: 0.15 }),
  );
  globe.position.set(3.25, 1.05, -1.15);
  g2.add(globe);
  const meridian = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 24), kit.brass);
  meridian.position.set(3.25, 1.05, -1.15);
  g2.add(meridian);
  cyl(0.05, 0.16, 0.7, walnutDark, 3.25, 0.35, -1.15, 8, g2);
  solid(2, 3.25, -1.15, 0.28, 0.28);

  box(1.25, 1.05, 0.4, walnutDark, 4.2, 0.55, 4.85, g2);
  box(1.32, 0.06, 0.46, marbleMat, 4.2, 1.1, 4.85, g2);
  for (const [lx, color] of [[-0.35, 0x7a1e2a], [0, 0xc4a15a], [0.32, 0x1d4d62]]) {
    cyl(0.045, 0.045, 0.2, new THREE.MeshStandardMaterial({
      color, roughness: 0.22, metalness: 0.2,
    }), 4.2 + lx, 1.26, 4.82, 8, g2).castShadow = false;
  }
  solid(2, 4.2, 4.85, 0.68, 0.24);
  wing(g2, -4.15, 4.45, Math.PI, 2, leatherDark);
  plant(g2, -6.85, 4.9, 2, 0.9);
  plant(g2, 6.7, -4.7, 2, 0.85);
  chandelier(g2, -0.15, -2.4, 2.7);
  chandelier(g2, 0.7, 0.2, 2.2);
  curtainsFor(g2, 2);
  root.add(g2);

  function update(t) {
    for (const fire of flickers) {
      const k = 0.84 + Math.sin(t * 8.5) * 0.1 + Math.sin(t * 15.7 + fire.base) * 0.06;
      fire.light.intensity = fire.base * k;
      fire.ember.material.emissiveIntensity = 1.15 * k;
    }
  }

  return { group: root, update };
}
