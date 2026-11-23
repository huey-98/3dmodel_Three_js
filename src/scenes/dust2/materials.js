// 炙热沙城的运行时材质：全部用 CanvasTexture 生成，色调按 CS2 沙漠暖黄。
import * as THREE from 'three';
import { canvasTex } from '@shared/canvasTex.js';

function noise(ctx, w, h, count, alpha, size = 2) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = `rgba(0,0,0,${(Math.random() * alpha).toFixed(3)})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
    ctx.fillStyle = `rgba(255,240,200,${(Math.random() * alpha * 0.8).toFixed(3)})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
  }
}

// 沙岩砖墙：大块砖缝 + 污渍
function sandstoneTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c8ab77';
    ctx.fillRect(0, 0, w, h);
    const rowH = 64;
    for (let y = 0; y < h; y += rowH) {
      const inset = (y / rowH) % 2 ? 88 : 0;
      for (let x = -88; x < w + 88; x += 176) {
        ctx.strokeStyle = 'rgba(90,66,38,0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + inset + 2, y + 2, 172, rowH - 4);
        ctx.fillStyle = `rgba(${190 + Math.random() * 25 | 0},${158 + Math.random() * 22 | 0},${108 + Math.random() * 20 | 0},0.5)`;
        ctx.fillRect(x + inset + 3, y + 3, 170, rowH - 6);
      }
    }
    // 顶部水渍、底部泥渍
    const g1 = ctx.createLinearGradient(0, 0, 0, 120);
    g1.addColorStop(0, 'rgba(70,50,25,0.35)');
    g1.addColorStop(1, 'rgba(70,50,25,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, 120);
    const g2 = ctx.createLinearGradient(0, h, 0, h - 90);
    g2.addColorStop(0, 'rgba(84,60,30,0.4)');
    g2.addColorStop(1, 'rgba(84,60,30,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, h - 90, w, 90);
    noise(ctx, w, h, 900, 0.09);
  });
}

// 地面沙土：大块色斑 + 碎石
function dirtTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#bd9a5f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(${150 + Math.random() * 60 | 0},${118 + Math.random() * 50 | 0},${70 + Math.random() * 40 | 0},0.35)`;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 60, 8 + Math.random() * 40, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    noise(ctx, w, h, 1600, 0.12, 3);
    ctx.strokeStyle = 'rgba(88,62,30,0.25)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * w, Math.random() * h);
      ctx.lineTo(Math.random() * w, Math.random() * h);
      ctx.stroke();
    }
  });
}

// 深色洞内石墙
function caveTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#937347';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 36; i++) {
      ctx.fillStyle = `rgba(${90 + Math.random() * 40 | 0},${66 + Math.random() * 30 | 0},${36 + Math.random() * 24 | 0},0.5)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 30 + Math.random() * 90, 14 + Math.random() * 40);
    }
    noise(ctx, w, h, 1300, 0.16, 3);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(30,18,6,0.55)');
    g.addColorStop(0.5, 'rgba(30,18,6,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

// 木箱：竖板 + 边框
function crateTex() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9c7440';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = x % 64 ? 'rgba(70,46,20,0.28)' : 'rgba(255,225,170,0.12)';
      ctx.fillRect(x, 0, 30, h);
    }
    ctx.strokeStyle = 'rgba(58,36,14,0.8)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, w, h);
    ctx.lineWidth = 7;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    noise(ctx, w, h, 500, 0.08);
  });
}

// 蓝色垃圾斗（A 大蓝箱）
function blueMetalTex() {
  return canvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#3a6f9e';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(18,42,64,0.7)';
    ctx.lineWidth = 4;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.strokeRect(2, 2, w - 4, h - 4);
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(90,64,40,${0.1 + Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 6 + Math.random() * 40, 4 + Math.random() * 26);
    }
    noise(ctx, w, h, 700, 0.07);
  });
}

// 木板门：粗竖板 + 铁件
function doorTex() {
  return canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#7c5a30';
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 42) {
      ctx.fillStyle = 'rgba(30,16,4,0.5)';
      ctx.fillRect(x, 0, 4, h);
      ctx.fillStyle = `rgba(${140 + Math.random() * 30 | 0},${100 + Math.random() * 20 | 0},${55 + Math.random() * 18 | 0},0.5)`;
      ctx.fillRect(x + 5, 0, 36, h);
    }
    ctx.fillStyle = 'rgba(48,32,14,0.85)';
    ctx.fillRect(0, 26, w, 26);
    ctx.fillRect(0, h - 60, w, 26);
    ctx.fillStyle = '#38352f';
    for (let y = 40; y < h; y += 84) ctx.fillRect(10, y, 20, 20);
    noise(ctx, w, h, 400, 0.1);
  });
}

// 屋顶檐口/木梁
function beamTex() {
  return canvasTex(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#6d5433';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 10; i++) {
      ctx.strokeStyle = `rgba(40,26,10,${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, Math.random() * h);
      ctx.bezierCurveTo(w * 0.3, Math.random() * h, w * 0.7, Math.random() * h, w, Math.random() * h);
      ctx.stroke();
    }
  });
}

