// A still, not game code (2 Oct): the playing field made of big stacked sheets at the game's own zoom (UNIT px a tile),
// the hero a tile among slabs eight to thirty tiles across, a ravine through them. Faces are walls drawn the ravine's
// way: the eye 14 tiles up, a top at height h projected away from the screen's centre by 14/(14-h), the face the quads
// from the foot ring (at the height it stands on) to the top ring, lit by facing with the light from the west, strata
// down the thick ones. Run from the repo root after `npm install --no-save @napi-rs/canvas` and `node tools/build.js`;
// writes to /mnt/user-data/outputs (repoint on Windows). P=0 is the flat close view, P=0.7 well up the slope; ZOOM=0.35 pulls the frame back; EYE=7 lowers the eye (more face per tile of thickness).
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
state.started=true; state.intro=null; state.pip=null; state.inv.story=STORY.adventure; state.inv.sword=true; enterScene('peak1', 0.5, 0.6); state.cut=null; for (let k=0;k<20;k++) update(1/60); state.texts=[]; state.title=null; state.scrolls=[]; state.enemies=[]; state.time=3.7;
const ZOOM = +process.env.ZOOM || 1, U = UNIT, EYE = +process.env.EYE || 14;
ctx.setTransform(ZOOM, 0, 0, ZOOM, W / 2 * (1 - ZOOM), H / 2 * (1 - ZOOM));
let S = 77; const rnd = () => (S = (S * 9301 + 49297) % 233280) / 233280, rb = (a, b) => a + rnd() * (b - a);
// the view: one projection for everything, the game's own. The slope rises gently left to right (height by x, as the
// rise has it), the view tipped and pulled back as the rise does at p (P=0.35: partway up), the eye EYE tiles up: a
// point at height z above the camera's ground is pushed out from the screen's centre by EYE/(EYE-z), the same
// perspective the ravines use to pull their floors in by EYE/(EYE+depth). Sheets lie on the slope: their heights add.
const P = +process.env.P || 0.35, th = 0.95 * P, ct = Math.cos(th), st = Math.sin(th), s = 1 - (1 - 0.5) * P, us = U * s;
const slope = (x, y) => 0.055 * (x + 14) + 0.22 * Math.sin(y * 0.55 + x * 0.2) * Math.sin(x * 0.4 - y * 0.3) + 0.06 * Math.sin(x * 1.3 + y * 1.1) + 0.03 * Math.sin(x * 2.1 - y * 1.7);   // one base plate: a slight incline, bumps and irregularities
const cam = [1, 0]; const CX = W / 2, CY = H / 2; const ch = slope(cam[0], cam[1]);
const proj = (x, y, h = 0) => { const z = slope(x, y) + h - ch, k = 1 + z / EYE; return [CX + (x - cam[0]) * us * k, CY + ((y - cam[1]) * ct - z * st) * us * k]; };
// the ground: the slope's grey, lit a little by its lean, as a mesh of quads; grit over it
{ const q = 0.25, tone = (x, y) => { const gx = slope(x + 0.5, y) - slope(x - 0.5, y), gy = slope(x, y + 0.5) - slope(x, y - 0.5); const lit = mtnClamp(0.5 * gx / 0.6 - 0.3 * gy / 0.6, -0.8, 0.8); const n = 0.5 + 0.5 * Math.sin(x * 0.9 + y * 0.7) * Math.sin(x * 0.5 - y * 0.8); return [143, 145, 136].map(v => Math.round(v + lit * 26 + (n - 0.5) * 8)); };
  for (let y = -14; y < 16; y += q) for (let x = -24; x < 30; x += q) { const c = tone(x + q / 2, y + q / 2); ctx.fillStyle = 'rgb(' + c.join(',') + ')'; ctx.beginPath(); [[x, y], [x + q, y], [x + q, y + q], [x, y + q]].forEach(([px, py], i) => { const [X, Y] = proj(px, py); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.8; ctx.stroke(); }
  for (let i = 0; i < 12000 / ZOOM / ZOOM; i++) { ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,250,.08)' : 'rgba(20,18,16,.09)'; ctx.fillRect(rnd() * W * 3 - W, rnd() * H * 3 - H, 1 + rnd() * 1.5, 1 + rnd()); } }
function BASE_TEX() { paintTop([[-W, -H], [W * 2, -H], [W * 2, H * 2], [-W, H * 2]], 143, 9, 0, false, 2.2);
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, r = rb(2, 5); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(x + 1.5, y + 1.5, r, r * 0.6, 0, 0, 6.28); ctx.fill(); drawJagged(x, y, r, i * 0.7, ['#8c8a80', '#a09e94', '#6a6860']); } };   // loose stones lying on the base

// a sheet's outline in tiles: squarish, corners knocked, a jog or two
function outlineOf(cx, cy, w, h, seed, n = 12) {
  let s0 = S; S = Math.floor(seed * 7919) % 233280; const P = []; const rot = (rnd() - 0.5) * 0.35;
  for (let k = 0; k < n; k++) { const t = k / n, a = t * 6.28 + (rnd() - 0.5) * 0.25, ex = Math.cos(a), ey = Math.sin(a); const rr = Math.pow(Math.pow(Math.abs(ex), 4) + Math.pow(Math.abs(ey), 4), -1 / 4); const j = 0.86 + rnd() * 0.24; const px = ex * rr * w / 2 * j, py = ey * rr * h / 2 * j; P.push([cx + px * Math.cos(rot) - py * Math.sin(rot) * 0.5, cy + py * Math.cos(rot) + px * Math.sin(rot) * 0.5]); }
  // worn, not cut: two rounds of corner-cutting, then a small wobble along the edge
  let Q = P; for (let r = 0; r < 2; r++) { const R = []; for (let k = 0; k < Q.length; k++) { const [ax, ay] = Q[k], [bx, by] = Q[(k + 1) % Q.length]; R.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]); } Q = R; }
  Q = Q.map(([x, y], k) => [x + (rnd() - 0.5) * 0.12, y + (rnd() - 0.5) * 0.08]);
  S = s0; return Q;
}
// the lip and the brink, as the rise's ravines have them, in grey: outside the hole (inside a plate's top) a band of
// broken ground along the edge, three strokes darkest at the edge; then the lip, a dark line where the stone breaks off
// and a lighter rim above it, all the way round
function paintBrink(R, clipPath) { ctx.save(); if (clipPath) { ctx.beginPath(); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip(); }
  ctx.lineJoin = 'round'; for (const [wk, col] of [[0.7, 'rgba(40,38,32,.07)'], [0.42, 'rgba(40,38,32,.1)'], [0.2, 'rgba(30,28,24,.18)']]) { ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, wk * us); ctx.beginPath(); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.stroke(); }
  ctx.restore(); }
