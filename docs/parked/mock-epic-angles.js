// A still, not game code (7 Oct, after 232, Ross: no 90-degree angles; think about nature). Over the roughened lines
// (mock-epic-lines.js): a slab's top rolls over into its face (a rounded shoulder: the top darkening into the rim,
// the wall's crown lit), the wall batters outward on its way down (its foot pushed out), the lower wall blends into
// the ground's colour and a skirt of scree (talus: no angle at the ground), and cut strips taper to points at their
// ends. Before and after. Writes /mnt/user-data/outputs/quest-epic-angles.png
// (the lines: Over the
// married-to-the-ground look (mock-epic-blend.js), the lines roughened: every outline displaced at three scales
// (slow bulges, mid wobble, fine tooth) with the odd bite and spur; brush strokes whose width breathes along the
// stroke; lips drawn as broken runs that taper and lift; faces whose foot jogs; cracks that taper to nothing and
// branch. Before and after. Writes /mnt/user-data/outputs/quest-epic-angles.png
// (the married look: The epic scene (mock-epic.js) with the proposed marrying of things to the ground, hooked into the
// game's draw order: a soft contact shadow on the ground along every slab's foot and under every crag and boulder
// (light from the north-west: the shadow falls south-east), scree and grit gathered at the feet, slab tops in the
// ground's own tone so only the wall and the lip say the stone rose, faces a shade darker. Before and after, pulled
// back and at the game's zoom. Writes /mnt/user-data/outputs/quest-epic-angles.png
// (the scene: test on an epic scene, Grand Canyon and Everest; the rise's walls
// as boundaries, large crags, epic ravines, caves). A screen composed from the kit as it stands: 64 by 40 tiles of
// grey stone; two bottomless ravines from the rise's generator (hand-widened to a canyon, 7 to 9 tiles across) as
// the south and west boundaries; the mountain's own face at the east (foot) with crags heaped at it and big ones on
// the canyon's rim; three-tile cliff slabs (brush strokes) stacked two deep with a cave under a bridging stroke; a
// terraced ravine through the big slab (232's brush); a crack on the cliff's crown. Shots at the game's zoom and
// pulled back. Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`:
// node docs/parked/mock-epic.js   writes /mnt/user-data/outputs/quest-epic-angles.png
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

