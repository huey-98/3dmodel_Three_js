import * as THREE from 'three';
import { makeTex, makeRectTex, drawStucco, drawCobble, drawTile, drawGraffiti, drawStone, drawAMark, drawSign, drawPanel, drawWood, drawTarp, drawCloth, drawCrate, drawBark, drawLeaf, drawMarkA, drawMarkB, drawArchWindow, drawSiteFrame, drawArrow, mapped } from './textures.js';

export function createBazaarKit() {
  const stuccoSand = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#d6c07a', '#b89a58', '#ead89a'));
  const stuccoPink = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#e3a898', '#c47d72', '#f0d2c6', '#d5cdc2'));
  const stuccoWhite = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#e7e1d6', '#bdb6aa', '#f7f4ee', '#cfc6b8'));
  const stuccoBlue = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#7ea4c6', '#688eae', '#c5d4e2', '#e3d2b4'));
  const stuccoShop = makeTex(512, (ctx, s) => drawStucco(ctx, s, '#9aa694', '#8f9b89', '#a6b2a0'));
  const tileMap = makeTex(512, drawTile);
  const stoneMap = makeTex(512, drawStone);
  const graffitiMap = makeRectTex(256, 192, drawGraffiti);
  const aMarkMap = makeRectTex(256, 256, drawAMark);
  const signMap = makeRectTex(128, 160, drawSign);
  const panel = makeTex(512, drawPanel);
  const cobbleMap = makeTex(512, drawCobble);
  cobbleMap.repeat.set(22, 22);
  const woodMap = makeTex(256, drawWood);
  const tarpTorn = makeTex(1024, (ctx, s) => drawTarp(ctx, s, true), { repeat: false });
  const tarpSolid = makeTex(512, (ctx, s) => drawTarp(ctx, s, false));
  const cloth = makeTex(512, drawCloth);
  const crateMap = makeTex(256, drawCrate);
  const barkMap = makeTex(256, drawBark);
  barkMap.repeat.set(2, 3);
  const leafMap = makeTex(256, drawLeaf, { repeat: false });
  const markB = makeRectTex(512, 512, drawMarkB);
  const markA = makeRectTex(512, 512, drawMarkA);
  const archWinTex = makeRectTex(256, 320, drawArchWindow);
  const siteFrameTex = makeRectTex(512, 512, drawSiteFrame);
  const arrow = makeRectTex(256, 128, drawArrow);

  const wood = (color, roughness) => new THREE.MeshStandardMaterial({
    map: woodMap, color, roughness, metalness: 0.02,
  });
  const crateBase = new THREE.MeshStandardMaterial({
    map: crateMap, color: 0xd7b48a, roughness: 0.84,
  });

  const kit = {
    sand: mapped(stuccoSand, { roughness: 0.93 }),
    pink: mapped(stuccoPink, { roughness: 0.92 }),
    white: mapped(stuccoWhite, { roughness: 0.93 }),
    blue: mapped(stuccoBlue, { roughness: 0.9 }),
    panel: mapped(panel, { roughness: 0.88 }),
    cobble: mapped(cobbleMap, { roughness: 0.96 }),
    tarp: mapped(tarpTorn, {
      roughness: 0.82,
      side: THREE.DoubleSide,
      alphaTest: 0.45,
    }),
    tarpPatch: mapped(tarpSolid, { color: 0xc6b27a, roughness: 0.86, side: THREE.DoubleSide }),
    cloth: mapped(cloth, { roughness: 0.78, side: THREE.DoubleSide }),
    wood: wood(0xd2b48a, 0.74),
    beam: wood(0x6d5138, 0.88),
    door: wood(0x624832, 0.86),
    bark: mapped(barkMap, { roughness: 0.95 }),
    leaf: mapped(leafMap, { roughness: 0.8, side: THREE.DoubleSide, alphaTest: 0.45 }),
    leafDry: mapped(leafMap, {
      color: 0xd7e4a4, roughness: 0.82, side: THREE.DoubleSide, alphaTest: 0.45,
    }),
    markB: mapped(markB, {
      roughness: 0.62,
      transparent: true,
      alphaTest: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    arrow: mapped(arrow, { roughness: 0.5 }),
    // A 包点地面喷漆，与 markB 同法（贴地平面必须带 polygonOffset 才不跟铺装抢深度）。
    markA: mapped(markA, {
      roughness: 0.62,
      transparent: true,
      alphaTest: 0.2,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    }),
    trim: new THREE.MeshStandardMaterial({ color: 0xefe4d2, roughness: 0.86 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xffefb0, roughness: 0.86 }),
    creamFloor: new THREE.MeshStandardMaterial({
      color: 0xf3d56a, roughness: 0.86,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xc9bfae, roughness: 0.94 }),
    shopFloor: mapped(tileMap, {
      roughness: 0.55,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    shopWall: mapped(stuccoShop, { roughness: 0.9 }),
    stone: mapped(stoneMap, { roughness: 0.95 }),
    aMark: mapped(aMarkMap, {
      roughness: 0.85,
      transparent: true,
      alphaTest: 0.15,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    // 包点边界的红色虚线方框，与 markA 同一层套路（贴地必须 polygonOffset）。
    siteFrame: mapped(siteFrameTex, {
      roughness: 0.7,
      transparent: true,
      alphaTest: 0.25,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    }),
    // A 包点大拱券的白色格子窗：贴在拱龛底墙前面，券外四个角透明。
    archWin: mapped(archWinTex, {
      roughness: 0.55, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide,
    }),
    sign: mapped(signMap, { roughness: 0.6 }),
    ceilDark: new THREE.MeshStandardMaterial({ color: 0x5a5f5c, roughness: 0.95 }),
    sack: new THREE.MeshStandardMaterial({ color: 0xe6e1d4, roughness: 1 }),
    graffiti: mapped(graffitiMap, {
      roughness: 0.9,
      transparent: true,
      alphaTest: 0.15,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
    skirtSand: new THREE.MeshStandardMaterial({ color: 0xa88b4a, roughness: 0.96 }),
    skirtPink: new THREE.MeshStandardMaterial({ color: 0xa86b62, roughness: 0.96 }),
    skirtWhite: new THREE.MeshStandardMaterial({ color: 0xb3ab9e, roughness: 0.96 }),
    skirtBlue: new THREE.MeshStandardMaterial({ color: 0x6d88a0, roughness: 0.95 }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x100e0c, roughness: 0.42, metalness: 0.18, side: THREE.DoubleSide,
    }),
    recess: new THREE.MeshStandardMaterial({
      color: 0x0c0b0a, roughness: 1, side: THREE.DoubleSide,
    }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8d9499, metalness: 0.72, roughness: 0.38 }),
    metalDark: new THREE.MeshStandardMaterial({ color: 0x2c3134, metalness: 0.55, roughness: 0.48 }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.4, roughness: 0.45 }),
    van: new THREE.MeshStandardMaterial({ color: 0xe6e2d8, roughness: 0.52, metalness: 0.04 }),
    vanTrim: new THREE.MeshStandardMaterial({ color: 0xb9b4a8, roughness: 0.6 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.92 }),
    bin: new THREE.MeshStandardMaterial({ color: 0x5b6d52, metalness: 0.12, roughness: 0.72 }),
    binLid: new THREE.MeshStandardMaterial({ color: 0x3c4540, metalness: 0.28, roughness: 0.5 }),
    tank: new THREE.MeshStandardMaterial({ color: 0xd5d8dc, roughness: 0.45, metalness: 0.25 }),
    ac: new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.6, metalness: 0.15 }),
    sandPile: new THREE.MeshStandardMaterial({
      color: 0xc4ae8c, roughness: 1,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
    far: [0xd4cfc2, 0xc5ccc8, 0xddd6c8, 0xb7c0b8].map((color) => (
      new THREE.MeshStandardMaterial({ color, roughness: 1 })
    )),
    crate(color) {
      const m = crateBase.clone();
      m.color.set(color);
      return m;
    },
  };

  return kit;
}