function paintLip(R) { ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(28,28,24,.6)'; ctx.lineWidth = Math.max(1, 1.8 * s); ctx.beginPath(); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.stroke();
  ctx.strokeStyle = 'rgba(225,222,200,.3)'; ctx.lineWidth = Math.max(1, 1.2 * s); ctx.beginPath(); R.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y - 1.6 * s) : ctx.moveTo(X, Y - 1.6 * s)); ctx.closePath(); ctx.stroke(); }
// the top of a sheet: its grey, grit, short cracks, a lichen flake, then its brink and lip
function paintTop(Q, tone, seed, thick, edge = true, more = 1) {
  let s0 = S; S = Math.floor(seed * 131) % 233280; const n = Q.length;
  if (edge) { ctx.fillStyle = 'rgb(' + tone + ',' + (tone + 2) + ',' + (tone - 5) + ')'; ctx.beginPath(); Q.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
  ctx.save(); ctx.beginPath(); Q.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
  const xs = Q.map(p => p[0]), ys = Q.map(p => p[1]), x0 = Math.max(-W, Math.min(...xs)), x1 = Math.min(W * 2, Math.max(...xs)), y0 = Math.max(-H, Math.min(...ys)), y1 = Math.min(H * 2, Math.max(...ys)), area = (x1 - x0) * (y1 - y0);
  for (let f = 0; f < 3; f++) { const g = ctx.createRadialGradient(rb(x0, x1), rb(y0, y1), 0, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.5); g.addColorStop(0, rnd() < 0.5 ? 'rgba(255,255,250,.05)' : 'rgba(20,18,16,.06)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
  const ng = Math.round(area / 42); for (let i = 0; i < ng; i++) { ctx.fillStyle = rnd() < 0.45 ? 'rgba(255,255,250,' + rb(0.08, 0.2) + ')' : 'rgba(18,16,14,' + rb(0.1, 0.22) + ')'; ctx.fillRect(rb(x0, x1), rb(y0, y1), rb(1, 2.2), rb(1, 1.6)); }
  for (let i = 0; i < ng / 16; i++) { const x = rb(x0, x1), y = rb(y0, y1), r = rb(1.5, 3.2); ctx.fillStyle = 'rgba(20,18,16,.22)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 1, r, r * 0.7, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgb(' + (tone + 14) + ',' + (tone + 16) + ',' + (tone + 8) + ')'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.7, 0, 0, 6.28); ctx.fill(); }
  const nc = Math.round((2 + area / 9000) * more); ctx.lineWidth = 1;
  for (let i = 0; i < nc; i++) { let x = rb(x0, x1), y = rb(y0, y1), a = rnd() * 6.28; const long = rnd() < 0.18, segs = long ? 6 : 2 + Math.floor(rnd() * 2); const pts = [[x, y]]; for (let k = 0; k < segs; k++) { a += (rnd() - 0.5) * 1.1; const d = long ? rb(8, 18) : rb(3, 8); x += Math.cos(a) * d; y += Math.sin(a) * d; pts.push([x, y]); }
    ctx.strokeStyle = 'rgba(255,252,240,.18)'; ctx.beginPath(); pts.forEach(([X, Y], k) => k ? ctx.lineTo(X + 1, Y + 1) : ctx.moveTo(X + 1, Y + 1)); ctx.stroke();
    ctx.strokeStyle = long ? 'rgba(18,16,14,.55)' : 'rgba(26,24,20,.42)'; ctx.beginPath(); pts.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke(); }
  for (let i = 0; i < area / 40000 * more; i++) { if (rnd() < 0.5) continue; ctx.fillStyle = 'rgba(176,186,160,.3)'; const x = rb(x0, x1), y = rb(y0, y1); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + rb(-5, 5), y + rb(-3, 3), rb(2, 5), rb(1.5, 3), rnd() * 3, 0, 6.28); ctx.fill(); } }
  ctx.restore();
  if (edge) { paintBrink(Q, true); paintLip(Q); }
  S = s0;
}
// the faces: walls from the foot ring (on the ground the sheet stands on, at height base) to the top ring (at height
// top), on the edges that face the screen's centre, the ravine's lighting (west lit), darker toward the foot, strata
// rings down a thick one, grey stones set in at the foot of the thickest
function paintFaces(P, base, top, tone, seed, strata = null, hole = false) {
  let s0 = S; S = Math.floor(seed * 977) % 233280; const n = P.length, T = P.map(([x, y]) => proj(x, y, top)), F = P.map(([x, y]) => proj(x, y, base)), thick = top - base, yTop = Math.min(...T.map(q => q[1])), yFoot = Math.max(...F.map(q => q[1]));
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, [X0, Y0] = T[i], [X1, Y1] = T[j], [x0, y0] = F[i], [x1, y1] = F[j];
    const ex = X1 - X0, ey = Y1 - Y0, L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L;      // the face's outward facing (the ring runs clockwise on the screen, y down)
    const mx = (X0 + X1) / 2, my = (Y0 + Y1) / 2, fx = (x0 + x1) / 2, fy = (y0 + y1) / 2;
    if ((fx - mx) * nx + (fy - my) * ny <= 0.2) continue;                                      // only the faces the eye sees: the foot lies outside the top, toward the centre
    const lit = hole ? mtnClamp(0.86 + 0.1 * (-nx), 0.8, 0.96) : mtnClamp(0.72 + 0.28 * (-nx) - 0.08 * ny, 0.5, 1), e = t => Math.round(t * lit), col = (v, t = 1) => 'rgb(' + e(v * t) + ',' + e(v * t - 2) + ',' + e(v * t - 8) + ')';
    const g = ctx.createLinearGradient(0, yTop, 0, yFoot); g.addColorStop(0, col(tone * 0.5)); g.addColorStop(0.06, col(tone * 0.9)); g.addColorStop(0.5, col(tone * 0.74)); g.addColorStop(1, col(tone * 0.56));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y1); ctx.lineTo(x1, y1); ctx.lineTo(x0, y0); ctx.closePath(); ctx.fill();
  }
  // strata, ring by ring down the faces (continuous, a wobble along them), where each sheet meets the next on a pit's wall
  ctx.strokeStyle = 'rgba(30,28,24,.22)'; ctx.lineWidth = Math.max(1, 1.2 * s); const seen = i => { const j = (i + 1) % n, ex = T[j][0] - T[i][0], ey = T[j][1] - T[i][1], L = Math.hypot(ex, ey) || 1, nx = ey / L, ny = -ex / L; return ((F[i][0] + F[j][0]) / 2 - (T[i][0] + T[j][0]) / 2) * nx + ((F[i][1] + F[j][1]) / 2 - (T[i][1] + T[j][1]) / 2) * ny > 0.2; };
  const rings = strata ? strata.map(hz => (top - hz) / thick).filter(t => t > 0.02 && t < 0.98) : thick > 0.3 ? [0.22, 0.4, 0.6] : [];
  for (const t of rings) { let pen = false; ctx.beginPath(); for (let i = 0; i <= n; i++) { const k = i % n; if (!seen(k) && !seen((k - 1 + n) % n)) { pen = false; continue; } const w = strata ? t : t + 0.04 * Math.sin(k * 0.9 + seed); const x = T[k][0] + (F[k][0] - T[k][0]) * w, y = T[k][1] + (F[k][1] - T[k][1]) * w; pen ? ctx.lineTo(x, y) : ctx.moveTo(x, y); pen = true; } ctx.stroke(); }
  // grey stones set in from a tile and a half under the lip, a cap showing, as the ravines have them (only faces that deep)
  if (thick >= 1.5) for (let i = 0; i < n; i++) { if (!seen(i) || (i * 5 + seed) % 7 !== 1) continue; const j = (i + 1) % n, [X, Y] = T[i], [x, y] = F[i], h = ((i * 31 + seed * 3) % 97) / 97, t0 = 1.5 / thick, t = t0 + h * (0.85 - t0), r = (0.12 + h * 0.4) * us, v = Math.round(126 - t * 50);
    const px = X + (x - X) * t, py = Y + (y - Y) * t, wall = 'rgb(' + Math.round(tone * (1 - t * 0.45)) + ',' + Math.round(tone * (1 - t * 0.45) - 2) + ',' + Math.round(tone * (1 - t * 0.45) - 8) + ')';
    ctx.save(); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(T[j][0], T[j][1]); ctx.lineTo(F[j][0], F[j][1]); ctx.lineTo(x, y); ctx.closePath(); ctx.clip();   // never off its own wall
    drawJagged(px, py, Math.max(2, r), i * 0.53 + seed, ['rgb(' + v + ',' + (v - 2) + ',' + (v - 8) + ')', 'rgb(' + (v + 16) + ',' + (v + 14) + ',' + (v + 6) + ')', 'rgb(' + (v - 22) + ',' + (v - 24) + ',' + (v - 28) + ')']);
    const g = ctx.createRadialGradient(px, py - r * 0.5, 0, px, py - r * 0.2, r * 1.6); g.addColorStop(0, wall.replace('rgb', 'rgba').replace(')', ',.85)')); g.addColorStop(0.55, wall.replace('rgb', 'rgba').replace(')', ',.5)')); g.addColorStop(1, wall.replace('rgb', 'rgba').replace(')', ',0)'));   // the wall over the join, feathered: most of the stone buried, a cap showing
    ctx.fillStyle = g; ctx.fillRect(px - r * 2, py - r * 2, r * 4, r * 4); ctx.restore(); }
  S = s0;
}
// the field, in tiles about the hero: a dense stack climbing to the north-east, every sheet standing on the one under
// it (base = the top it lies on), a step or a hop or a jump up onto each; a pitfall where the layering is missing (the
// sheet two down shows); one thin crack across the foot. Under a quarter tile a step, under half a hop, over that a face.
// the whole field is plates: a floor of big ones lapping each other (steps everywhere, the slope never bare), then
// stacks scattered on it for the climbing, each a terrace that climbs its own way
// the base is one plate (the slope under everything, its surface bumped); on it the stacks, laid so that from the
// top of one you can jump to the next: gaps of a tile and a half to two between plate edges at a like height
const sheets = [];
{ const stack = (x0, y0, w0, h0, lean, kinds, seed, tone) => { let base = 0, x = x0, y = y0, w = w0, h = h0; kinds.forEach((thick, i) => { sheets.push({ P: outlineOf(x, y, w, h, seed + i * 1.3), base, thick, tone: tone + i * 2 }); base += thick; x += lean[0]; y += lean[1]; w = Math.max(3, w - 0.45); h = Math.max(2.2, h - 0.28); }); };
  stack(-8.5, 3.5, 8, 4.5, [0.8, -0.45], [0.3, 0.4, 0.35, 0.6, 0.45, 0.4], 60, 134);                // south-west, the pit in its foot
  stack(-2.5, -1, 6.5, 4, [0.5, -0.5], [0.4, 0.5, 0.45, 0.55, 0.5], 70, 136);                      // middle, a hop and a half from the first
  stack(5.5, -3.5, 10, 6, [0.75, -0.5], [0.3, 0.45, 0.4, 1.1, 0.35, 0.5, 0.4, 0.6, 0.5, 0.5], 80, 136);   // north-east, the tall one, a face partway up
  stack(8, 4, 6, 3.5, [0.5, -0.35], [0.4, 0.5, 0.3, 0.9], 100, 138);                               // south-east, a short one
  stack(-6.5, -6, 5, 3, [0.6, 0.3], [0.35, 0.3, 0.5], 120, 140);                                   // north-west, a perch
}
const PIT = [-8.6, 4.2]; const pit = outlineOf(PIT[0], PIT[1], 3.2, 2.2, 13.3, 9);
// the crack: a thin ravine across the foot slab, a step wide, nowhere near the way up
const spine = []; for (let y = 12; y >= -9; y -= 0.4) spine.push([-6 + (12 - y) * 0.42 + 0.6 * Math.sin(y * 0.7 + 1) + 0.25 * Math.sin(y * 2.3), y, 0.06 + 0.04 * Math.sin(y * 0.9)]);
const lipW = spine.map(([x, y, hw]) => [x - hw, y]), lipE = spine.map(([x, y, hw]) => [x + hw, y]);
const ringT = lipE.concat(lipW.slice().reverse());
function inPoly(P, x, y) { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
const topAt = (x, y) => { let h = 0; for (const s of sheets) if (inPoly(s.P, x, y) && !(s.base > 0.3 && s.base < 1.5 && inPoly(pit, x, y))) h = Math.max(h, s.base + s.thick); return h; };
const holeScreen = ringT.map(([x, y]) => proj(x, y, topAt(x, y)));
const hole = new Path2D(); holeScreen.forEach(([X, Y], i) => i ? hole.lineTo(X, Y) : hole.moveTo(X, Y)); hole.closePath();
const clipOut = () => {};                                                   // (a seam cuts nothing: it is drawn over the tops)
// a sheet with the pitfall through it is drawn as its outline less the pit (evenodd): its top is cut, and the pit's own
// walls are the sheet's faces turned inward (the same quads, from the pit ring at the sheet's base to the pit ring at its top)
// the seam at one height, clipped to a top (or to the ground outside every plate): a dark line as wide as the crack,
// a hair of light along its west edge

function paintSeam(h, clipTo) { ctx.save(); if (clipTo) { ctx.beginPath(); clipTo.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip(); }
  { const Rp = pit.map(([x, y]) => proj(x, y, h)); ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); Rp.forEach(([X, Y], i) => i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip('evenodd'); }   // the crack stops at the pit (the pit opened on it)
  const C = spine.map(([x, y]) => proj(x, y, h)), wds = spine.map(q => q[2] * 2 * us); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 1; i < C.length; i++) { const w = Math.max(2, wds[i]);                    // all inside the crack's own width: the dark of the slit, its west half a shade lighter (the far wall catching the light), its east half darker
    ctx.strokeStyle = 'rgb(44,44,40)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(C[i - 1][0], C[i - 1][1]); ctx.lineTo(C[i][0], C[i][1]); ctx.stroke();
    ctx.strokeStyle = 'rgb(14,14,12)'; ctx.lineWidth = w * 0.5; ctx.beginPath(); ctx.moveTo(C[i - 1][0] + w * 0.25, C[i - 1][1]); ctx.lineTo(C[i][0] + w * 0.25, C[i][1]); ctx.stroke(); }
  ctx.restore(); }