// ---- the proposed look, hooked in ----
let BLEND = false;
const rngB = seed => { let v = seed * 9301 + 49297; return () => (v = (v * 9301 + 49297) % 233280) / 233280; };
// a contact shadow on the ground round a ring (the slab's foot ring, at its base): several strokes outside the ring,
// each fainter and wider, offset south-east; then scree: pebbles and grit scattered along the foot
function contact(R, pr, z, us, seed, strength = 1) {
  const S = R.map(([x, y]) => pr(x, y, z)); ctx.save(); ctx.lineJoin = 'round';
  for (const [w, a, dx, dy] of [[1.1, 0.07, 0.25, 0.3], [0.7, 0.1, 0.18, 0.22], [0.35, 0.16, 0.1, 0.12], [0.14, 0.22, 0.04, 0.05]]) { ctx.strokeStyle = 'rgba(16,16,14,' + (a * strength).toFixed(3) + ')'; ctx.lineWidth = Math.max(1, w * us); plPath(S.map(([X, Y]) => [X + dx * us, Y + dy * us])); ctx.stroke(); }
  const rnd = rngB(seed); for (let i = 0; i < R.length; i++) { const [x0, y0] = R[i], [x1, y1] = R[(i + 1) % R.length], L = Math.hypot(x1 - x0, y1 - y0), nx = (y1 - y0) / (L || 1), ny = -(x1 - x0) / (L || 1);   // (the outward side: the ring winds so that this normal points out)
    for (let k = 0; k < L * 3 * strength; k++) { const t = rnd(), d = rnd() * rnd() * 0.5 + 0.05, x = x0 + (x1 - x0) * t - nx * d, y = y0 + (y1 - y0) * t - ny * d, [X, Y] = pr(x, y, z), r = us * (0.03 + rnd() * 0.05 * (1.2 - d));
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(X + 1, Y + 1, r, r * 0.65, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = plRgb(118 + rnd() * 30); ctx.beginPath(); ctx.ellipse(X, Y, r, r * 0.65, 0, 0, 6.28); ctx.fill(); } }
  ctx.restore();
}
const faces0 = drawPlateFaces, prop0 = drawMtnProp, lay0 = platesLay, plate0 = drawPlate;
// a top takes the ground's own colour under it (mtnColor: the slope's shading and the stone by height), laid over its
// texture at GROUND alpha, so a slab on dark high ground is dark and a slab on the pale foot is pale
let GROUND = 0.55;
drawPlate = (m, p, pr, s) => { plate0(m, p, pr, s); if (!BLEND) return; const top = plateTop(p); ctx.save(); ctx.beginPath(); for (const O of p.O) O.forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.clip();
  const c = mtnColor(m, p.x, p.y); ctx.globalAlpha = GROUND; ctx.fillStyle = c; ctx.fillRect(-W, -H, W * 3, H * 3); ctx.restore(); };
drawPlateFaces = (m, p, pr, s) => { if (BLEND && p.rav == null) contact(p.P, pr, p.base, UNIT * s, p.seed * 7, Math.min(1.4, 0.7 + p.thick * 0.3)); faces0(m, p, pr, s); };
drawMtnProp = (m, p, gp, us, s) => { if (BLEND && (p.k === 'crag' || p.k === 'boulder')) { const [X, Y] = gp(p.x, p.y), r = p.r * us * (p.k === 'crag' ? 0.9 : 0.8); const g = ctx.createRadialGradient(X + r * 0.3, Y + r * 0.15, r * 0.2, X + r * 0.3, Y + r * 0.15, r * 1.5); g.addColorStop(0, 'rgba(16,16,14,.4)'); g.addColorStop(1, 'rgba(16,16,14,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X + r * 0.3, Y + r * 0.15, r * 1.5, r * 0.8, 0, 0, 6.28); ctx.fill();
    const rnd = rngB(p.seed * 31); for (let k = 0; k < 10; k++) { const a = rnd() * 6.28, d = r * (0.9 + rnd() * 0.5), x = X + Math.cos(a) * d, y = Y + Math.sin(a) * d * 0.55 + r * 0.2, rr = us * (0.03 + rnd() * 0.05); ctx.fillStyle = plRgb(118 + rnd() * 30); ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.65, 0, 0, 6.28); ctx.fill(); } }
  prop0(m, p, gp, us, s); };
platesLay = m => { const pl = lay0(m); if (BLEND) for (const p of pl.list) { if (p.tone !== pl.tone) { p.tone = pl.tone; p.tex = undefined; } } return pl; };   // tops in the ground's tone

// ---- lines ----
let LINES = false;
const noise1 = (t, seed) => Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 3.1 + seed * 1.3) * 0.3 + Math.sin(t * 7.3 + seed * 0.7) * 0.2;   // a cheap layered noise in [-1, 1]
// an outline roughened: each point moved along its outward normal by layered noise (slow, mid, fine) plus the odd
// bite in or spur out; then resampled so the fine tooth has points to live on
function roughen(P, seed, amt = 1) {
  const n = P.length, Q = []; let per = 0; for (let i = 0; i < n; i++) per += Math.hypot(P[(i + 1) % n][0] - P[i][0], P[(i + 1) % n][1] - P[i][1]);
  const step = 0.18, pts = []; for (let i = 0; i < n; i++) { const [ax, ay] = P[i], [bx, by] = P[(i + 1) % n], L = Math.hypot(bx - ax, by - ay), k = Math.max(1, Math.round(L / step)); for (let j = 0; j < k; j++) { const t = j / k; pts.push([ax + (bx - ax) * t, ay + (by - ay) * t]); } }
  const m = pts.length, rnd = rngB(seed * 13 + 1), bites = []; for (let b = 0; b < 2 + Math.floor(rnd() * 3); b++) bites.push([rnd() * m, (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.4) * amt, 2 + rnd() * 5]);
  let s = 0; for (let i = 0; i < m; i++) { const [px, py] = pts[(i - 1 + m) % m], [nx, ny] = pts[(i + 1) % m], ex = nx - px, ey = ny - py, L = Math.hypot(ex, ey) || 1, ox = ey / L, oy = -ex / L; s += Math.hypot(ex, ey) / 2;
    let d = (noise1(s * 0.35, seed) * 0.28 + noise1(s * 1.4, seed + 5) * 0.09 + noise1(s * 5.5, seed + 9) * 0.035) * amt;
    for (const [at, dep, w] of bites) { const dd = Math.min(Math.abs(i - at), m - Math.abs(i - at)); if (dd < w) d += dep * (1 - dd / w) * (1 - dd / w); }
    Q.push([pts[i][0] + ox * d, pts[i][1] + oy * d]); }
  return Q;
}
const trace0 = brushTrace, outline0 = plateOutline;
brushTrace = (strokes, plates, seed) => { if (!LINES) return trace0(strokes, plates, seed);   // a stroke's width breathes along it: each point's own radius
  const S = strokes.map(st => ({ ...st, pts: st.pts })); const P = trace0(S, plates, seed); return roughen(P, seed, 1); };
