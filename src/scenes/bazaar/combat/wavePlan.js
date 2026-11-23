// ---------- 出生点 ----------

// 世界坐标。南凹槽两个口子是主攻方向，东拱门和货车旁是侧翼，北面从背后压过来。
// path 的每一点都是世界坐标，enemy.js 直接读 x / z。所有路径都停在棚外，
// 敌人不会走进任何 rooms 范围里。
export const SPAWNS = {
  southLeft: {
    x: -6, z: 26.5,
    path: [{ x: -6, z: 19 }, { x: -6, z: 12 }, { x: -6, z: 8.6 }],
  },
  southRight: {
    x: 7, z: 26.5,
    path: [{ x: 7, z: 19 }, { x: 7, z: 12 }, { x: 7, z: 8.6 }],
  },
  north: {
    x: 3, z: -17,
    path: [{ x: 3, z: -12 }, { x: 2, z: -9 }, { x: 2, z: -7.4 }],
  },
  northWest: {
    x: -10, z: -17,
    path: [{ x: -10, z: -12 }, { x: -8, z: -9.5 }, { x: -8, z: -7.4 }],
  },
  northEast: {
    x: 10, z: -17,
    path: [{ x: 10, z: -12 }, { x: 8, z: -9.5 }, { x: 8, z: -7.4 }],
  },
  // 东拱门在蓝楼西侧，进门后斜穿广场，停在棚子东侧外沿。
  arch: {
    x: 14.5, z: 13.05,
    path: [{ x: 12.2, z: 13.05 }, { x: 9.5, z: 10 }, { x: 9.4, z: 8.4 }],
  },
  // 货车停在广场西南，从车身东南侧的摊位间绕进来。
  van: {
    x: -16.5, z: 17.5,
    path: [{ x: -15, z: 11 }, { x: -11, z: 8.6 }, { x: -8.6, z: 8.4 }],
  },
};

// 阳台居高临下，不从地面走。
export const BALCONY = { x: -19.5, z: 6, y: 3.7 };

export function wavePlan(n) {
  // 第 1 波只从南凹槽两侧来，玩家先熟悉正面交火；北面从第 2 波开始压过来。
  if (n === 1) {
    return [
      { at: SPAWNS.southLeft, kind: 'walker', delay: 0 },
      { at: SPAWNS.southRight, kind: 'walker', delay: 1.4 },
      { at: SPAWNS.southLeft, kind: 'walker', delay: 3.2 },
    ];
  }
  if (n === 2) {
    return [
      { at: SPAWNS.southLeft, kind: 'walker', delay: 0 },
      { at: SPAWNS.southRight, kind: 'walker', delay: 0.8 },
      { at: SPAWNS.north, kind: 'walker', delay: 2 },
      { at: SPAWNS.arch, kind: 'walker', delay: 3 },
      { at: SPAWNS.van, kind: 'walker', delay: 4.2 },
    ];
  }
  const plan = [];
  const order = [
    SPAWNS.southLeft, SPAWNS.southRight, SPAWNS.arch,
    SPAWNS.north, SPAWNS.northWest, SPAWNS.northEast, SPAWNS.van,
  ];
  const count = n === 3 ? 7 : Math.min(16, 7 + (n - 3));
  for (let i = 0; i < count; i++) {
    plan.push({
      at: order[i % order.length],
      kind: 'walker',
      delay: i * Math.max(0.6, 1.6 - n * 0.1),
    });
  }
  if (n === 3) {
    plan.push({ at: BALCONY, kind: 'stationary', delay: 2.4 });
    plan.push({ at: BALCONY, kind: 'stationary', delay: 3.6 });
  } else if (n >= 5) {
    plan.push({ at: BALCONY, kind: 'stationary', delay: 2 });
  }
  return plan;
}

export function waveTuning(n) {
  return {
    speed: Math.min(4.2, 2.4 + 0.3 * (n - 1)),
    interval: Math.max(0.45, 1.7 - 0.11 * (n - 1)),
    reaction: Math.max(0.55, 1.4 - 0.15 * (n - 1)),
  };
}