BASE_TEX(); paintSeam(0, null);
sheets.sort((a, b) => (a.base + a.thick) - (b.base + b.thick));
const isCut = s => s.base > 0.1 && inPoly(s.P, PIT[0], PIT[1]), cutS = sheets.filter(isCut), pitFloor = Math.min(...cutS.map(s => s.base)), pitTop = Math.max(...cutS.map(s => s.base + s.thick)), lastCut = cutS[cutS.length - 1]; if (process.env.DBG) { for (const q of [PIT, [-3.5, 2.6], [-2, 1.6]]) console.log(q, sheets.filter(s=>inPoly(s.P,q[0],q[1])).map(s=>s.base.toFixed(2)).join(" ")); }
sheets.forEach((s, i) => { ctx.save(); clipOut(); const top = s.base + s.thick, cut = isCut(s);
  paintFaces(s.P, s.base, top, s.tone, i + 1);
  if (cut) { ctx.save(); const R = pit.map(([x, y]) => proj(x, y, top)); ctx.beginPath(); ctx.rect(-W, -H, W * 3, H * 3); R.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip('evenodd'); }
  paintTop(s.P.map(([x, y]) => proj(x, y, top)), s.tone, i + 7, s.thick);
  paintSeam(top, s.P.map(([x, y]) => proj(x, y, top)));
  if (cut) ctx.restore();
  // the pit, once, after the last sheet it cuts: a shade over its floor, then one wall from the floor to the top lip with a line where each cut sheet meets the next
  if (s === lastCut) { const R = pit.map(([x, y]) => proj(x, y, pitTop)); ctx.save(); ctx.beginPath(); R.forEach(([X, Y], k) => k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.closePath(); ctx.clip(); ctx.fillStyle = 'rgba(20,22,20,.2)'; ctx.fillRect(-W, -H, W * 3, H * 3); { const Fp = pit.map(([x, y]) => proj(x, y, pitFloor)), cx0 = Fp.reduce((t, q) => t + q[0], 0) / Fp.length, cy0 = Fp.reduce((t, q) => t + q[1], 0) / Fp.length, g = ctx.createRadialGradient(cx0, cy0 + 7, 0, cx0, cy0, 2.2 * us); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(-W, -H, W * 3, H * 3); } ctx.restore(); paintFaces(pit.slice().reverse(), pitFloor, pitTop, 122, 40, cutS.map(c => c.base + c.thick), true); paintBrink(R, true); paintLip(R); }
  ctx.restore(); });
// the hero in the air, jumping from the hop sheet up onto the next (his shadow on the sheet he left, at its height)
{ const hb = topAt(-0.5, -2.2); const hh = state.hero, [X, Y] = proj(1.0, -2.6, hb); ctx.save(); ctx.translate(X, Y); ctx.scale(s, s); ctx.translate(-X, -Y); hh.x = X; hh.y = Y; hh.fx = 1; hh.fy = 0; hh.z = UNIT * 0.7; hh.vz = UNIT; hh.vx = UNIT * 3; hh.vy = 0; drawHero(); ctx.restore(); }
fs.writeFileSync('/mnt/user-data/outputs/quest-sheet-field' + (ZOOM === 1 ? '' : '-' + ZOOM) + (EYE === 14 ? '' : '-eye' + EYE) + '.png', canvas.toBuffer('image/png')); console.log('written UNIT', UNIT, 'tiles in view', (W / UNIT).toFixed(1), 'x', (H / UNIT).toFixed(1));
`);
