import * as THREE from 'three';

// w×h 的 CanvasTexture：SRGB 色彩空间、各向异性 8。回调拿到 (ctx, w, h)。
export function canvasTex(w, h, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
