// 家具碰撞矩形登记：FURNITURE_RECTS 单例与 solid / footprint 两个写入助手。
export const FURNITURE_RECTS = [];

export function solid(floor, x, z, hx, hz) {
  FURNITURE_RECTS.push({
    floor,
    minX: x - hx, maxX: x + hx,
    minZ: z - hz, maxZ: z + hz,
  });
}

export function footprint(rot, hx, hz) {
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  return [hx * c + hz * s, hx * s + hz * c];
}
