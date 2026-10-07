// A still, not game code (6 Oct, 231): a crack drawn on the crown of a three-layer stack (a slit to the base, a lid
// spanning it), one on a 0.5 slab, one on the base (a hairline). Run from the repo root after `npm install --no-save
// @napi-rs/canvas` and `node tools/build.js`: node docs/parked/mock-crack.js   writes /tmp/crack.png
const { createCanvas, Path2D } = require('@napi-rs/canvas'); global.Path2D = Path2D; const fs = require('fs');
let src = fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop }; global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 }; global.location = { search: '' };
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
LAYOUTS.flat={plates:[{x:20,y:12,w:8,h:5,seed:4,base:0,thick:0.4,tone:134,rot:0,under:-1},{x:20,y:12,w:7,h:4.4,seed:5,base:0.4,thick:0.4,tone:134,rot:0,under:0},{x:20,y:12,w:6,h:3.8,seed:6,base:0.8,thick:0.4,tone:134,rot:0,under:1},{x:20,y:12,w:2.4,h:1.2,seed:7,base:1.2,thick:0.3,tone:134,rot:0,under:2},{x:28,y:14,w:4,h:3,seed:8,base:0,thick:0.5,tone:134,rot:0,under:-1}],pits:[],seams:[{spine:[[20,9.5],[20.4,12],[20,14.5]],top:1.2},{spine:[[10,19],[30,19.5]],top:0},{spine:[[26.5,13],[29.5,15]],top:0.5}]};
FLAT.pl=null; FLAT.land=null; FLAT.fixed.zoom=0.825; state.started=true; state.intro=null; startTestScene('flat', 0.5, 0.5); const h=state.hero; h.x=18.3*UNIT; h.y=13*UNIT; h.liftAt=null; for(let k=0;k<8;k++){update(1/60); h.x=18.3*UNIT; h.y=13*UNIT;} state.texts=[]; state.title=null; state.scrolls=[]; draw();
fs.writeFileSync('/tmp/crack.png', canvas.toBuffer('image/png'));`);
