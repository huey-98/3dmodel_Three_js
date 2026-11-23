// 大门构件：中门 / A 门为对开木门（半开）；其余洞口为石拱门套。均带门槛 sill。
import { B2_Y, B1_Y, B_Y, CT_Y, A_SMALL_Y, A_PLAT_Y, LONG_Y, PIT_Y, GARDEN_Y } from '../layout.js';

const DOOR_H = 4.3;

function doubleDoor(ctx, axis, fixed, a0, a1, into, sill = 0) {
  const { kit, box, solid } = ctx;
  const leafW = (a1 - a0) / 2 - 0.15;
  const th = 0.3;
  const post = (p) => {
    if (axis === 'x') box(0.7, DOOR_H + 0.9, 0.9, kit.mass, p, sill + (DOOR_H + 0.9) / 2, fixed);
    else box(0.9, DOOR_H + 0.9, 0.7, kit.mass, fixed, sill + (DOOR_H + 0.9) / 2, p);
  };
  post(a0 - 0.35); post(a1 + 0.35);
  if (axis === 'x') box(a1 - a0 + 1.4, 0.6, 0.9, kit.mass, (a0 + a1) / 2, sill + DOOR_H + 0.8, fixed);
  else box(0.9, 0.6, a1 - a0 + 1.4, kit.mass, fixed, sill + DOOR_H + 0.8, (a0 + a1) / 2);
  for (const h0 of [a0 + 0.1, a1 - 0.1]) {
    const c = fixed + into * leafW / 2;
    if (axis === 'x') { box(th, DOOR_H, leafW, kit.door, h0, sill + DOOR_H / 2, c); solid(h0 - th / 2, h0 + th / 2, c - leafW / 2, c + leafW / 2); }
    else { box(leafW, DOOR_H, th, kit.door, c, sill + DOOR_H / 2, h0); solid(c - leafW / 2, c + leafW / 2, h0 - th / 2, h0 + th / 2); }
  }
}

// 半关闭对开门（axis x）：东扇闭合在门洞平面，西扇绕西柱小角度摆开，留缝可通行。
function halfClosedDoor(ctx, fixed, a0, a1, into, sill = 0) {
  const { kit, box, solid } = ctx;
  const th = 0.3;
  box(0.7, DOOR_H + 0.9, 0.9, kit.mass, a0 - 0.35, sill + (DOOR_H + 0.9) / 2, fixed);
  box(0.7, DOOR_H + 0.9, 0.9, kit.mass, a1 + 0.35, sill + (DOOR_H + 0.9) / 2, fixed);
  box(a1 - a0 + 1.4, 0.6, 0.9, kit.mass, (a0 + a1) / 2, sill + DOOR_H + 0.8, fixed);
  const mid = (a0 + a1) / 2;
  // 东扇闭合
  box(a1 - mid, DOOR_H, th, kit.door, (mid + a1) / 2, sill + DOOR_H / 2, fixed);
  solid(mid, a1, fixed - th / 2, fixed + th / 2);
  // 西扇小角度敞开（铰链在西柱 a0）
  const leafW = (mid - a0) - 0.5;
  const ang = 0.52;
  const cx = a0 + Math.cos(ang) * leafW / 2;
  const cz = fixed + into * Math.sin(ang) * leafW / 2;
  const leaf = box(leafW, DOOR_H, th, kit.door, cx, sill + DOOR_H / 2, cz);
  leaf.rotation.y = -into * ang;
  const ex = a0 + Math.cos(ang) * leafW;
  const ez = fixed + into * Math.sin(ang) * leafW;
  solid(Math.min(a0, ex), Math.max(a0, ex), Math.min(fixed, ez), Math.max(fixed, ez));
}

export function buildDoors(ctx) {
  const { kit, archGate } = ctx;
  // 中门：中路北缘门洞 x[-6,6] @ z=26，半关闭（东扇闭、西扇留缝可过）
  halfClosedDoor(ctx, 26, -6, 6, 1, 0);
  // B1 入口：中门南面西墙敞开洞口 z[40,44]（门口无物体），经入口通道进 B1
  // A 小缺口门套：中路南段东墙缺口，框住进 A 小通道的口（匪口侧右缺口）
  archGate(6, 48, 8, 4.4, 0.7, 'x', kit.sand, 0);
  // A 门：A 大西墙门洞 z[56,64] @ x=44
  doubleDoor(ctx, 'z', 44, 56, 64, 1, 0);
  // B 门（B 点东墙）/ B 洞 / 旋转楼梯 / B2 南通道 / 电梯位 / A 小楼梯 / 警家东上坡 / A 斜坡 / A 坑口
  archGate(-14, 15, 10, 4.6, 0.7, 'x', kit.sand, B_Y);
  archGate(-33, 26, 6, 4.6, 0.7, 'z', kit.cave, B2_Y);
  archGate(-36, 56, 8, 4.4, 0.7, 'z', kit.cave, GARDEN_Y);
  archGate(20, 10, 8, 4.6, 0.7, 'x', kit.sand, CT_Y);
  archGate(21, 26, 10, 4.2, 0.6, 'z', kit.sand, A_SMALL_Y);
  archGate(32, 37, 6, 4.6, 0.7, 'x', kit.sand, CT_Y);
  archGate(42, 34, 4, 4.6, 0.7, 'z', kit.sand, LONG_Y);
  archGate(42, 56, 4, 4.2, 0.6, 'z', kit.cave, PIT_Y);
  // 警家拱门：A 平台西缘框住电梯位下行口，从平台西望见石拱 + 下方警家
  archGate(26, 10, 8, 4.6, 0.7, 'x', kit.plaster, A_PLAT_Y);
}