plateOutline = (cx, cy, w, h, seed, n, turn) => { const P = outline0(cx, cy, w, h, seed, n, turn); return LINES ? roughen(P, seed, 0.8) : P; };
// the lip: not one stroke round the ring but runs that taper and lift, a heavier dark where the stone breaks, a light
// rim that comes and goes
const lip0 = platePaintLip;
platePaintLip = (R, s) => { if (!LINES) return lip0(R, s); const n = R.length, rnd = rngB(n * 7 + Math.round(R[0][0])); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [col, wk, dy, keep] of [['rgba(28,28,24,.6)', 1.8, 0, 0.8], ['rgba(225,222,200,.3)', 1.2, -1.6, 0.55]]) { let i = 0; while (i < n) { if (rnd() > keep) { i += 2 + Math.floor(rnd() * 4); continue; } const len = 3 + Math.floor(rnd() * 9); ctx.strokeStyle = col;
      for (let k = 0; k < len && i + k < n; k++) { const t = k / len, w = wk * s * (0.4 + 0.9 * Math.sin(t * Math.PI)) * (0.7 + rnd() * 0.6); ctx.lineWidth = Math.max(0.6, w); ctx.beginPath(); ctx.moveTo(R[(i + k) % n][0], R[(i + k) % n][1] + dy * s); ctx.lineTo(R[(i + k + 1) % n][0], R[(i + k + 1) % n][1] + dy * s); ctx.stroke(); } i += len + 1 + Math.floor(rnd() * 3); } } };
// the base crack: tapering to nothing at its ends, with side branches
const seam0 = platePaintSeam;
platePaintSeam = (sm, z, clip, pits, pr, us) => { if (!LINES) return seam0(sm, z, clip, pits, pr, us); const C = sm.spine.map(([x, y]) => pr(x, y, z)), n = C.length, rnd = rngB(n * 3 + 11); ctx.save(); ctx.lineCap = 'round';
  for (let i = 1; i < n; i++) { const t = (i - 0.5) / (n - 1), w = Math.max(0.8, 0.07 * us * Math.sin(t * Math.PI) * (0.6 + 0.8 * rnd())); ctx.strokeStyle = 'rgb(44,44,40)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(C[i - 1][0], C[i - 1][1]); ctx.lineTo(C[i][0], C[i][1]); ctx.stroke();
    if (rnd() < 0.35) { const a = Math.atan2(C[i][1] - C[i - 1][1], C[i][0] - C[i - 1][0]) + (rnd() < 0.5 ? 1 : -1) * (0.6 + rnd() * 0.8), L = us * (0.3 + rnd() * 0.9); ctx.lineWidth = w * 0.5; ctx.beginPath(); ctx.moveTo(C[i][0], C[i][1]); ctx.quadraticCurveTo(C[i][0] + Math.cos(a) * L * 0.5, C[i][1] + Math.sin(a) * L * 0.5 + 2, C[i][0] + Math.cos(a + 0.3) * L, C[i][1] + Math.sin(a + 0.3) * L); ctx.stroke(); } }   // a branch
  ctx.restore(); };

// ---- no right angles ----
let ROUND = false, groundCol = null;
const facesP0 = platePaintFaces, ring0 = tunnelRing;
// a wall: its foot pushed outward (batter), painted top to bottom as the shoulder's light, the face, then the ground's
// colour at the foot (the talus), with a soft scree skirt below the foot
platePaintFaces = (T, F, tone) => { if (!ROUND) return facesP0(T, F, tone); const n = T.length, drawn = [], gc = groundCol || plRgb(tone);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L, mx = (T[i][0] + T[j][0]) / 2, my = (T[i][1] + T[j][1]) / 2, fx = (F[i][0] + F[j][0]) / 2, fy = (F[i][1] + F[j][1]) / 2;
    if (!((fx - mx) * nx + (fy - my) * ny > 0.2 && fy > my + 0.2)) continue;
    const lit = mtnClamp(0.72 + 0.28 * (-nx) - 0.08 * ny, 0.5, 1), hgt = Math.max(1, fy - my), bat = 0.22 * hgt, Fi = [F[i][0] + nx * bat, F[i][1] + ny * bat + bat * 0.4], Fj = [F[j][0] + nx * bat, F[j][1] + ny * bat + bat * 0.4];   // the foot pushed out along the wall's normal and a little down
    const g = ctx.createLinearGradient(0, my, 0, (Fi[1] + Fj[1]) / 2); g.addColorStop(0, plRgb(tone * 0.92 * lit)); g.addColorStop(0.18, plRgb(tone * 0.78 * lit)); g.addColorStop(0.7, plRgb(tone * 0.72 * lit)); g.addColorStop(1, gc);
    ctx.beginPath(); ctx.moveTo(T[i][0], T[i][1]); ctx.lineTo(T[j][0], T[j][1]); ctx.lineTo(Fj[0], Fj[1]); ctx.lineTo(Fi[0], Fi[1]); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = g; ctx.lineWidth = 0.6; ctx.stroke(); drawn.push(i); }
  return drawn; };
