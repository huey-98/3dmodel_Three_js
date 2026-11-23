import * as THREE from 'three';
import { FLOOR_H, COL_XS, COL_Z } from './layout.js';

// 门前石铺地、柱廊、露台、阳台与绿篱。
export function buildPorch(ctx) {
  const {
    kit, group, box, cyl,
    stone, marble, walnut, parquet, paver, plaster, trimWood, doorWood, doorPanel,
    runnerMat, leafMat, leafLite, lampMat, crownMat, matLeft, matRight, matBack, matFront,
  } = ctx;

  // ---------- 门前石铺地、柱廊、露台 ----------
  box(12.2, 0.05, 2.55, paver, 0, 0.025, 7.22, 0.38);

  for (const x of COL_XS) {
    box(0.5, 0.14, 0.5, kit.stoneDark, x, 0.1, COL_Z, 0);
    box(0.4, 0.1, 0.4, kit.stoneSmooth, x, 0.22, COL_Z, 0);
    cyl(0.16, 0.2, 3.42, kit.stoneSmooth, x, 1.98, COL_Z, 18);
    box(0.42, 0.1, 0.42, kit.stoneSmooth, x, 3.74, COL_Z, 0);
    box(0.56, 0.12, 0.56, kit.stoneDark, x, 3.84, COL_Z, 0);
  }
  const beamZ = (6.2 + 8.5) / 2;
  box(7.5, 0.22, 2.35, kit.stoneSmooth, 0, 3.96, beamZ, 0);
  box(7.7, 0.08, 0.16, kit.stoneDark, 0, 3.82, 8.52, 0).castShadow = false;
  for (let i = 0; i < 28; i++) {
    const x = -3.45 + i * (6.9 / 27);
    box(0.09, 0.08, 0.1, kit.stoneSmooth, x, 3.74, 8.46, 0).castShadow = false;
  }

  function addBalcony(deckY, z0, z1, width) {
    const depth = z1 - z0;
    const zc = (z0 + z1) / 2;
    box(width, 0.12, depth, kit.stoneSmooth, 0, deckY - 0.06, zc, 0);
    box(width + 0.08, 0.1, 0.1, kit.stoneDark, 0, deckY - 0.12, z1 - 0.02, 0).castShadow = false;
    const postH = 0.92;
    const yPost = deckY + postH / 2;
    const yRail = deckY + postH;
    const glassH = 0.62;
    const posts = [];
    const step = 0.78;
    for (let x = -width / 2; x <= width / 2 + 0.01; x += step) posts.push([x, z1]);
    for (let z = z0 + 0.35; z < z1 - 0.2; z += step) {
      posts.push([-width / 2, z]);
      posts.push([width / 2, z]);
    }
    for (const [x, z] of posts) {
      cyl(0.03, 0.035, postH, kit.brassDark, x, yPost, z, 8).castShadow = false;
    }
    const frontRail = box(width, 0.05, 0.05, kit.brass, 0, yRail, z1, 0);
    frontRail.castShadow = false;
    box(0.05, 0.05, depth, kit.brass, -width / 2, yRail, zc, 0).castShadow = false;
    box(0.05, 0.05, depth, kit.brass, width / 2, yRail, zc, 0).castShadow = false;
    const pane = (pw, pz, x, z, rot) => {
      const g = box(pw, glassH, 0.02, kit.railGlass, x, deckY + 0.42, z, 0);
      g.castShadow = false;
      g.receiveShadow = false;
      if (rot) g.rotation.y = rot;
      if (pz) {
        g.scale.z = pz / 0.02;
      }
    };
    pane(width - 0.12, 0, 0, z1 - 0.03, 0);
    const sidePane = box(0.02, glassH, depth - 0.2, kit.railGlass, -width / 2 + 0.03, deckY + 0.42, zc, 0);
    sidePane.castShadow = false;
    const sidePaneR = box(0.02, glassH, depth - 0.2, kit.railGlass, width / 2 - 0.03, deckY + 0.42, zc, 0);
    sidePaneR.castShadow = false;
    for (const x of [-width * 0.28, width * 0.28]) {
      box(0.7, 0.22, 0.32, kit.stoneDark, x, deckY + 0.16, z1 - 0.38, 0).castShadow = false;
      for (let i = 0; i < 3; i++) {
        const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), i === 1 ? leafLite : leafMat);
        shrub.position.set(x - 0.2 + i * 0.2, deckY + 0.36, z1 - 0.38);
        shrub.castShadow = false;
        group.add(shrub);
      }
    }
  }
  addBalcony(FLOOR_H, 6.05, 8.32, 7.6);
  addBalcony(FLOOR_H * 2, 6.05, 7.25, 6.2);

  function urn(x, z) {
    cyl(0.22, 0.3, 0.14, kit.stoneDark, x, 0.1, z);
    cyl(0.18, 0.14, 0.32, kit.stoneSmooth, x, 0.32, z);
    cyl(0.26, 0.18, 0.08, kit.stoneDark, x, 0.5, z);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), leafMat);
    ball.position.set(x, 0.78, z);
    ball.castShadow = true;
    group.add(ball);
    const ball2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), leafLite);
    ball2.position.set(x + 0.05, 1.0, z);
    group.add(ball2);
  }
  urn(-4.7, 7.5);
  urn(4.7, 7.5);

  function hedge(x, z, w, d) {
    box(w, 0.72, d, leafMat, x, 0.4, z, 0);
    box(w - 0.1, 0.16, d - 0.1, leafLite, x, 0.84, z, 0).castShadow = false;
  }
  hedge(-6.4, 10.1, 2.4, 2.2);
  hedge(6.7, 10.1, 2.4, 2.2);
}
