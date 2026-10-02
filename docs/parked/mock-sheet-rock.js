// A still, not game code (handoff 2 Oct): run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`; writes PNGs to /mnt/user-data/outputs (repoint on Windows). See HANDOFF.md, The mountain reimagined.
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D;
const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '' };
eval(src + `;
W=1000; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
state.started=true; state.intro=null; state.pip=null; state.inv.story=STORY.adventure; state.inv.sword=true; enterScene('peak1', 0.5, 0.6); state.cut=null; for (let k=0;k<20;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.time=3.7;
ctx.fillStyle = '#7b9550'; ctx.fillRect(0, 0, W, H);
const Wd = W, Hd = H;

let S = 31; const rnd = () => (S = (S * 9301 + 49297) % 233280) / 233280, rb = (a, b) => a + rnd() * (b - a);
// the rock's silhouette on the ground (in px): wide at the foot, rounded, narrowing toward the top of the stack
const base = [500, 560], silhouette = t => { const a = t * 6.28; return [base[0] + Math.cos(a) * 330 * (0.9 + 0.1 * Math.sin(a * 3)), base[1] + Math.sin(a) * 150 * (0.9 + 0.12 * Math.sin(a * 2 + 1))]; };
// one layer: an outline (a squarish blob, broken by the sheet's own breaks), its face below it (thickness in px), lit top
function sheet(cx, cy, w, h, thick, seed, tone) {
  let s0 = S; S = Math.floor(seed * 7919) % 233280; const n = 16, P = [];
  for (let k = 0; k < n; k++) { const t = k / n, a = t * 6.28, ex = Math.cos(a), ey = Math.sin(a); const rr = Math.pow(Math.pow(Math.abs(ex), 2.4) + Math.pow(Math.abs(ey), 2.4), -1 / 2.4); const j = 0.84 + rnd() * 0.3; P.push([cx + ex * rr * w / 2 * j, cy + ey * rr * h / 2 * j]); }
  const F = P.map(([x, y]) => [x - thick * 0.1, y + thick]);
  for (let k = 0; k < n; k++) { const [ax, ay] = P[k], [bx, by] = P[(k + 1) % n], [cx2, cy2] = F[(k + 1) % n], [dx2, dy2] = F[k]; const nx = by - ay, L = Math.hypot(bx - ax, by - ay) || 1, f = nx / L; if (f < 0.05) continue;
    const v = Math.round(tone * 0.42 + tone * 0.2 * (1 - f)); ctx.fillStyle = 'rgb(' + v + ',' + (v - 2) + ',' + (v - 6) + ')'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx2, cy2); ctx.lineTo(dx2, dy2); ctx.closePath(); ctx.fill();
    if (thick > 10) { ctx.strokeStyle = 'rgba(20,18,16,.35)'; ctx.lineWidth = 1; for (let t = 0.33; t < 0.95; t += 0.33) { ctx.beginPath(); ctx.moveTo(ax + (dx2 - ax) * t, ay + (dy2 - ay) * t); ctx.lineTo(bx + (cx2 - bx) * t, by + (cy2 - by) * t); ctx.stroke(); } } }
  ctx.fillStyle = 'rgb(' + tone + ',' + (tone + 2) + ',' + (tone - 5) + ')'; ctx.beginPath(); P.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
  ctx.save(); ctx.beginPath(); P.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  const nf = Math.round(2 + w * h / 9000); for (let f = 0; f < nf; f++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,250,.12)' : 'rgba(20,18,16,.12)'; ctx.beginPath(); ctx.ellipse(cx + (rnd() - 0.5) * w * 0.8, cy + (rnd() - 0.5) * h * 0.8, 12 + rnd() * 40, 7 + rnd() * 18, rnd() * 3, 0, 6.28); ctx.fill(); }
  ctx.strokeStyle = 'rgba(30,28,24,.45)'; ctx.lineWidth = 1.2; for (let k2 = 0; k2 < nf; k2++) { const x = cx + (rnd() - 0.5) * w * 0.8, y = cy + (rnd() - 0.5) * h * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 40, y + (rnd() - 0.5) * 24); ctx.stroke(); }
  ctx.restore();
  ctx.lineWidth = 1.3; for (let k = 0; k < n; k++) { const [ax, ay] = P[k], [bx, by] = P[(k + 1) % n]; const nx = by - ay, L = Math.hypot(bx - ax, by - ay) || 1; ctx.strokeStyle = -nx / L > 0.3 ? 'rgba(255,255,250,.45)' : 'rgba(20,18,14,.7)'; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
  S = s0;
}
// the stack: about 70 sheets from the foot up; each one sits a little higher on the screen and, mirrored from the
// picture, steps toward the right as it goes up (the lower sheets reach out to the left); each a little smaller,
// broken into two or three pieces now and then; a few thick ones
let y = base[1] + 20, x = base[0], w = 680, h = 300, i = 0;
const sheets = [];
while (y > base[1] - 300 && w > 90) {
  const thick = rnd() < 0.72 ? rb(4, 9) : rnd() < 0.7 ? rb(10, 18) : rb(22, 34);
  const pieces = rnd() < 0.3 ? 2 : 1;
  for (let p = 0; p < pieces; p++) { const pw = pieces === 1 ? w : w * rb(0.42, 0.56), px = pieces === 1 ? x : x + (p ? 1 : -1) * w * 0.26 + rb(-15, 15); sheets.push([px + rb(-18, 18), y + rb(-4, 4), pw * rb(0.92, 1.06), h * rb(0.9, 1.08), thick, i * 1.7 + p, 124 + Math.round(rnd() * 22)]); }
  y -= thick * 0.9 + rb(1, 4); x += rb(4, 11); w -= rb(5, 12); h -= rb(2, 5); i++;
}
// the ground shadow of the whole mass
ctx.fillStyle = 'rgba(20,24,16,.3)'; ctx.beginPath(); ctx.ellipse(base[0] + 30, base[1] + 70, 380, 110, 0, 0, 6.28); ctx.fill();
for (const sh of sheets) sheet(...sh);
// weathering: a dusting of pale lichen over the top sheets, a dark seam here and there down the faces
for (let k = 0; k < 60; k++) { ctx.fillStyle = 'rgba(190,196,180,.18)'; ctx.beginPath(); ctx.ellipse(base[0] + rb(-220, 260), base[1] - rb(60, 290), rb(8, 30), rb(4, 12), rnd() * 3, 0, 6.28); ctx.fill(); }


// the hero: on a thin sheet about a third of the way up the left side, mid-jump onto the next (its shadow on the sheet below)
const hh = state.hero; hh.x = 310; hh.y = 585; hh.fx = 1; hh.fy = 0; hh.z = UNIT * 0.9; hh.vz = UNIT * 2;
groundShadow(hh.x, hh.y, UNIT * 0.35, UNIT * 0.14, 0, { a: 0.35 });
drawHero();
// and standing on the top sheet, for scale
hh.x = 700; hh.y = 300; hh.z = 0; hh.vz = 0; drawHero();
fs.writeFileSync('/mnt/user-data/outputs/quest-pink-rock-hero.png', canvas.toBuffer('image/png')); console.log('written', UNIT);
`);
