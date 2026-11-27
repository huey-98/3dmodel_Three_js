import * as THREE from 'three';
import { createBazaarKit } from './materials.js';
import { MAP_SCALE } from './constants.js';
import { createWorldHelpers } from './world/helpers.js';
import { buildBooth } from './world/booth.js';
import { buildWest } from './world/westBuilding.js';
import { buildNorth } from './world/northBuilding.js';
import { buildShop } from './world/shop.js';
import { buildPassage } from './world/passage.js';
import { buildSouth } from './world/southBuilding.js';
import { buildVan } from './world/van.js';
import { buildBackdrop } from './world/backdrop.js';
import { buildEastLot } from './world/eastLot.js';
import { buildASite } from './world/aSite.js';

export { MAP_SCALE };

// 参考图布局：中央绿篷棚屋（正面红字 B），左蓝楼、后白楼、右沙黄楼、南沙黄楼（露天凹槽），沙黄大地砖环绕。
// 只放大水平尺度，层高、窗台和跳板高度不变，人物仍能跳窗、上车。

export function createBazaar() {
  const kit = createBazaarKit();
  const group = new THREE.Group();
  const solids = [];
  const platforms = [];
  const rooms = [];
  const animated = [];
  const geoCache = new Map();
  const archCache = new Map();
  const ctx = { kit, group, solids, platforms, rooms, animated, geoCache, archCache };
  Object.assign(ctx, createWorldHelpers(ctx));

  buildBooth(ctx);
  Object.assign(ctx, buildWest(ctx));
  buildNorth(ctx);
  Object.assign(ctx, buildShop(ctx));
  Object.assign(ctx, buildPassage(ctx));
  Object.assign(ctx, buildSouth(ctx));
  buildVan(ctx);
  buildBackdrop(ctx);
  Object.assign(ctx, buildEastLot(ctx));
  buildASite(ctx);

  group.scale.set(MAP_SCALE, 1, MAP_SCALE);
  for (const list of [solids, platforms, rooms]) {
    for (const b of list) {
      b.minX *= MAP_SCALE;
      b.maxX *= MAP_SCALE;
      b.minZ *= MAP_SCALE;
      b.maxZ *= MAP_SCALE;
    }
  }

  group.traverse((obj) => {
    if (obj.isPointLight) {
      obj.distance *= MAP_SCALE;
      obj.intensity *= MAP_SCALE;
    }
    if (!obj.isMesh) return;
    obj.castShadow = !obj.userData.noShadow;
    obj.receiveShadow = !obj.userData.noReceive;
  });

  function update(t) {
    for (const item of animated) {
      const pos = item.geo.attributes.position;
      const base = item.base;
      if (item.mode === 'tarp') {
        for (let i = 0; i < pos.count; i++) {
          pos.setY(i, base[i * 3 + 1] + Math.sin(t * 1.4 + base[i * 3] * 0.8) * 0.012);
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          const w = item.weights[i];
          pos.setY(i, base[i * 3 + 1] + Math.sin(t * 1.6 + i * 0.15) * 0.045 * w);
        }
      }
      pos.needsUpdate = true;
      item.geo.computeVertexNormals();
    }
  }

  return { group, solids, platforms, rooms, update };
}
