import * as THREE from 'three';
import { mulberry32 } from '../materials.js';

// 东侧沙黄楼：可进入的小卖部，含拱门、窗洞、货架货堆。
export function buildShop(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { SOUTH_WALL_Z, pink, balD } = ctx;
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
  return { blue, eastDoorZ, eastDoorZ0, eastDoorZ1, eastDoorH, ix1 };
}
