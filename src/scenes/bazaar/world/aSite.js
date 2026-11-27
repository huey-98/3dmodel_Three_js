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
  const cz = (blk.z0 + blk.z1) / 2;
  // 台面起跳 1.541，加 STEP_UP 0.35 的余量，顶面超过 2.59 就绝对上不去；取 2.40 以内留准头。
  const arch = { x: 48.4, w: 4.8, h: 6.0 }; // 拱心只偏台阶轴心（50.6）2.2，上来正对着看的是它

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
  box(0.5, 0.14, blk.z1 - blk.z0 + 0.3, kit.trim, blk.x0 - 0.15, wallTop - 0.05, cz);
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

  // 红圈 A 的四角：西北、东北、西南三堆，台阶口右手一只单箱。
  // 台阶落地缓冲（X 48.5–52.6 之 Z -14.5–-11.35）与通往西侧走道的横带（Z -12.8–-11.35）都留空。
  pile(38.2, -20.4, 1.6, 1.55, 1.05, 1.15, 1.15, 0.6);
  pile(51.5, -19.0, 1.55, 1.5, 1.05, 1.2, 1.2, 0.6, 0.1);
  pile(38.9, -16.6, 1.5, 1.5, 1.05, 1.1, 1.1, 0.55, 0.12);
  crate(51.2, -15.6, 1.4, 1.35, 1.35, 0xc99555, padY, true);
  crate(41.5, -14.4, 1.15, 1.05, 1.15, 0xc08a4c, padY, true);
  crate(46.9, -13.4, 1.25, 1.05, 1.2, 0xc99555, padY, true);
  pallet(48.6, -21.4, 1.4, 0.9);
  pallet(40.6, -18.8, 1.3, 0.9);

  // 大 A 箱：顶面 2.75 超出可跳上限，所以只给 solid 不给 platform —— 挡人挡枪但爬不上去。
  crate(42.6, -21.6, 2.8, 2.05, 2.4, 0xc99555, padY, false);
  // 正面（朝南，朝台阶来向）印与地面同一款红圈 A，参考图里箱子与地面是同一个标记。
  const aBoxFace = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), kit.markA);
  aBoxFace.position.set(42.6, padY + 1.02, -20.38);
  aBoxFace.userData.noShadow = true;
  aBoxFace.userData.noReceive = true;
  add(aBoxFace);

  // ---------- 地面红圈 A ----------
  // padFloor 平面已经在 padY + 0.01，贴花要再抬一层才不跟它抢深度。
  // 圆心与拱心同一条 X（48.0），台阶上来正对的是它，往北看红圈与拱券上下成一线。
  const aMark = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), kit.markA);
  aMark.rotation.x = -Math.PI / 2;
  aMark.position.set(48.0, padY + 0.04, -17.0);
  aMark.userData.noShadow = true;
  add(aMark);
}
