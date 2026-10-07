// A still, not game code (7 Oct, 233): angled edges as built. A 1.4 slab 14 by 16 with a 4-wide ravine, 1.4 deep,
// slope 1 (45 degrees: a V with a floor 1.2 wide), and a 5-wide one at slope 2.5 (gentle, you walk out); you on the
// steep one's side, sliding, and on the gentle one's side. At the game's zoom and pulled back. Run from the repo root
// after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`: node docs/parked/mock-vedge.js
// writes /mnt/user-data/outputs/quest-vedge.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D; const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop }; global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 }; global.location = { search: '' };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
LAYOUTS.flat={plates:[{x:20,y:12,w:14,h:16,seed:4,base:0,thick:1.4,tone:134,rot:0,under:-1},{x:20,y:8.5,w:9,h:6,seed:5,base:1.4,thick:0.6,tone:134,rot:0,under:0}],pits:[],seams:[],ravines:[{spine:[[16.5,8.7],[20,8.4],[23.5,8.8]],w:3,depth:2,top:2,seed:9,slope:1},{spine:[[15,16.5],[25,16.5]],w:5,depth:1.4,top:1.4,seed:10,slope:2.5}]};
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; }; const shots=[];
function shot(x, y, zoom, p, label) { FLAT.fixed.zoom = 0.825 * zoom; FLAT.fixed.p = p; FLAT.land = null; FLAT.pl = null; state.started=true; state.intro=null; startTestScene('flat', x/40, y/24); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; h.vx = h.vy = 0; for (let k=0;k<3;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw(); shots.push([grab(), label + ' (ground ' + (h.lift||0).toFixed(2) + ')']); }
shot(20, 12, 0.5, 0.45, 'A  pulled back: the steep V through two layers (its strata lines), the gentle one below');
shot(20, 7.5, 1, 0.35, 'B  on the steep side, a third of the way down');
shot(20, 15.2, 1, 0.35, 'C  on the gentle side');
shot(20, 8.4, 1.3, 0.35, 'D  on the floor, the game\\'s own view');
const sheet = createCanvas(W * 2, (H + 45) * 2), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
shots.forEach(([c, l], i) => { const X = (i % 2) * W, Y = Math.floor(i / 2) * (H + 45); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; g.fillText(l, X + 14, Y + H + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-vedge.png', sheet.toBuffer('image/png')); console.log('wrote');
`);
