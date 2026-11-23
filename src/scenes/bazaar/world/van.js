import * as THREE from 'three';
import { MAP_SCALE } from '../constants.js';

// 广场货车与旁边的跳板箱链（可跳上车顶）。
export function buildVan(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { pinkCx, vanZ } = ctx;
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
}
