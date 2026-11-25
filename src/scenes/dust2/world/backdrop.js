// 界墙外的大漠远景：远山台地、零散废墟楼、更淡的沙色，配合雾做层次感。
import * as THREE from 'three';
import { canvasTex } from '@shared/canvasTex.js';

function mesaTex() {
  return canvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c4a06e';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 70 | 0},${90 + Math.random() * 50 | 0},${50 + Math.random() * 40 | 0},0.4)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 130, 8 + Math.random() * 40);
    }
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,235,190,0.25)');
    g.addColorStop(1, 'rgba(120,86,44,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export function buildBackdrop(ctx) {
  const { group } = ctx;
  const tex = mesaTex();
  const mat = new THREE.MeshBasicMaterial({ map: tex, fog: true });

  // 台地环带：北、东、南三面（西侧留给 A 大远处）
  const mesas = [
    { x: -30, z: -92, w: 90, h: 22, d: 26 },
    { x: 52, z: -70, w: 60, h: 16, d: 30 },
    { x: 108, z: -8, w: 30, h: 26, d: 90 },
    { x: 100, z: 78, w: 60, h: 18, d: 26 },
    { x: -20, z: 101, w: 70, h: 20, d: 24 },
    { x: -96, z: 10, w: 28, h: 24, d: 100 },
  ];
  for (const m of mesas) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(m.w, m.h, m.d), mat);
    mesh.position.set(m.x, m.h / 2 - 2, m.z);
    group.add(mesh);
  }

  // 近一点的废弃土楼剪影
  const ruinMat = new THREE.MeshBasicMaterial({ color: 0xb99a66, fog: true });
  const ruins = [
    [-74, -58, 8, 6, 8], [-76, 40, 10, 4, 7], [72, -40, 9, 7, 9], [58, 52, 7, 5, 8],
    [-70, -8, 6, 8, 6], [40, -84, 12, 5, 6],
  ];
  for (const [x, z, w, h, d] of ruins) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), ruinMat);
    mesh.position.set(x, h / 2 - 1.5, z);
    group.add(mesh);
  }
}