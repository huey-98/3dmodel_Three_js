// 建造助手：几何缓存、碰撞登记、常用构件。由 createDust2World 挂到 ctx 上。
import * as THREE from 'three';
import { SLAB, VOID_Y } from '../layout.js';

// 贴图世界尺度：1 格纹理约 2.1 米，砖缝尺寸接近原图比例。
const UV_PER_M = 0.48;

export function createWorldHelpers(ctx) {
  const { kit, group, solids, platforms, geoCache } = ctx;

  function add(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  function makeBox(w, h, d) {
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
    let geo = geoCache.get(key);
    if (!geo) {
      geo = new THREE.BoxGeometry(w, h, d);
      const uv = geo.attributes.uv;
      const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
      for (let f = 0; f < 6; f++) {
        const su = faces[f][0] * UV_PER_M;
        const sv = faces[f][1] * UV_PER_M;
        for (let i = 0; i < 4; i++) {
          const idx = f * 4 + i;
          uv.setXY(idx, uv.getX(idx) * su, uv.getY(idx) * sv);
        }
      }
      geoCache.set(key, geo);
    }
    return geo;
  }

  function box(w, h, d, mat, x, y, z) {
    return add(new THREE.Mesh(makeBox(w, h, d), mat).translateX(x).translateY(y).translateZ(z));
  }

  function volume(ax, bx, ay, by, az, bz, mat) {
    const x0 = Math.min(ax, bx);
    const x1 = Math.max(ax, bx);
    const y0 = Math.min(ay, by);
    const y1 = Math.max(ay, by);
    const z0 = Math.min(az, bz);
    const z1 = Math.max(az, bz);
    if (x1 - x0 < 0.001 || y1 - y0 < 0.001 || z1 - z0 < 0.001) return null;
    return box(x1 - x0, y1 - y0, z1 - z0, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  }

  function solid(x0, x1, z0, z1) {
    solids.push({ minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1) });
  }

  // 可站平台：top 是踩面，bottom 是板底（默认板厚 SLAB）。
  // 物理按“脚底高度感知”处理：见 physics.blockedAt。
  function platform(x0, x1, z0, z1, top, bottom = top - SLAB) {
    platforms.push({ minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minZ: Math.min(z0, z1), maxZ: Math.max(z0, z1), top, bottom });
  }

  // 实心楼体：挡人，顶面不可站。
  function block(x0, x1, z0, z1, h, mat, base = VOID_Y) {
    volume(x0, x1, base, h, z0, z1, mat);
    solid(x0, x1, z0, z1);
  }

  // 可跳上去的木箱：挡人 + 顶面可站，y 是箱子底。
  function crate(size, x, z, y = 0, standTop = true) {
    box(size, size, size, kit.crate, x, y + size / 2, z);
    solid(x - size / 2, x + size / 2, z - size / 2, z + size / 2);
    if (standTop) platform(x - size / 2, x + size / 2, z - size / 2, z + size / 2, y + size, y);
    return null;
  }

  // 拱门框：两根柱 + 顶梁，中间过人是空的。axis 'z' 表示洞朝 Z 开口。
  function archGate(cx, cz, w, h, thick, axis, mat, sill = 0) {
    if (axis === 'z') {
      box(thick, h, thick, mat, cx - w / 2 - thick / 2, sill + h / 2, cz);
      box(thick, h, thick, mat, cx + w / 2 + thick / 2, sill + h / 2, cz);
      volume(cx - w / 2 - thick / 2, cx + w / 2 + thick / 2, sill + h, sill + h + thick, cz - thick / 2, cz + thick / 2, mat);
    } else {
      box(thick, h, thick, mat, cx, sill + h / 2, cz - w / 2 - thick / 2);
      box(thick, h, thick, mat, cx, sill + h / 2, cz + w / 2 + thick / 2);
      volume(cx - thick / 2, cx + thick / 2, sill + h, sill + h + thick, cz - w / 2 - thick / 2, cz + w / 2 + thick / 2, mat);
    }
  }

  // 暗色洞口（下水道/拱门内的黑盒子）
  function darkOpening(cx, cz, w, d, h = 4, y0 = 0) {
    volume(cx - w / 2, cx + w / 2, y0, y0 + h, cz - d / 2, cz + d / 2, kit.recess);
  }

  return { add, box, volume, solid, platform, block, crate, archGate, darkOpening };
}
