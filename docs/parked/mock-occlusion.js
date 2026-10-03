// A still, not game code (3 Oct, after 225, Ross: a window when you walk under a slab; the x-ray only when a large
// thing, a boulder or a plate in front, hides you, not trees or plants). Each case laid on the flat board with the
// game's own drawing, its coverage measured (you drawn as a solid box: the share of it the frame hides), and the
// proposed look beside how it draws now. Rule: under a slab, WINDOW; behind a boulder, crag or plate, the x-ray at
// 70 percent covered or more; trees, reeds and grass never. Run from the repo root after
// `npm install --no-save @napi-rs/canvas` and `node tools/build.js`:
// node docs/parked/mock-occlusion.js   writes /mnt/user-data/outputs/quest-occlusion.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D;
const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
src = src.replace('const shapes = heroHid(); r.xray = !!shapes;', 'const shapes = XRAY_OFF ? null : heroHid(); r.xray = !!shapes;');
if (!src.includes('XRAY_OFF ? null')) throw new Error('x-ray hook not found');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '' };
const out = [];
eval(src + `;
var XRAY_OFF = false;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; };
const drawHero0 = drawHero, box = () => { const h = state.hero; ctx.fillStyle = '#ff00ff'; ctx.fillRect(h.x - UNIT / 2, h.y - h.z - UNIT / 2, UNIT, UNIT); };
const wall = (y, seed) => ({x:20,y,w:7,h:3,seed,base:0,thick:1.2,tone:134,rot:0,under:-1});
function scene(plates, solids, hx, hy) {
  LAYOUTS.flat = { plates, pits: [], seams: [] }; FLAT.pl = null; FLAT.land = null;
  state.started=true; state.intro=null; startTestScene('flat', hx/40, hy/24); for (let k=0;k<6;k++) update(1/60);
  state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[]; state.quests = state.quests || {};
  state.solids = state.solids.filter(o => !o.rise && o.kind !== 'reeds');
  for (const [k, x, y, r] of solids) state.solids.push({ x: x * UNIT, y: y * UNIT, r: r * UNIT * (k === 'tree' ? 1 : 1 / MTN_F[k]), kind: MTN_KIND[k], v: 0, flip: false, pal: 'green', rise: k, rr: r, seed: 3, vis: r * UNIT * 1.6, key: 't' + x });
  const h = state.hero; h.x = hx * UNIT; h.y = hy * UNIT; h.z = 0; h.vx = h.vy = 0; h.liftAt = null; update(1/60); h.x = hx * UNIT; h.y = hy * UNIT; h.vx = h.vy = 0;
}
const frame = (xray, solid) => { XRAY_OFF = !xray; drawHero = solid ? box : drawHero0; draw(); drawHero = drawHero0; XRAY_OFF = false; return grab(); };
const magenta = c => { const d = c.getContext('2d').getImageData(0, 0, W, H).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 235 && d[i + 1] < 30 && d[i + 2] > 235) n++; return n; };
scene([], [], 20, 14); const ref = magenta(frame(false, true));
const cases = [
  ['under a slab (the roof at base 1.2 over a passage)', [wall(11.5, 4), wall(16.5, 5), {x:20,y:14,w:7.5,h:9,seed:9,base:1.2,thick:0.5,tone:138,rot:0,under:-1}], [], 20, 14, 'window'],
  ['behind a big boulder (r 1.8)', [], [['boulder', 20, 15.0, 1.8]], 20, 14, 'rule'],
  ['behind a mid boulder (r 1.3)', [], [['boulder', 20, 15.0, 1.3]], 20, 14, 'rule'],
  ['partly behind a small boulder (r 0.9)', [], [['boulder', 20.6, 14.9, 0.9]], 20, 14, 'rule'],
  ['behind a tree', [], [['tree', 20, 14.8, 1]], 20, 14, 'never'],
  ['behind a plate (a 1.2 wall, you against its north edge)', [wall(15.7, 6)], [], 20, 14, 'rule'],
];
for (const [name, plates, solids, hx, hy, kind] of cases) {
  scene(plates, solids, hx, hy); const cov = 1 - magenta(frame(false, true)) / ref, now = frame(true, false), off = frame(false, false);
  let want, verdict;
  if (kind === 'window') { const c = state.mtn, m = c.m, s = mtnZoom(c.p, m), pl = platesLay(m), R = pl.list.find(p => p.seed === 9), [HX, HY] = mtnProj(hx, hy, 0, c), rad = UNIT * s * 2.2;
    LAYOUTS.flat.plates = plates.slice(0, 2); FLAT.pl = null; const under = frame(false, false); LAYOUTS.flat.plates = plates; FLAT.pl = null;
    const mk = createCanvas(W, H), g = mk.getContext('2d'); g.drawImage(under, 0, 0); const gr = g.createRadialGradient(HX, HY - UNIT * s * 0.4, rad * 0.55, HX, HY - UNIT * s * 0.4, rad); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, W, H);
    want = createCanvas(W, H); const w2 = want.getContext('2d'); w2.drawImage(off, 0, 0); w2.drawImage(mk, 0, 0); verdict = 'window'; }
  else if (kind === 'never') { want = off; verdict = 'no x-ray (a tree)'; }
  else { const on = cov >= 0.7; want = on ? now : off; verdict = on ? 'x-ray' : 'no x-ray (under 70%)'; }
  out.push({ name, cov, now, want, verdict });
}
`);
const cw = 300, ch = 260, sheet = createCanvas(2 * cw + 30, out.length * (ch + 34) + 40), g = sheet.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '14px sans-serif'; g.fillStyle = '#fff';
g.fillText('now', 12, 18); g.fillText('proposed', 22 + cw, 18);
out.forEach((o, i) => { const y = 40 + i * (ch + 34); g.fillStyle = '#ddd'; g.fillText(o.name + ': ' + Math.round(o.cov * 100) + '% of you hidden > ' + o.verdict, 12, y - 6);
  g.drawImage(o.now, 640 - 150, 400 - 170, 300, 260, 10, y, cw, ch); g.drawImage(o.want, 640 - 150, 400 - 170, 300, 260, 20 + cw, y, cw, ch); console.log(o.name, Math.round(o.cov * 100) + '%', o.verdict); });
fs.writeFileSync('/mnt/user-data/outputs/quest-occlusion.png', sheet.toBuffer('image/png')); console.log('written');
