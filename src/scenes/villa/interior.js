import * as THREE from 'three';
import { FLOOR_H, INTERIOR, OPENINGS } from './building.js';
import { getVillaKit } from './villaMaterials.js';
import { FURNITURE_RECTS } from './interior/data.js';
import { createInteriorParts } from './interior/parts.js';
import { createFurnitureBuilders } from './interior/furniture.js';
import { buildFloor1 } from './interior/floor1.js';
import { buildFloor2 } from './interior/floor2.js';
import { buildFloor3 } from './interior/floor3.js';

export { FURNITURE_RECTS };

export function createInterior() {
  FURNITURE_RECTS.length = 0;
  const kit = getVillaKit();
  const root = new THREE.Group();
  const flickers = [];
  const ctx = { kit, root, flickers };
  Object.assign(ctx, createInteriorParts(ctx));
  Object.assign(ctx, createFurnitureBuilders(ctx));

  buildFloor1(ctx);
  buildFloor2(ctx);
  buildFloor3(ctx);

  function update(t) {
    for (const fire of flickers) {
      const k = 0.84 + Math.sin(t * 8.5) * 0.1 + Math.sin(t * 15.7 + fire.base) * 0.06;
      fire.light.intensity = fire.base * k;
      fire.ember.material.emissiveIntensity = 1.15 * k;
    }
  }

  return { group: root, update };
}
