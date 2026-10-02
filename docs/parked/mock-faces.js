// node docs/parked/mock-faces.js: stills of a tall slab with a pit cut across its edge and two shorter slabs in front, three
// ways (Ross, 2 Oct, after 219: "no pit shadow / reverse shading / textures on faces; a shorter platform should not occlude a
// taller one"). Writes /mnt/user-data/outputs/faces-A.png (as shipped), faces-B.png (faces plain: one shade by facing, no lip
// band, no strata, no set-in stones, no pit shade), faces-C.png (B, and slabs painted by their top's height, the taller
// after the shorter). Each at the game's own zoom (left) and pulled back (right). Scratch: never src.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
global.Path2D = Path2D;
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..', '..');
let src = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<script>([\s\S]*)<\/script>/)[1].replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const plates = fs.readFileSync(path.join(root, 'src', 'plates.js'), 'utf8');
const fn = name => { const i = plates.indexOf('function ' + name + '('); let j = plates.indexOf('\n}\n', i); return plates.slice(i, j + 3); };
// B: faces plain. One flat shade per face from its facing, nothing else on it; the pit's walls the same; no shade over a pit
let facesB = fn('platePaintFaces').replace(/function platePaintFaces\(/, 'function platePaintFacesB(');
facesB = facesB.replace("const g = ctx.createLinearGradient(0, yTop, 0, yFoot + 1); g.addColorStop(0, plRgb(tone * 0.5)); g.addColorStop(0.06, plRgb(tone * 0.9)); g.addColorStop(0.5, plRgb(tone * 0.74)); g.addColorStop(1, plRgb(tone * 0.56));", "const g = plRgb(tone * 0.78);")
  .replace("const rings = strata ?", "if (true) return; const rings = strata ?");
let drawB = fn('drawPlate').replace(/function drawPlate\(/, 'function drawPlateB(').replace("platePaintFaces(T, F, p.thick, p.tone, p.seed, s)", "platePaintFacesB(T, F, p.thick, p.tone, p.seed, s)")
  .replace("ctx.fillStyle = 'rgba(12,14,14,.16)'; ctx.fillRect(-W, -H, W * 3, H * 3);", "")
  .replace("g.addColorStop(0, plRgb(p.tone * 0.6 * lit)); g.addColorStop(0.12, plRgb(p.tone * 0.95 * lit)); g.addColorStop(1, plRgb(p.tone * 0.72 * lit));", "g.addColorStop(0, plRgb(p.tone * 0.8 * lit)); g.addColorStop(1, plRgb(p.tone * 0.8 * lit));");
// C: B, and the slabs painted by their top's height (the taller after the shorter; equal tops by whose foot lies south)
const orderC = "";
const noop = () => {}; const game = createCanvas(1280, 800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: '?edit=flat' };
const LAY = { plates: [
  { x: 20, y: 10, w: 7, h: 5, seed: 4, base: 0, thick: 1.6, tone: 134, rot: 0, under: -1 },          // the tall slab
  { x: 18.4, y: 13.0, w: 3.4, h: 2.4, seed: 21, base: 0, thick: 0.4, tone: 136, rot: 0, under: -1 }, // a short slab in front of its south-west face
  { x: 23.0, y: 12.4, w: 3.2, h: 2.4, seed: 22, base: 0, thick: 0.9, tone: 138, rot: 0, under: -1 }, // a taller one across its south-east edge
], pits: [{ x: 18.2, y: 11.6, w: 3.6, h: 3.2, seed: 9, floor: 0, ledge: 0.55 }], seams: [] };
eval(src + ';' + facesB + drawB + orderC + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
state.started=true; startEdit('flat'); for(let k=0;k<5;k++){update(1/60);draw();} state.texts=[]; state.title=null;
editLoad(JSON.stringify(LAY)); const E=state.edit; E.sel=null; state.hero.x=19.5*UNIT; state.hero.y=16.5*UNIT; state.hero.liftAt=null;
const shot=(name, way)=>{ for (const [tag, z, cx, cy] of [['close', 1.3, 20.5, 12.6], ['wide', 0.6, 20.5, 12.6]]) { E.cx=cx; E.cy=cy; E.zoom=z; mtnCamera(0,state.mtn,true);
    const m=MTN.flat; m.pl=null; for(let k=0;k<2;k++){update(1/60);draw();}
    ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,0,460,26); ctx.fillStyle='#fff'; ctx.font='16px sans-serif'; ctx.textAlign='left'; ctx.fillText(name+' ('+tag+')', 10, 19);
    fs.writeFileSync('/mnt/user-data/outputs/faces-'+way+'-'+tag+'.png', canvas.toBuffer('image/png')); } };
shot('D: faces on the ground order, tops by height', 'D');
drawPlate = drawPlateB;                                                                         // (a function declaration: reassignable)
shot('E: D with faces plain, no pit shade', 'E');
`);