// the shoulder: inside the rim the top darkens into the edge over a third of a tile, so the top rolls over
const topPaint0 = plateTopPaint;
plateTopPaint = (m, p, pr, s) => { topPaint0(m, p, pr, s); if (!ROUND) return; const us = UNIT * s, top = plateTop(p); ctx.save(); ctx.beginPath(); for (const O of p.O) O.forEach(([x, y], i) => { const [X, Y] = pr(x, y, top); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.clip(); ctx.lineJoin = 'round';
  for (const [w, a] of [[0.7, 0.05], [0.45, 0.07], [0.25, 0.1], [0.1, 0.14]]) { ctx.strokeStyle = 'rgba(20,20,18,' + a + ')'; ctx.lineWidth = w * us; for (const O of p.O) plPath(O.map(([x, y]) => pr(x, y, top))); ctx.stroke(); } ctx.restore(); };
// a cut strip tapers to a point over its last tile and a half each end
tunnelRing = (spine0, w) => { if (!ROUND) return ring0(spine0, w); const spine = []; for (let i = 1; i < spine0.length; i++) { const [ax, ay] = spine0[i - 1], [bx, by] = spine0[i], k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 0.5)); for (let j = 0; j < k; j++) spine.push([ax + (bx - ax) * j / k, ay + (by - ay) * j / k]); } spine.push(spine0[spine0.length - 1]);   // (resampled every half tile so the taper has points to live on)
  const n = spine.length, L = [], R = []; let tot = 0; const cum = [0]; for (let i = 1; i < n; i++) { tot += Math.hypot(spine[i][0] - spine[i - 1][0], spine[i][1] - spine[i - 1][1]); cum.push(tot); }
  for (let i = 0; i < n; i++) { const [x0, y0] = spine[Math.max(0, i - 1)], [x1, y1] = spine[Math.min(n - 1, i + 1)], d = Math.hypot(x1 - x0, y1 - y0) || 1, t = Math.min(1, Math.min(cum[i], tot - cum[i]) / 1.5), k = w / 2 * (0.08 + 0.92 * Math.sqrt(t)), nx = -(y1 - y0) / d * k, ny = (x1 - x0) / d * k, [x, y] = spine[i]; L.push([x + nx, y + ny]); R.push([x - nx, y - ny]); }
  return L.concat(R.reverse()); };
const grab = () => { const c = createCanvas(W, H); c.getContext('2d').drawImage(canvas, 0, 0); return c; }; const shots = [];
function shot(x, y, zoom, p, label) { groundCol = mtnColor(EPIC, x, y); EPIC.fixed.zoom = 0.825 * zoom; EPIC.fixed.p = p; EPIC.land = null; EPIC.pl = null; EPIC.ravDraw = null; state.started=true; state.intro=null; startTestScene('epic', x/64, y/40); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.clouds=[];
  const h = state.hero; h.x = x*UNIT; h.y = y*UNIT; h.liftAt = null; h.z = 0; for (let k=0;k<8;k++) { update(1/60); h.x = x*UNIT; h.y = y*UNIT; } state.texts=[]; state.title=null; state.scrolls=[]; draw(); shots.push([grab(), label + ' (ground ' + (h.lift||0).toFixed(2) + ')']); }
BLEND = true; LINES = true;
for (const [rd, name] of [[false, 'lines, boxes'], [true, 'no right angles']]) { ROUND = rd; PL_TEX.clear(); PL_BRUSHC.clear(); groundCol = null;
  shot(30, 20, 0.3, 0.5, 'A  ' + name + ': pulled back and tipped');
  shot(27, 11.5, 1, 0.35, 'B  ' + name + ': by the cave');
  shot(38, 19.5, 1, 0.35, 'C  ' + name + ': the shelf'); }
const sheet = createCanvas(W * 2, (H + 45) * 3), g = sheet.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, sheet.width, sheet.height); g.font = '20px monospace';
[0, 3, 1, 4, 2, 5].map(k => shots[k]).forEach(([c, l], i) => { const X = (i % 2) * W, Y = Math.floor(i / 2) * (H + 45); g.drawImage(c, X, Y); g.fillStyle = '#ffe080'; g.fillText(l, X + 14, Y + H + 28); });
fs.writeFileSync('/mnt/user-data/outputs/quest-epic-angles.png', sheet.toBuffer('image/png')); console.log('wrote', shots.length);
`);
