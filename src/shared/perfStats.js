// 调试用性能面板：URL 带 ?stats 时在左上角显示帧率、帧时间、JS 耗时和 renderer.info 统计。
// 没有这个参数时不创建 DOM，只返回两个空方法，主循环里不用写分支。
const FRAME_WINDOW = 120; // 统计最近 120 帧
const PAINT_MS = 250;      // 面板刷新间隔，避免每帧改 DOM
const SKIP_MS = 300;       // 切后台、重新聚焦造成的长间隔不计入帧时间

function summarize(ring) {
  const values = [];
  for (const v of ring) {
    if (Number.isFinite(v) && v > 0) values.push(v);
  }
  if (!values.length) return null;
  values.sort((a, b) => a - b);
  let sum = 0;
  for (const v of values) sum += v;
  const p95 = values[Math.min(values.length - 1, Math.floor(values.length * 0.95))];
  return { avg: sum / values.length, p95, max: values[values.length - 1] };
}

function count(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  return String(n);
}

export function createPerfStats({ renderer, name = '' }) {
  const enabled = new URLSearchParams(location.search).has('stats');
  if (!enabled) {
    return { beginFrame() {}, endFrame() {} };
  }

  // 每帧手动 reset，这样一帧里的多次 render（武器近景、透射 pass）都会累加进来
  renderer.info.autoReset = false;

  // 调试用：把最后一次 render 的场景、相机和渲染器挂到 window，便于在控制台做 A/B 测量
  const originalRender = renderer.render.bind(renderer);
  renderer.render = (scene, camera) => {
    window.__perfScene = scene;
    window.__perfCamera = camera;
    return originalRender(scene, camera);
  };
  window.__perfRenderer = renderer;

  const box = document.createElement('div');
  box.id = 'perf-stats';
  box.style.cssText = [
    'position:fixed',
    'left:12px',
    'top:12px',
    'z-index:9',
    'padding:8px 10px',
    'border-radius:8px',
    'background:rgba(0,0,0,.72)',
    'color:#c8f6cc',
    'font:12px/1.55 ui-monospace,Consolas,monospace',
    'white-space:pre',
    'pointer-events:none',
    'user-select:none',
  ].join(';');

  const head = document.createElement('div');
  head.textContent = name ? `性能 · ${name}` : '性能';
  head.style.cssText = 'color:#fff;margin-bottom:2px';
  const body = document.createElement('div');
  box.append(head, body);
  document.body.append(box);

  const frameMs = new Array(FRAME_WINDOW).fill(NaN);
  const jsMs = new Array(FRAME_WINDOW).fill(NaN);
  let cursor = 0;
  let filled = 0;
  let lastNow = null;
  let lastPaint = -Infinity;
  let jsStart = 0;

  function beginFrame() {
    renderer.info.reset();
    jsStart = performance.now();
  }

  function endFrame(now) {
    const js = performance.now() - jsStart;
    let frame = NaN;
    if (Number.isFinite(now)) {
      if (lastNow != null) {
        const gap = now - lastNow;
        if (gap > 0 && gap < SKIP_MS) frame = gap;
      }
      lastNow = now;
    }
    frameMs[cursor] = frame;
    jsMs[cursor] = js;
    cursor = (cursor + 1) % FRAME_WINDOW;
    filled = Math.min(filled + 1, FRAME_WINDOW);
    if (filled >= 8 && Number.isFinite(now) && now - lastPaint >= PAINT_MS) {
      lastPaint = now;
      paint();
    }
  }

  function paint() {
    const frame = summarize(frameMs);
    const js = summarize(jsMs);
    const info = renderer.info;
    const fps = frame ? 1000 / frame.avg : null;
    const lines = [
      `fps ${fps ? fps.toFixed(1) : '-'}  frame ${frame ? frame.avg.toFixed(1) : '-'}  p95 ${frame ? frame.p95.toFixed(1) : '-'}  max ${frame ? frame.max.toFixed(1) : '-'}`,
      `js ${js ? js.avg.toFixed(1) : '-'}  p95 ${js ? js.p95.toFixed(1) : '-'}`,
      `calls ${info.render.calls}  tris ${count(info.render.triangles)}`,
      `geom ${info.memory.geometries}  tex ${info.memory.textures}  dpr ${renderer.getPixelRatio().toFixed(2)}  ${renderer.domElement.width}×${renderer.domElement.height}`,
    ];
    body.textContent = lines.join('\n');
  }

  window.__perf = {
    snapshot() {
      const frame = summarize(frameMs);
      const js = summarize(jsMs);
      return {
        scene: name,
        frames: filled,
        fps: frame ? 1000 / frame.avg : null,
        frameAvgMs: frame ? frame.avg : null,
        frameP95Ms: frame ? frame.p95 : null,
        frameMaxMs: frame ? frame.max : null,
        jsAvgMs: js ? js.avg : null,
        jsP95Ms: js ? js.p95 : null,
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        lines: renderer.info.render.lines,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        pixelRatio: renderer.getPixelRatio(),
        drawingBufferWidth: renderer.domElement.width,
        drawingBufferHeight: renderer.domElement.height,
      };
    },
  };

  return { beginFrame, endFrame };
}
