// A still, not game code (handoff 2 Oct): run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`; writes PNGs to /mnt/user-data/outputs (repoint on Windows). See HANDOFF.md, The mountain reimagined.
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D;
const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(+process.env.SW||1280, +process.env.SH||800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '' };
src = src.replace('const mtnView = (m, x) => m.fixed ? m.fixed.p : mtnClamp((x - 1) / (m.len - 10));', 'const mtnView = (m, x) => { if (m.arc) { const t = mtnClamp(x / m.len); return t < m.arc ? mtnClamp(t / m.arc) : mtnClamp((1 - t) / (1 - m.arc)); } return m.fixed ? m.fixed.p : mtnClamp((x - 1) / (m.len - 10)); };').replace('const mtnZoomMin = () => Math.max(0.5, 20 / UNIT);', 'const mtnZoomMin = () => Math.max(0.3, (state.mtn && state.mtn.m.floorPx || 20) / UNIT);');
eval(src + `;
W=+process.env.SW||1280; H=+process.env.SH||800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
// ---- m1 the climb, scratch: the rise's grey end carried on; the way zigzags up; the camera an arc
const M1X = {
  id: 'mt1', len: 96, D: 36, flat: 0, grade: 0.0024, mid: 18, floor: '#8f9188', earth: '#a39b80', stoneAt: 0, inX: 4, outX: 90, tilt: 1.0, lead: 5, lift: 5,
  X0: -16, X1: 150, Y0: -10, Y1: 90, seed: 41, dx: 0.5, fine: 12, ravs: null, isls: null, arc: 0.62, floorPx: 14,
  foot: y => 94 + Math.sin(y * 0.3 + 1) * 2,
  // the way: five legs, each swinging across the slope and a little higher (the slope's height rises with x)
  pathY: x => 18 + 11 * Math.sin(x * 0.19 + 0.4) * (0.6 + 0.4 * Math.sin(x * 0.05)),
  pathD(x, y) { const { inX, outX, D } = this, y0 = this.pathY(inX + 6), y1 = this.pathY(outX); let d = x >= inX + 4 && x <= outX ? Math.abs(y - this.pathY(x)) : 99;
    if (y <= y0 + 0.5) { const t = mtnClamp((y + 1) / (y0 + 1)); d = Math.min(d, Math.abs(x - (inX + 6 * t * t))); }
    if (y >= y1 - 0.5) { const t = mtnClamp((y - y1) / (D + 1 - y1)); d = Math.min(d, Math.abs(x - (outX + 0.6 * t))); } return d; },
};
// the camera's arc: close at the way in, the crest at arc, close again at the top
const mtnViewArc = (m, x) => { if (!m.arc) return m.fixed ? m.fixed.p : mtnClamp((x - 1) / (m.len - 10)); const t = mtnClamp(x / m.len); return t < m.arc ? mtnClamp(t / m.arc) : mtnClamp((1 - t) / (1 - m.arc)); };
const zoomMinX = () => Math.max(0.3, (state.mtn && state.mtn.m.floorPx || 20) / UNIT);
function m1xRavines(m) {
  const seed = m.seed * 101;
  const a = genRavine('long', seed + 1, [30, -6], Math.PI / 2 + 0.25, 40, 0.5);   // across the slope, crossed where the way meets it
  for (const q of a.spine[0]) { const d = Math.abs(q[1] - m.pathY(q[0])); if (d < 2.4) q[2] = Math.min(q[2], 0.5 + 0.25 * d / 2.4); }
  const b = genRavine('long', seed + 2, [56, 40], -Math.PI / 2 - 0.2, 32, 0.5);  // the wide one, islands in it
  const c = genRavine('thin', seed + 3, [74, -6], Math.PI / 2 + 0.1, 44, 0.6);
  for (const q of c.spine[0]) { const d = Math.abs(q[1] - m.pathY(q[0])); if (d < 2.2) q[2] = Math.min(q[2], 0.45 + 0.3 * d / 2.2); else q[2] = Math.max(q[2], 0.9); }
  b.river = []; c.river = []; a.river = [];
  return [a, b, c];
}
M1X.layout = function (lay) { const m = this, { put, rnd, clearOf } = lay, { X0, Y0, Y1 } = m;
  if (!m.ravs) { m.ravs = m1xRavines(m); m.ravDraw = null; m.isls = [[57.5, 20.5, 1.3], [60.5, 17.2, 1.2], [63.5, 19.6, 1.5], [67, 23, 1.1]].map(([x, y, r], i) => ({ x, y, r, s: i * 2.1, chain: true })); }
  mtnPass(lay, true);
  for (let i = 0; i < 110; i++) { const x = X0 + rnd() * (m.foot(18) - X0 - 4), y = Y0 + rnd() * (Y1 - Y0), r = 0.5 + rnd() * 1.3; if (m.pathD(x, y) < 2.2 || mtnGap(m, x, y, r + 1.2) || !clearOf(x, y, r)) continue; put('crag', x, y, r, true); }
  // what the crest glimpses on the face above: shelves of ground stepping across it, a cave mouth, crags heaped
  for (const [x, y] of [[40, -3], [52, -6], [66, -4], [80, -8]]) put('shelf', x, y, 6 + rnd() * 4, false);
  put('cave', 71, -1.5, 1.6, false);
  mtnTufts(lay, 120);
};
M1X.scene = { area: 'field', depth: 4, msg: '', music: 'field', amb: 'wind', floor: M1X.floor, speed: 0.45, accel: 8 };
M1X.finish = function (sc, S) { const m = this; sc.mtnHold = a => mtnHold(m, a); sc.mtnIsle = (x, y, pad) => onIsl(m, x / UNIT, y / UNIT, pad / UNIT); sc.gusts = S.f1.gusts.map(g => ({ ...g })); sc.feat.plants = [[8, -3], [36, 3]].map(([x, dy]) => [x / m.len, (m.pathY(x) + dy) / m.D]); };
// grey by height: dry grass and moss only at the start, stone the rest of the way
mtnColor = function (m, x, y) {
  const h = mtnH(m, x, y), gx = mtnH(m, x + 0.3, y) - mtnH(m, x - 0.3, y), gy = mtnH(m, x, y + 0.3) - mtnH(m, x, y - 0.3);
  const lit = mtnClamp(0.35 * gx / 0.6 - 0.2 * gy / 0.6, -0.8, 0.8) * (0.4 + 0.6 * mtnClamp((h - 3) / 6));
  let c = [143, 145, 136]; const n = 0.5 + 0.5 * Math.sin(x * 0.37 + y * 0.9) * Math.sin(x * 0.11 - y * 0.23 + 2) + 0.35 * Math.sin(x * 1.3 + y * 0.4), g = mtnClamp(n * n * 1.2 - 0.2) * mtnClamp(1 - x / 40);
  c = c.map((v, i) => v + ([150, 142, 96][i] - v) * g * 0.7); c = c.map((v, i) => v + ([104, 128, 80][i] - v) * g * g * 0.5 * (y % 7 < 3 ? 1 : 0.3));
  const d2 = 0.5 + 0.5 * Math.sin(x * 2.1 + y * 1.7) * Math.sin(x * 0.7 - y * 1.3); c = c.map(v => v + (d2 - 0.5) * 16);
  const k = mtnClamp((h - 8) / 14); c = c.map((v, i) => v + ([118, 117, 112][i] - v) * k);
  const d = m.pathD(x, y); if (d < 0.9 && x > m.X0) { const w = (1 - d / 0.9) * 0.5; c = c.map((v, i) => v + ([158, 146, 118][i] - v) * w); }
  return 'rgb(' + c.map(v => Math.round(mtnClamp(v + lit * 30, 0, 255))).join(',') + ')';
};
const prop0 = drawMtnProp;
drawMtnProp = function (m, p, sxOf, sy, us, s) {
  if (p.k === 'shelf') { const x0 = sxOf(p.x - p.r / 2), x1 = sxOf(p.x + p.r / 2), y = sy(p.y, mtnH(m, p.x, p.y)), hh = us * 1.2; if (x1 < 0 || x0 > W) return;
    const g = ctx.createLinearGradient(0, y, 0, y + hh); g.addColorStop(0, '#6e6c66'); g.addColorStop(1, 'rgba(60,58,54,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y); for (let x = x0; x <= x1; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.05 + p.seed) * 3 * s); ctx.lineTo(x1, y + hh); ctx.lineTo(x0, y + hh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(225,222,200,.45)'; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.beginPath(); for (let x = x0; x <= x1; x += 12) { const Y = y + Math.sin(x * 0.05 + p.seed) * 3 * s - 2 * s; x === x0 ? ctx.moveTo(x, Y) : ctx.lineTo(x, Y); } ctx.stroke(); return; }
  if (p.k === 'cave') { const X = sxOf(p.x), Y = sy(p.y, mtnH(m, p.x, p.y)), r = p.r * us; ctx.fillStyle = '#4a4844'; ctx.beginPath(); ctx.ellipse(X, Y - r * 0.1, r * 1.25, r * 0.75, 0, Math.PI, 0); ctx.lineTo(X + r * 1.25, Y + r * 0.1); ctx.lineTo(X - r * 1.25, Y + r * 0.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#0e0f10'; ctx.beginPath(); ctx.ellipse(X, Y, r, r * 0.62, 0, Math.PI, 0); ctx.lineTo(X + r, Y + r * 0.05); ctx.lineTo(X - r, Y + r * 0.05); ctx.closePath(); ctx.fill(); return; }
  prop0(m, p, sxOf, sy, us, s);
};
delete WORLD.mt1; MTN.mt1 = M1X; addMtn(WORLD, sc => (WORLD[sc.id] = sc, sc), M1X);
const run=n=>{ for (let k=0;k<n;k++){ update(1/60); } }, clear=()=>{ state.texts=[]; state.title=null; state.scrolls=[]; };
state.started=true; state.intro=null; state.pip=null;
startTestScene('mt1', 4/96, 3/36); run(5); clear(); const h=state.hero; state.enemies=[];

// ---- the look pass on a drawn frame: fractured rock with raking light, a skyline of peaks, conifers, a cliff band
function dress(m) {
  const c = state.mtn, s = mtnZoom(c.p, m), us = UNIT * s, th = m.tilt * c.p, ct = Math.cos(th), st = Math.sin(th);
  const sxOf = x => W / 2 + (x - c.cx) * us, sy = (y, z) => H / 2 + ((y - c.cy) * ct - (z - c.ch) * st) * us, pj = (x, y) => [sxOf(x), sy(y, mtnH(m, x, y))];
  let S = 909; const rnd = () => (S = (S * 9301 + 49297) % 233280) / 233280, r2 = (a, b) => a + rnd() * (b - a);
  const inRav = (x, y) => mtnGap(m, x, y, 0.3);
  // the land's far edge: everything above it is sky
  const hz = []; for (let x = m.X0; x <= m.X1; x += 1) hz.push(pj(x, m.Y0));
  const landClip = () => { ctx.beginPath(); ctx.moveTo(-W, H * 3); hz.forEach(([X, Y]) => ctx.lineTo(X, Y)); ctx.lineTo(W * 2, H * 3); ctx.closePath(); ctx.clip(); };
  const holes = () => { for (const r of mtnDrawRavs(m)) if (r.spine) for (const ring of ravRings(r, 0.2)) { ring.forEach(([x, y], i) => { const [X, Y] = pj(x, y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); } };
  // 1. the skyline: three ranges stepping back into haze, snow on the high crowns, cloud between
  ctx.save(); ctx.beginPath(); ctx.moveTo(-W, -H); ctx.lineTo(W * 2, -H); for (let i = hz.length - 1; i >= 0; i--) ctx.lineTo(hz[i][0], hz[i][1]); ctx.closePath(); ctx.clip();
  const top = Math.min(...hz.map(h => h[1]));
  const ranges = [[0.22, 'rgba(150,164,186,1)', 'rgba(236,240,246,.8)', 0.0035, 1.9], [0.42, 'rgba(118,130,152,1)', 'rgba(240,243,248,.9)', 0.005, 1.3], [0.66, 'rgba(84,92,110,1)', 'rgba(246,248,252,.95)', 0.0075, 0.9]];
  for (const [base, col, snow, k, hgt] of ranges.slice()) {
    const hzAt = X => { const i = Math.max(0, Math.min(hz.length - 2, Math.floor((X - hz[0][0]) / (hz[1][0] - hz[0][0])))); const t = Math.max(0, Math.min(1, (X - hz[i][0]) / (hz[i + 1][0] - hz[i][0]))); return hz[i][1] + (hz[i + 1][1] - hz[i][1]) * t; };
    const pts = []; for (let X = -40; X <= W + 40; X += 10) { const t = X * k; const y = hzAt(X) + 30 * s - us * hgt * 2.4 * (0.5 + 0.5 * Math.abs(Math.sin(t + base * 7)) * (0.6 + 0.4 * Math.sin(t * 2.7 + 1)) + 0.3 * Math.abs(Math.sin(t * 5.1 + 2))) * (1 + base) - base * 30 * s; pts.push([X, y]); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-40, H * 2); pts.forEach(([X, Y]) => ctx.lineTo(X, Y)); ctx.lineTo(W + 40, H * 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = snow; for (let i = 2; i < pts.length - 2; i++) { const [X, Y] = pts[i]; if (Y < pts[i - 1][1] && Y < pts[i + 1][1] && Y < pts[i - 2][1] && Y < pts[i + 2][1]) { const w = 18 * s + rnd() * 20; ctx.beginPath(); ctx.moveTo(X, Y + 1); ctx.lineTo(X - w, Y + w * 1.6 + 8); ctx.lineTo(X - w * 0.35, Y + w * 1.1); ctx.lineTo(X + w * 0.2, Y + w * 1.9); ctx.lineTo(X + w * 0.9, Y + w * 1.4 + 6); ctx.closePath(); ctx.fill(); } }
    ctx.fillStyle = 'rgba(205,215,232,' + (0.55 - base * 0.6) + ')'; ctx.fillRect(-40, 0, W + 80, H);   // the air between ranges
  }
  for (let i = 0; i < 7; i++) { const X = r2(-40, W + 40), Y = top + r2(-30, 60) * s + 30; ctx.fillStyle = 'rgba(255,255,255,' + r2(0.35, 0.6) + ')'; for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.ellipse(X + j * 26 * s, Y + Math.sin(j) * 6, 34 * s + rnd() * 20, 11 * s + rnd() * 6, 0, 0, 6.28); ctx.fill(); } }
  ctx.restore();
  // 2. the rock: facets lit from the west with hard shadow on their east, strata following the contour, cracks and seams; none over the drop
  ctx.save(); landClip(); ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); holes(); ctx.clip('evenodd');
  for (let i = 0; i < 420; i++) { const x = r2(m.X0, m.X1), y = r2(m.Y0, m.Y1), w = r2(0.8, 4), h = r2(0.6, 2.4), n = 5 + Math.floor(rnd() * 3); if (inRav(x, y)) continue;
    const P = []; for (let k = 0; k < n; k++) { const a = k / n * 6.28 + rnd() * 0.4; P.push(pj(x + Math.cos(a) * w / 2 * (0.7 + rnd() * 0.5), y + Math.sin(a) * h / 2 * (0.7 + rnd() * 0.5))); }
    const lit = rnd(); ctx.fillStyle = lit < 0.45 ? 'rgba(255,255,250,' + r2(0.05, 0.12) + ')' : 'rgba(30,28,26,' + r2(0.05, 0.11) + ')'; ctx.beginPath(); P.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.fill();
    // the east edge of each facet in shadow: a dark line on its right side, a light one on its left
    ctx.lineWidth = Math.max(1, 1.4 * s); for (let k = 0; k < n; k++) { const [ax, ay] = P[k], [bx, by] = P[(k + 1) % n]; const nx = by - ay, ny = -(bx - ax), L = Math.hypot(nx, ny) || 1; const f = -nx / L; if (Math.abs(f) < 0.5) continue; ctx.strokeStyle = f > 0 ? 'rgba(255,255,248,.22)' : 'rgba(20,18,16,.45)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); } }
  ctx.strokeStyle = 'rgba(40,38,34,.22)'; ctx.lineWidth = Math.max(1, 1.2 * s);                                           // strata: along the contour (the height is by x, so near-vertical on the tipped slope), wandering
  for (let x = m.X0; x < m.X1; x += 2.2 + rnd() * 2.5) { ctx.beginPath(); let pen = false; for (let y = m.Y0; y <= m.Y1; y += 0.7) { const xx = x + 0.6 * Math.sin(y * 0.35 + x) + 0.3 * Math.sin(y * 1.3); if (inRav(xx, y)) { pen = false; continue; } const [X, Y] = pj(xx, y); pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; } ctx.stroke(); }
  for (let i = 0; i < 90; i++) { let x = r2(m.X0, m.X1), y = r2(m.Y0, m.Y1), a = rnd() * 6.28; const n = 4 + Math.floor(rnd() * 6), big = rnd() < 0.2; ctx.strokeStyle = big ? 'rgba(18,16,14,.6)' : 'rgba(30,28,24,.45)'; ctx.lineWidth = Math.max(1, (big ? 2.4 : 1.3) * s); ctx.beginPath(); let pen = false;   // cracks and seams
    for (let k = 0; k < n; k++) { if (inRav(x, y)) { pen = false; } else { const [X, Y] = pj(x, y); pen ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); pen = true; } a += (rnd() - 0.5) * 1.3; x += Math.cos(a) * r2(0.6, 1.8); y += Math.sin(a) * r2(0.6, 1.8); } ctx.stroke(); }
  ctx.restore();
  // 3. the layers: bands of slabs stacked up the slope, each a step; a band is two or three rows deep, its slabs
  // overlapping, bigger the higher the layer (SCALE the dial); the way goes through a gap in each
  ctx.save(); landClip();
  const SCALE = +process.env.SCALE || 1;
  const slabAt = (x, y, w, h, deep) => { const n = 9, P = []; for (let k = 0; k < n; k++) { const a = k / n * 6.28; P.push([x + Math.cos(a) * w / 2 * (0.75 + rnd() * 0.4), y + Math.sin(a) * h / 2 * (0.75 + rnd() * 0.4)]); }
    const Q = P.map(([px, py]) => pj(px, py)), Qs = P.map(([px, py]) => [sxOf(px) + us * 1.1 * deep, sy(py, mtnH(m, px, py)) + us * 0.8 * deep]);
    ctx.fillStyle = 'rgba(26,24,22,.5)'; ctx.beginPath(); Qs.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.fill();
    for (let k = 0; k < n; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % n], [cx2, cy2] = Qs[(k + 1) % n], [dx2, dy2] = Qs[k]; const nx = by - ay, L = Math.hypot(bx - ax, by - ay) || 1; const f = nx / L; if (f < 0.1) continue; const v = Math.round(50 + 46 * (1 - f)); ctx.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.lineTo(dx2, dy2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(20,18,16,.35)'; ctx.lineWidth = Math.max(1, s); for (let t = 0.3; t < 1; t += 0.33) { ctx.beginPath(); ctx.moveTo(ax + (dx2 - ax) * t, ay + (dy2 - ay) * t); ctx.lineTo(bx + (cx2 - bx) * t, by + (cy2 - by) * t); ctx.stroke(); } }   // strata down the face
    const tone = 132 + Math.round(rnd() * 14); ctx.fillStyle = 'rgb(' + tone + ',' + (tone + 2) + ',' + (tone - 5) + ')'; ctx.beginPath(); Q.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); Q.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip();
    for (let f = 0; f < 5; f++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,250,.13)' : 'rgba(20,18,16,.13)'; const [X, Y] = pj(x + (rnd() - 0.5) * w * 0.6, y + (rnd() - 0.5) * h * 0.6); ctx.beginPath(); ctx.ellipse(X, Y, us * r2(0.3, 0.9) * w / 4, us * r2(0.2, 0.5) * h / 3, rnd() * 3, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = 'rgba(30,28,24,.5)'; ctx.lineWidth = Math.max(1, 1.3 * s); for (let k2 = 0; k2 < 4; k2++) { const [X, Y] = pj(x + (rnd() - 0.5) * w * 0.7, y + (rnd() - 0.5) * h * 0.7); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + (rnd() - 0.5) * us * w * 0.4, Y + (rnd() - 0.5) * us * h * 0.3); ctx.stroke(); }
    for (let g2 = 0; g2 < 2; g2++) { if (rnd() < 0.5) continue; ctx.fillStyle = 'rgba(96,128,70,.35)'; const [X, Y] = pj(x + (rnd() - 0.5) * w * 0.7, y + (rnd() - 0.5) * h * 0.7); ctx.beginPath(); ctx.ellipse(X, Y, us * r2(0.3, 0.7), us * r2(0.15, 0.35), rnd() * 3, 0, 6.28); ctx.fill(); }   // moss in the hollows of the top
    ctx.restore();
    ctx.lineWidth = Math.max(1, 1.5 * s); for (let k = 0; k < n; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % n]; const nx = by - ay, L = Math.hypot(bx - ax, by - ay) || 1; ctx.strokeStyle = -nx / L > 0.3 ? 'rgba(255,255,250,.45)' : 'rgba(20,18,14,.7)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); } };
  // the shelves: slabs of every size, some the whole width of the view, thin and thick (the face), overlapping as they
  // step up the slope; laid far to near so the near ones lie over; no rows
  const shelves = []; let S2 = 4242; const rn = () => (S2 = (S2 * 9301 + 49297) % 233280) / 233280, rb = (a, b) => a + rn() * (b - a);
  const N = +process.env.N || 46;
  for (let i = 0; i < N; i++) { const kind = rn(); const w = kind < 0.2 ? rb(40, 90) : kind < 0.5 ? rb(14, 34) : rb(5, 14), h = kind < 0.2 ? rb(4, 8) : rb(2.2, 6), x = rb(m.X0 + 4, m.X1 - 20), y = rb(m.Y0 - 2, m.Y1 + 2), thick = rn() < 0.7 ? rb(0.2, 0.6) : rn() < 0.7 ? rb(0.7, 1.3) : rb(1.6, 2.8);
    if (process.env.N ? inRav(x, y) : (inRav(x, y) || inRav(x - w / 3, y) || inRav(x + w / 3, y))) continue; shelves.push([x, y, w, h, thick * SCALE, rn() * 6.28, kind < 0.2]); }
  shelves.sort((a, b) => a[1] - b[1]);
  const shelfAt = (x, y, w, h, thick, seed, long) => { let S3 = Math.floor(seed * 1000); const r3 = () => (S3 = (S3 * 9301 + 49297) % 233280) / 233280; const n = long ? 18 : 9, P = [];
    for (let k = 0; k < n; k++) { const t = k / n, a = t * 6.28; const ex = Math.cos(a), ey = Math.sin(a); const rr = Math.pow(Math.pow(Math.abs(ex), 2.6) + Math.pow(Math.abs(ey), 2.6), -1 / 2.6); P.push([x + ex * rr * w / 2 * (0.86 + r3() * 0.26), y + ey * rr * h / 2 * (0.86 + r3() * 0.26)]); }   // squarish, not round
    const Q = P.map(([px, py]) => pj(px, py)), Qs = P.map(([px, py]) => [sxOf(px) + us * 0.12 * thick, sy(py, mtnH(m, px, py)) + us * thick * 0.72]);   // the face: straight down the screen (the view tipped), a touch east
    ctx.fillStyle = 'rgba(22,20,18,.45)'; ctx.beginPath(); Qs.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.fill();
    for (let k = 0; k < n; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % n], [cx2, cy2] = Qs[(k + 1) % n], [dx2, dy2] = Qs[k]; const nx = by - ay, L = Math.hypot(bx - ax, by - ay) || 1; const f = nx / L; if (f < 0.08) continue; const v = Math.round(54 + 40 * (1 - Math.abs(f)) * 0.5 + (ax < bx ? 0 : 0)); ctx.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.lineTo(dx2, dy2); ctx.closePath(); ctx.fill();
      if (thick > 0.9) { ctx.strokeStyle = 'rgba(20,18,16,.4)'; ctx.lineWidth = Math.max(1, s); for (let t = 0.3; t < 0.95; t += 0.3) { ctx.beginPath(); ctx.moveTo(ax + (dx2 - ax) * t, ay + (dy2 - ay) * t); ctx.lineTo(bx + (cx2 - bx) * t, by + (cy2 - by) * t); ctx.stroke(); } } }
    const tone = 128 + Math.round(r3() * 18); ctx.fillStyle = 'rgb(' + tone + ',' + (tone + 2) + ',' + (tone - 5) + ')'; ctx.beginPath(); Q.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.beginPath(); Q.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip();
    const nf = Math.round(2 + w * h / 12); for (let f = 0; f < nf; f++) { ctx.fillStyle = r3() < 0.5 ? 'rgba(255,255,250,.11)' : 'rgba(20,18,16,.11)'; const [X, Y] = pj(x + (r3() - 0.5) * w * 0.8, y + (r3() - 0.5) * h * 0.8); ctx.beginPath(); ctx.ellipse(X, Y, us * (0.8 + r3() * 2.2), us * (0.5 + r3() * 1.2), r3() * 3, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = 'rgba(30,28,24,.45)'; ctx.lineWidth = Math.max(1, 1.2 * s); for (let k2 = 0; k2 < nf; k2++) { const [X, Y] = pj(x + (r3() - 0.5) * w * 0.8, y + (r3() - 0.5) * h * 0.8); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + (r3() - 0.5) * us * 3, Y + (r3() - 0.5) * us * 2); ctx.stroke(); }
    for (let g2 = 0; g2 < nf / 2; g2++) { if (r3() < 0.6) continue; ctx.fillStyle = 'rgba(96,128,70,.3)'; const [X, Y] = pj(x + (r3() - 0.5) * w * 0.8, y + (r3() - 0.5) * h * 0.8); ctx.beginPath(); ctx.ellipse(X, Y, us * (0.3 + r3() * 0.6), us * (0.15 + r3() * 0.3), r3() * 3, 0, 6.28); ctx.fill(); }
    ctx.restore();
    ctx.lineWidth = Math.max(1, 1.4 * s); for (let k = 0; k < n; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % n]; const nx = by - ay, L = Math.hypot(bx - ax, by - ay) || 1; ctx.strokeStyle = -nx / L > 0.3 ? 'rgba(255,255,250,.4)' : 'rgba(20,18,14,.65)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); } };
  for (const sh of shelves) shelfAt(...sh);
  ctx.restore();
  // 4. conifers on the low legs, thinning out with height and gone by x 50; dark, narrow, three tiers each
  ctx.save(); landClip();
  const trees = []; for (let i = 0; i < 160; i++) { const x = r2(m.X0, 52), y = r2(m.Y0, m.Y1); if (rnd() > 1 - (x - m.X0) / (52 - m.X0) * 0.9) continue; if (m.pathD(x, y) < 2 || inRav(x, y) || rnd() < 0.7) continue; trees.push([x, y, r2(0.9, 1.6)]); }
  trees.sort((a, b) => a[1] - b[1]);
  for (const [x, y, hgt] of trees) { const [X, Y] = pj(x, y), hh = us * hgt, w = us * 0.32 * hgt; ctx.fillStyle = 'rgba(20,24,20,.3)'; ctx.beginPath(); ctx.ellipse(X + w * 0.6, Y + 2, w * 1.3, w * 0.4, 0, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#3a2c20'; ctx.lineWidth = Math.max(1, 2 * s); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y - hh * 0.3); ctx.stroke();
    for (let t = 0; t < 3; t++) { const y0 = Y - hh * (0.2 + t * 0.27), ww = w * (1 - t * 0.25); ctx.fillStyle = t % 2 ? '#2a4a30' : '#1f3a26'; ctx.beginPath(); ctx.moveTo(X, y0 - hh * 0.35); ctx.lineTo(X + ww, y0); ctx.lineTo(X - ww, y0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(120,160,110,.25)'; ctx.beginPath(); ctx.moveTo(X, y0 - hh * 0.35); ctx.lineTo(X - ww, y0); ctx.lineTo(X - ww * 0.2, y0); ctx.closePath(); ctx.fill(); } }
  ctx.restore();
  // 5. the air: the top of the frame paler, haze in the far hollows
  ctx.save(); landClip(); const g = ctx.createLinearGradient(0, top, 0, H); g.addColorStop(0, 'rgba(200,212,230,.45)'); g.addColorStop(0.45, 'rgba(200,212,230,.08)'); g.addColorStop(1, 'rgba(200,212,230,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  drawHero();
}
for (const [n, x] of [['in', 9], ['leg2', 30], ['crest', 59], ['top', 88]]) { const y = M1X.pathY(x) + (n==='crest'?0:0); h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; mtnCamera(0, state.mtn, true); for (let k=0;k<25;k++) { update(1/60); h.x=x*UNIT; h.y=y*UNIT; } clear(); draw(); if (process.env.DRESS) dress(M1X); fs.writeFileSync('/tmp/m1x-'+n+'.png', canvas.toBuffer('image/png')); console.log(n, 'p', state.mtn.p.toFixed(2), 'zoom', mtnZoom(state.mtn.p, M1X).toFixed(2), 'hero px', (UNIT*mtnZoom(state.mtn.p, M1X)*0.6).toFixed(0)); }
`);
