import * as THREE from 'three';

// 用基础几何体拼一个简易小人，四肢带关节枢轴，可摆动
export function createPerson() {
  const group = new THREE.Group(); // 外层：位置、朝向、跳跃高度
  const rig = new THREE.Group();   // 内层：走路起伏动画
  group.add(rig);

  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.8 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3b6fd4, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.9 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 });

  const mesh = (geo, mat) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  };

  // 关节：枢轴 Group 放在关节位置，网格向下偏移，旋转枢轴即可摆动肢体
  const limb = (geo, mat, px, py, offsetY) => {
    const pivot = new THREE.Group();
    pivot.position.set(px, py, 0);
    const m = mesh(geo, mat);
    m.position.y = offsetY;
    pivot.add(m);
    rig.add(pivot);
    return pivot;
  };

  // 腿
  const legGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
  const legL = limb(legGeo, pantsMat, -0.13, 0.75, -0.35);
  const legR = limb(legGeo, pantsMat, 0.13, 0.75, -0.35);
  const shoeGeo = new THREE.BoxGeometry(0.22, 0.12, 0.32);
  const shoeL = mesh(shoeGeo, shoeMat);
  shoeL.position.set(0, -0.65, 0.05);
  legL.add(shoeL);
  const shoeR = mesh(shoeGeo, shoeMat);
  shoeR.position.set(0, -0.65, 0.05);
  legR.add(shoeR);

  // 躯干
  const body = mesh(new THREE.BoxGeometry(0.52, 0.6, 0.3), shirtMat);
  body.position.y = 1.05;
  rig.add(body);

  // 头与头发
  const head = mesh(new THREE.SphereGeometry(0.21, 24, 16), skinMat);
  head.position.y = 1.58;
  rig.add(head);
  const hair = mesh(
    new THREE.SphereGeometry(0.215, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
    hairMat
  );
  hair.position.y = 1.6;
  rig.add(hair);

  // 手臂与手
  const armGeo = new THREE.BoxGeometry(0.14, 0.58, 0.14);
  const armL = limb(armGeo, shirtMat, -0.34, 1.32, -0.29);
  const armR = limb(armGeo, shirtMat, 0.34, 1.32, -0.29);
  const handGeo = new THREE.SphereGeometry(0.08, 12, 8);
  const handL = mesh(handGeo, skinMat);
  handL.position.y = -0.33;
  armL.add(handL);
  const handR = mesh(handGeo, skinMat);
  handR.position.y = -0.33;
  armR.add(handR);

  let phase = 0;    // 步行动画相位
  let swing = 0;    // 当前摆幅（平滑过渡用）

  function update(dt, moving) {
    const targetAmp = moving ? 0.6 : 0;
    swing += (targetAmp - swing) * Math.min(dt * 10, 1);
    if (moving) phase += dt * 9;
    const s = Math.sin(phase) * swing;
    legL.rotation.x = s;
    legR.rotation.x = -s;
    armL.rotation.x = -s * 0.85;
    armR.rotation.x = s * 0.85;
    // 行走时身体轻微起伏（作用于内层 rig，不影响跳跃高度）
    rig.position.y = moving ? Math.abs(Math.cos(phase)) * 0.04 * (swing / 0.6) : 0;
  }

  return { group, update };
}
