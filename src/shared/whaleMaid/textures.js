import { canvasTex } from '../canvasTex.js';

// 女仆 canvas 贴图：脸 drawFace、鲸鱼胸标 whaleLogoTex、围裙 apronTex、裙子 skirtTex。
export function drawFace(ctx, s, blink) {
  ctx.clearRect(0, 0, s, s);

  ctx.strokeStyle = '#2c4168';
  ctx.lineWidth = s * 0.01;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.22, s * 0.33);
  ctx.quadraticCurveTo(s * 0.3, s * 0.27, s * 0.4, s * 0.33);
  ctx.moveTo(s * 0.6, s * 0.33);
  ctx.quadraticCurveTo(s * 0.7, s * 0.27, s * 0.78, s * 0.33);
  ctx.stroke();

  function eye(cx, cy) {
    if (blink) {
      ctx.strokeStyle = '#1c2740';
      ctx.lineWidth = s * 0.015;
      ctx.beginPath();
      ctx.moveTo(cx - s * 0.12, cy);
      ctx.quadraticCurveTo(cx, cy + s * 0.018, cx + s * 0.12, cy);
      ctx.stroke();
      return;
    }
    ctx.fillStyle = '#1c2740';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 4, s * 0.13, s * 0.095, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.125, s * 0.155, 0, 0, Math.PI * 2);
    ctx.fill();
    const ig = ctx.createRadialGradient(cx, cy + 10, 2, cx, cy + 6, s * 0.11);
    ig.addColorStop(0, '#c5eeff');
    ig.addColorStop(0.3, '#5aacec');
    ig.addColorStop(1, '#1d5c9a');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, s * 0.095, s * 0.118, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#14233f';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, s * 0.042, s * 0.058, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - 14, cy - 18, 11, 14, -0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 16, cy + 14, 5.5, 6.5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c2740';
    ctx.lineWidth = s * 0.015;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.125, s * 0.155, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
  }
  eye(s * 0.31, s * 0.5);
  eye(s * 0.69, s * 0.5);

  ctx.fillStyle = 'rgba(236, 128, 140, 0.3)';
  ctx.beginPath();
  ctx.ellipse(s * 0.18, s * 0.7, s * 0.1, s * 0.048, 0, 0, Math.PI * 2);
  ctx.ellipse(s * 0.82, s * 0.7, s * 0.1, s * 0.048, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#c45a6a';
  ctx.lineWidth = s * 0.013;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.45, s * 0.8);
  ctx.quadraticCurveTo(s * 0.5, s * 0.835, s * 0.55, s * 0.8);
  ctx.stroke();
}

export function whaleLogoTex() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1c2a4a';
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.58, 66, 38, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.7, h * 0.55);
    ctx.quadraticCurveTo(w * 0.9, h * 0.38, w * 0.84, h * 0.66);
    ctx.quadraticCurveTo(w * 0.78, h * 0.6, w * 0.7, h * 0.58);
    ctx.fill();
    ctx.fillStyle = '#f7f4ee';
    ctx.beginPath();
    ctx.arc(w * 0.38, h * 0.52, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1c2a4a';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.46, h * 0.38);
    ctx.quadraticCurveTo(w * 0.52, h * 0.16, w * 0.64, h * 0.24);
    ctx.stroke();
    ctx.fillStyle = '#1c2a4a';
    ctx.beginPath();
    ctx.arc(w * 0.66, h * 0.18, 4.5, 0, Math.PI * 2);
    ctx.arc(w * 0.74, h * 0.12, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function apronTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f7f4ee';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ece6d8';
    ctx.lineWidth = 2;
    for (let y = 24; y < h * 0.78; y += 16) {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) ctx.lineTo(x, y + Math.sin(x * 0.14) * 3.5);
      ctx.stroke();
    }
  });
}

export function skirtTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1c2a4a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#d4b36a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.86);
    ctx.lineTo(w, h * 0.86);
    ctx.stroke();
    ctx.fillStyle = '#e4d3a4';
    const marks = [
      [80, 130], [190, 100], [320, 140], [440, 95],
      [70, 270], [210, 240], [360, 280],
      [120, 390], [270, 410], [410, 370],
    ];
    for (const [x, y] of marks) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-6, -1.2, 12, 2.4);
      ctx.fillRect(-1.2, -6, 2.4, 12);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(x + 16, y - 10, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
