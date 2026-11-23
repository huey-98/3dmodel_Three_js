import * as THREE from 'three';
import { solid, footprint } from './data.js';
import { INTERIOR, OPENINGS } from '../building.js';

// 家具建造器：植物、挂画、沙发、壁炉、书架、床、窗帘等，只依赖 ctx 里的材质与助手。
export function createFurnitureBuilders(ctx) {
  const {
    kit, root, flickers,
    walnut, walnutDark, oak, marbleMat, emerald, emeraldDeep, champagne, blush, ivory,
    linenBlue, leather, leatherDark, gold, rugLiving, rugBed, rugStudy, sheer, drapeByFloor,
    emberMat, rugMat, box, cyl,
  } = ctx;

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

  return {
    plant, bouquet, chandelier, art, mirror, sofa, wing, diningChair, fireplace, bookcase,
    bed, nightstand, clock, curtainsFor,
  };
}
