import * as THREE from 'three';

// 场地边界墙、东侧空地、警家街景立面与台阶。
export function buildEastLot(ctx) {
  const {
    kit, group, solids, platforms, rooms, animated,
    add, makeBox, box, volume, solid, platform, block, skirt, getArch, placeWindow,
    parapet, shellWall, solidAlongZ, pierceZ, placeArchSpandrel, placeArchway,
    sagGeo, hangCloth, wire, crate,
  } = ctx;
  const { blue, south, passage, eastDoorZ, SOUTH_WALL_Z } = ctx;
  // 场地边界：北、西实墙；东侧边界墙在东门外通道处断开，通道外圈出一块矩形空地：
  // 北墙贴通道北墙外皮，南墙取后门中心与旧墙位的中点，东墙再向东扩一截；
  // 南侧由南楼封住，楼后再挡一截防止绕出。
  const yellowWall = new THREE.MeshStandardMaterial({ color: 0xb5a898, roughness: 0.9 });
  const wallH = 3.2;
  function barrier(x0, x1, z0, z1) {
    volume(x0, x1, 0, wallH, z0, z1, yellowWall);
    solid(x0, x1, z0, z1);
  }
  const lotX1 = 53.4;
  const lotZ1 = (eastDoorZ + 1.5) / 2;
  const lotZ0 = passage.z0 - passage.t;
  barrier(-20, blue.x1 + 0.82, -16.2, -14.7);
  barrier(-16.4, -15.5, -16, south.z1);
  barrier(blue.x1 - 0.08, blue.x1 + 0.82, -16, passage.z0 - passage.t);
  barrier(blue.x1 - 0.08, blue.x1 + 0.82, passage.z1 + passage.t, lotZ1 + 0.8);
  // 通道上方补到边界墙同高（门洞加高后这段可能为零），不设碰撞。
  volume(blue.x1 - 0.08, blue.x1 + 0.82, passage.h + 0.2, wallH, passage.z0 - passage.t, passage.z1 + passage.t, yellowWall);
  barrier(-20, blue.x1 + 0.82, south.z1, south.z1 + 0.8);
  barrier(lotX1 - 0.8, lotX1, lotZ0 - 0.8, lotZ1 + 0.8);
  // 南墙在 X≈69（世界坐标）处向南开一个宽约 10、深约 8 米的凹槽，
  // 凹槽是 CT 出生点，朝北看是参考图的警家街景：左手白楼木门立面（西），
  // 右手剥落蓝楼大木门红 A 朝南（东，警家凹槽），再东是警家宽缓台阶
  // 带铁栏向北延伸、顶端收口，地面细石铺装。
  const alcX0 = 42.8;
  const alcX1 = 49.5;
  const alcZ1 = lotZ1 + 0.8 + 5.3;
  barrier(blue.x1 - 0.08, alcX0, lotZ1, lotZ1 + 0.8);
  barrier(alcX1 + 12, lotX1, lotZ1, lotZ1 + 0.8);
  barrier(alcX0 - 0.8, alcX1 + 0.8, alcZ1, alcZ1 + 0.8);
  barrier(alcX0 - 0.8, alcX0, lotZ1, alcZ1 + 0.8);

  // 凹槽地面：细石铺装，单块约 0.45 米。
  const alcFloorTex = kit.cobble.map.clone();
  alcFloorTex.needsUpdate = true;
  alcFloorTex.repeat.set(5.6, 4.4);
  const alcFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(alcX1 - alcX0, alcZ1 - lotZ1 - 0.8),
    new THREE.MeshStandardMaterial({
      map: alcFloorTex, roughness: 0.96,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
  );
  alcFloor.rotation.x = -Math.PI / 2;
  alcFloor.position.set((alcX0 + alcX1) / 2, 0.045, (lotZ1 + 0.8 + alcZ1) / 2);
  alcFloor.userData.noShadow = true;
  add(alcFloor);
  // 空地东半也铺细石，面朝东的街景视角脚下与参考图一致。
  const lotFloorTex = kit.cobble.map.clone();
  lotFloorTex.needsUpdate = true;
  lotFloorTex.repeat.set(12.2, 4.0);
  const lotFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(lotX1 - 0.8 - 38, lotZ1 - lotZ0),
    new THREE.MeshStandardMaterial({
      map: lotFloorTex, roughness: 0.96,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
  );
  lotFloor.rotation.x = -Math.PI / 2;
  lotFloor.position.set((38 + lotX1 - 0.8) / 2, 0.045, (lotZ0 + lotZ1) / 2);
  lotFloor.userData.noShadow = true;
  add(lotFloor);

  // 空地北墙东段换成剥落蓝楼（警家凹槽），带红 A 的立面朝南（朝出生点）：
  // 大木门、门楣横窗、红 A 箭头、蓝牌、高窗、空调外机和带托木的出檐。
  // 白楼在西、蓝楼在东，两者直接相接，中间不再设连接墙。
  const blueB = { x0: 43.3, x1: 48.6, z0: lotZ0 - 0.8, z1: lotZ0, h: 6.4 };
  const bbFace = lotZ0 + 0.03;
  block(blueB.x0, blueB.x1, blueB.z0, blueB.z1, blueB.h, kit.blue);
  skirt(blueB.x0, blueB.x1, blueB.z0, blueB.z1, kit.skirtBlue);
  const alcDoorX = 45.9;
  const alcDoorMat = kit.wood.clone();
  alcDoorMat.color.set(0x9a6b42);
  box(2.6, 2.9, 0.08, alcDoorMat, alcDoorX, 1.45, bbFace + 0.01);
  box(2.84, 0.12, 0.1, kit.trim, alcDoorX, 2.96, bbFace + 0.02);
  for (const s of [-1, 1]) {
    box(0.12, 2.9, 0.1, kit.trim, alcDoorX + s * 1.36, 1.45, bbFace + 0.02);
  }
  box(0.05, 2.9, 0.09, kit.trim, alcDoorX, 1.45, bbFace + 0.015);
  // 门楣上的横窗（暗玻璃带框）。
  box(1.7, 0.62, 0.05, kit.glass, alcDoorX, 3.55, bbFace);
  box(1.86, 0.08, 0.07, kit.trim, alcDoorX, 3.9, bbFace + 0.01);
  box(1.86, 0.08, 0.07, kit.trim, alcDoorX, 3.2, bbFace + 0.01);
  const aMark = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), kit.aMark);
  aMark.position.set(47.5, 3.3, bbFace);
  aMark.userData.noShadow = true;
  add(aMark);
  const alcSign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), kit.sign);
  alcSign.position.set(44.0, 1.7, bbFace);
  alcSign.userData.noShadow = true;
  add(alcSign);
  placeWindow(47.5, 4.6, bbFace, 1.0, 1.2, 0);
  box(0.7, 0.36, 0.34, kit.ac, 44.2, 5.1, bbFace + 0.16);
  box(blueB.x1 - blueB.x0 + 0.3, 0.14, 0.5, kit.trim, (blueB.x0 + blueB.x1) / 2, blueB.h - 0.05, blueB.z1 + 0.15);
  for (let x = blueB.x0 + 0.4; x < blueB.x1; x += 0.85) {
    box(0.12, 0.18, 0.34, kit.beam, x, blueB.h - 0.28, blueB.z1 + 0.1);
  }

  // 东侧：矮石墙压顶加黑铁栏杆，栏后只留远处白楼（界外布景，不可达）。
  const stoneH = 1.15;
  const fenceTop = 2.35;
  volume(alcX1, alcX1 + 0.8, 0, stoneH, lotZ1, alcZ1 + 0.8, kit.stone);
  solid(alcX1, alcX1 + 0.8, lotZ1, alcZ1 + 0.8);
  box(0.95, 0.08, alcZ1 + 0.8 - lotZ1, kit.concrete, alcX1 + 0.4, stoneH + 0.04, (lotZ1 + alcZ1 + 0.8) / 2);
  const fz0 = lotZ1 + 0.15;
  const fz1 = alcZ1 + 0.65;
  for (const y of [stoneH + 0.2, fenceTop - 0.06]) {
    box(0.04, 0.05, fz1 - fz0, kit.metalDark, alcX1 + 0.4, y, (fz0 + fz1) / 2);
  }
  for (let z = fz0; z <= fz1 + 0.001; z += 0.34) {
    box(0.03, fenceTop - stoneH - 0.1, 0.03, kit.metalDark, alcX1 + 0.4, (stoneH + fenceTop) / 2, z);
  }
  for (let z = fz0; z <= fz1 + 0.001; z += 1.7) {
    box(0.07, fenceTop - stoneH + 0.08, 0.07, kit.metalDark, alcX1 + 0.4, (stoneH + fenceTop) / 2, z);
  }

  const eastFar = [
    [alcX1 + 4, lotZ1 + 8, 7.5, 6, 5],
    [alcX1 + 9.5, lotZ1 + 9.5, 9, 7, 6],
    [alcX1 + 14, lotZ1 + 7.5, 6.5, 5, 5],
  ];
  for (const [x, z, h, w, d] of eastFar) {
    const bld = box(w, h, d, kit.white, x, h / 2, z);
    bld.userData.noShadow = true;
    bld.userData.noReceive = true;
    for (let wy = 1.6; wy < h - 1; wy += 2.2) {
      for (let wx = x - w / 2 + 1; wx < x + w / 2 - 0.6; wx += 1.6) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.0), kit.glass);
        win.position.set(wx, wy, z - d / 2 - 0.02);
        win.rotation.y = Math.PI;
        win.userData.noShadow = true;
        win.userData.noReceive = true;
        add(win);
      }
    }
  }

  // 南墙东段（面朝东时的右手边）：矮石墙向东延伸，墙外只留远处白楼布景。
  const rwX1 = alcX1 + 12;
  volume(alcX1, rwX1, 0, stoneH, lotZ1, lotZ1 + 0.8, kit.stone);
  solid(alcX1, rwX1, lotZ1, lotZ1 + 0.8);
  box(rwX1 - alcX1, 0.08, 0.95, kit.concrete, (alcX1 + rwX1) / 2, stoneH + 0.04, lotZ1 + 0.4);

  // 斜角：凹槽东北角切一段 45° 石墙（带铁栏），位于南墙线以南作导向，不挡台阶。
  const chamLen = 1.6 * Math.SQRT2;
  const cham = box(chamLen, stoneH, 0.5, kit.stone, alcX1 + 0.8, stoneH / 2, lotZ1 + 0.8);
  cham.rotation.y = -Math.PI / 4;
  const chamRail = box(chamLen, 0.05, 0.04, kit.metalDark, alcX1 + 0.8, fenceTop - 0.06, lotZ1 + 0.8);
  chamRail.rotation.y = -Math.PI / 4;
  for (let i = 0; i <= 4; i++) {
    const t = i / 4 - 0.5;
    box(0.03, fenceTop - stoneH - 0.1, 0.03, kit.metalDark,
      alcX1 + 0.8 + Math.SQRT1_2 * chamLen * t, (stoneH + fenceTop) / 2, lotZ1 + 0.8 + Math.SQRT1_2 * chamLen * t);
  }
  solid(alcX1 - 0.35, alcX1 + 1.95, lotZ1, lotZ1 + 1.95);

  // 凹槽正北偏西：剥落白楼立面（朝南），大木门、门旁小窗、上层双窗、
  // 空调外机、出檐和屋顶水箱。白楼在西、蓝楼在东，两者直接相接。
  const wf = { x0: 38, x1: 43.4, z0: lotZ0 - 0.8, z1: lotZ0, h: 6.8 };
  block(wf.x0, wf.x1, wf.z0, wf.z1, wf.h, kit.white);
  skirt(wf.x0, wf.x1, wf.z0, wf.z1, kit.skirtWhite);
  const wfFace = wf.z1 + 0.03;
  const wfDoorX = 40.8;
  box(2.2, 2.7, 0.08, kit.door, wfDoorX, 1.35, wfFace + 0.01);
  box(2.44, 0.12, 0.1, kit.trim, wfDoorX, 2.76, wfFace + 0.02);
  for (const s of [-1, 1]) {
    box(0.12, 2.7, 0.1, kit.trim, wfDoorX + s * 1.16, 1.35, wfFace + 0.02);
  }
  box(0.05, 2.7, 0.09, kit.trim, wfDoorX, 1.35, wfFace + 0.015);
  placeWindow(38.9, 1.15, wfFace, 0.7, 0.95, 0);
  placeWindow(39.1, 4.1, wfFace, 0.95, 1.25, 0);
  placeWindow(41.5, 4.1, wfFace, 0.95, 1.25, 0);
  box(0.7, 0.36, 0.34, kit.ac, 42.1, 3.1, wfFace + 0.15);
  box(wf.x1 - wf.x0 + 0.3, 0.14, 0.5, kit.trim, (wf.x0 + wf.x1) / 2, wf.h - 0.05, wf.z1 + 0.15);
  for (let x = wf.x0 + 0.4; x < wf.x1; x += 0.85) {
    box(0.12, 0.18, 0.34, kit.beam, x, wf.h - 0.28, wf.z1 + 0.1);
  }
  const wfTank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12), kit.tank);
  wfTank.position.set(39.0, wf.h + 0.45, wf.z0 + 0.4);
  add(wfTank);
  // 台阶的南北尺度提前算出来：沿街房子和它后面补出的楼体都要以顶端那条线（stairEndZ）收边。
  const stairStartZ = lotZ0 - 0.8;
  const stairN = 7;
  const stairTread = 0.55;
  const stairEndZ = stairStartZ - stairN * stairTread;
  // 超市东边通道的北墙换成两栋沿街房子：西头沙黄楼、东头白楼，南立面与旧墙线齐平，
  // 朝通道和空地；东头那栋直接与警家白楼 wf 相接，wf 和蓝楼的立面保持原样不动。
  // 用 block 自带碰撞顶掉原来的围墙，封闭性不变；这一排整排按两倍层高做
  // （沙黄楼 11.2、白楼 12.8），立面每 2.4 米补一档窗。
  // 楼体向北一直填到台阶顶端那条线（stairEndZ），和后面补出的两栋楼体齐平，整片不留空地。
  const rowZ1 = lotZ0;
  const rowZ0 = stairEndZ;
  const rowFace = rowZ1 + 0.03;
  const rowA = { x0: blue.x1 + 0.82, x1: 27.4, h: 11.2 };
  const rowB = { x0: rowA.x1, x1: wf.x0, h: 12.8 };
  block(rowA.x0, rowA.x1, rowZ0, rowZ1, rowA.h, kit.sand);
  skirt(rowA.x0, rowA.x1, rowZ0, rowZ1, kit.skirtSand);
  block(rowB.x0, rowB.x1, rowZ0, rowZ1, rowB.h, kit.white);
  skirt(rowB.x0, rowB.x1, rowZ0, rowZ1, kit.skirtWhite);
  // 沙黄楼：大木门 + 门旁小窗 + 上层双窗 + 空调外机，檐口带托木。
  const aDoorX = 20.6;
  box(2.4, 2.8, 0.08, kit.door, aDoorX, 1.4, rowFace + 0.01);
  box(2.64, 0.12, 0.1, kit.trim, aDoorX, 2.9, rowFace + 0.02);
  for (const s of [-1, 1]) {
    box(0.12, 2.8, 0.1, kit.trim, aDoorX + s * 1.26, 1.4, rowFace + 0.02);
  }
  placeWindow(23.6, 1.15, rowFace, 0.75, 0.95, 0);
  for (const y of [3.6, 6.0, 8.4]) {
    placeWindow(23.6, y, rowFace, 0.95, 1.25, 0);
    placeWindow(26.0, y, rowFace, 0.95, 1.25, 0);
  }
  for (const y of [3.4, 8.2]) {
    box(0.7, 0.36, 0.34, kit.ac, 19.2, y, rowFace + 0.15);
  }
  // 白楼：木门 + 小窗 + 三层双窗 + 空调外机。
  const bDoorX = 30.0;
  box(2.6, 3.0, 0.08, kit.door, bDoorX, 1.5, rowFace + 0.01);
  box(2.84, 0.12, 0.1, kit.trim, bDoorX, 3.1, rowFace + 0.02);
  for (const s of [-1, 1]) {
    box(0.12, 3.0, 0.1, kit.trim, bDoorX + s * 1.36, 1.5, rowFace + 0.02);
  }
  placeWindow(33.2, 1.2, rowFace, 0.8, 1.0, 0);
  for (const y of [4.2, 7.0, 9.8]) {
    placeWindow(32.6, y, rowFace, 1.0, 1.3, 0);
    placeWindow(35.2, y, rowFace, 1.0, 1.3, 0);
  }
  box(0.7, 0.36, 0.34, kit.ac, 36.8, 3.2, rowFace + 0.15);
  for (const b of [rowA, rowB]) {
    box(b.x1 - b.x0 + 0.3, 0.14, 0.5, kit.trim, (b.x0 + b.x1) / 2, b.h - 0.05, rowZ1 + 0.15);
    for (let x = b.x0 + 0.4; x < b.x1; x += 0.85) {
      box(0.12, 0.18, 0.34, kit.beam, x, b.h - 0.28, rowZ1 + 0.1);
    }
    parapet(b.x0, b.x1, rowZ0, rowZ1, b.h, b === rowA ? kit.sand : kit.white);
  }
  const rowTank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12), kit.tank);
  rowTank.position.set(19.0, rowA.h + 0.45, rowZ0 + 1.1);
  add(rowTank);

  // 警家台阶：第一级在北墙外皮一线，宽缓实心台阶向北延伸 7 级
  // （每级升 0.1 米、踏面约 0.83 米，升到约 0.7 米），顶端用矮石墙压顶
  // 加黑铁栏杆收口；西侧矮墙栏杆逐级抬升，东侧贴东边界墙。北段台阶和
  // 界外高台已去掉，台阶到顶即止。
  const stairX0 = blueB.x1 + 0.1;
  const stairX1 = lotX1 - 0.8;
  const stairTop = 0.7;
  const parH = 0.65;
  const railH = 1.05;
  for (let i = 0; i < stairN; i++) {
    const top = (stairTop * (i + 1)) / stairN;
    const sz1 = stairStartZ - i * stairTread;
    const sz0 = sz1 - stairTread;
    volume(stairX0, stairX1, 0, top, sz0, sz1, kit.stone);
    platform(stairX0, stairX1, sz0, sz1, top);
    // 西侧逐级抬升的矮石墙 + 黑铁栏杆；footprint 一并挡住。
    volume(stairX0, stairX0 + 0.3, top, top + parH, sz0, sz1, kit.stone);
    solid(stairX0, stairX0 + 0.3, sz0, sz1);
    const px = stairX0 + 0.15;
    for (const off of [0.22, railH - 0.05]) {
      box(0.04, 0.05, stairTread, kit.metalDark, px, top + parH + off, (sz0 + sz1) / 2);
    }
    for (const pz of [sz0 + 0.08, sz1 - 0.08]) {
      box(0.03, railH - 0.1, 0.03, kit.metalDark, px, top + parH + railH / 2 - 0.05, pz);
    }
    if (i % 3 === 0) {
      box(0.07, railH + 0.08, 0.07, kit.metalDark, px, top + parH + railH / 2 - 0.01, (sz0 + sz1) / 2);
    }
  }
  // 北墙在台阶通道处断开豁口。台阶东侧那段边界墙换成一栋白楼：建筑南北长度
  // 与台阶一致（stairEndZ → stairStartZ，即 stairN * stairTread），立面朝西正对
  // 台阶；它以南的其余段落仍由空地南墙屏障封口（见上面 lotZ0 - 0.8 那条 barrier）。
  const eb = { x0: lotX1 - 0.8, x1: lotX1 + 3.2, z0: stairEndZ, z1: stairStartZ, h: 6.8 };
  const ebCz = (eb.z0 + eb.z1) / 2;
  const ebFace = eb.x0 - 0.03;
  block(eb.x0, eb.x1, eb.z0, eb.z1, eb.h, kit.white);
  skirt(eb.x0, eb.x1, eb.z0, eb.z1, kit.skirtWhite);
  const ebDoorZ = ebCz + 0.6;
  box(0.08, 2.7, 2.2, kit.door, ebFace - 0.02, 1.35, ebDoorZ);
  box(0.1, 0.12, 2.44, kit.trim, ebFace - 0.03, 2.76, ebDoorZ);
  for (const s of [-1, 1]) {
    box(0.1, 2.7, 0.12, kit.trim, ebFace - 0.03, 1.35, ebDoorZ + s * 1.16);
  }
  box(0.09, 2.7, 0.05, kit.trim, ebFace - 0.025, 1.35, ebDoorZ);
  placeWindow(ebFace, 1.15, ebDoorZ - 2.05, 0.7, 0.95, -Math.PI / 2);
  placeWindow(ebFace, 4.1, ebDoorZ - 1.6, 0.95, 1.25, -Math.PI / 2);
  placeWindow(ebFace, 4.1, ebDoorZ + 1.6, 0.95, 1.25, -Math.PI / 2);
  box(0.34, 0.36, 0.7, kit.ac, ebFace - 0.13, 3.1, ebDoorZ + 2.0);
  // 西立面出檐 + 托木，屋顶一只水箱，与白楼、蓝楼同一路数。
  box(0.5, 0.14, eb.z1 - eb.z0 + 0.3, kit.trim, eb.x0 - 0.1, eb.h - 0.05, ebCz);
  for (let z = eb.z0 + 0.4; z < eb.z1; z += 0.85) {
    box(0.34, 0.18, 0.12, kit.beam, eb.x0 - 0.15, eb.h - 0.28, z);
  }
  const ebTank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12), kit.tank);
  ebTank.position.set(eb.x1 - 0.8, eb.h + 0.45, ebCz - 0.9);
  add(ebTank);
  // 顶端收口：最高一级北沿一道矮石墙压顶加黑铁栏杆，挡住向北走出台阶。
  volume(stairX0, stairX1, stairTop, stairTop + parH, stairEndZ, stairEndZ + 0.15, kit.stone);
  solid(stairX0, stairX1, stairEndZ, stairEndZ + 0.15);
  const capCz = stairEndZ + 0.075;
  for (const off of [0.22, railH - 0.05]) {
    box(stairX1 - stairX0, 0.05, 0.04, kit.metalDark, (stairX0 + stairX1) / 2, stairTop + parH + off, capCz);
  }
  for (let x = stairX0 + 0.2; x <= stairX1 - 0.1; x += 0.34) {
    box(0.03, railH - 0.1, 0.03, kit.metalDark, x, stairTop + parH + railH / 2 - 0.05, capCz);
  }

  // 白楼 wf 和蓝楼 blueB 原来只是 0.8 米厚的临街立面：以这两个立面为南面，
  // 向北补出楼体，深度正好填到台阶顶端那条线（stairEndZ），东面留出台阶和它的栏杆，
  // 高度、材质跟着各自的立面走，看上去就是同两栋房子有了进深。
  const rearZ1 = lotZ0 - 0.8;
  const rearZ0 = stairEndZ;
  const rearRow = [
    { x0: wf.x0, x1: wf.x1, h: wf.h, mat: kit.white, skirt: kit.skirtWhite },
    { x0: blueB.x0, x1: blueB.x1, h: blueB.h, mat: kit.blue, skirt: kit.skirtBlue },
  ];
  for (const b of rearRow) {
    const cx = (b.x0 + b.x1) / 2;
    block(b.x0, b.x1, rearZ0, rearZ1, b.h, b.mat);
    skirt(b.x0, b.x1, rearZ0, rearZ1, b.skirt);
    parapet(b.x0, b.x1, rearZ0, rearZ1, b.h, b.mat);
    box(b.x1 - b.x0 + 0.3, 0.14, 0.5, kit.trim, cx, b.h - 0.05, rearZ0 - 0.15);
    for (let x = b.x0 + 0.4; x < b.x1; x += 0.85) {
      box(0.12, 0.18, 0.34, kit.beam, x, b.h - 0.28, rearZ0 - 0.1);
    }
    const rearTank = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.9, 12), kit.tank);
    rearTank.position.set(cx - 0.9, b.h + 0.45, (rearZ0 + rearZ1) / 2);
    add(rearTank);
  }

  // 通道外空地上的一堆积沙。
  const lotPile = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), kit.sandPile);
  lotPile.scale.set(1.15, 0.08, 0.85);
  lotPile.position.set(23, 0.04, -4.4);
  lotPile.userData.noShadow = true;
  add(lotPile);

  const canR = 0.5;
  const canH = 1.18;
  const canX = blue.x0 - canR - 0.12;
  const canZ = SOUTH_WALL_Z - canR - 0.12;
  const bin = new THREE.Group();
  bin.position.set(canX, 0, canZ);
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(canR * 0.92, canR, canH, 18), kit.bin);
  drum.position.y = canH / 2;
  bin.add(drum);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(canR + 0.03, canR + 0.04, 0.07, 18), kit.metalDark);
  foot.position.y = 0.035;
  bin.add(foot);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(canR * 0.96, canR * 0.94, 0.08, 18), kit.metalDark);
  rim.position.y = canH - 0.02;
  bin.add(rim);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(canR * 1.04, canR * 1.02, 0.07, 18), kit.binLid);
  lid.position.y = canH + 0.04;
  bin.add(lid);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(canR * 0.78, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
    kit.binLid,
  );
  dome.position.y = canH + 0.06;
  bin.add(dome);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 8, 14, Math.PI), kit.metal);
  handle.position.y = canH + 0.28;
  handle.rotation.z = Math.PI / 2;
  bin.add(handle);
  group.add(bin);
  solid(canX - canR, canX + canR, canZ - canR, canZ + canR);
}
