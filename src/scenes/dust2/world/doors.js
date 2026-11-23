// 大门构件：A 大门 / 中门 / B 大门 / 猫道门 / 警家北门为对开木门（半开），
// 下水道、公寓、A 大拱门、坑口为石拱门套。所有门都带门槛高度 sill（多层关键）。
import { T_Y } from '../layout.js';

const DOOR_H = 4.3;

// 门洞沿 axis 展开；fixed 为墙面坐标；[a0,a1] 为门洞范围；into 为门扇开启侧。
function doubleDoor(ctx, axis, fixed, a0, a1, into, sill = 0) {
  const { kit, box, solid } = ctx;
  const leafW = (a1 - a0) / 2 - 0.15;
  const th = 0.3;
  const post = (p) => {
    if (axis === 'x') box(0.7, DOOR_H + 0.9, 0.9, kit.mass, p, sill + (DOOR_H + 0.9) / 2, fixed);
    else box(0.9, DOOR_H + 0.9, 0.7, kit.mass, fixed, sill + (DOOR_H + 0.9) / 2, p);
  };
  post(a0 - 0.35);
  post(a1 + 0.35);
  if (axis === 'x') box(a1 - a0 + 1.4, 0.6, 0.9, kit.mass, (a0 + a1) / 2, sill + DOOR_H + 0.8, fixed);
  else box(0.9, 0.6, a1 - a0 + 1.4, kit.mass, fixed, sill + DOOR_H + 0.8, (a0 + a1) / 2);

  // 两片门扇朝 into 方向平开贴墙，中间可通行
  for (const h0 of [a0 + 0.1, a1 - 0.1]) {
    const c = fixed + into * leafW / 2;
    if (axis === 'x') {
      box(th, DOOR_H, leafW, kit.door, h0, sill + DOOR_H / 2, c);
      solid(h0 - th / 2, h0 + th / 2, c - leafW / 2, c + leafW / 2);
    } else {
      box(leafW, DOOR_H, th, kit.door, c, sill + DOOR_H / 2, h0);
      solid(c - leafW / 2, c + leafW / 2, h0 - th / 2, h0 + th / 2);
    }
  }
}

export function buildDoors(ctx) {
  const { kit, box, volume, archGate, platform } = ctx;

  // A 大门：匪家平台南墙门洞 x[-50,-44] @ z=-6.3，门扇开向 A 大（+z）
  doubleDoor(ctx, 'x', -6.3, -50, -44, 1, T_Y);
  // 中门：门洞 x[-20,-14] @ z=-6.3，门扇开向中路（+z）
  doubleDoor(ctx, 'x', -6.3, -14, -6, 1, T_Y);
  // B 大门：门洞 x[20,28] @ z=45.7，门扇开向 B 平台（+z）
  doubleDoor(ctx, 'x', 45.7, 20, 28, 1, 0);
  // 猫道门：中路东墙门洞 z[12,20] @ x=-6.3，门扇开向 90°（+x）
  doubleDoor(ctx, 'z', -6.3, 12, 20, 1, 0);
  // 警家北门：门洞 x[10,16] @ z=49.7，门扇开向警家（+z）
  doubleDoor(ctx, 'x', 49.7, 10, 16, 1, 0);

  // 下水道：街面入口拱门 + 洞内黑套 + B 后出口拱门
  archGate(35.5, 0.3, 5, 5.4, 0.8, 'z', kit.cave, 0);
  volume(33.2, 37.8, -3.2, 0.9, 0.5, 2.2, kit.dark);
  archGate(35.5, 70.2, 4, 5.4, 0.8, 'z', kit.cave, -1.2);
  volume(33.4, 37.6, -3.2, 0.9, 68.4, 70.0, kit.dark);

  // 公寓正门（北墙 x[20,26]）石拱 + 门口石阶
  archGate(23, 7.7, 6, 4.8, 0.7, 'z', kit.sand, 0);
  box(6.4, 0.4, 1.2, kit.cobble, 23, 0.2, 6.7);
  platform(19.8, 26.2, 7.3, 5.9, 0.4, -0.05);

  // A 大拱门（顶棚 z[27,35] 的石面框）
  archGate(-47, 27.2, 10, 4.9, 0.8, 'z', kit.sand, 0.8);
  // A 坑口石拱（A 东墙门洞 z[40,46]）
  archGate(-30.2, 43, 6, 4.2, 0.7, 'x', kit.sand, -3.0);

  // 公寓二层外门框（西墙门洞 z[12,20]）
  archGate(15.7, 16, 8, 3.4, 0.6, 'z', kit.sand, 4.0);

  // 窗口：公寓西墙矮段（z[8,12]，顶 3.2）上的木框 + 窗台
  box(0.5, 2.4, 0.5, kit.mass, 15.7, 4.4, 8.3);
  box(0.5, 2.4, 0.5, kit.mass, 15.7, 4.4, 11.7);
  box(0.55, 0.5, 3.9, kit.mass, 15.7, 5.75, 10);
  box(0.7, 0.22, 3.4, kit.beam, 15.6, 4.1, 10);
}
