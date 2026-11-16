import * as THREE from 'three';

// 小木船：U 形船体 + 座板 + 双桨
export function createBoat() {
  const group = new THREE.Group();

  const matHull = new THREE.MeshStandardMaterial({ color: 0x8a5a2e, roughness: 0.8 });
  const matInner = new THREE.MeshStandardMaterial({ color: 0xc59a63, roughness: 0.85 });
  const matTrim = new THREE.MeshStandardMaterial({ color: 0x5e3d20, roughness: 0.85 });
  const matOar = new THREE.MeshStandardMaterial({ color: 0xd2b183, roughness: 0.9 });

  // 船体：U 形截面沿 z（船长方向）挤出
  const shape = new THREE.Shape();
  shape.moveTo(-0.58, 0.52);
  shape.lineTo(0.58, 0.52);
  shape.lineTo(0.34, 0);
  shape.lineTo(-0.34, 0);
  shape.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 3.0, bevelEnabled: true, bevelSize: 0.14, bevelThickness: 0.12, bevelSegments: 2, steps: 1,
  });
  hullGeo.translate(0, 0, -1.5);
  const hull = new THREE.Mesh(hullGeo, matHull);
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  // 内舱地板
  const floor = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 2.7), matInner);
  floor.position.y = 0.04;
  floor.receiveShadow = true;
  group.add(floor);

  // 座板
  for (const z of [-0.6, 0.6]) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.1, 0.4), matInner);
    bench.position.set(0, 0.44, z);
    bench.castShadow = true;
    group.add(bench);
  }

  // 船舷压条
  for (const x of [-0.58, 0.58]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.0), matTrim);
    rail.position.set(x, 0.54, 0);
    group.add(rail);
  }

  // 船桨（绕桨架旋转）
  function createOar(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.58, 0.58, 0.15);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 1.5, 8), matOar);
    shaft.rotation.z = side * Math.PI / 2;
    shaft.position.x = side * 0.75;
    shaft.castShadow = true;
    pivot.add(shaft);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.34), matOar);
    blade.position.x = side * 1.42;
    blade.castShadow = true;
    pivot.add(blade);
    group.add(pivot);
    // 桨架
    const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8), matTrim);
    lock.position.set(side * 0.58, 0.58, 0.15);
    group.add(lock);
    return pivot;
  }
  const oarL = createOar(-1);
  const oarR = createOar(1);

  // 划桨循环：桨叶入水后向后拉
  function setRowPhase(phase) {
    const s = Math.sin(phase);
    oarL.rotation.z = 0.25 - s * 0.28;
    oarL.rotation.y = s * 0.5;
    oarR.rotation.z = -0.25 + s * 0.28;
    oarR.rotation.y = -s * 0.5;
  }

  // 人物落座位置（船体局部坐标，船头朝 +z）
  const seatPosition = new THREE.Vector3(0, -0.26, 0.6);

  return { group, setRowPhase, seatPosition };
}
