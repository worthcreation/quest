// A still, not game code (7 Oct, after 232, Ross: test on an epic scene, Grand Canyon and Everest; the rise's walls
// as boundaries, large crags, epic ravines, caves). A screen composed from the kit as it stands: 64 by 40 tiles of
// grey stone; two bottomless ravines from the rise's generator (hand-widened to a canyon, 7 to 9 tiles across) as
// the south and west boundaries; the mountain's own face at the east (foot) with crags heaped at it and big ones on
// the canyon's rim; three-tile cliff slabs (brush strokes) stacked two deep with a cave under a bridging stroke; a
// terraced ravine through the big slab (232's brush); a crack on the cliff's crown. Shots at the game's zoom and
// pulled back. Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`:
// node docs/parked/mock-epic.js   writes /mnt/user-data/outputs/quest-epic.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D; const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop }; global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 }; global.location = { search: '' };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
// the screen: EPIC (src/mountain.js) and its layout (src/layouts/epic.js), in the game since 236
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; }; const shots = [];
function shot(x, y, zoom, p, label) { EPIC.fixed.zoom = 0.825 * zoom; EPIC.fixed.p = p; EPIC.land = null; EPIC.pl = null; EPIC.ravDraw = null; state.started=true; state.intro=null; startTestScene('epic', x/64, y/40); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; for (let k=0;k<8;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw(); shots.push([grab(), label + ' (ground ' + (h.lift||0).toFixed(2) + ')']); }
shot(30, 20, 0.3, 0.5, 'A  the whole screen, pulled back and tipped: the canyon south, the side canyon west, the face east, the cliff band north, the cave, the shelf');
shot(22.7, 20.5, 1, 0.35, 'B  at the cave mouth, the game\\'s own view');
shot(38, 17, 1, 0.35, 'C  on the shelf by the terraced ravine, the face beyond');
shot(14, 28, 1, 0.35, 'D  on the canyon rim');
shot(30, 9, 0.6, 0.45, 'E  under the cliff band, pulled back a little');
shot(44, 24, 0.5, 0.6, 'F  toward the face, tipped far');
const sheet = createCanvas(W * 2, (H + 45) * 3), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
shots.forEach(([c, l], i) => { const X = (i % 2) * W, Y = Math.floor(i / 2) * (H + 45); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; g.fillText(l, X + 14, Y + H + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-epic.png', sheet.toBuffer('image/png')); console.log('wrote', shots.length);
`);
