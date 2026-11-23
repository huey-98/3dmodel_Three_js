import * as THREE from 'three';
import { viewMesh, remember, leatherMap, clothMap } from './resources.js';
import { buildHand, pointHand, addArm } from './hands.js';
import { daggerBladeGeo } from './knifeMotion.js';
import { RIFLE_MUZZLE_Z, PISTOL_MUZZLE_Z } from './constants.js';

// 三把武器的近景几何：步枪、手枪、匕首与枪口闪光灯光源。
export function createWeaponViews({ scene }) {
  const rifleView = new THREE.Group();
  const pistolView = new THREE.Group();
  const knifeView = new THREE.Group();

  const gunMetal = new THREE.MeshStandardMaterial({ color: 0x2a2f36, metalness: 0.78, roughness: 0.32 });
  const slideMetal = new THREE.MeshStandardMaterial({ color: 0xc5ccd4, metalness: 0.72, roughness: 0.26 });
  const gunDark = new THREE.MeshStandardMaterial({ color: 0x171b20, metalness: 0.5, roughness: 0.46 });
  const polymer = new THREE.MeshStandardMaterial({ color: 0x24282e, metalness: 0.08, roughness: 0.62 });
  const bodyGray = new THREE.MeshStandardMaterial({ color: 0x33363c, metalness: 0.12, roughness: 0.68 });
  const skinOrange = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.42, roughness: 0.38 });
  const emblemRed = new THREE.MeshStandardMaterial({
    color: 0xc41e24,
    metalness: 0.2,
    roughness: 0.5,
    emissive: 0x8a1018,
    emissiveIntensity: 0.28,
  });
  const blued = new THREE.MeshStandardMaterial({ color: 0x2a3140, metalness: 0.8, roughness: 0.34 });
  const magSteel = new THREE.MeshStandardMaterial({ color: 0x4a525c, metalness: 0.62, roughness: 0.38 });
  const bladeMetal = new THREE.MeshStandardMaterial({ color: 0xd5dbe3, metalness: 0.84, roughness: 0.18 });
  const leather = new THREE.MeshStandardMaterial({ map: leatherMap, roughness: 0.72, metalness: 0.04 });
  const cloth = new THREE.MeshStandardMaterial({ map: clothMap, roughness: 0.88, metalness: 0 });
  const sleeve = new THREE.MeshStandardMaterial({ map: clothMap, color: 0x23282e, roughness: 0.92, metalness: 0 });

  const part = (parent, geo, mat, x, y, z, rx = 0, rz = 0) => {
    const mesh = viewMesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx;
    mesh.rotation.z = rz;
    parent.add(mesh);
    return mesh;
  };
  const tube = (parent, radius, length, mat, x, y, z) => {
    const mesh = viewMesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const axle = (parent, radius, length, mat, x, y, z) => {
    const mesh = viewMesh(new THREE.CylinderGeometry(radius, radius, length, 8), mat);
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };

  // M4A1-S 造型：提把、消音器，枪管/缓冲管/扳机/拉机柄为橙色。+Z 朝枪口。
  tube(rifleView, 0.011, 0.13, skinOrange, 0, 0.024, -0.31);
  part(rifleView, new THREE.BoxGeometry(0.036, 0.078, 0.1), polymer, 0, 0.028, -0.39);
  part(rifleView, new THREE.BoxGeometry(0.014, 0.058, 0.12), polymer, 0.016, 0.034, -0.36);
  part(rifleView, new THREE.BoxGeometry(0.014, 0.058, 0.12), polymer, -0.016, 0.034, -0.36);
  part(rifleView, new THREE.BoxGeometry(0.042, 0.098, 0.014), gunDark, 0, 0.006, -0.448);
  part(rifleView, new THREE.BoxGeometry(0.046, 0.056, 0.19), bodyGray, 0, 0.012, -0.04);
  part(rifleView, new THREE.BoxGeometry(0.042, 0.034, 0.2), bodyGray, 0, 0.05, -0.03);
  part(rifleView, new THREE.BoxGeometry(0.046, 0.052, 0.1), bodyGray, 0, 0.022, 0.09);
  part(rifleView, new THREE.BoxGeometry(0.006, 0.022, 0.05), gunDark, -0.024, 0.048, 0.02);
  part(rifleView, new THREE.BoxGeometry(0.008, 0.014, 0.034), gunMetal, -0.026, 0.052, -0.04);
  part(rifleView, new THREE.BoxGeometry(0.008, 0.01, 0.018), skinOrange, 0.026, 0.004, -0.04);
  part(rifleView, new THREE.BoxGeometry(0.004, 0.014, 0.026), gunDark, -0.026, -0.002, 0.045);
  part(rifleView, new THREE.BoxGeometry(0.034, 0.048, 0.13), bodyGray, 0, 0.094, -0.06);
  part(rifleView, new THREE.BoxGeometry(0.004, 0.044, 0.11), bodyGray, -0.018, 0.096, -0.02);
  part(rifleView, new THREE.BoxGeometry(0.004, 0.044, 0.11), bodyGray, 0.018, 0.096, -0.02);
  part(rifleView, new THREE.BoxGeometry(0.028, 0.008, 0.11), gunDark, 0, 0.118, -0.05);
  part(rifleView, new THREE.BoxGeometry(0.01, 0.005, 0.008), gunMetal, 0, 0.122, -0.072);
  part(rifleView, new THREE.BoxGeometry(0.006, 0.02, 0.02), emblemRed, -0.022, 0.098, 0.01);
  part(rifleView, new THREE.BoxGeometry(0.024, 0.008, 0.008), gunMetal, 0, 0.122, -0.08);
  part(rifleView, new THREE.BoxGeometry(0.032, 0.092, 0.038), polymer, 0, -0.058, -0.1, 0.28);
  for (const y of [-0.038, -0.052, -0.066]) {
    part(rifleView, new THREE.BoxGeometry(0.006, 0.006, 0.034), gunDark, 0.017, y, -0.092);
  }
  part(rifleView, new THREE.BoxGeometry(0.044, 0.008, 0.03), gunDark, 0, -0.012, 0.015);
  part(rifleView, new THREE.BoxGeometry(0.042, 0.012, 0.016), gunMetal, 0, 0.018, -0.278);
  const rifleBolt = new THREE.Group();
  rifleBolt.position.set(0, 0.108, -0.05);
  rifleView.add(rifleBolt);
  remember(rifleBolt);
  part(rifleBolt, new THREE.BoxGeometry(0.012, 0.008, 0.034), skinOrange, 0, 0, 0);
  part(rifleBolt, new THREE.BoxGeometry(0.022, 0.012, 0.014), skinOrange, 0, 0.006, -0.012);
  const rifleTrigger = new THREE.Group();
  rifleTrigger.position.set(0, -0.012, 0.012);
  rifleView.add(rifleTrigger);
  part(rifleTrigger, new THREE.BoxGeometry(0.008, 0.028, 0.01), skinOrange, 0, -0.01, 0);
  const rifleMag = new THREE.Group();
  rifleMag.position.set(0, -0.004, 0.07);
  rifleView.add(rifleMag);
  remember(rifleMag);
  let magY = -0.008;
  let magZ = 0.004;
  let magAng = -0.12;
  for (let i = 0; i < 5; i++) {
    const last = i === 4;
    const h = last ? 0.018 : 0.046;
    const w = last ? 0.032 : 0.029 - i * 0.002;
    part(rifleMag, new THREE.BoxGeometry(w, h, 0.034), last ? gunMetal : magSteel, 0, magY, magZ, magAng);
    part(rifleMag, new THREE.BoxGeometry(0.004, h * 0.9, 0.006), gunDark, w * 0.42, magY, magZ + 0.018, magAng);
    const step = 0.021;
    magY -= Math.cos(magAng) * step;
    magZ -= Math.sin(magAng) * step;
    magAng -= 0.1;
  }
  part(rifleMag, new THREE.BoxGeometry(0.034, 0.006, 0.036), gunMetal, 0, magY - 0.012, magZ + 0.004, magAng);
  part(rifleMag, new THREE.BoxGeometry(0.012, 0.008, 0.006), gunDark, 0.016, -0.04, 0.02, -0.12);
  part(rifleMag, new THREE.BoxGeometry(0.004, 0.16, 0.005), gunDark, -0.015, -0.06, 0.03, -0.1);
  part(rifleView, new THREE.BoxGeometry(0.012, 0.052, 0.014), gunMetal, 0, 0.02, 0.138);
  part(rifleView, new THREE.BoxGeometry(0.054, 0.048, 0.24), polymer, 0, 0.018, 0.24);
  part(rifleView, new THREE.BoxGeometry(0.056, 0.044, 0.05), polymer, 0, 0.018, 0.365);
  for (let i = 0; i < 10; i++) {
    part(rifleView, new THREE.BoxGeometry(0.056, 0.006, 0.01), gunDark, 0, 0.018, 0.13 + i * 0.022);
  }
  const gasRailY = 0.062;
  const gasRailH = 0.03;
  part(rifleView, new THREE.BoxGeometry(0.022, 0.014, 0.11), gunMetal, 0, 0.072, 0.04, -0.14);
  part(rifleView, new THREE.BoxGeometry(0.024, 0.018, 0.06), gunMetal, 0, 0.056, 0.105);
  part(rifleView, new THREE.BoxGeometry(0.028, gasRailH, 0.32), gunMetal, 0, gasRailY, 0.23);
  part(rifleView, new THREE.BoxGeometry(0.03, gasRailH, 0.05), gunMetal, 0, gasRailY, 0.412);
  part(rifleView, new THREE.BoxGeometry(0.03, 0.018, 0.28), gunMetal, 0, gasRailY + 0.012, 0.26, -0.055);
  for (let i = 0; i < 11; i++) {
    part(rifleView, new THREE.BoxGeometry(0.03, 0.005, 0.01), gunDark, 0, gasRailY + gasRailH * 0.5 + 0.004, 0.1 + i * 0.028);
  }
  tube(rifleView, 0.0032, 0.34, gunDark, 0, gasRailY + 0.005, 0.24);
  part(rifleView, new THREE.BoxGeometry(0.022, 0.014, 0.016), gunMetal, 0, gasRailY, 0.058);
  part(rifleView, new THREE.BoxGeometry(0.026, 0.014, 0.016), gunMetal, 0, gasRailY, 0.428);
  tube(rifleView, 0.014, 0.34, gunDark, 0, 0.032, 0.38);
  tube(rifleView, 0.0105, 0.14, skinOrange, 0, 0.032, 0.33);
  part(rifleView, new THREE.BoxGeometry(0.032, 0.03, 0.022), gunDark, 0, 0.038, 0.44);
  part(rifleView, new THREE.BoxGeometry(0.006, 0.028, 0.015), gunDark, 0.014, 0.036, 0.44);
  part(rifleView, new THREE.BoxGeometry(0.006, 0.028, 0.015), gunDark, -0.014, 0.036, 0.44);
  part(rifleView, new THREE.BoxGeometry(0.005, 0.026, 0.008), gunDark, 0, 0.054, 0.44);
  tube(rifleView, 0.014, 0.16, gunDark, 0, 0.032, 0.54);
  tube(rifleView, 0.0105, 0.16, skinOrange, 0, 0.032, 0.54);
  part(rifleView, new THREE.BoxGeometry(0.046, 0.008, 0.032), gunMetal, 0, 0.032, 0.628);
  part(rifleView, new THREE.BoxGeometry(0.038, 0.038, 0.05), gunDark, 0, 0.032, 0.645);
  tube(rifleView, 0.019, 0.26, gunDark, 0, 0.032, 0.78);
  for (let i = 0; i < 5; i++) {
    part(rifleView, new THREE.BoxGeometry(0.044, 0.003, 0.01), gunMetal, 0, 0.032, 0.69 + i * 0.038);
  }
  part(rifleView, new THREE.BoxGeometry(0.036, 0.004, 0.02), gunDark, 0, 0.032, 0.868);
  tube(rifleView, 0.017, 0.036, gunMetal, 0, 0.032, 0.902);
  part(rifleView, new THREE.BoxGeometry(0.004, 0.034, 0.2), gunDark, 0.028, 0.018, 0.24);
  part(rifleView, new THREE.BoxGeometry(0.004, 0.034, 0.2), gunDark, -0.028, 0.018, 0.24);
  const rifleMuzzle = new THREE.Object3D();
  rifleMuzzle.position.set(0, 0.032, RIFLE_MUZZLE_Z);
  rifleView.add(rifleMuzzle);
  const rifleRight = buildHand(leather, cloth, 'right');
  const rifleLeft = buildHand(leather, cloth, 'left');
  rifleView.add(rifleRight.group, rifleLeft.group);
  rifleRight.group.position.set(-0.02, -0.062, -0.015);
  pointHand(rifleRight.group, new THREE.Vector3(0.1, -0.1, 1), new THREE.Vector3(0.1, 0.45, -1));
  addArm(rifleRight.group, sleeve, new THREE.Vector3(-0.35, -1, -0.04), 0.4);
  rifleRight.group.visible = false;
  remember(rifleRight.group);
  rifleLeft.group.position.set(0, -0.038, 0.26);
  pointHand(rifleLeft.group, new THREE.Vector3(0.04, 0.4, 1), new THREE.Vector3(-0.2, -0.7, -0.6));
  addArm(rifleLeft.group, sleeve, new THREE.Vector3(0.42, -1, -0.05), 0.16);
  remember(rifleLeft.group);

  part(pistolView, new THREE.BoxGeometry(0.032, 0.036, 0.2), slideMetal, 0, 0.045, 0.05);
  part(pistolView, new THREE.BoxGeometry(0.01, 0.016, 0.018), gunDark, 0, 0.07, -0.03);
  part(pistolView, new THREE.BoxGeometry(0.01, 0.018, 0.016), gunDark, 0, 0.068, 0.11);
  const pistolSlide = remember(part(pistolView, new THREE.BoxGeometry(0.034, 0.02, 0.08), slideMetal, 0, 0.05, 0.01));
  const pistolSlideFrontZ = 0.15;
  const pistolSuppressorLen = 0.26;
  const pistolSuppressorY = 0.041;
  const pistolSuppressorR = 0.0175;
  const pistolSuppressorZ = pistolSlideFrontZ + pistolSuppressorLen * 0.5;
  part(pistolView, new THREE.BoxGeometry(0.034, 0.034, 0.006), slideMetal, 0, pistolSuppressorY, pistolSlideFrontZ - 0.001);
  tube(pistolView, pistolSuppressorR, pistolSuppressorLen, slideMetal, 0, pistolSuppressorY, pistolSuppressorZ);
  tube(pistolView, pistolSuppressorR - 0.0025, pistolSuppressorLen - 0.028, gunDark, 0, pistolSuppressorY, pistolSuppressorZ + 0.008);
  tube(pistolView, 0.008, pistolSuppressorLen - 0.03, gunDark, 0, pistolSuppressorY, pistolSuppressorZ + 0.006);
  part(pistolView, new THREE.BoxGeometry(0.038, 0.036, 0.014), gunMetal, 0, pistolSuppressorY, pistolSlideFrontZ + 0.009);
  for (let i = 0; i < 6; i++) {
    const ax = (i % 2 === 0 ? 1 : -1) * 0.014;
    const ay = pistolSuppressorY + (i < 3 ? 0.012 : -0.012);
    part(pistolView, new THREE.BoxGeometry(0.004, 0.004, 0.004), gunDark, ax, ay, pistolSlideFrontZ + 0.01 + (i % 3) * 0.004);
  }
  for (let i = 0; i < 5; i++) {
    part(pistolView, new THREE.BoxGeometry(0.036, 0.003, 0.008), gunMetal, 0, pistolSuppressorY, pistolSlideFrontZ + 0.04 + i * 0.038);
  }
  part(pistolView, new THREE.BoxGeometry(0.034, 0.034, 0.01), gunDark, 0, pistolSuppressorY, pistolSlideFrontZ + pistolSuppressorLen - 0.008);
  tube(pistolView, 0.014, 0.012, gunMetal, 0, pistolSuppressorY, pistolSlideFrontZ + pistolSuppressorLen + 0.002);
  part(pistolView, new THREE.BoxGeometry(0.03, 0.04, 0.12), polymer, 0, 0.02, 0.0);
  part(pistolView, new THREE.BoxGeometry(0.03, 0.11, 0.042), polymer, 0, -0.05, -0.03, 0.2);
  const pistolTrigger = new THREE.Group();
  pistolTrigger.position.set(0, 0.0, 0.02);
  pistolView.add(pistolTrigger);
  part(pistolTrigger, new THREE.BoxGeometry(0.006, 0.026, 0.008), gunDark, 0, -0.01, 0);
  const pistolMag = remember(part(pistolView, new THREE.BoxGeometry(0.026, 0.09, 0.032), gunDark, 0, -0.07, -0.02));
  const pistolMuzzle = new THREE.Object3D();
  pistolMuzzle.position.set(0, 0.04, PISTOL_MUZZLE_Z);
  pistolView.add(pistolMuzzle);
  const pistolHand = buildHand(leather, cloth, 'right');
  const pistolSupport = buildHand(leather, cloth, 'left');
  pistolView.add(pistolHand.group, pistolSupport.group);
  pistolHand.group.position.set(0.01, -0.02, -0.02);
  pointHand(pistolHand.group, new THREE.Vector3(0.08, -0.2, 1), new THREE.Vector3(0.05, 0.4, -1));
  remember(pistolHand.group);
  pistolSupport.group.position.set(0.016, -0.02, 0.03);
  pointHand(pistolSupport.group, new THREE.Vector3(0.35, -0.15, 0.9), new THREE.Vector3(-0.15, 0.35, -1));
  remember(pistolSupport.group);

  knifeView.add(viewMesh(daggerBladeGeo(), bladeMetal));
  part(knifeView, new THREE.BoxGeometry(0.016, 0.066, 0.013), gunMetal, 0, 0, 0.004);
  const quillon = (y) => {
    const ball = viewMesh(new THREE.SphereGeometry(0.008, 10, 8), gunMetal);
    ball.position.set(0, y, 0.004);
    knifeView.add(ball);
  };
  quillon(0.034);
  quillon(-0.034);
  tube(knifeView, 0.015, 0.016, gunMetal, 0, 0, -0.012);
  tube(knifeView, 0.012, 0.078, leather, 0, 0, -0.056);
  tube(knifeView, 0.0142, 0.007, gunDark, 0, 0, -0.026);
  tube(knifeView, 0.0142, 0.007, gunDark, 0, 0, -0.056);
  tube(knifeView, 0.0142, 0.007, gunDark, 0, 0, -0.086);
  const pommel = viewMesh(new THREE.SphereGeometry(0.016, 12, 8), gunMetal);
  pommel.scale.set(1.05, 1.05, 0.7);
  pommel.position.set(0, 0, -0.11);
  knifeView.add(pommel);
  const knifeHand = buildHand(leather, cloth, 'right');
  knifeView.add(knifeHand.group);
  knifeHand.group.position.set(0.014, -0.006, -0.098);
  pointHand(knifeHand.group, new THREE.Vector3(0.78, -0.38, 0.28), new THREE.Vector3(-0.18, 0.82, -0.52));
  addArm(knifeHand.group, cloth, new THREE.Vector3(-0.48, -0.12, -0.88), 0.36);
  remember(knifeHand.group);

  const flashLight = new THREE.PointLight(0xffa040, 0, 8, 2);
  scene.add(flashLight);

  return {
    rifleView, pistolView, knifeView, rifleBolt, rifleTrigger, rifleMag, rifleMuzzle,
    rifleRight, rifleLeft, pistolSlide, pistolTrigger, pistolMag, pistolMuzzle,
    pistolHand, pistolSupport, knifeHand, flashLight,
  };
}
