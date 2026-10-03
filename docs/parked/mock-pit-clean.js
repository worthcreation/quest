// A still, not game code (2 Oct, after 224, Ross: the pit punched through the stack of four shows the slabs' remnants
// inside the cutout; he wants it clean of everything but the hole's own depth shading). Three looks of mt2's pit,
// cropped round it, at the game's zoom and pulled back: NOW as shipped (each layer down cut back 0.55 as an L ledge,
// each ledge with its own texture, brink, lip, base line and seam); A a straight punch (ledge 0: one wall from the
// lip to the floor, the floor raised to 0.7 so a held jump climbs out); B the staircase kept but drawn as hole (the
// ledges and walls plain stone, darker the deeper, one lip at the rim only).
// Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`:
// node docs/parked/mock-pit-clean.js   writes /mnt/user-data/outputs/quest-pit-clean-4.png
const { createCanvas, Path2D, loadImage } = require('@napi-rs/canvas'); global.Path2D = Path2D;
const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '' };
const panels = {};
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const shipped = JSON.stringify(LAYOUTS.mt2);
function setup(mode, zoom) {
  LAYOUTS.mt2 = JSON.parse(shipped); if (mode === 'A') { LAYOUTS.mt2.pits[0].ledge = 0; LAYOUTS.mt2.pits[0].floor = 0.7; }
  M2.pl = null; M2.land = null; M2.fixed.zoom = 0.825 * zoom; MODE = mode;
  state.started=true; state.intro=null; startTestScene('mt2', 5.5/40, 23.2/24); for (let k=0;k<10;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[]; state.quests = state.quests || {};
  draw(); ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,W,H*0); const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c;
}
let MODE = 'NOW'; const SH_K = +process.env.SHK || 0.9;   // (D: how far the rim's shadow reaches per tile of height, eastward)
// B: a cut layer's top inside the hole is painted plain (no texture, brink, lip or seam), its tone darker the deeper
// below the rim; the hole's walls as they are; the base line and the brink inside each layer's ring dropped; one lip
// at the rim
const topPaint0 = plateTopPaint, drawPlate0 = drawPlate;
plateTopPaint = function (m, p, pr, s) {
  if (!/B|C|D/.test(MODE)) return topPaint0(m, p, pr, s);
  const pl = platesLay(m), top = plateTop(p), pits = pl.pits.filter(q => q.ring.has(p) && q.top > top + 1e-6);
  if (!pits.length) return topPaint0(m, p, pr, s);
  // outside every pit's rim: as before; inside: plain
  ctx.save(); ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); for (const q of pits) { const R = q.P.map(([x, y]) => pr(x, y, top)); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); } ctx.clip('evenodd'); topPaint0(m, p, pr, s); ctx.restore();
  for (const q of pits) { const d = (q.top - top) / Math.max(0.01, q.top - q.floor), Os = p.O.map(O => O.map(([x, y]) => pr(x, y, top)));
    ctx.save(); ctx.beginPath(); for (const T of Os) T.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.clip(); plPath(q.P.map(([x, y]) => pr(x, y, top))); ctx.clip();
    for (const h of p.holes) { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); h.ring.get(p).forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip('evenodd'); }
    if (MODE === 'C' || MODE === 'D') { const tex = plateTex(p, m); if (tex) plateLay(tex, p, p.box[0], p.box[1], p.box[2], p.box[3], pr, top); else { ctx.fillStyle = plRgb(p.tone); ctx.fillRect(-W, -H, W * 3, H * 3); } ctx.fillStyle = 'rgba(18,18,16,' + (MODE === 'D' ? 0.06 + 0.14 * d : 0.08 + 0.45 * d).toFixed(2) + ')'; }   // C: the ledge's own texture, the depth shade over it (D: a faint ambient only)
    else ctx.fillStyle = plRgb(p.tone * (0.92 - 0.45 * d));
    ctx.fillRect(-W, -H, W * 3, H * 3);
    if (MODE === 'D') { const hgt = q.top - top, sx = SH_K * hgt, sy = SH_K * 0.35 * hgt; plPath(q.P.map(([x, y]) => pr(x + sx, y + sy, top))); ctx.fillStyle = 'rgba(10,10,12,.5)'; ctx.fill(); }   // D: the rim's shadow on this ledge (the rim's ring, cast east by its height above the ledge)
    ctx.restore(); }
};
drawPlate = function (m, p, pr, s) {
  if (!/B|C|D/.test(MODE)) return drawPlate0(m, p, pr, s);
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top));
  if (!plOn(T, us * 2)) return;
  const ring = (q, z) => q.ring.get(p).map(([x, y]) => pr(x, y, z));
  plateTopPaint(m, p, pr, s);
  for (const q of p.holes) { const R = ring(q, top), B = ring(q, p.base), n = R.length, d = (q.top - top) / Math.max(0.01, q.top - q.floor);
    ctx.save(); plPath(T); ctx.clip(); plPath(R); ctx.clip();
    let cx = 0, cy = 0; for (const [X, Y] of R) { cx += X / n; cy += Y / n; }
    plateBehindHero(p, top);
    if (MODE === 'C' && p.base <= q.floor + 0.01) { plPath(B); ctx.fillStyle = 'rgba(18,18,16,.62)'; ctx.fill(); }   // C: the floor darkest (the base's ground inside the lowest ring, under the wash)
    if (MODE === 'D' && p.base <= q.floor + 0.01) { plPath(B); ctx.fillStyle = 'rgba(18,18,16,.2)'; ctx.fill(); const hgt = q.top - q.floor; ctx.save(); plPath(B); ctx.clip(); plPath(q.P.map(([x, y]) => pr(x + SH_K * hgt, y + SH_K * 0.35 * hgt, p.base))); ctx.fillStyle = 'rgba(10,10,12,.55)'; ctx.fill(); ctx.restore(); }   // D: the floor: a faint ambient, then the rim's shadow from its full height
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (R[i][0] + R[j][0]) / 2, my = (R[i][1] + R[j][1]) / 2, bx = (B[i][0] + B[j][0]) / 2, by = (B[i][1] + B[j][1]) / 2;
      if ((bx - mx) * (cx - mx) + (by - my) * (cy - my) <= 0.2) continue;
      const ex = R[j][0] - R[i][0], ey = R[j][1] - R[i][1], L = Math.hypot(ex, ey) || 1; let nx = ey / L; if ((mx - cx) * nx + (my - cy) * (-ex / L) > 0) nx = -nx;
      const lit = MODE === 'D' ? mtnClamp(0.9 + 0.3 * (-nx), 0.6, 1.05) : mtnClamp(0.86 + 0.1 * (-nx), 0.8, 0.96), g = plRgb(p.tone * 0.8 * lit * (1 - (MODE === 'D' ? 0.1 : 0.3) * d));   // (D: the wall facing away from the light dark, the one facing it lit)
      ctx.beginPath(); ctx.moveTo(R[i][0], R[i][1]); ctx.lineTo(R[j][0], R[j][1]); ctx.lineTo(B[j][0], B[j][1]); ctx.lineTo(B[i][0], B[i][1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.restore();
    if (q.top <= top + 1e-6) { ctx.save(); plPath(T); ctx.clip(); platePaintLip(R, s); ctx.restore(); } }   // (one lip: the rim's)
};
for (const [mode, zoom] of [['NOW', 1], ['C', 1], ['D', 1], ['NOW', 0.5], ['C', 0.5], ['D', 0.5]]) panels[mode + zoom] = setup(mode, zoom);
`);
(async () => {
  const sheet = createCanvas(3 * 520 + 40, 2 * 460 + 70), g = sheet.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, sheet.width, sheet.height);
  g.font = '18px sans-serif'; g.fillStyle = '#fff';
  const names = { NOW: 'NOW (ledges as slabs)', A: 'A straight punch, floor 0.7', B: 'B staircase drawn as hole', C: 'C depth wash, floor darkest', D: 'D the rim casts a shadow (light from the west)' };
  [['NOW', 1], ['C', 1], ['D', 1], ['NOW', 0.5], ['C', 0.5], ['D', 0.5]].forEach(([mode, zoom], i) => { const col = i % 3, row = i < 3 ? 0 : 1, c = panels[mode + zoom], sw = zoom === 1 ? 520 : 400, sh = zoom === 1 ? 420 : 320;
    g.drawImage(c, 640 - sw / 2, 400 - sh / 2 - (zoom === 1 ? 70 : 20), sw, sh, 10 + col * 530, 30 + row * 470, sw * (520 / sw), sh * (520 / sw));
    g.fillStyle = '#fff'; g.fillText(names[mode] + (zoom === 1 ? '  (the game\'s zoom)' : '  (pulled back)'), 14 + col * 530, 22 + row * 470); });
  fs.writeFileSync('/mnt/user-data/outputs/quest-pit-clean-4.png', sheet.toBuffer('image/png')); console.log('written');
})();
