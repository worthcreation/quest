// A still, not game code (6 Oct, 232, Ross: check the ravine reads as a ravine). The ravine brush on the flat board:
// a 1.4 slab with a 2.4-wide ravine (two terraces, the stairs on the north wall), a 4-wide one 1.4 deep (three
// terraces), a 0.8-wide one (one drop), a 0.4 slab with a shallow one; you on the floor of the first and on its
// top terrace. At the game's zoom and pulled back. Run from the repo root after `npm install --no-save @napi-rs/canvas`
// and `node tools/build.js`: node docs/parked/mock-ravine.js   writes /mnt/user-data/outputs/quest-ravine.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D; const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop }; global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 }; global.location = { search: '' };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
LAYOUTS.flat={plates:[{x:20,y:12,w:14,h:9,seed:4,base:0,thick:1.4,tone:134,rot:0,under:-1},{x:33,y:7,w:7,h:4,seed:5,base:0,thick:0.4,tone:134,rot:0,under:-1}],pits:[],seams:[],
  ravines:[{spine:[[14,10],[20,9.6],[26,10.2]],w:2.4,depth:1.4,top:1.4,seed:9},{spine:[[14,14.6],[26,14.2]],w:4,depth:1.4,top:1.4,seed:10},{spine:[[16,12.4],[24,12.2]],w:0.8,depth:1.4,top:1.4,seed:11},{spine:[[30,7],[36,7]],w:2.4,depth:0.4,top:0.4,seed:12}]};
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; }; const shots=[];
function shot(x, y, zoom, label) { FLAT.fixed.zoom = 0.825 * zoom; FLAT.land = null; FLAT.pl = null; state.started=true; state.intro=null; startTestScene('flat', x/40, y/24); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; for (let k=0;k<8;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw(); shots.push([grab(), label + ' (ground ' + (h.lift||0).toFixed(2) + ')']); }
shot(22, 12, 0.55, 'A  pulled back: a 2.4-wide ravine with two stairs (north), a 4-wide one with three, a 0.8 slit, a shallow one on the thin slab');
shot(20, 9.9, 1, 'B  on the floor of the 2.4-wide ravine, the stairs on the north wall');
shot(20, 9.15, 1, 'C  on its top terrace');
shot(20, 14.4, 1, 'D  on the floor of the 4-wide one');
const sheet = createCanvas(W * 2, H * 2 + 90), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
shots.forEach(([c, l], i) => { const X = (i % 2) * W, Y = Math.floor(i / 2) * (H + 45); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; g.fillText(l, X + 14, Y + H + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-ravine.png', sheet.toBuffer('image/png')); console.log('wrote');
`);
