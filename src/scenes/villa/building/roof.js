import * as THREE from 'three';
import { W, D, HALF_W, TOP_Y } from './layout.js';

// 四坡屋顶、宝顶与烟囱。
export function buildRoof(ctx) {
  const {
    kit, group, box, cyl,
    stone, marble, walnut, parquet, paver, plaster, trimWood, doorWood, doorPanel,
    runnerMat, leafMat, leafLite, lampMat, crownMat, matLeft, matRight, matBack, matFront,
  } = ctx;

  // ---------- 屋顶 ----------
  const roofGeo = new THREE.ConeGeometry(HALF_W * 1.2, 2.85, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, kit.slate);
  roof.scale.set(1, 1, (D + 1.15) / (W + 1.15));
  roof.position.y = TOP_Y + 0.42 + 1.42;
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);
  cyl(0.05, 0.09, 0.38, kit.copper, 0, TOP_Y + 3.15, 0, 10);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), kit.copper);
  finial.position.y = TOP_Y + 3.4;
  group.add(finial);

  function chimney(x, z) {
    box(0.72, 3.4, 0.72, kit.stoneDark, x, TOP_Y + 2.05, z, 0);
    box(0.9, 0.12, 0.9, kit.stoneSmooth, x, TOP_Y + 3.8, z, 0);
    cyl(0.09, 0.12, 0.22, kit.slateDark, x - 0.16, TOP_Y + 3.96, z - 0.14, 8);
    cyl(0.09, 0.12, 0.22, kit.slateDark, x + 0.16, TOP_Y + 3.96, z + 0.14, 8);
  }
  chimney(-2.5, -1.15);
  chimney(2.7, 0.85);
}
