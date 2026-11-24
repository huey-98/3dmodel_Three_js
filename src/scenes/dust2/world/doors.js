// 大门构件：中门 / A 门 / B 门为金属对开（CS2）；其余洞口为石拱门套。
import { B2_Y, B_Y, LONG_Y, GARDEN_Y } from '../layout.js';

const DOOR_H = 4.3;

function doubleDoor(ctx, axis, fixed, a0, a1, into, sill = 0, mat) {
  const { kit, box, solid } = ctx;
  const leafMat = mat || kit.metalDoor;
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
    if (axis === 'x') { box(th, DOOR_H, leafW, leafMat, h0, sill + DOOR_H / 2, c); solid(h0 - th / 2, h0 + th / 2, c - leafW / 2, c + leafW / 2); }
    else { box(leafW, DOOR_H, th, leafMat, c, sill + DOOR_H / 2, h0); solid(c - leafW / 2, c + leafW / 2, h0 - th / 2, h0 + th / 2); }
  }
}

function halfClosedDoor(ctx, fixed, a0, a1, into, sill = 0, mat) {
  const { kit, box, solid } = ctx;
  const leafMat = mat || kit.metalDoor;
  const th = 0.3;
  box(0.7, DOOR_H + 0.9, 0.9, kit.mass, a0 - 0.35, sill + (DOOR_H + 0.9) / 2, fixed);
  box(0.7, DOOR_H + 0.9, 0.9, kit.mass, a1 + 0.35, sill + (DOOR_H + 0.9) / 2, fixed);
  box(a1 - a0 + 1.4, 0.6, 0.9, kit.mass, (a0 + a1) / 2, sill + DOOR_H + 0.8, fixed);
  const mid = (a0 + a1) / 2;
  box(a1 - mid, DOOR_H, th, leafMat, (mid + a1) / 2, sill + DOOR_H / 2, fixed);
  solid(mid, a1, fixed - th / 2, fixed + th / 2);
  const leafW = (mid - a0) - 0.5;
  const ang = 0.52;
  const cx = a0 + Math.cos(ang) * leafW / 2;
  const cz = fixed + into * Math.sin(ang) * leafW / 2;
  const leaf = box(leafW, DOOR_H, th, leafMat, cx, sill + DOOR_H / 2, cz);
  leaf.rotation.y = -into * ang;
  const ex = a0 + Math.cos(ang) * leafW;
  const ez = fixed + into * Math.sin(ang) * leafW;
  solid(Math.min(a0, ex), Math.max(a0, ex), Math.min(fixed, ez), Math.max(fixed, ez));
}

export function buildDoors(ctx) {
  const { kit, archGate, box } = ctx;
  halfClosedDoor(ctx, 26, -4, 4, 1, 0, kit.metalDoor);
  doubleDoor(ctx, 'x', 50, 30, 38, -1, LONG_Y, kit.metalDoor);
  doubleDoor(ctx, 'z', -14, 12, 20, 1, B_Y, kit.metalDoor);
  box(0.4, 2.2, 5.2, kit.mass, -14.1, B_Y + 3.2, 8.5);
  archGate(-35, 24, 6, 4.6, 0.7, 'z', kit.cave, B2_Y);
  archGate(-36, 56, 8, 4.4, 0.7, 'z', kit.cave, GARDEN_Y);
  archGate(48, 23, 10, 4.6, 0.7, 'z', kit.sand, LONG_Y);
}
