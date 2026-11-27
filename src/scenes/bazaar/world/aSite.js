import * as THREE from 'three';

// A 包点：高台东北角、警家台阶正北的一片掩体。北面是一整面夯土墙，墙前挂着外露木
// 脚手架与悬挑跳台；西侧一栋白楼当包点西墙，中间留一扇能穿过去的拱门。
// 只做地图与掩体，不参与战斗逻辑；刷怪点与路径都在高台以南（世界 z >= -17），不受影响。
// 坐标都是缩放前的局部值，水平尺度由 world.js 收尾统一乘 MAP_SCALE。
export function buildASite(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { pad, blk } = ctx;
  const padY = pad.y;                       // 高台台面 0.7
  const wallTop = 13.0;                     // 主墙顶；世界 Y 13.6 才出阳阴影上界，所以到此为止
  const nubTop = 13.4;                      // L 型转角那一截略高，檐口出一个台阶
  const blkCz = (blk.z0 + blk.z1) / 2;
  // 台面起跳 1.541，加 STEP_UP 0.35 的余量，顶面超过 2.59 就一次跳不上去。
  const face = blk.z1;                       // 主墙南面
  const arch = { x: 42.4, w: 4.8, h: 6.0 }; // 墙上唯一的开口，挪到西侧给木平台让位
  // 悬挑平台的进深 2.93（原来 4.4，按需求缩短三分之一）；转角那截比台面再多挑 1 米。
  const deckDepth = 2.93;
  const deck = { x0: 45.6, x1: 50.2, z0: face, z1: face + deckDepth, top: 2.75, t: 0.14 };
  const nub = { x0: deck.x1, x1: 52.4, z0: face, z1: face + deckDepth + 1.0 };   // 与主墙成 L 型
  // 包点中心：红方框与红圈都以它为准。方框东南角最接近台阶口，那一只角不放东西。
  const site = { cx: 47.6, cz: -18.0, frame: 8.6, ring: 4.6 };

  // ---------- 北侧夯土墙：主墙 + L 型转角 ----------
  const hz0 = arch.x - arch.w / 2;
  const hz1 = arch.x + arch.w / 2;
  // 洞只开在南面 1.3 米厚的一堵里，后面是实心楼体：拱龛是几何缺失而不是通道，人进不去。
  const band = face - 1.3;
  volume(blk.x0, blk.x1, padY, wallTop, blk.z0, band, kit.adobe);
  volume(blk.x0, hz0, padY, wallTop, band, face, kit.adobe);
  volume(hz1, blk.x1, padY, wallTop, band, face, kit.adobe);
  volume(hz0, hz1, padY + arch.h, wallTop, band, face, kit.adobe);
  solid(blk.x0, blk.x1, blk.z0, blk.z1);
  // 矩形洞上沿两角补成半券（同 shop.js 的拱门手法，只是这面朝南）。
  placeArchSpandrel(arch.x, padY, band, arch.w, arch.h, 0, face - band, kit.adobe);
  // 龛底挂白色格子拱窗：离背墙 6 厘米，券外四角透明，露出土黄墙面。
  const archWin = new THREE.Mesh(new THREE.PlaneGeometry(arch.w, arch.h), kit.archWin);
  archWin.position.set(arch.x, padY + arch.h / 2, band + 0.06);
  archWin.userData.noShadow = true;
  add(archWin);
  placeArchway(arch.x, padY, face + 0.03, arch.w, arch.h, 0);
  // 转角那截往南挑出的墙，顶面比主墙高 0.4，两堵在 (50.2, -21.6) 收成 L 型内角。
  volume(nub.x0, nub.x1, padY, nubTop, nub.z0, nub.z1, kit.adobe);
  solid(nub.x0, nub.x1, nub.z0, nub.z1);

  // 条石压边：墙两端与转角的竖向石墩，加一道通高水平石带（灰白，跟土黄墙反差）。
  volume(blk.x0, blk.x0 + 0.5, padY, wallTop, face, face + 0.1, kit.stone);
  volume(blk.x1 - 0.5, blk.x1, padY, wallTop, face, face + 0.1, kit.stone);
  volume(nub.x0 - 0.1, nub.x0 + 0.3, padY, nubTop, nub.z1, nub.z1 + 0.1, kit.stone);
  volume(blk.x0, hz0, 10.4, 10.7, face, face + 0.1, kit.stone);
  volume(hz1, blk.x1, 10.4, 10.7, face, face + 0.1, kit.stone);
  volume(nub.x0, nub.x1, 10.8, 11.1, nub.z1, nub.z1 + 0.1, kit.stone);
  // skirt() 固定画 y 0 到 0.46，在高台上会整块埋进台身，所以基座自己写石砌台沿。
  volume(blk.x0 - 0.03, blk.x1 + 0.03, padY, padY + 0.5, face - 0.03, face + 0.03, kit.stone);
  volume(blk.x0 - 0.03, blk.x0 + 0.03, padY, padY + 0.5, blk.z0, blk.z1, kit.stone);
  volume(nub.x0 - 0.03, nub.x1 + 0.03, padY, padY + 0.5, nub.z1 - 0.03, nub.z1 + 0.03, kit.stone);
  volume(nub.x1 - 0.03, nub.x1 + 0.03, padY, padY + 0.5, nub.z0, nub.z1, kit.stone);

  // 出檐板加托木，跟 rowA/rowB、wf、blueB 同一套立面语言；主墙与转角各一道，顶面差 0.4。
  box(blk.x1 - blk.x0 + 0.3, 0.14, 0.5, kit.trim, (blk.x0 + blk.x1) / 2, wallTop - 0.05, face + 0.15);
  for (let x = blk.x0 + 0.4; x < blk.x1; x += 1.2) {
    box(0.12, 0.18, 0.34, kit.beam, x, wallTop - 0.28, face + 0.1);
  }
  box(0.5, 0.14, blk.z1 - blk.z0 + 0.3, kit.trim, blk.x0 - 0.15, wallTop - 0.05, blkCz);
  for (let z = blk.z0 + 0.4; z < blk.z1; z += 2.4) {
    box(0.34, 0.18, 0.12, kit.beam, blk.x0 - 0.1, wallTop - 0.28, z);
  }
  box(nub.x1 - nub.x0 + 0.3, 0.14, 0.5, kit.trim, (nub.x0 + nub.x1) / 2, nubTop - 0.05, nub.z1 - 0.15);
  box(0.5, 0.14, nub.z1 - nub.z0 + 0.3, kit.trim, nub.x1 + 0.15, nubTop - 0.05, (nub.z0 + nub.z1) / 2);
  for (let x = nub.x0 + 0.3; x < nub.x1; x += 0.9) {
    box(0.12, 0.18, 0.34, kit.beam, x, nubTop - 0.28, nub.z1 - 0.1);
  }
  for (let z = nub.z0 + 0.4; z < nub.z1; z += 1.2) {
    box(0.34, 0.18, 0.12, kit.beam, nub.x1 + 0.1, nubTop - 0.28, z);
  }
  parapet(blk.x0, blk.x1, blk.z0, blk.z1, wallTop, kit.adobe);
  parapet(nub.x0, nub.x1, nub.z0, nub.z1, nubTop, kit.adobe);
  const blkTank = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 14), kit.tank);
  blkTank.position.set(blk.x0 + 2.4, wallTop + 0.6, blk.z0 + 1.6);
  add(blkTank);
  // 整面墙只留左侧那一个拱券开口，不设门窗与空调外机。

  // ---------- 墙面木构架（脚手架式格构 + 两把梯子）----------
  // 只是依附在墙面上的框架，没有围护也不给碰撞：主墙 solid 已经挡住，人是撞不到木架的。
  const fr = { x0: deck.x0 + 0.2, x1: deck.x1 - 0.2, y0: deck.top + 0.6, y1: 9.7 };
  for (let x = fr.x0; x <= fr.x1 + 0.01; x += 1.2) {
    box(0.18, fr.y1 - fr.y0, 0.16, kit.beam, x, (fr.y0 + fr.y1) / 2, face + 0.08);
  }
  for (const y of [fr.y0, 5.0, 6.65, 8.3, fr.y1]) {
    box(fr.x1 - fr.x0 + 0.18, 0.16, 0.16, kit.wood, (fr.x0 + fr.x1) / 2, y, face + 0.08);
  }
  // 两把木梯：两侧立杆加五道踏步，靠在格构上，纯粹是通往"后方宫殿二层"的样子。
  for (const lx of [fr.x0 + 1.2, fr.x1 - 0.6]) {
    for (const s of [-0.3, 0.3]) {
      box(0.07, 3.4, 0.07, kit.wood, lx + s, deck.top + 1.7, face + 0.2);
    }
    for (let k = 0; k < 5; k++) {
      box(0.66, 0.05, 0.06, kit.wood, lx, deck.top + 0.5 + k * 0.72, face + 0.2);
    }
  }

  // ---------- 悬挑木平台（跳台）----------
  // 台面 2.75、板底 2.61，下面留 1.9 米净空：靠 physics 的 KNEE 判定，人能从台面下走过，
  // 也能从平台下那堆箱顶（2.2）跳上来。整块台面只注册一个平台，带 bottom。
  const joistY = deck.top - deck.t - 0.1;
  for (const jx of [deck.x0 + 0.8, 48.0, deck.x1 - 0.8]) {
    box(0.16, 0.2, deck.z1 - deck.z0, kit.beam, jx, joistY, (deck.z0 + deck.z1) / 2);
  }
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const z = deck.z0 + (i + 0.5) * (deck.z1 - deck.z0) / rows;
    const gap = i === 2;                                    // 中间一块缩进，留个缺口
    const len = deck.x1 - deck.x0 - (gap ? 1.5 : 0);
    box(len, deck.t, (deck.z1 - deck.z0) / rows - 0.06, kit.wood,
      gap ? deck.x1 - len / 2 : (deck.x0 + deck.x1) / 2, deck.top - deck.t / 2, z);
  }
  platform(deck.x0, deck.x1, deck.z0, deck.z1, deck.top, deck.top - deck.t);
  // 台面下的支撑立柱：细 footprint，柱间净宽足够过人。
  for (const px of [deck.x0 + 0.4, 48.0, deck.x1 - 0.4]) {
    box(0.18, deck.top - deck.t - padY, 0.18, kit.beam, px, padY + (deck.top - deck.t - padY) / 2, deck.z1 - 0.1);
    solid(px - 0.15, px + 0.15, deck.z1 - 0.28, deck.z1 + 0.08);
  }
  // 平台遮蔽出一块半封闭凹空间：地面换铺方形石砖，右下角堆 6 只木箱当踏脚。
  const pocketTex = kit.shopFloor.map.clone();
  pocketTex.needsUpdate = true;
  //  repeat 按边的实际长度给，方砖在两个方向上才是正方形
  pocketTex.repeat.set((deck.x1 - deck.x0) / 1.53, (deck.z1 - deck.z0) / 1.53);
  const pocketFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(deck.x1 - deck.x0, deck.z1 - deck.z0),
    new THREE.MeshStandardMaterial({
      map: pocketTex, roughness: 0.6,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    }),
  );
  pocketFloor.rotation.x = -Math.PI / 2;
  pocketFloor.position.set((deck.x0 + deck.x1) / 2, padY + 0.02, (deck.z0 + deck.z1) / 2);
  pocketFloor.userData.noShadow = true;
  add(pocketFloor);

  const cs = { x: 48.9, z: face + 0.5, w: 0.6, d: 0.8, h: 0.75 };
  for (const i of [-1, 0, 1]) {
    for (let lvl = 0; lvl < 2; lvl++) {
      box(cs.w, cs.h, cs.d, kit.crate(lvl ? 0xbc8a4e : 0xc99555),
        cs.x + i * (cs.w + 0.03), padY + cs.h * (lvl + 0.5), cs.z);
    }
  }
  // 两层三列共 6 只，整堆只注册一个顶面 2.2：比台面低 0.55 以上，不会被误当成台面上去。
  platform(cs.x - 0.94, cs.x + 0.94, cs.z - cs.d / 2, cs.z + cs.d / 2, padY + 2 * cs.h);

  // 平台左端衔接一只矮木箱掩体（纯 solid，挡人挡枪）。
  crate(44.6, face + 1.3, 1.4, 1.9, 1.6, 0xc99555, padY, false);

  // ---------- 西侧立面：一排白楼当包点的西墙 ----------
  // 东面 x = 36 那面朝包点，北端接进北侧体块、南端顶到东通道北侧那栋沿街白楼 rowB 的北墙，
  // 与北立面绕西北角折成一条连续街墙。中间开一扇真能穿过去的拱门：门洞那段与过梁都不注册
  // solid（solid 与高度无关，给了就等于把门堵死），高台西半现在只经这门进出。
  const wing = { x0: 34.5, x1: 36, z0: blk.z1, z1: pad.z1, top: padY + 5.6 };
  const wingCz = (wing.z0 + wing.z1) / 2;
  const door = { z: -16.0, w: 2.4, h: 3.6 };
  const dz0 = door.z - door.w / 2;
  const dz1 = door.z + door.w / 2;
  volume(wing.x0, wing.x1, padY, wing.top, wing.z0, dz0, kit.white);
  volume(wing.x0, wing.x1, padY, wing.top, dz1, wing.z1, kit.white);
  volume(wing.x0, wing.x1, padY + door.h, wing.top, dz0, dz1, kit.white);
  solidAlongZ(wing.x0, wing.x1, wing.z0, wing.z1, [{ at: door.z, w: door.w }]);
  placeArchSpandrel(wing.x0, padY, door.z, door.w, door.h, Math.PI / 2, wing.x1 - wing.x0, kit.white);
  placeArchway(wing.x1 + 0.02, padY, door.z, door.w, door.h, Math.PI / 2);
  placeArchway(wing.x0 - 0.02, padY, door.z, door.w, door.h, -Math.PI / 2);
  volume(wing.x0 - 0.03, wing.x0 + 0.03, padY, padY + 0.46, wing.z0, wing.z1, kit.skirtWhite);
  volume(wing.x1 - 0.03, wing.x1 + 0.03, padY, padY + 0.46, wing.z0, wing.z1, kit.skirtWhite);
  parapet(wing.x0, wing.x1, wing.z0, wing.z1, wing.top, kit.white);
  box(0.5, 0.14, wing.z1 - wing.z0 + 0.3, kit.trim, wing.x1 + 0.15, wing.top - 0.05, wingCz);
  for (let z = wing.z0 + 0.5; z < wing.z1; z += 1.5) {
    box(0.34, 0.18, 0.12, kit.beam, wing.x1 + 0.1, wing.top - 0.28, z);
  }
  // 东立面 rotY = Math.PI / 2：placeWindow 的局部 +Z 转到世界 +X，与 eb 朝西用 -PI/2 同理。
  // 两个拱形壁龛排在门洞以北那一段，门洞以南只剩一小截，配一扇小窗。
  placeWindow(wing.x1 + 0.03, padY + 0.3, -22.2, 2.4, 3.2, Math.PI / 2, true, false);
  placeWindow(wing.x1 + 0.03, padY + 0.3, -18.6, 2.0, 2.8, Math.PI / 2, true, false);
  placeWindow(wing.x1 + 0.03, 2.4, -13.2, 0.9, 1.2, Math.PI / 2);
  // 西面朝高台西侧走道，开两扇小窗，不留 blank 墙。
  placeWindow(wing.x0 - 0.03, 2.2, -22.4, 0.85, 1.15, -Math.PI / 2);
  placeWindow(wing.x0 - 0.03, 2.2, -13.2, 0.85, 1.15, -Math.PI / 2);
  const wingTank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12), kit.tank);
  wingTank.position.set((wing.x0 + wing.x1) / 2, wing.top + 0.45, wing.z0 + 2.2);
  add(wingTank);

  // ---------- 木箱堆与掩体 ----------
  // 每堆只按最终顶面注册一个 platform：底层顶也注册的话，顶箱内缩沿比角色半径窄，
  // 落进那一圈时 groundAt 会取到上层顶面，人就会站在箱体里。
  function pile(cx, czp, bw, bd, bh, tw, td, th, yaw = 0.1) {
    box(bw, bh, bd, kit.crate(0xc99555), cx, padY + bh / 2, czp);
    box(tw, th, td, kit.crate(0xbc8a4e), cx, padY + bh + th / 2, czp).rotation.y = yaw;
    platform(cx - bw / 2, cx + bw / 2, czp - bd / 2, czp + bd / 2, padY + bh + th);
  }

  function pallet(cx, czp, pw, pd) {
    // 三只墩块在下、面板盖在上面，顶面才是一块平整的托盘。
    for (let i = -1; i <= 1; i++) box(pw, 0.13, 0.11, kit.beam, cx, padY + 0.065, czp + i * (pd / 2.6));
    box(pw, 0.05, pd, kit.beam, cx, padY + 0.155, czp);
    platform(cx - pw / 2, cx + pw / 2, czp - pd / 2, czp + pd / 2, padY + 0.18);
  }

  // 方框的西南角：沿 Z 并排的两只大箱再叠一层，整堆顶面 3.0，比一次起跳够得着的高，
  // 要借紧挨着东侧那只两级矮堆（2.35）跳上来；顶上横搭两块木板。
  const bsX = 44.6;
  const bsZ = -14.9;
  for (const dz of [-0.725, 0.725]) {
    box(1.1, 1.15, 1.45, kit.crate(0xc99555), bsX, padY + 0.575, bsZ + dz);
    box(1.1, 1.15, 1.45, kit.crate(0xbc8a4e), bsX, padY + 1.725, bsZ + dz);
  }
  platform(bsX - 0.55, bsX + 0.55, bsZ - 1.45, bsZ + 1.45, padY + 2.3);
  for (const [dz, yaw] of [[-0.6, 0.04], [0.55, -0.05]]) {
    box(1.0, 0.06, 1.3, kit.wood, bsX, padY + 2.33, bsZ + dz).rotation.y = yaw;
  }
  pile(46.2, -14.2, 1.1, 1.45, 1.15, 0.95, 1.25, 0.5, 0.1);

  // 东北角：让开转角那堵挑出的墙，堆到它南面；两只并排加一只压顶，顶 2.3，
  // 东侧那只 1.7 当台阶，上面横搭两块木板。
  pile(50.6, -19.4, 1.0, 1.4, 1.0, 0.95, 1.3, 0.6, 0.08);
  crate(51.7, -19.4, 1.0, 1.0, 1.4, 0xc08a4c, padY, true);
  for (const [dz, yaw] of [[-0.32, 0.05], [0.3, -0.04]]) {
    box(2.0, 0.06, 0.32, kit.wood, 51.1, padY + 1.63, -19.4 + dz).rotation.y = yaw;
  }

  // 西北角（靠墙、拱门以西）：印红圈 A 的大木箱，约 2.25 × 2.0 × 2.4 米接近正方，
  // 只给 solid 不给平台 —— solid 与高度无关，挡人挡枪而且从哪儿都上不去，和参考图一致。
  const aBox = { x: 39.4, z: face + 1.2 };
  crate(aBox.x, aBox.z, 1.5, 2.4, 2.0, 0xd9c9a8, padY, false);
  // 正面（朝南，朝台阶来向）印与地面同一款红圈 A。竖直面只有横向被放大，
  // 所以画 1.05 × 1.6 才能在世界上是个正圆，并且不越出 2.25 × 2.4 的箱面。
  const aBoxFace = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.6), kit.markA);
  aBoxFace.position.set(aBox.x, padY + 1.2, aBox.z + 1.02);
  aBoxFace.userData.noShadow = true;
  aBoxFace.userData.noReceive = true;
  add(aBoxFace);
  pile(44.0, -19.0, 0.85, 1.1, 1.0, 0.8, 1.0, 0.6, 0.12);
  // 平台下的杂物：一只托盘，站在上面 0.88，台面在头顶 2.61 不算落脚处。
  pallet(46.8, face + 1.5, 1.4, 0.9);

  // ---------- 地面红圈与包点方框 ----------
  // padFloor 平面已经在 padY + 0.01，贴花要再抬一层才不跟它抢深度；
  // 水平面两个轴都跟着放大，所以方框和红圈在世界上仍是正方形与正圆。
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(site.frame, site.frame), kit.siteFrame);
  frame.rotation.x = -Math.PI / 2;
  frame.position.set(site.cx, padY + 0.035, site.cz);
  frame.userData.noShadow = true;
  add(frame);

  const aMark = new THREE.Mesh(new THREE.PlaneGeometry(site.ring, site.ring), kit.markA);
  aMark.rotation.x = -Math.PI / 2;
  aMark.position.set(site.cx, padY + 0.04, site.cz);
  aMark.userData.noShadow = true;
  add(aMark);
}