// 包点字母贴图（红圈 + 字母）
function siteLetterTex(letter) {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(178,38,32,0.9)';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = 'rgba(178,38,32,0.85)';
    ctx.font = 'bold 150px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, w / 2, h / 2 + 8);
  });
}

// 石板路（包点/大院地面）
function cobbleTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#b39a72';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 42) {
      const inset = (y / 42) % 2 ? 21 : 0;
      for (let x = -21; x < w + 21; x += 42) {
        ctx.fillStyle = `rgba(${150 + Math.random() * 55 | 0},${128 + Math.random() * 45 | 0},${92 + Math.random() * 35 | 0},0.75)`;
        ctx.beginPath();
        ctx.roundRect(x + inset + 2, y + 2, 38, 38, 6);
        ctx.fill();
      }
    }
    noise(ctx, w, h, 1200, 0.1, 2);
  });
}

// 柏油/砂石街道（带中心线和散砖）
function roadTex() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#a89066';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${130 + Math.random() * 60 | 0},${108 + Math.random() * 50 | 0},${70 + Math.random() * 40 | 0},0.4)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 90, 10 + Math.random() * 40);
    }
    ctx.fillStyle = 'rgba(196,176,138,0.5)';
    for (let y = 8; y < h; y += 64) ctx.fillRect(w * 0.5 - 6, y, 12, 34);
    noise(ctx, w, h, 900, 0.08, 2);
  });
}

// 木板（猫道栈道）
function woodFloorTex() {
  return canvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8a6234';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      ctx.fillStyle = `rgba(${120 + Math.random() * 40 | 0},${88 + Math.random() * 30 | 0},${48 + Math.random() * 20 | 0},0.7)`;
      ctx.fillRect(0, y + 2, w, 28);
      ctx.strokeStyle = 'rgba(50,30,10,0.5)';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    noise(ctx, w, h, 500, 0.08);
  });
}

// 公寓地砖
function aptFloorTex() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c9b492';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(90,68,40,0.35)';
    ctx.lineWidth = 3;
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    noise(ctx, w, h, 400, 0.07, 2);
  });
}
export function createDust2Kit() {
  const mk = (tex, rough = 0.92) => new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: 0.02 });
  const sand = mk(sandstoneTex());
  const cave = mk(caveTex());
  const dirt = mk(dirtTex());
  const crate = mk(crateTex());
  const blue = mk(blueMetalTex(), 0.7);
  const door = mk(doorTex());
  const beam = mk(beamTex());
  const mass = mk(sandstoneTex());
  const cobble = mk(cobbleTex());
  const road = mk(roadTex());
  const wood = mk(woodFloorTex());
  const apt = mk(aptFloorTex());
  return {
    sand,
    cobble,
    road,
    wood,
    apt,
    cave,
    dirt,
    crate,
    blue,
    door,
    beam,
    mass,
    dark: new THREE.MeshStandardMaterial({ color: 0x241a0e, roughness: 1 }),
    recess: new THREE.MeshStandardMaterial({ color: 0x1c130a, roughness: 1 }),
    letter: new THREE.MeshStandardMaterial({ map: siteLetterTex('A'), transparent: true, roughness: 1 }),
    letterB: new THREE.MeshStandardMaterial({ map: siteLetterTex('B'), transparent: true, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x5d7a35, roughness: 0.95, side: THREE.DoubleSide }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x6b502c, roughness: 0.95 }),
    lampGlow: new THREE.MeshStandardMaterial({ color: 0x120c06, emissive: 0xffb45c, emissiveIntensity: 1.6 }),
    shade: new THREE.MeshBasicMaterial({ color: 0x241606, transparent: true, opacity: 0.34 }),
  };
}