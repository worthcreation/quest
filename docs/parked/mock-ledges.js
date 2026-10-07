// A still, not game code (6 Oct, after 230, Ross: "some stills" of the Ledges, m2 remade with the brush). The seven
// set pieces laid as a layout on the flat board (40 by 24, as mt2): the stair field (three brush ridges, hops),
// the horseshoe (a 0.9 ring open south, carrots inside, a 0.5 stepping stone behind it), the shelf and the eave (a
// 1.2 face with a 0.5 stroke overhanging its south side: walk under, the window opens), the sinkhole (a pit through a
// stack of three, a G tunnel out of its floor north), the cave (two 1.2 ridges with a 0.5 roof stroke bridging them,
// its mouth south), the crack (a seam to the sinkhole's rim) and the way out (a two-step). Writes one sheet:
// the whole scene pulled back, then at the game's own zoom you on ridge two by the horseshoe, under the eave, down the
// sinkhole and inside the cave. Run from the repo root after `npm install --no-save @napi-rs/canvas` and
// `node tools/build.js`: node docs/parked/mock-ledges.js   writes /mnt/user-data/outputs/quest-ledges.png
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
const st = (pts, r, thick, base = 0, under = -1, seed = 0) => ({ kind: 'brush', strokes: [{ r, pts }], plates: [], seed, base, thick, tone: 134, under });
const LEDGES = { plates: [
  st([[4, 5], [10, 8]], 1.0, 0.4, 0, -1, 11),                   // 0 the stair field: ridge one
  st([[11.2, 9.2], [17, 12]], 1.0, 0.45, 0, -1, 12),            // 1 ridge two
  st([[18.2, 13.2], [23, 15]], 1.0, 0.4, 0, -1, 13),            // 2 ridge three
  st([[25.5, 10], [25.3, 8], [26, 6], [28, 5], [30, 6], [30.7, 8], [30.5, 10]], 0.8, 0.9, 0, -1, 21),   // 3 the horseshoe
  st([[27, 3.1], [29, 3.1]], 0.6, 0.5, 0, -1, 22),              // 4 the stepping stone behind it
  { x: 10, y: 18, w: 8, h: 3, seed: 31, base: 0, thick: 1.2, tone: 134, rot: 0, under: -1 },   // 5 the shelf (a face)
  st([[7, 19.3], [13, 19.3]], 1.2, 0.5, 1.2, 5, 32),            // 6 the eave on it, overhanging south
  { x: 31, y: 17, w: 6, h: 4, seed: 41, base: 0, thick: 0.45, tone: 134, rot: 0, under: -1 },   // 7 the sinkhole's stack
  { x: 31.2, y: 17, w: 5.4, h: 3.6, seed: 42, base: 0.45, thick: 0.4, tone: 134, rot: 0, under: 7 },
  { x: 31.4, y: 17, w: 4.8, h: 3.2, seed: 43, base: 0.85, thick: 0.45, tone: 134, rot: 0, under: 8 },
  st([[20, 17], [20, 23]], 0.9, 1.2, 0, -1, 51),                // 10 the cave's west ridge
  st([[23.6, 17], [23.6, 23]], 0.9, 1.2, 0, -1, 52),            // 11 its east ridge
  st([[21.8, 17], [21.8, 20]], 2.0, 0.5, 1.2, -1, 53),          // 12 the roof bridging them (base 1.2: walked under)
  { x: 36, y: 20.5, w: 3, h: 2.4, seed: 61, base: 0, thick: 0.3, tone: 134, rot: 0, under: -1 },   // 13 the way out
  { x: 37, y: 22.4, w: 3, h: 2.2, seed: 62, base: 0.3, thick: 0.3, tone: 134, rot: 0, under: 13 },
], pits: [{ x: 31.5, y: 17, w: 3, h: 2.6, seed: 44, floor: 0, ledge: 0.55 }],
  seams: [{ spine: [[0, 14, 0.1], [12, 15.2, 0.09], [22, 15.6, 0.1], [29.6, 16.6, 0.08]] }],
  tunnels: [{ spine: [[31.5, 16.6], [31.5, 14.4]], w: 1.4, floor: 0, roof: 1.2 }] };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; };
LAYOUTS.flat = LEDGES; FLAT.pl = null; FLAT.land = null;
const shots = [];
function shot(x, y, zoom, label) {
  FLAT.fixed.zoom = 0.825 * zoom; FLAT.land = null; FLAT.pl = null;
  state.started=true; state.intro=null; startTestScene('flat', x/40, y/24); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  state.items = [{type:'carrot',x:27.6*UNIT,y:8.2*UNIT},{type:'carrot',x:28.4*UNIT,y:8.2*UNIT},{type:'carrot',x:21.8*UNIT,y:17.7*UNIT}];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; for (let k=0;k<8;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw();
  const c = grab(); shots.push([c, label + '   (you at ' + x + ', ' + y + ', ground ' + (h.lift||0).toFixed(2) + ', window ' + !!state.mtn.win + ')']); }
shot(20, 12, 0.36, 'A  the Ledges pulled back: the stair field, the horseshoe, the shelf and eave, the sinkhole, the cave, the way out');
shot(16.6, 11.8, 1, 'B  on ridge two, the horseshoe ahead with its carrots, the stepping stone behind it');
shot(10, 20.2, 1, 'C  under the eave: the window opens');
shot(31.9, 16.6, 1, 'D  on the sinkhole floor, the tunnel mouth north');
shot(21.8, 21.4, 1, 'E  inside the cave by its mouth');
const sheet = createCanvas(W * 2, H * 3 + 100), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '22px monospace';
g.drawImage(shots[0][0], 0, 0, W * 2, H * 1.25); g.fillStyle = '#ffe080'; g.fillText(shots[0][1], 16, H * 1.25 + 28);
shots.slice(1).forEach(([c, l], i) => { const X = (i % 2) * W, Y = H * 1.25 + 50 + Math.floor(i / 2) * (H * 0.85 + 50); g.drawImage(c, 0, 0, W, H, X, Y, W, H * 0.85); g.fillStyle = '#ffe080'; g.fillText(l, X + 16, Y + H * 0.85 + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-ledges.png', sheet.toBuffer('image/png'));
const pl = platesLay(FLAT); console.log('laid plates', pl.list.length, 'pits', pl.pits.length, '| ground: ridge two', plateTopAt(pl,14,10.6).toFixed(2), 'horseshoe wall', plateTopAt(pl,26,6).toFixed(2), 'inside it', plateTopAt(pl,28,8), 'eave', plateTopAt(pl,10,20.2), 'shelf', plateTopAt(pl,10,18).toFixed(2), 'sinkhole floor', plateTopAt(pl,32.2,17.6), 'cave floor', plateTopAt(pl,21.8,21), 'roof base', pl.list.find(p=>p.seed===53).base);
`);
