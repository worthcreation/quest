// A still, not game code (3 Oct, after 225, Ross: the x-ray only shows your outline when a plate covers you; what
// should show when you walk under a roof?). Four looks of the same spot, the flat board, two walls 1.2 high with a
// roof slab bridging them at base 1.2 and you walking the passage under it (the overhang rule, 217):
// NOW the x-ray as shipped (you faint, a dashed box round you, through the roof); EDGES the same plus the covered
// geometry's edges (the walls' tops and feet under the roof) as dashed lines; CLEAR the covering slab turned half
// transparent wherever it is; WINDOW the covering slab opaque but with a soft round window over you showing what is
// under it. At the game's zoom and pulled back. Run from the repo root after `npm install --no-save @napi-rs/canvas`
// and `node tools/build.js`: node docs/parked/mock-xray.js   writes /mnt/user-data/outputs/quest-xray.png
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
const panels = {};
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const walls = [{x:19,y:11.5,w:7,h:3,seed:4,base:0,thick:1.2,tone:134,rot:0,under:-1},{x:19,y:16.5,w:7,h:3,seed:5,base:0,thick:1.2,tone:134,rot:0,under:-1}];
const roof = {x:19,y:14,w:7.5,h:9,seed:9,base:1.2,thick:0.5,tone:138,rot:0,under:-1};
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; };
function frames(zoom) {
  LAYOUTS.flat = { plates: walls, pits: [], seams: [] }; FLAT.pl = null; FLAT.land = null; FLAT.fixed.zoom = 0.825 * zoom;
  state.started=true; state.intro=null; startTestScene('flat', 19/40, 14/24); for (let k=0;k<10;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[]; state.quests = state.quests || {};
  state.hero.x = 19 * UNIT; state.hero.y = 14 * UNIT; state.hero.lift = 0; update(1/60); draw(); const under = grab();
  LAYOUTS.flat = { plates: walls.concat([roof]), pits: [], seams: [] }; FLAT.pl = null; update(1/60); draw(); const now = grab();   // (the roof laid: you walk under it, the x-ray shows you through it)
  const c = state.mtn, m = c.m, s = mtnZoom(c.p, m), pr = (x, y, z) => mtnProj(x, y, mtnH(m, x, y) + z, c), pl = platesLay(m), R = pl.list.find(p => p.seed === 9), Ws = pl.list.filter(p => p.seed === 4 || p.seed === 5);
  const Rt = R.P.map(([x, y]) => pr(x, y, plateTop(R)));
  // over: under, then the roof alone (its faces and top), no x-ray
  const put = (cv) => { ctx.clearRect(0, 0, W, H); ctx.drawImage(cv, 0, 0); };
  put(under); drawPlateFaces(m, R, pr, s); drawPlate(m, R, pr, s); const over = grab();
  // EDGES: now, plus the walls' tops and feet under the roof, dashed
  put(now); ctx.save(); plPath(Rt); ctx.clip(); ctx.strokeStyle = 'rgba(255,248,220,.55)'; ctx.lineWidth = Math.max(1, 1.2 * s); ctx.setLineDash([3 * s, 3 * s]);
  for (const p of Ws) { for (const z of [plateTop(p), p.base]) { plPath(p.P.map(([x, y]) => pr(x, y, z))); ctx.stroke(); } } ctx.restore(); const edges = grab();
  // CLEAR: under, the roof at half strength
  put(under); ctx.save(); ctx.globalAlpha = 0.45; ctx.drawImage(over, 0, 0); ctx.restore(); const clear = grab();
  // WINDOW: over, then under through a soft round window round you
  const [HX, HY] = pr(state.hero.x / UNIT, state.hero.y / UNIT, 0), rad = UNIT * s * 2.2, mk = createCanvas(W, H), g = mk.getContext('2d'); g.drawImage(under, 0, 0);
  const grad = g.createRadialGradient(HX, HY - UNIT * s * 0.4, rad * 0.55, HX, HY - UNIT * s * 0.4, rad); grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = grad; g.fillRect(0, 0, W, H);
  put(over); ctx.drawImage(mk, 0, 0); const win = grab();
  return { NOW: now, EDGES: edges, CLEAR: clear, WINDOW: win };
}
panels[1] = frames(1); panels[0.5] = frames(0.5);
`);
const names = { NOW: 'NOW: you faint, a dashed box', EDGES: 'EDGES: plus the covered walls\' edges', CLEAR: 'CLEAR: the covering slab half transparent', WINDOW: 'WINDOW: a soft window over you' };
const sheet = createCanvas(4 * 420 + 50, 2 * 400 + 70), g = sheet.getContext('2d'); g.fillStyle = '#222'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '16px sans-serif';
[1, 0.5].forEach((zoom, row) => ['NOW', 'EDGES', 'CLEAR', 'WINDOW'].forEach((k, col) => { const c = panels[zoom][k], sw = zoom === 1 ? 420 : 300, sh = zoom === 1 ? 360 : 257;
  g.drawImage(c, 640 - sw / 2, 400 - sh / 2 - (zoom === 1 ? 40 : 10), sw, sh, 10 + col * 430, 30 + row * 400, 420, 360);
  g.fillStyle = '#fff'; g.fillText(names[k] + (zoom === 1 ? ' (the game\'s zoom)' : ' (pulled back)'), 14 + col * 430, 22 + row * 400); }));
fs.writeFileSync('/mnt/user-data/outputs/quest-xray.png', sheet.toBuffer('image/png')); console.log('written');
