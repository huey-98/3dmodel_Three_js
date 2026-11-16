import * as THREE from 'three';

// 楼房尺寸参数
const FLOOR_H = 3;      // 每层高度
const FLOORS = 3;       // 层数
const W = 10;           // 宽度（x 方向）
const D = 8;            // 进深（z 方向）

// 碰撞包围盒（比墙体略大，门前台阶区域也计入）
export const BUILDING_BOUNDS = {
  minX: -W / 2 - 0.8,
  maxX: W / 2 + 0.8,
  minZ: -D / 2 - 0.8,
  maxZ: D / 2 + 1.8,
};

export function createBuilding() {
  const g = new THREE.Group();

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 });
  const slabMat = new THREE.MeshStandardMaterial({ color: 0xb0a08a, roughness: 0.9 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x35586e, roughness: 0.15, metalness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4a3a, roughness: 0.8 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7 });
  const pathMat = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 1 });

  const box = (w, h, d, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  // 主体墙
  const body = box(W, FLOORS * FLOOR_H, D, wallMat);
  body.position.y = (FLOORS * FLOOR_H) / 2;
  g.add(body);

  // 楼板分隔带（每层顶部一圈凸出的横线）
  for (let i = 1; i <= FLOORS; i++) {
    const slab = box(W + 0.4, 0.25, D + 0.4, slabMat);
    slab.position.y = i * FLOOR_H;
    g.add(slab);
  }

  // 窗户：随机部分亮灯
  const addWindow = (x, y, z, rotY) => {
    const win = new THREE.Group();
    const glass = glassMat.clone();
    if (Math.random() < 0.3) {
      glass.color.set(0xffd98a);
      glass.emissive = new THREE.Color(0xffb347);
      glass.emissiveIntensity = 0.7;
    }
    win.add(box(1.3, 1.6, 0.1, frameMat));
    win.add(box(1.1, 1.4, 0.12, glass));
    win.position.set(x, y, z);
    win.rotation.y = rotY;
    g.add(win);
  };

  const winY = (floor) => floor * FLOOR_H + 1.85;
  const frontX = [-3.6, -1.8, 1.8, 3.6];
  const sideZ = [-2.4, 0, 2.4];
  for (let f = 0; f < FLOORS; f++) {
    for (const x of frontX) {
      addWindow(x, winY(f), D / 2 + 0.06, 0);          // 前
      addWindow(x, winY(f), -D / 2 - 0.06, Math.PI);   // 后
    }
    for (const z of sideZ) {
      addWindow(W / 2 + 0.06, winY(f), z, Math.PI / 2);   // 右
      addWindow(-W / 2 - 0.06, winY(f), z, -Math.PI / 2); // 左
    }
  }

  // 大门与台阶
  const door = box(1.8, 2.6, 0.16, doorMat);
  door.position.set(0, 1.3, D / 2 + 0.05);
  g.add(door);
  const step = box(2.8, 0.3, 1.4, slabMat);
  step.position.set(0, 0.15, D / 2 + 0.8);
  g.add(step);

  // 屋顶（四棱锥，先旋转几何体再缩放，保证与矩形墙体对齐）
  const roofGeo = new THREE.ConeGeometry(7.5, 2.6, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.scale.set(1, 1, (D + 0.6) / (W + 0.6));
  roof.position.y = FLOORS * FLOOR_H + 1.3;
  roof.castShadow = true;
  g.add(roof);

  // 门前小路
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 14), pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.02, D / 2 + 7.7);
  path.receiveShadow = true;
  g.add(path);

  return g;
}
