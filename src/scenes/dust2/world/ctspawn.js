// 警家木构拱廊：竹席顶、木梁拱门、铁窗、Boost 出口。对照 CS2 警家内外两张图。
import * as THREE from 'three';
import { CT_Y } from '../layout.js';

export function buildCtSpawn(ctx) {
  woodenHall(ctx);
  barredWindows(ctx);
  hangingLamps(ctx);
  interiorDressing(ctx);
}

function woodenHall(ctx) {
  const { kit, box, solid, group, archSpandrel } = ctx;
  const y0 = CT_Y;
  const posts = [
    [11.3, 5.4], [11.3, 10.4], [11.3, 15.2],
  ];
  for (const [x, z] of posts) {
    box(0.42, 3.15, 0.42, kit.beam, x, y0 + 1.55, z);
    solid(x - 0.22, x + 0.22, z - 0.22, z + 0.22);
  }
  box(0.58, 3.6, 0.58, kit.beam, 20.55, y0 + 1.8, 6.3);
  box(0.58, 3.6, 0.58, kit.beam, 20.55, y0 + 1.8, 13.7);
  box(0.4, 3.4, 0.4, kit.beam, 20.15, y0 + 1.7, 6.55);
  box(0.4, 3.4, 0.4, kit.beam, 20.15, y0 + 1.7, 13.45);
  solid(20.24, 20.86, 6.0, 6.7);
  solid(20.24, 20.86, 13.3, 14.0);

  const sp = archSpandrel(7.6, 2.7, 0.85, kit.beam);
  sp.position.set(20.95, y0 + 1.08, 10);
  sp.rotation.y = Math.PI / 2;
  sp.castShadow = true;
  sp.receiveShadow = true;
  group.add(sp);
  box(0.85, 0.32, 8.2, kit.beam, 20.55, y0 + 3.62, 10);
  box(0.28, 2.6, 0.28, kit.beam, 20.72, y0 + 1.3, 10);

  box(10.4, 0.12, 11.2, kit.bamboo, 15.8, y0 + 3.62, 10.4);
  for (const z of [5.6, 8.0, 10.4, 12.8, 15.2]) {
    box(10.2, 0.2, 0.28, kit.beam, 15.8, y0 + 3.48, z);
  }
  for (const x of [12.2, 15.8, 19.4]) {
    box(0.22, 0.2, 11.0, kit.beam, x, y0 + 3.5, 10.4);
  }
  box(10.6, 0.18, 0.35, kit.beam, 15.8, y0 + 3.72, 5.3);
  box(10.6, 0.18, 0.35, kit.beam, 15.8, y0 + 3.72, 15.5);
}

function barredWindows(ctx) {
  const { kit, box } = ctx;
  const y0 = CT_Y;
  box(11.2, 5.2, 0.18, kit.weathered, 16, y0 + 2.4, 3.98);
  for (const x of [13.2, 17.6]) {
    box(1.9, 1.55, 0.14, kit.recess, x, y0 + 1.75, 4.16);
    for (let i = -2; i <= 2; i++) {
      box(0.05, 1.4, 0.05, kit.iron, x + i * 0.32, y0 + 1.75, 4.28);
    }
    for (let j = -1; j <= 1; j++) {
      box(1.7, 0.05, 0.05, kit.iron, x, y0 + 1.75 + j * 0.48, 4.28);
    }
    box(2.1, 0.12, 0.2, kit.mass, x, y0 + 0.9, 4.32);
  }
}

function hangingLamps(ctx) {
  const { kit, box, group } = ctx;
  const y0 = CT_Y;
  for (const [x, z] of [[14.2, 8.6], [17.8, 12.2]]) {
    box(0.04, 0.55, 0.04, kit.iron, x, y0 + 3.25, z);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), kit.lampGlow);
    bulb.position.set(x, y0 + 2.9, z);
    group.add(bulb);
    const light = new THREE.PointLight(0xffc078, 14, 9, 1.6);
    light.position.set(x, y0 + 2.7, z);
    group.add(light);
  }
}

function interiorDressing(ctx) {
  const { kit, box, solid } = ctx;
  const y0 = CT_Y;
  box(0.12, 1.5, 2.4, kit.wood, 12.2, y0 + 0.85, 7.4);
  box(0.12, 1.3, 2.0, kit.wood, 12.35, y0 + 0.75, 7.6);
  box(1.6, 0.12, 0.9, kit.wood, 12.6, y0 + 0.08, 9.5);
  box(1.4, 0.12, 0.8, kit.wood, 12.7, y0 + 0.18, 9.6);
  solid(12.1, 12.5, 6.3, 8.6);
}
