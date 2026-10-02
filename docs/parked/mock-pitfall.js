// A still, not game code (2 Oct, after 213): a pitfall punched through a staggered stack. The hole is one ring cut
// through every plate it crosses down to the base; each plate shows its own cut face inside the hole (a wall from its
// base to its top), so the hole's walls step with the stack, a line where each plate meets the next. Painted plate by
// plate, bottom up, as the plates already are: each one's faces (less the hole), its top less the hole, then inside
// the hole at its top height (and on its own outline) a shade that deepens with every plate looked down through, its
// own cut wall, the lip. Nothing of the hole is painted outside its lip. AT=x,y puts the hero; ZOOM=0.5 pulls back.
// Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`. Writes /mnt/user-data/outputs.
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
eval(src + `;
W=1280; H=800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
const AT=(process.env.AT||'4.5,14.5').split(',').map(Number), ZOOM=+process.env.ZOOM||1;
// the layout: one staggered stack of six on the south-west bank, leaning north-east, and a pit punched through all of it
M2.plates = function (pl) {
  plateStack(pl, 4.6, 19.6, 7.2, 4.6, [0.95, -0.6], [0.35, 0.4, 0.3, 0.45, 0.35, 0.4], 60);
  platePit(pl, 6.9, 18.4, 3.0, 2.2, 13.3, 0);
};
M2.pl = null; M2.land = null;
state.started=true; state.intro=null; startTestScene('mt2', AT[0]/40, AT[1]/24); for (let k=0;k<10;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
{ const pl=platesLay(M2), q=pl.pits[0]; q.cut=pl.list.filter(p=>q.P.some(([x,y])=>plateHas(p,x,y))||p.P.some(([x,y])=>plateIn(q.P,x,y))); q.top=Math.max(...q.cut.map(plateTop)); q.last=q.cut.reduce((a,p)=>!a||p.key>a.key?p:a,null);   // (cut: every plate the ring crosses, not only the ones over its middle)
  console.log('plates', pl.list.length, '| the pit cuts', q.cut.length, 'down to', q.floor, '| lip', q.top.toFixed(2)); }
const outside = R => { ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip('evenodd'); };
drawPlate = function (m, p, pr, s) {
  const pl = platesLay(m), us = UNIT * s, top = plateTop(p), T = p.P.map(([x, y]) => pr(x, y, top)), F = p.P.map(([x, y]) => pr(x, y, p.base));
  if (!plOn(T, us * 2) && !plOn(F, us * 2)) return;
  const cuts = pl.pits.filter(q => q.cut.includes(p)), ring = (q, z) => q.P.map(([x, y]) => pr(x, y, z));
  // the faces, less the hole (the ring swept from the plate's base to its top: none of its stone is left there)
  ctx.save(); for (const q of cuts) for (const z of [p.base, (p.base + top) / 2, top]) outside(ring(q, z));
  platePaintFaces(T, F, p.thick, p.tone, p.seed, s); ctx.restore();
  // the top, less the hole
  ctx.save(); plPath(T); ctx.clip(); for (const q of cuts) outside(ring(q, top));
  const tex = plateTex(p, m); if (tex) plateLay(tex, p, p.box[0], p.box[1], p.box[2], p.box[3], pr, top);
  platePaintBrink(T, us); platePaintLip(T, s); ctx.restore();
  // the hole through this plate: on its own outline, inside the ring at its top
  for (const q of cuts) { const R = ring(q, top), B = ring(q, p.base), n = R.length;
    ctx.save(); plPath(T); ctx.clip(); plPath(R); ctx.clip();
    ctx.fillStyle = 'rgba(12,14,14,.16)'; ctx.fillRect(-W, -H, W * 3, H * 3);              // looking down through one more plate: a shade deeper
    // its cut face: a quad an edge, from the ring at its base to the ring at its top, lit by its own shade (0.8 to 0.96), lighter at the top
    let cx = 0, cy = 0; for (const [X, Y] of R) { cx += X / n; cy += Y / n; }
    const yT = Math.min(...R.map(q2 => q2[1])), yB = Math.max(...B.map(q2 => q2[1])), tone = p.tone, col = (v, l) => plRgb(v * l);
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, mx = (R[i][0] + R[j][0]) / 2, my = (R[i][1] + R[j][1]) / 2, bx = (B[i][0] + B[j][0]) / 2, by = (B[i][1] + B[j][1]) / 2;
      if ((bx - mx) * (cx - mx) + (by - my) * (cy - my) <= 0.2) continue;                  // only the walls whose foot lies in toward the hole's middle: the far ones, facing you
      const ex = R[j][0] - R[i][0], ey = R[j][1] - R[i][1], L = Math.hypot(ex, ey) || 1; let nx = ey / L; if ((mx - cx) * nx + (my - cy) * (-ex / L) > 0) nx = -nx;   // facing into the hole
      const lit = mtnClamp(0.86 + 0.1 * (-nx), 0.8, 0.96), g = ctx.createLinearGradient(0, yT, 0, yB + 1); g.addColorStop(0, col(tone * 0.6, lit)); g.addColorStop(0.12, col(tone * 0.95, lit)); g.addColorStop(1, col(tone * 0.72, lit));
      ctx.beginPath(); ctx.moveTo(R[i][0], R[i][1]); ctx.lineTo(R[j][0], R[j][1]); ctx.lineTo(B[j][0], B[j][1]); ctx.lineTo(B[i][0], B[i][1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke(); }
    ctx.strokeStyle = 'rgba(28,26,22,.45)'; ctx.lineWidth = Math.max(1, 1.2 * s); plPath(B); ctx.stroke();   // where this plate meets the one under it
    platePaintBrink(R, us); ctx.restore();
    ctx.save(); plPath(T); ctx.clip(); platePaintLip(R, s); ctx.restore(); }               // the lip, on this plate's own top only
};
drawPit = function () {};                                                                 // (the hole is painted plate by plate above)
if (ZOOM !== 1) { M2.fixed.zoom *= ZOOM; mtnCamera(0, state.mtn, true); }
draw();
const name='/mnt/user-data/outputs/quest-pitfall'+(ZOOM===1?'':'-'+ZOOM)+'.png';
fs.writeFileSync(name, canvas.toBuffer('image/png')); console.log('written', name);
`);
