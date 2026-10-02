// node docs/parked/mock-eye.js (TUNNEL=1: a tunnel through a stack instead, build 222): the flat board with a staggered stack, a tall slab with a pit, and short slabs, at three
// eye heights (Ross, after 220: faces should read the same on every slab, "draw distance past the camera"). Writes
// /mnt/user-data/outputs/eye-<n>-close.png and -wide.png. Scratch: never src.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
global.Path2D = Path2D;
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '?edit=flat' };
const P = (x, y, w, h, seed, base, thick, under = -1) => ({ x, y, w, h, seed, base, thick, tone: 134, rot: 0, under });
const LAY = process.env.TUNNEL ? { plates: [P(16, 12, 7, 5.5, 1, 0, 0.4), P(16, 12, 7, 5.5, 2, 0.4, 0.4, 0), P(16, 12, 7, 5.5, 3, 0.8, 0.4, 1), P(16.3, 11.8, 6.4, 5, 5, 1.2, 0.5, 2), P(24, 11, 4, 3, 7, 0, 1.2)], pits: [], seams: [],
  tunnels: [{ spine: [[15.2, 7], [15.8, 12], [15.4, 17.5]], w: 1.4, floor: 0, roof: 1.2 }] } : { plates: [P(8, 14, 8, 6, 60, 0, 0.4), P(8.6, 13.6, 7.4, 5.6, 61, 0.4, 0.4, 0), P(9.2, 13.2, 6.8, 5.2, 62, 0.8, 0.4, 1), P(9.8, 12.8, 6.2, 4.8, 63, 1.2, 0.4, 2),
  P(26, 10, 7, 5, 4, 0, 1.6), P(27.5, 15.5, 3.2, 2.4, 22, 0, 0.6)], pits: [{ x: 23.6, y: 11.2, w: 3.8, h: 3.4, seed: 9, floor: 0, ledge: 0.55 }], seams: [] };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
state.started=true; startEdit('flat'); for(let k=0;k<5;k++){update(1/60);draw();} state.texts=[]; state.title=null;
editLoad(JSON.stringify(LAY)); const E=state.edit; E.sel=null; state.hero.x=(process.env.TUNNEL ? 15.7 : 18)*UNIT; state.hero.y=(process.env.TUNNEL ? 13.2 : 19)*UNIT; state.hero.liftAt=null;
for (const eye of (process.env.EYES || '14,40,0').split(',').map(Number)) { MTN.flat.eye = eye || undefined;
  for (const [tag, z] of [['close', 1.0], ['wide', 0.6]]) { E.cx=process.env.TUNNEL ? 16 : 18; E.cy=process.env.TUNNEL ? 12.5 : 13; E.zoom=z; if (process.env.P) E.p=+process.env.P; mtnCamera(0,state.mtn,true); for(let k=0;k<2;k++){update(1/60);draw();}
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,420,26); ctx.fillStyle='#fff'; ctx.font='16px sans-serif'; ctx.textAlign='left'; ctx.fillText('eye ' + (eye || 'none (no push-out)') + ' tiles up (' + tag + ')', 10, 19);
    fs.writeFileSync('/mnt/user-data/outputs/' + (process.env.TUNNEL ? 'tunnel-' : 'eye-' + eye + '-') + (process.env.P ? 'tilt' + process.env.P + '-' : '') + tag + '.png', canvas.toBuffer('image/png')); } }
`);
