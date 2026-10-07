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
const st = (pts, r, thick, base = 0, under = -1, seed = 0) => ({ kind: 'brush', strokes: [{ r, pts }], plates: [], seed, base, thick, tone: 134, under });
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
// the screen
const EPIC = {
  id: 'epic', len: 64, D: 40, flat: 0, grade: 0.004, mid: 20, floor: '#8f9188', stone: [143, 145, 136], stoneAt: -9, inX: 4, outX: 200, tilt: 0.95, lead: 0, lift: 2.5, eye: 40,
  X0: -16, X1: 110, Y0: -8, Y1: 70, seed: 41, dx: 0.5, fine: 9, fixed: { p: 0.35, zoom: 0.825, follow: true }, ravs: null, isls: null,
  foot: y => 52 + Math.sin(y * 0.3) * 2.5 + Math.sin(y * 0.8) * 0.9,                     // the mountain's face: the stone rises east of here
  pathY() { return this.mid; }, pathD: () => 99,
  layout(lay) { const m = this, { put, rnd, clearOf } = lay;
    if (!m.ravs) { const seed = m.seed * 101;
      const canyon = genRavine('long', seed + 1, [-6, 30], 0.12, 60, 0.7); for (const q of canyon.spine[0]) q[2] = Math.min(3.0, q[2] * 1.4 + 0.6);   // the canyon along the south, widened to about 6 tiles (wider breaks the outline tracing: the rows went black)
      const side = genRavine('long', seed + 2, [12, -8], Math.PI / 2 + 0.25, 30, 0.6); for (const q of side.spine[0]) q[2] = Math.min(2.4, q[2] * 1.2 + 0.4);   // a side canyon in from the north
      m.ravs = [canyon, side]; m.ravDraw = null; }
    for (let i = 0; i < 90; i++) { const y = m.Y0 + rnd() * (m.Y1 - m.Y0), x = m.foot(y) + 0.5 + rnd() * 30, r = 1.0 + rnd() * 1.4; if (!clearOf(x, y, r * 0.6)) continue; put('crag', x, y, r, true); }   // the face: crags heaped
    for (let i = 0; i < 40; i++) { const x = m.X0 + rnd() * (m.foot(20) - m.X0), y = m.Y0 + rnd() * (m.Y1 - m.Y0), r = 0.9 + rnd() * 1.1; if (!mtnGap(m, x, y, r + 2.2) || mtnGap(m, x, y, r + 0.4) || !clearOf(x, y, r)) continue; put('crag', x, y, r, true); }   // big crags along the canyon rims
    for (let i = 0; i < 40; i++) { const x = m.X0 + rnd() * (m.foot(20) - m.X0 - 2), y = m.Y0 + rnd() * (m.Y1 - m.Y0), r = 0.5 + rnd() * 0.6; if (mtnGap(m, x, y, r + 0.4) || !clearOf(x, y, r)) continue; put(rnd() < 0.6 ? 'boulder' : 'crag', x, y, r, true); }
  },
  plates: pl => plateLayout(pl, 'epic'),
  scene: { area: 'field', depth: 4, msg: 'The canyon.', music: 'field', amb: 'wind', floor: '#8f9188', speed: 0.45, accel: 8 },
  finish(sc) { const m = this; sc.mtnHold = a => mtnHold(m, a) || (a === state.hero ? plateStepHero(m, a) : plateHold(m, a)); },
};
LAYOUTS.epic = { plates: [
  st([[18, 6], [30, 5], [42, 7]], 3.2, 3.0, 0, -1, 11),            // 0 the north cliff: a band three tiles thick
  st([[22, 5], [40, 6]], 2.2, 2.4, 3.0, 0, 12),                     // 1 a second band on it
  st([[20, 14], [20, 22]], 1.4, 1.8, 0, -1, 21),                    // 2 the cave's west wall
  st([[25.5, 14], [25.5, 22]], 1.4, 1.8, 0, -1, 22),                // 3 its east wall
  st([[22.7, 13.5], [22.7, 19]], 3.4, 1.0, 1.8, -1, 23),            // 4 its roof, a mouth south
  st([[32, 16], [44, 15], [48, 20]], 2.6, 1.6, 0, -1, 31),          // 5 a shelf east, 1.6 high
  st([[36, 12], [46, 12.5]], 2.0, 1.4, 1.6, 5, 32),                 // 6 a tier on it
  st([[8, 10], [12, 18]], 1.6, 1.2, 0, -1, 41),                     // 7 a ridge by the side canyon
], pits: [], seams: [{ spine: [[24, 3], [34, 4.5], [40, 3.5]], top: 5.4 }],
  ravines: [{ spine: [[34, 16.8], [44, 16.2]], w: 2.8, depth: 1.6, top: 1.6, seed: 61 }] };
MTN.epic = EPIC; addMtn(WORLD, sc => (WORLD[sc.id] = sc), EPIC);
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
