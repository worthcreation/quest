// A still, not game code (7 Oct, after 233, Ross: reads as a large pill; give it depth, consider the edges, and show
// steeper and less steep slopes). Row 1: the same ravine (4 wide, 1.4 deep) at five slopes, the run per tile of
// depth 0.3 (near cliff), 0.6, 1 (45 degrees), 1.8, 3 (scree you walk up), as built. Row 2: the same five with the
// depth treatment: value falling off with depth, the near rim's cast shadow across the floor, the rim roughened
// and the top rolling over into the fall, the strata lines broken. Row 3: the 45-degree one close, before and after.
// (the still as built: A 1.4 slab 14 by 16 with a 4-wide ravine, 1.4 deep,
// slope 1 (45 degrees: a V with a floor 1.2 wide), and a 5-wide one at slope 2.5 (gentle, you walk out); you on the
// steep one's side, sliding, and on the gentle one's side. At the game's zoom and pulled back. Run from the repo root
// after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`: node docs/parked/mock-vedge.js
// writes /mnt/user-data/outputs/quest-vslopes.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D; const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop }; global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 }; global.location = { search: '' };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
LAYOUTS.flat={plates:[{x:20,y:12,w:40,h:14,seed:4,base:0,thick:1.4,tone:134,rot:0,under:-1}],pits:[],seams:[],ravines:[0.3,0.6,1,1.8,3].map((sl,i)=>({spine:[[3+i*8,9],[5+i*8,8.6],[7+i*8,9.2]],w:4,depth:1.4,top:1.4,seed:9+i,slope:sl}))};

let DEPTH = false;
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; }; const shots=[];
function shot(x, y, zoom, p, label) { FLAT.fixed.zoom = 0.825 * zoom; FLAT.fixed.p = p; FLAT.land = null; FLAT.pl = null; state.started=true; state.intro=null; startTestScene('flat', x/40, y/24); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; h.vx = h.vy = 0; for (let k=0;k<3;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw(); shots.push([grab(), label + ' (ground ' + (h.lift||0).toFixed(2) + ')']); }
shot(20, 11.2, 0.42, 0.4, 'A  slopes 0.3, 0.6, 1, 1.8, 3 (run per tile of depth; 0.3 a near cliff, 3 a scree you walk up), pulled back');
shot(20, 11.2, 0.42, 0.7, 'B  the same, tipped far');
shot(21, 10.2, 1.1, 0.35, 'C  the 45-degree one close, you on its near side');
shot(37, 10.4, 1.1, 0.35, 'D  the scree (slope 3) close');
const sheet = createCanvas(W * 2, (H + 45) * 2), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
shots.forEach(([c, l], i) => { const X = (i % 2) * W, Y = Math.floor(i / 2) * (H + 45); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; g.fillText(l, X + 14, Y + H + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-vslopes.png', sheet.toBuffer('image/png')); console.log('wrote');
`);
