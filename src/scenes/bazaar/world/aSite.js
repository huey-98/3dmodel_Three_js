import * as THREE from 'three';

// A 包点：高台东北角、警家台阶正北的一片掩体，视线尽头是带大拱券的收口建筑。
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
  const wallTop = padY + 9.0;               // 体块墙顶 9.7，低于沿街两栋（11.2 / 12.8）
  const blkCz = (blk.z0 + blk.z1) / 2;
  // 台面起跳 1.541，加 STEP_UP 0.35 的余量，顶面超过 2.59 就绝对上不去；取 2.40 以内留准头。
  const arch = { x: 48.4, w: 4.8, h: 6.0 }; // 拱心只偏台阶轴心（50.6）2.2，上来正对着看的是它
  // 包点中心：红方框与红圈都以它为准。方框东南角最接近台阶口，那一只角不放东西。
  const site = { cx: 47.6, cz: -18.0, frame: 8.6, ring: 4.6 };

  // ---------- 北端收口建筑：实心体块 + 南墙大拱券龛 ----------
  const hz0 = arch.x - arch.w / 2;
  const hz1 = arch.x + arch.w / 2;
  // 洞只开在南面 1.3 米厚的一堵里，后面是实心楼体：拱龛是几何缺失而不是通道，人进不去。
  const band = blk.z1 - 1.3;
  volume(blk.x0, blk.x1, padY, wallTop, blk.z0, band, kit.sand);
  volume(blk.x0, hz0, padY, wallTop, band, blk.z1, kit.sand);
  volume(hz1, blk.x1, padY, wallTop, band, blk.z1, kit.sand);
  volume(hz0, hz1, padY + arch.h, wallTop, band, blk.z1, kit.sand);
  solid(blk.x0, blk.x1, blk.z0, blk.z1);
  // 矩形洞上沿两角补成半券（同 shop.js 的拱门手法，只是这面朝南）。
  placeArchSpandrel(arch.x, padY, band, arch.w, arch.h, 0, blk.z1 - band, kit.sand);
  // 龛底挂白色格子拱窗：离背墙 6 厘米，券外四角透明，露出米黄墙面。
  const archWin = new THREE.Mesh(new THREE.PlaneGeometry(arch.w, arch.h), kit.archWin);
  archWin.position.set(arch.x, padY + arch.h / 2, band + 0.06);
  archWin.userData.noShadow = true;
  add(archWin);
  placeArchway(arch.x, padY, blk.z1 + 0.03, arch.w, arch.h, 0);

  // skirt() 固定画 y 0 到 0.46，在高台上会整块埋进台身，所以基座自己写台沿。
  volume(blk.x0 - 0.03, blk.x1 + 0.03, padY, padY + 0.46, blk.z1 - 0.03, blk.z1 + 0.03, kit.skirtSand);
  volume(blk.x0 - 0.03, blk.x0 + 0.03, padY, padY + 0.46, blk.z0, blk.z1, kit.skirtSand);
  // 出檐板加托木，跟 rowA/rowB、wf、blueB 同一套立面语言；东面朝界外，不铺。
  box(blk.x1 - blk.x0 + 0.3, 0.14, 0.5, kit.trim, (blk.x0 + blk.x1) / 2, wallTop - 0.05, blk.z1 + 0.15);
  for (let x = blk.x0 + 0.4; x < blk.x1; x += 1.2) {
    box(0.12, 0.18, 0.34, kit.beam, x, wallTop - 0.28, blk.z1 + 0.1);
  }
  box(0.5, 0.14, blk.z1 - blk.z0 + 0.3, kit.trim, blk.x0 - 0.15, wallTop - 0.05, blkCz);
  for (let z = blk.z0 + 0.4; z < blk.z1; z += 2.4) {
    box(0.34, 0.18, 0.12, kit.beam, blk.x0 - 0.1, wallTop - 0.28, z);
  }
  parapet(blk.x0, blk.x1, blk.z0, blk.z1, wallTop, kit.sand);
  const blkTank = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.2, 14), kit.tank);
  blkTank.position.set(blk.x0 + 2.4, wallTop + 0.6, blk.z0 + 1.6);
  add(blkTank);
  // 拱两侧的窗与外机（rotY 0 即局部 +Z 朝南，与 rowFace / wfFace 同一路）。
  placeWindow(35.6, 6.2, blk.z1 + 0.03, 1.1, 1.4, 0);
  placeWindow(51.6, 6.2, blk.z1 + 0.03, 1.1, 1.4, 0);
  placeWindow(35.6, 2.4, blk.z1 + 0.03, 0.85, 1.15, 0);
  placeWindow(51.6, 2.4, blk.z1 + 0.03, 0.85, 1.15, 0);
  box(0.7, 0.36, 0.34, kit.ac, 50.2, 7.6, blk.z1 + 0.15);

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

  // 东北角：两只并排加一只压顶，顶 2.3，东侧那只 1.7 当台阶；上面横搭两块木板。
  pile(49.7, -20.9, 1.0, 1.4, 1.0, 0.95, 1.3, 0.6, 0.08);
  crate(50.7, -20.9, 1.0, 1.0, 1.4, 0xc08a4c, padY, true);
  for (const [dz, yaw] of [[-0.32, 0.05], [0.3, -0.04]]) {
    box(2.0, 0.06, 0.32, kit.wood, 50.1, padY + 1.63, -20.9 + dz).rotation.y = yaw;
  }

  // 西北角（靠墙、拱门以西）：印红圈 A 的大木箱，约 2.25 × 2.0 × 2.4 米接近正方，
  // 只给 solid 不给平台 —— 挡人挡枪，而且 solid 与高度无关，从哪儿都上不去，和参考图一致。
  crate(44.3, -21.5, 1.5, 2.4, 2.0, 0xd9c9a8, padY, false);
  // 正面（朝南，朝台阶来向）印与地面同一款红圈 A。竖直面只有横向被放大，
  // 所以画 1.05 × 1.6 才能在世界上是个正圆，并且不越出 2.25 × 2.4 的箱面。
  const aBoxFace = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.6), kit.markA);
  aBoxFace.position.set(44.3, padY + 1.2, -20.48);
  aBoxFace.userData.noShadow = true;
  aBoxFace.userData.noReceive = true;
  add(aBoxFace);
  pile(44.0, -19.0, 0.85, 1.1, 1.0, 0.8, 1.0, 0.6, 0.12);
  pallet(48.4, -22.0, 1.4, 0.9);

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
