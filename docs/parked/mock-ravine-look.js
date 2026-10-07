// A still, not game code (7 Oct, after 232, Ross: the ravine's shading needs help, it reads as a dark mark). The
// painter proposed for the ravine brush's cut, hooked into the game's own draw order (drawPlateFaces patched) on
// 232's ravines: the floor shaded by the near rim's shadow (dark at the south rim, fading to the far wall), the far
// wall lit with the ravine palette's wall gradient, strata lines and a dark overhang band under its lip, stones set in;
// the terraces' tops catching light, their feet in shadow. Three strengths, each at the game's zoom and pulled back.
// Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`:
// node docs/parked/mock-ravine-look.js   writes /mnt/user-data/outputs/quest-ravine-look.png
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
let STR = 1, LEAN = 0;   // the strength of the look; the far wall drawn taller than true (as the mountain's ravines lean their far walls): its foot pushed down the screen by LEAN x depth in tiles
const rngM = seed => { let s = seed * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
// the proposed painter. q: the ravine's cut (its strip P: the left side out, the right side back), pr the projection
const seg = (P, i) => { const n = P.length / 2; return [P[i], P[i + 1], P[2 * n - 2 - i], P[2 * n - 1 - i]]; };   // the i-th segment's quad: left i, left i+1, right i+1, right i (the strip's two sides run opposite ways)
function ravFloor(q, p, pr, s) {
  const n = q.P.length / 2, sh = 0.45 + 0.25 * STR, ext = 0.35 + 0.1 * STR;                 // the near rim's shadow: how dark, how far across the floor
  ctx.save(); plPath(p.P.map(([x, y]) => pr(x, y, q.floor))); ctx.clip();
  for (let i = 0; i < n - 1; i++) { const [L0, L1, R1, R0] = seg(q.P, i), l0 = pr(L0[0], L0[1], q.floor), l1 = pr(L1[0], L1[1], q.floor), r1 = pr(R1[0], R1[1], q.floor), r0 = pr(R0[0], R0[1], q.floor);
    const mL = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2], mR = [(r0[0] + r1[0]) / 2, (r0[1] + r1[1]) / 2], near = mL[1] > mR[1] ? mL : mR, far = near === mL ? mR : mL;
    const quad = () => { ctx.beginPath(); ctx.moveTo(l0[0], l0[1]); ctx.lineTo(l1[0], l1[1]); ctx.lineTo(r1[0], r1[1]); ctx.lineTo(r0[0], r0[1]); ctx.closePath(); };
    ctx.fillStyle = 'rgba(20,22,22,.12)'; quad(); ctx.fill();                                // the floor a touch under the tops
    const g = ctx.createLinearGradient(far[0], far[1] + LEAN * q.depth * UNIT * s, near[0], near[1]); g.addColorStop(0, 'rgba(6,8,10,' + (0.75 + 0.15 * STR) + ')'); g.addColorStop(0.5, 'rgba(6,8,10,' + (0.3 * STR) + ')'); g.addColorStop(1, 'rgba(6,8,10,.05)'); ctx.fillStyle = g; quad(); ctx.fill(); }   // dark at the far wall's foot, as the mountain's ravines fade into their drop
  ctx.restore();
}
// the far wall: the strip's north side from z0 to z1, lit (lighter than the tops, darker to its foot), strata, stones set in
function ravWall(q, p, pr, s, z0, z1) {
  const us = UNIT * s, n = q.P.length / 2, rnd = rngM(q.rav * 17 + 3), top = 150 + 10 * STR, foot = 108;
  ctx.save(); plPath(p.P.map(([x, y]) => pr(x, y, z1))); ctx.clip();
  for (let i = 0; i < n - 1; i++) { const [L0, L1, R1, R0] = seg(q.P, i), far = (pr(L0[0], L0[1], z0)[1] > pr(R0[0], R0[1], z0)[1]) ? [R0, R1] : [L0, L1];
    const dz = LEAN * (z1 - z0) * us, T0 = pr(far[0][0], far[0][1], z1), T1 = pr(far[1][0], far[1][1], z1), F0 = pr(far[0][0], far[0][1], z0).map((v, k) => k ? v + dz : v), F1 = pr(far[1][0], far[1][1], z0).map((v, k) => k ? v + dz : v), hgt = Math.max(1, (F0[1] + F1[1]) / 2 - (T0[1] + T1[1]) / 2);
    const g = ctx.createLinearGradient(0, (T0[1] + T1[1]) / 2, 0, (F0[1] + F1[1]) / 2); g.addColorStop(0, plRgb(top)); g.addColorStop(0.12, plRgb(top - 8)); g.addColorStop(1, plRgb(foot));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(T0[0], T0[1]); ctx.lineTo(T1[0], T1[1]); ctx.lineTo(F1[0], F1[1]); ctx.lineTo(F0[0], F0[1]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(30,28,24,' + (0.18 + 0.1 * STR) + ')'; ctx.lineWidth = 1; for (const f of [0.3, 0.55, 0.78]) { ctx.beginPath(); ctx.moveTo(T0[0] + (F0[0] - T0[0]) * f, T0[1] + (F0[1] - T0[1]) * f + rnd() * 2); ctx.lineTo(T1[0] + (F1[0] - T1[0]) * f, T1[1] + (F1[1] - T1[1]) * f + rnd() * 2); ctx.stroke(); }
    if (STR > 0.5 && hgt > us * 0.25) for (let k = 0; k < 2; k++) { if (rnd() < 0.5) continue; const t = rnd(), f = 0.35 + rnd() * 0.45, X = T0[0] + (T1[0] - T0[0]) * t, Y = T0[1] + (F0[1] - T0[1]) * f, r = us * (0.08 + rnd() * 0.1); ctx.save(); ctx.beginPath(); ctx.moveTo(T0[0], T0[1]); ctx.lineTo(T1[0], T1[1]); ctx.lineTo(F1[0], F1[1]); ctx.lineTo(F0[0], F0[1]); ctx.closePath(); ctx.clip(); drawJagged(X, Y, r, q.rav * 3 + k, ['#8c8a80', '#a09e94', '#6a6860']); ctx.restore(); } }
  ctx.restore();
}
// the near lip: a bright rim along the strip's south side at the top, a shadow line just inside
function ravLip(q, p, pr, s, z1) {
  const n = q.P.length / 2; ctx.save(); plPath(p.P.map(([x, y]) => pr(x, y, z1))); ctx.clip(); ctx.lineCap = 'round';
  for (let i = 0; i < n - 1; i++) { const [L0, L1, R1, R0] = seg(q.P, i), nearS = (pr(L0[0], L0[1], z1)[1] > pr(R0[0], R0[1], z1)[1]) ? [L0, L1] : [R0, R1], A = pr(nearS[0][0], nearS[0][1], z1), B = pr(nearS[1][0], nearS[1][1], z1);
    ctx.strokeStyle = 'rgba(235,232,215,' + (0.35 + 0.2 * STR) + ')'; ctx.lineWidth = Math.max(1, 1.6 * s); ctx.beginPath(); ctx.moveTo(A[0], A[1] + 1.5 * s); ctx.lineTo(B[0], B[1] + 1.5 * s); ctx.stroke(); }
  ctx.restore();
}
const faces0 = drawPlateFaces;
drawPlateFaces = (m, p, pr, s) => { const pl = platesLay(m), ravs = pl.pits.filter(q => q.rav != null);
  for (const q of ravs) if (p.base <= q.floor + 0.01 && q.cut.includes(p)) ravFloor(q, p, pr, s);
  for (const q of ravs) q.crack = false; faces0(m, p, pr, s); for (const q of ravs) q.crack = true;   // (the game's own flat floor wash off)
  for (const q of ravs) if (q.cut.includes(p) && Math.abs(plateTop(p) - q.top0) < 1e-6) { const n = q.terraces + 1; ravWall(q, p, pr, s, q.top0 - q.depth / n, q.top0); ravLip(q, p, pr, s, q.top0); }
};
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; }; const shots=[];
function shot(x, y, zoom, label) { FLAT.fixed.zoom = 0.825 * zoom; FLAT.land = null; FLAT.pl = null; state.started=true; state.intro=null; startTestScene('flat', x/40, y/24); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; for (let k=0;k<8;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw(); shots.push([grab(), label]); }
for (const [str, lean, name] of [[1, 0, 'A  true walls'], [1, 0.5, 'B  far wall leaned half its depth'], [1, 1, 'C  leaned its whole depth']]) { STR = str; LEAN = lean; shot(20, 9.9, 1, name + ': on the floor of the 2.4-wide ravine, two stairs on the far wall'); shot(22, 12, 0.55, name + ': pulled back'); }
const sheet = createCanvas(W * 2, (H + 45) * 3), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
shots.forEach(([c, l], i) => { const X = (i % 2) * W, Y = Math.floor(i / 2) * (H + 45); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; g.fillText(l, X + 14, Y + H + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-ravine-look.png', sheet.toBuffer('image/png')); console.log('wrote');
`);
