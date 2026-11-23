// 已去掉头侧深色鲸耳块
import * as THREE from 'three';

import { C, mat, mesh, v } from './whaleMaid/base.js';
import { strand, makeBow, flukeGeo } from './whaleMaid/parts.js';
import { drawFace, whaleLogoTex, apronTex, skirtTex } from './whaleMaid/textures.js';

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

  // 行走 / 划船坐姿，idle 时保持轻摆
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
