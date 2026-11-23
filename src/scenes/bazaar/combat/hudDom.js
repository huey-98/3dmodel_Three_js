// 波次 HUD、横幅、低血红晕、受击方向箭头、准星标记与阵亡遮罩的 DOM 创建。
const FONT = '"Microsoft YaHei", sans-serif';

export function createCombatHudDom() {
  // ---------- 界面 ----------
  const top = document.createElement('div');
  top.id = 'wave';
  top.style.cssText = [
    'position:fixed', 'left:28px', 'top:20px', 'z-index:5',
    'pointer-events:none', 'user-select:none',
    `font:${FONT}`, 'color:#fff', 'text-shadow:0 1px 3px rgba(0,0,0,.85)',
  ].join(';');
  const waveLine = document.createElement('div');
  waveLine.style.cssText = 'font-size:18px;font-weight:700;line-height:1.3';
  const waveSub = document.createElement('div');
  waveSub.style.cssText = 'font-size:13px;opacity:.85;line-height:1.4';
  top.append(waveLine, waveSub);
  document.body.appendChild(top);

  const banner = document.createElement('div');
  banner.id = 'wave-banner';
  banner.style.cssText = [
    'position:fixed', 'left:50%', 'top:32%', 'transform:translate(-50%,-50%)',
    'z-index:6', 'pointer-events:none', 'user-select:none', 'opacity:0',
    'transition:opacity .25s ease', 'text-align:center',
    `font:${FONT}`, 'color:#fff', 'text-shadow:0 2px 14px rgba(0,0,0,.9)',
  ].join(';');
  const bannerMain = document.createElement('div');
  bannerMain.style.cssText = 'font-size:44px;font-weight:800;letter-spacing:2px';
  const bannerSub = document.createElement('div');
  bannerSub.style.cssText = 'font-size:15px;opacity:.9;margin-top:6px;letter-spacing:1px';
  banner.append(bannerMain, bannerSub);
  document.body.appendChild(banner);

  const vignette = document.createElement('div');
  vignette.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:4', 'pointer-events:none', 'opacity:0',
    'transition:opacity .18s ease',
    'background:radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(150,10,10,.75) 100%)',
  ].join(';');
  document.body.appendChild(vignette);

  const hurtRow = document.createElement('div');
  hurtRow.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:22%', 'transform:translateX(-50%)',
    'z-index:5', 'pointer-events:none', 'user-select:none',
    `font:${FONT}`, 'text-align:center',
  ].join(';');
  const hurtArrow = document.createElement('div');
  hurtArrow.style.cssText = [
    'width:0', 'height:0', 'margin:0 auto',
    'border-left:26px solid transparent', 'border-right:26px solid transparent',
    'border-bottom:34px solid rgba(255,80,64,.92)',
    'filter:drop-shadow(0 0 8px rgba(255,40,20,.9))', 'opacity:0',
    'transition:opacity .25s ease',
  ].join(';');
  hurtRow.appendChild(hurtArrow);
  document.body.appendChild(hurtRow);

  // 命中标记：画在准星外围，和 firstPerson.js 的十字共用中心。
  const marker = document.createElement('div');
  marker.style.cssText = [
    'position:fixed', 'left:50%', 'top:50%', 'width:34px', 'height:34px',
    'transform:translate(-50%,-50%)', 'pointer-events:none', 'z-index:6', 'opacity:0',
    `font:${FONT}`,
  ].join(';');
  marker.innerHTML = [
    '<svg width="34" height="34" viewBox="0 0 34 34" style="display:block">',
    '<g stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none">',
    '<path d="M6 6 L13 13 M28 6 L21 13 M6 28 L13 21 M28 28 L21 21"/>',
    '</g>',
    '</svg>',
  ].join('');
  document.body.appendChild(marker);
  const markerPath = marker.querySelector('path');

  // 死亡遮罩
  const over = document.createElement('div');
  over.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:8', 'display:none',
    'align-items:center', 'justify-content:center', 'flex-direction:column', 'gap:10px',
    'background:rgba(40,4,4,.62)', 'backdrop-filter:blur(2px)',
    `font:${FONT}`, 'color:#fff',
  ].join(';');
  const overTitle = document.createElement('div');
  overTitle.textContent = '阵亡';
  overTitle.style.cssText = 'font-size:38px;font-weight:800;letter-spacing:6px';
  const overSub = document.createElement('div');
  overSub.style.cssText = 'font-size:14px;opacity:.85';
  over.append(overTitle, overSub);
  document.body.appendChild(over);

  return {
    top, waveLine, waveSub, banner, bannerMain, bannerSub, vignette,
    hurtRow, hurtArrow, marker, markerPath, over, overTitle, overSub,
  };
}
